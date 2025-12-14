/**
 * Script to check all tables in the database and fix id column issues
 * Converts TEXT id columns to UUID and ensures proper defaults
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

interface TableInfo {
  tableName: string;
  idColumn: {
    dataType: string;
    isNullable: string;
    hasDefault: boolean;
    defaultValue: string | null;
  };
  rowCount: number;
  needsFix: boolean;
  issues: string[];
}

async function getLambdaResponse(lambdaClient: LambdaClient, query: string, params: any[] = []) {
  const response = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: LAMBDA_FUNCTION_NAME,
      Payload: JSON.stringify({
        action: 'query',
        query,
        params,
      }),
    })
  );

  const result = JSON.parse(
    new TextDecoder().decode(response.Payload || new Uint8Array())
  );

  if (result.statusCode !== 200) {
    const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    const errorMsg = errorBody.message || errorBody.error || errorBody.detail || JSON.stringify(errorBody);
    throw new Error(`Lambda error: ${errorMsg}`);
  }

  const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  
  if (body.error) {
    const errorMsg = body.message || body.error || body.detail || JSON.stringify(body);
    throw new Error(`Database error: ${errorMsg}`);
  }

  return body;
}

async function checkAllTables(lambdaClient: LambdaClient): Promise<TableInfo[]> {
  console.log('🔍 Scanning all tables for id column issues...');
  
  // Get all tables
  const tablesQuery = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  const tablesBody = await getLambdaResponse(lambdaClient, tablesQuery);
  const tables = tablesBody.rows || [];

  console.log(`📋 Found ${tables.length} tables to check\n`);

  const tableInfos: TableInfo[] = [];

  for (const table of tables) {
    const tableName = table.table_name;

    // Check if table has an id column
    const idColumnQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = $1
        AND column_name = 'id'
    `;

    try {
      const idColumnBody = await getLambdaResponse(lambdaClient, idColumnQuery, [tableName]);
      const idColumn = idColumnBody.rows?.[0];

      if (!idColumn) {
        continue; // No id column, skip
      }

      // Count rows
      const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
      const countBody = await getLambdaResponse(lambdaClient, countQuery);
      const rowCount = parseInt(countBody.rows?.[0]?.count || '0', 10);

      const issues: string[] = [];
      let needsFix = false;

      // Check for issues
      if (idColumn.data_type !== 'uuid') {
        issues.push(`Type is ${idColumn.data_type}, should be uuid`);
        needsFix = true;
      }

      if (idColumn.is_nullable === 'YES') {
        issues.push('Column is nullable, should be NOT NULL');
        needsFix = true;
      }

      if (!idColumn.column_default || !idColumn.column_default.includes('gen_random_uuid')) {
        issues.push('Missing DEFAULT gen_random_uuid()');
        needsFix = true;
      }

      tableInfos.push({
        tableName,
        idColumn: {
          dataType: idColumn.data_type,
          isNullable: idColumn.is_nullable,
          hasDefault: !!idColumn.column_default,
          defaultValue: idColumn.column_default,
        },
        rowCount,
        needsFix,
        issues,
      });

    } catch (error: any) {
      console.error(`   ⚠️  Error checking ${tableName}: ${error.message}`);
    }
  }

  return tableInfos;
}

async function migrateTableToUUID(
  tableName: string,
  rowCount: number,
  lambdaClient: LambdaClient
): Promise<boolean> {
  try {
    console.log(`\n📊 Migrating ${tableName}...`);

    // Get foreign key constraints that reference this table
    const fkQuery = `
      SELECT
        tc.table_name as foreign_table,
        kcu.column_name as foreign_column,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND kcu.referenced_table_name = $1
        AND kcu.referenced_column_name = 'id'
    `;

    const fkBody = await getLambdaResponse(lambdaClient, fkQuery, [tableName]);
    const foreignKeys = fkBody.rows || [];

    if (foreignKeys.length > 0) {
      console.log(`   🔗 Found ${foreignKeys.length} foreign key constraint(s) referencing this table`);
    }

    // Drop foreign key constraints
    for (const fk of foreignKeys) {
      const dropFKQuery = `ALTER TABLE ${fk.foreign_table} DROP CONSTRAINT IF EXISTS ${fk.constraint_name}`;
      await getLambdaResponse(lambdaClient, dropFKQuery);
    }

    // Drop primary key
    const dropPKQuery = `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${tableName}_pkey`;
    try {
      await getLambdaResponse(lambdaClient, dropPKQuery);
    } catch (e) {
      // PK might not exist, continue
    }

    // Add temporary UUID column
    const addTempQuery = `ALTER TABLE ${tableName} ADD COLUMN id_new UUID DEFAULT gen_random_uuid()`;
    await getLambdaResponse(lambdaClient, addTempQuery);

    // Convert existing rows
    if (rowCount > 0) {
      console.log(`   🔄 Converting ${rowCount} existing row(s)...`);
      const convertQuery = `
        UPDATE ${tableName}
        SET id_new = CASE
          WHEN id IS NULL THEN gen_random_uuid()
          WHEN id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::text::uuid
          ELSE gen_random_uuid()
        END
        WHERE id_new IS NULL
      `;
      await getLambdaResponse(lambdaClient, convertQuery);
    }

    // Drop old column
    const dropOldQuery = `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS id`;
    await getLambdaResponse(lambdaClient, dropOldQuery);

    // Rename new column
    const renameQuery = `ALTER TABLE ${tableName} RENAME COLUMN id_new TO id`;
    await getLambdaResponse(lambdaClient, renameQuery);

    // Set NOT NULL and default
    const setNotNullQuery = `
      ALTER TABLE ${tableName}
      ALTER COLUMN id SET NOT NULL,
      ALTER COLUMN id SET DEFAULT gen_random_uuid()
    `;
    await getLambdaResponse(lambdaClient, setNotNullQuery);

    // Add primary key
    const addPKQuery = `ALTER TABLE ${tableName} ADD PRIMARY KEY (id)`;
    await getLambdaResponse(lambdaClient, addPKQuery);

    // Recreate foreign keys
    for (const fk of foreignKeys) {
      // Determine referenced table (should be tableName)
      const recreateFKQuery = `
        ALTER TABLE ${fk.foreign_table}
        ADD CONSTRAINT ${fk.constraint_name}
        FOREIGN KEY (${fk.foreign_column})
        REFERENCES ${tableName}(id)
        ON DELETE CASCADE
      `;
      await getLambdaResponse(lambdaClient, recreateFKQuery);
    }

    console.log(`   ✅ ${tableName} migrated successfully!`);
    return true;

  } catch (error: any) {
    console.error(`   ❌ Error migrating ${tableName}: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    return false;
  }
}

async function main() {
  console.log('🚀 Checking and fixing all id columns in database...');
  console.log(`📡 Using Lambda: ${LAMBDA_FUNCTION_NAME}`);
  console.log(`🌍 Region: ${AWS_REGION}`);
  console.log('');

  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  // Check all tables
  const tableInfos = await checkAllTables(lambdaClient);

  // Filter tables that need fixing
  const tablesToFix = tableInfos.filter(t => t.needsFix);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Tables with id column issues:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (tablesToFix.length === 0) {
    console.log('✅ No tables need fixing! All id columns are properly configured.');
    return;
  }

  tablesToFix.forEach((table) => {
    console.log(`\n❌ ${table.tableName} (${table.rowCount} rows)`);
    table.issues.forEach(issue => {
      console.log(`   - ${issue}`);
    });
    console.log(`   Current: ${table.idColumn.dataType}, nullable: ${table.idColumn.isNullable}, default: ${table.idColumn.defaultValue || 'none'}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📋 Found ${tablesToFix.length} table(s) that need fixing`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Migrate tables
  const results: { table: string; success: boolean }[] = [];

  for (const tableInfo of tablesToFix) {
    const success = await migrateTableToUUID(
      tableInfo.tableName,
      tableInfo.rowCount,
      lambdaClient
    );
    results.push({ table: tableInfo.tableName, success });
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Migration Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  results.forEach(({ table, success }) => {
    console.log(`${success ? '✅' : '❌'} ${table}`);
  });

  const successCount = results.filter(r => r.success).length;
  console.log('');
  console.log(`✅ Successfully migrated: ${successCount}/${results.length} tables`);

  if (successCount === results.length) {
    console.log('');
    console.log('🎉 All tables migrated successfully!');
  }
}

main()
  .then(() => {
    console.log('');
    console.log('✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
