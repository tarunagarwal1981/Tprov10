/**
 * Script to migrate all table id columns from TEXT to UUID
 * Uses the same approach that worked for multi_city tables
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID ;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY ;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

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
    throw new Error(errorMsg);
  }

  const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  
  if (body.error) {
    const errorMsg = body.message || body.error || body.detail || JSON.stringify(body);
    throw new Error(errorMsg);
  }

  return body;
}

async function migrateTable(tableName: string, lambdaClient: LambdaClient): Promise<boolean> {
  try {
    console.log(`\n📊 Migrating ${tableName}...`);

    // Step 1: Count existing rows
    const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
    const countBody = await getLambdaResponse(lambdaClient, countQuery);
    const rowCount = parseInt(countBody.rows?.[0]?.count || '0', 10);
    console.log(`   📋 Found ${rowCount} existing rows`);

    // Step 2: Get all foreign key constraints that reference this table's id
    const fkQuery = `
      SELECT
        tc.table_name as foreign_table,
        kcu.column_name as foreign_column,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND ccu.table_name = $1
        AND ccu.column_name = 'id'
    `;

    const fkBody = await getLambdaResponse(lambdaClient, fkQuery, [tableName]);
    const foreignKeys = fkBody.rows || [];
    
    if (foreignKeys.length > 0) {
      console.log(`   🔗 Found ${foreignKeys.length} foreign key constraint(s) referencing this table`);
    }

    // Step 3: Drop foreign key constraints that reference this table
    for (const fk of foreignKeys) {
      console.log(`   🔓 Dropping FK constraint: ${fk.constraint_name}`);
      const dropFKQuery = `ALTER TABLE ${fk.foreign_table} DROP CONSTRAINT IF EXISTS ${fk.constraint_name}`;
      await getLambdaResponse(lambdaClient, dropFKQuery);
    }

    // Step 4: Drop primary key constraint
    console.log(`   🔓 Dropping primary key constraint...`);
    const dropPKQuery = `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${tableName}_pkey`;
    try {
      await getLambdaResponse(lambdaClient, dropPKQuery);
    } catch (e) {
      // PK might not exist with that name, try to find it
      const findPKQuery = `
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = $1
          AND constraint_type = 'PRIMARY KEY'
      `;
      try {
        const pkBody = await getLambdaResponse(lambdaClient, findPKQuery, [tableName]);
        if (pkBody.rows && pkBody.rows.length > 0) {
          const pkName = pkBody.rows[0].constraint_name;
          await getLambdaResponse(lambdaClient, `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${pkName}`);
        }
      } catch (e2) {
        // No PK found, continue
      }
    }

    // Step 5: Add temporary UUID column
    console.log(`   ➕ Adding temporary UUID column...`);
    const addTempColumnQuery = `ALTER TABLE ${tableName} ADD COLUMN id_new UUID DEFAULT gen_random_uuid()`;
    await getLambdaResponse(lambdaClient, addTempColumnQuery);

    // Step 6: If there are existing rows, convert text IDs to UUIDs
    if (rowCount > 0) {
      console.log(`   🔄 Converting existing ${rowCount} row(s)...`);
      
      // For existing rows, try to convert text IDs to UUIDs if they're valid UUIDs
      // Otherwise, generate new UUIDs
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

    // Step 7: Drop old id column
    console.log(`   🗑️  Dropping old id column...`);
    const dropOldQuery = `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS id`;
    await getLambdaResponse(lambdaClient, dropOldQuery);

    // Step 8: Rename new column to id
    console.log(`   ✏️  Renaming id_new to id...`);
    const renameQuery = `ALTER TABLE ${tableName} RENAME COLUMN id_new TO id`;
    await getLambdaResponse(lambdaClient, renameQuery);

    // Step 9: Set NOT NULL and default
    console.log(`   🔧 Setting NOT NULL and default...`);
    const setNotNullQuery = `
      ALTER TABLE ${tableName}
      ALTER COLUMN id SET NOT NULL,
      ALTER COLUMN id SET DEFAULT gen_random_uuid()
    `;
    await getLambdaResponse(lambdaClient, setNotNullQuery);

    // Step 10: Add primary key constraint
    console.log(`   🔑 Adding primary key constraint...`);
    const addPKQuery = `ALTER TABLE ${tableName} ADD PRIMARY KEY (id)`;
    await getLambdaResponse(lambdaClient, addPKQuery);

    // Step 11: Recreate foreign key constraints
    for (const fk of foreignKeys) {
      console.log(`   🔗 Recreating FK constraint: ${fk.constraint_name}`);
      
      // Determine ON DELETE action - default to CASCADE, but SET NULL for nullable FKs
      let onDelete = 'CASCADE';
      
      // Check if the foreign column is nullable
      const checkNullableQuery = `
        SELECT is_nullable
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2
      `;
      try {
        const nullableBody = await getLambdaResponse(lambdaClient, checkNullableQuery, [fk.foreign_table, fk.foreign_column]);
        if (nullableBody.rows?.[0]?.is_nullable === 'YES') {
          onDelete = 'SET NULL';
        }
      } catch (e) {
        // Default to CASCADE
      }
      
      const recreateFKQuery = `
        ALTER TABLE ${fk.foreign_table}
        ADD CONSTRAINT ${fk.constraint_name}
        FOREIGN KEY (${fk.foreign_column})
        REFERENCES ${tableName}(id)
        ON DELETE ${onDelete}
      `;
      
      await getLambdaResponse(lambdaClient, recreateFKQuery);
    }

    console.log(`   ✅ ${tableName} migrated successfully!`);
    return true;

  } catch (error: any) {
    console.error(`   ❌ Error migrating ${tableName}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Migrating all table id columns to UUID...');
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

  // Get all tables with TEXT id columns
  console.log('🔍 Finding tables that need migration...');
  const tablesQuery = `
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'id'
      AND data_type = 'text'
    ORDER BY table_name
  `;

  const tablesBody = await getLambdaResponse(lambdaClient, tablesQuery);
  const tablesToMigrate = tablesBody.rows?.map((r: any) => r.table_name) || [];

  console.log(`📋 Found ${tablesToMigrate.length} tables to migrate:`);
  tablesToMigrate.forEach((table: string) => {
    console.log(`   - ${table}`);
  });

  if (tablesToMigrate.length === 0) {
    console.log('\n✅ No tables need migration!');
    return;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Starting migration...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results: { table: string; success: boolean }[] = [];

  for (const table of tablesToMigrate) {
    const success = await migrateTable(table, lambdaClient);
    results.push({ table, success });
    
    // Small delay between tables
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
  } else {
    console.log('');
    console.log('⚠️  Some tables failed to migrate. Please check the errors above.');
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
