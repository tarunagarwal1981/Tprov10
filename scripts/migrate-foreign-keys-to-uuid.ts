/**
 * Script to migrate foreign key columns in multi_city tables from TEXT to UUID
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'REDACTED_AWS_ACCESS_KEY';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '/REDACTED_AWS_SECRET_KEY/';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

// Tables and their foreign key columns to migrate
const FOREIGN_KEY_MIGRATIONS = [
  {
    table: 'multi_city_package_cities',
    columns: ['package_id'],
  },
  {
    table: 'multi_city_package_cancellation_tiers',
    columns: ['package_id'],
  },
  {
    table: 'multi_city_package_exclusions',
    columns: ['package_id'],
  },
  {
    table: 'multi_city_package_inclusions',
    columns: ['package_id'],
  },
  {
    table: 'multi_city_package_images',
    columns: ['package_id'],
  },
  {
    table: 'multi_city_package_day_plans',
    columns: ['package_id', 'city_id'],
  },
  {
    table: 'multi_city_pricing_packages',
    columns: ['package_id'],
  },
  {
    table: 'multi_city_pricing_rows',
    columns: ['pricing_package_id'],
  },
  {
    table: 'multi_city_private_package_rows',
    columns: ['pricing_package_id'],
  },
];

async function migrateForeignKeyColumn(
  tableName: string,
  columnName: string,
  lambdaClient: LambdaClient
): Promise<boolean> {
  try {
    // Check current type
    const checkQuery = `
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = $1 AND column_name = $2
    `;

    const checkResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: checkQuery,
          params: [tableName, columnName],
        }),
      })
    );

    const checkResult = JSON.parse(
      new TextDecoder().decode(checkResponse.Payload || new Uint8Array())
    );

    const checkBody = typeof checkResult.body === 'string' ? JSON.parse(checkResult.body) : checkResult.body;
    const column = checkBody.rows?.[0];

    if (!column) {
      return false;
    }

    if (column.data_type === 'uuid') {
      return true; // Already UUID
    }

    // Drop foreign key constraint if it exists
    const fkQuery = `
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = $1
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name IN (
          SELECT constraint_name
          FROM information_schema.key_column_usage
          WHERE table_name = $1 AND column_name = $2
        )
    `;

    const fkResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: fkQuery,
          params: [tableName, columnName],
        }),
      })
    );

    const fkResult = JSON.parse(
      new TextDecoder().decode(fkResponse.Payload || new Uint8Array())
    );

    const fkBody = typeof fkResult.body === 'string' ? JSON.parse(fkResult.body) : fkResult.body;
    const constraints = fkBody.rows || [];

    for (const constraint of constraints) {
      const dropFKQuery = `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${constraint.constraint_name}`;
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

    // Add temporary UUID column
    const tempColumnName = `${columnName}_new`;
    const addTempQuery = `ALTER TABLE ${tableName} ADD COLUMN ${tempColumnName} UUID`;
    
    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: addTempQuery,
          params: [],
        }),
      })
    );

    // Convert existing values
    const convertQuery = `
      UPDATE ${tableName}
      SET ${tempColumnName} = CASE
        WHEN ${columnName} IS NULL THEN NULL
        WHEN ${columnName} ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN ${columnName}::uuid
        ELSE NULL
      END
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

    // Drop old column
    const dropOldQuery = `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS ${columnName}`;
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

    // Rename new column
    const renameQuery = `ALTER TABLE ${tableName} RENAME COLUMN ${tempColumnName} TO ${columnName}`;
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

    // Recreate foreign key constraints
    for (const constraint of constraints) {
      // Determine referenced table and column
      const refQuery = `
        SELECT
          kcu.referenced_table_name,
          kcu.referenced_column_name,
          tc.constraint_name
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.table_constraints tc
          ON kcu.constraint_name = tc.constraint_name
        WHERE tc.table_name = $1
          AND kcu.column_name = $2
          AND tc.constraint_type = 'FOREIGN KEY'
      `;

      // For now, we'll recreate based on known relationships
      let referencedTable = '';
      let onDelete = 'CASCADE';
      
      if (columnName === 'package_id') {
        referencedTable = 'multi_city_packages';
      } else if (columnName === 'city_id') {
        referencedTable = 'multi_city_package_cities';
        onDelete = 'SET NULL';
      } else if (columnName === 'pricing_package_id') {
        referencedTable = 'multi_city_pricing_packages';
      }

      if (referencedTable) {
        const recreateFKQuery = `
          ALTER TABLE ${tableName}
          ADD CONSTRAINT ${constraint.constraint_name}
          FOREIGN KEY (${columnName})
          REFERENCES ${referencedTable}(id)
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
    }

    return true;
  } catch (error: any) {
    console.error(`   ❌ Error migrating ${tableName}.${columnName}:`, error.message);
    return false;
  }
}

async function migrateAllForeignKeys() {
  console.log('🚀 Starting migration of foreign key columns to UUID...');
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

  const results: { table: string; column: string; success: boolean }[] = [];

  for (const migration of FOREIGN_KEY_MIGRATIONS) {
    for (const column of migration.columns) {
      console.log(`📊 Migrating ${migration.table}.${column}...`);
      const success = await migrateForeignKeyColumn(migration.table, column, lambdaClient);
      results.push({ table: migration.table, column, success });
      console.log(`${success ? '✅' : '❌'} ${migration.table}.${column}`);
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Migration Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  results.forEach(({ table, column, success }) => {
    console.log(`${success ? '✅' : '❌'} ${table}.${column}`);
  });

  const successCount = results.filter(r => r.success).length;
  console.log('');
  console.log(`✅ Successfully migrated: ${successCount}/${results.length} columns`);
}

migrateAllForeignKeys()
  .then(() => {
    console.log('');
    console.log('✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
