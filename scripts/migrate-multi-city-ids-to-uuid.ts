/**
 * Script to migrate all multi_city table id columns from TEXT to UUID
 * and assign UUIDs to existing rows
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'REDACTED_AWS_ACCESS_KEY';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '/REDACTED_AWS_SECRET_KEY/';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

// Tables to migrate, in dependency order (child tables first, then parent tables)
const TABLES_TO_MIGRATE = [
  // Child tables first (depend on parent tables)
  'multi_city_package_cancellation_tiers',
  'multi_city_package_exclusions',
  'multi_city_package_inclusions',
  'multi_city_package_day_plans',
  'multi_city_package_images',
  'multi_city_private_package_rows',
  'multi_city_pricing_rows',
  'multi_city_package_cities',
  'multi_city_pricing_packages',
  // Parent tables last
  'multi_city_packages',
];

async function migrateTable(tableName: string, lambdaClient: LambdaClient): Promise<boolean> {
  try {
    console.log(`\n📊 Migrating ${tableName}...`);

    // Step 1: Check current structure
    const checkQuery = `
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1 AND column_name = 'id'
    `;

    const checkResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: checkQuery,
          params: [tableName],
        }),
      })
    );

    const checkResult = JSON.parse(
      new TextDecoder().decode(checkResponse.Payload || new Uint8Array())
    );

    const checkBody = typeof checkResult.body === 'string' ? JSON.parse(checkResult.body) : checkResult.body;
    const idColumn = checkBody.rows?.[0];

    if (!idColumn) {
      console.log(`   ⚠️  id column not found, skipping`);
      return false;
    }

    if (idColumn.data_type === 'uuid') {
      console.log(`   ✅ Already UUID type`);
      return true;
    }

    // Step 2: Count existing rows
    const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
    const countResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: countQuery,
          params: [],
        }),
      })
    );

    const countResult = JSON.parse(
      new TextDecoder().decode(countResponse.Payload || new Uint8Array())
    );

    const countBody = typeof countResult.body === 'string' ? JSON.parse(countResult.body) : countResult.body;
    const rowCount = parseInt(countBody.rows?.[0]?.count || '0', 10);
    console.log(`   📋 Found ${rowCount} existing rows`);

    // Step 3: Get all foreign key constraints that reference this table's id
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

    const fkResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: fkQuery,
          params: [tableName],
        }),
      })
    );

    const fkResult = JSON.parse(
      new TextDecoder().decode(fkResponse.Payload || new Uint8Array())
    );

    const fkBody = typeof fkResult.body === 'string' ? JSON.parse(fkResult.body) : fkResult.body;
    const foreignKeys = fkBody.rows || [];
    
    if (foreignKeys.length > 0) {
      console.log(`   🔗 Found ${foreignKeys.length} foreign key constraint(s) referencing this table`);
    }

    // Step 4: Drop foreign key constraints that reference this table
    for (const fk of foreignKeys) {
      console.log(`   🔓 Dropping FK constraint: ${fk.constraint_name}`);
      const dropFKQuery = `ALTER TABLE ${fk.foreign_table} DROP CONSTRAINT IF EXISTS ${fk.constraint_name}`;
      
      await lambdaClient.send(
        new InvokeCommand({
          FunctionName: LAMBDA_FUNCTION_NAME,
          Payload: JSON.stringify({
            action: 'query',
            query: dropFKQuery,
            params: [],
          }),
        })
      );
    }

    // Step 5: Drop primary key constraint
    console.log(`   🔓 Dropping primary key constraint...`);
    const dropPKQuery = `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${tableName}_pkey`;
    
    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: dropPKQuery,
          params: [],
        }),
      })
    );

    // Step 6: Add temporary UUID column
    console.log(`   ➕ Adding temporary UUID column...`);
    const addTempColumnQuery = `ALTER TABLE ${tableName} ADD COLUMN id_new UUID DEFAULT gen_random_uuid()`;
    
    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: addTempColumnQuery,
          params: [],
        }),
      })
    );

    // Step 7: If there are existing rows, convert text IDs to UUIDs
    if (rowCount > 0) {
      console.log(`   🔄 Converting existing ${rowCount} row(s)...`);
      
      // For existing rows, try to convert text IDs to UUIDs if they're valid UUIDs
      // Otherwise, generate new UUIDs
      const convertQuery = `
        UPDATE ${tableName}
        SET id_new = CASE
          WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::uuid
          ELSE gen_random_uuid()
        END
        WHERE id_new IS NULL
      `;
      
      await lambdaClient.send(
        new InvokeCommand({
          FunctionName: LAMBDA_FUNCTION_NAME,
          Payload: JSON.stringify({
            action: 'query',
            query: convertQuery,
            params: [],
          }),
        })
      );
    }

    // Step 8: Drop old id column
    console.log(`   🗑️  Dropping old id column...`);
    const dropOldQuery = `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS id`;
    
    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: dropOldQuery,
          params: [],
        }),
      })
    );

    // Step 9: Rename new column to id
    console.log(`   ✏️  Renaming id_new to id...`);
    const renameQuery = `ALTER TABLE ${tableName} RENAME COLUMN id_new TO id`;
    
    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: renameQuery,
          params: [],
        }),
      })
    );

    // Step 10: Set NOT NULL and default
    console.log(`   🔧 Setting NOT NULL and default...`);
    const setNotNullQuery = `
      ALTER TABLE ${tableName}
      ALTER COLUMN id SET NOT NULL,
      ALTER COLUMN id SET DEFAULT gen_random_uuid()
    `;
    
    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: setNotNullQuery,
          params: [],
        }),
      })
    );

    // Step 11: Add primary key constraint
    console.log(`   🔑 Adding primary key constraint...`);
    const addPKQuery = `ALTER TABLE ${tableName} ADD PRIMARY KEY (id)`;
    
    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: addPKQuery,
          params: [],
        }),
      })
    );

    // Step 12: Recreate foreign key constraints
    for (const fk of foreignKeys) {
      console.log(`   🔗 Recreating FK constraint: ${fk.constraint_name}`);
      
      // Determine ON DELETE action based on table
      let onDelete = 'CASCADE';
      if (fk.foreign_table.includes('day_plans') && fk.foreign_column === 'city_id') {
        onDelete = 'SET NULL';
      }
      
      const recreateFKQuery = `
        ALTER TABLE ${fk.foreign_table}
        ADD CONSTRAINT ${fk.constraint_name}
        FOREIGN KEY (${fk.foreign_column})
        REFERENCES ${tableName}(id)
        ON DELETE ${onDelete}
      `;
      
      await lambdaClient.send(
        new InvokeCommand({
          FunctionName: LAMBDA_FUNCTION_NAME,
          Payload: JSON.stringify({
            action: 'query',
            query: recreateFKQuery,
            params: [],
          }),
        })
      );
    }

    console.log(`   ✅ ${tableName} migrated successfully!`);
    return true;

  } catch (error: any) {
    console.error(`   ❌ Error migrating ${tableName}:`, error.message);
    return false;
  }
}

async function migrateAllTables() {
  console.log('🚀 Starting migration of all multi_city table id columns to UUID...');
  console.log(`📡 Using Lambda: ${LAMBDA_FUNCTION_NAME}`);
  console.log(`🌍 Region: ${AWS_REGION}`);
  console.log(`📋 Tables to migrate: ${TABLES_TO_MIGRATE.length}`);
  console.log('');

  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  const results: { table: string; success: boolean }[] = [];

  for (const table of TABLES_TO_MIGRATE) {
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

migrateAllTables()
  .then(() => {
    console.log('');
    console.log('✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
