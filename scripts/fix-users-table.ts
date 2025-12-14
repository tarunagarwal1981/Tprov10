/**
 * Fix users table - clean up and complete migration
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
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

async function fixUsersTable() {
  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    console.log('🔧 Fixing users table...\n');

    // Check if id_new exists and drop it first
    const checkColumnQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name IN ('id', 'id_new')
    `;

    const checkBody = await getLambdaResponse(lambdaClient, checkColumnQuery);
    const columns = checkBody.rows || [];
    
    const hasId = columns.some((c: any) => c.column_name === 'id');
    const hasIdNew = columns.some((c: any) => c.column_name === 'id_new');

    console.log(`Current columns: id=${hasId}, id_new=${hasIdNew}`);

    // If both exist, drop id_new
    if (hasIdNew && hasId) {
      console.log('📝 Cleaning up - dropping id_new column...');
      await getLambdaResponse(lambdaClient, `ALTER TABLE users DROP COLUMN IF EXISTS id_new`);
    }

    // Check id column type
    const idColumn = columns.find((c: any) => c.column_name === 'id');
    if (idColumn?.data_type === 'uuid') {
      console.log('✅ Users table id column is already UUID!');
      return;
    }

    // Need full migration
    console.log('📝 Running full migration...');
    
    // Get foreign keys
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
        AND ccu.table_name = 'users'
        AND ccu.column_name = 'id'
    `;
    
    const fkBody = await getLambdaResponse(lambdaClient, fkQuery);
    const foreignKeys = fkBody.rows || [];
    
    console.log(`   Found ${foreignKeys.length} foreign key constraint(s)`);
    
    // Drop FKs
    for (const fk of foreignKeys) {
      await getLambdaResponse(lambdaClient, `ALTER TABLE ${fk.foreign_table} DROP CONSTRAINT IF EXISTS ${fk.constraint_name}`);
    }
    
    // Drop PK
    await getLambdaResponse(lambdaClient, `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey`);
    
    // Add temp column
    console.log('   ➕ Adding temporary UUID column...');
    await getLambdaResponse(lambdaClient, `ALTER TABLE users ADD COLUMN id_new UUID DEFAULT gen_random_uuid()`);
    
    // Convert rows
    const countQuery = `SELECT COUNT(*) as count FROM users`;
    const countBody = await getLambdaResponse(lambdaClient, countQuery);
    const rowCount = parseInt(countBody.rows?.[0]?.count || '0', 10);
    
    if (rowCount > 0) {
      console.log(`   🔄 Converting ${rowCount} existing row(s)...`);
      await getLambdaResponse(lambdaClient, `
        UPDATE users
        SET id_new = CASE
          WHEN id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::text::uuid
          ELSE gen_random_uuid()
        END
        WHERE id_new IS NULL
      `);
    }
    
    // Drop old, rename new
    console.log('   🗑️  Dropping old id column...');
    await getLambdaResponse(lambdaClient, `ALTER TABLE users DROP COLUMN id`);
    console.log('   ✏️  Renaming id_new to id...');
    await getLambdaResponse(lambdaClient, `ALTER TABLE users RENAME COLUMN id_new TO id`);
    console.log('   🔧 Setting NOT NULL and default...');
    await getLambdaResponse(lambdaClient, `
      ALTER TABLE users
      ALTER COLUMN id SET NOT NULL,
      ALTER COLUMN id SET DEFAULT gen_random_uuid()
    `);
    console.log('   🔑 Adding primary key constraint...');
    await getLambdaResponse(lambdaClient, `ALTER TABLE users ADD PRIMARY KEY (id)`);
    
    // Recreate FKs
    if (foreignKeys.length > 0) {
      console.log('   🔗 Recreating foreign key constraints...');
      for (const fk of foreignKeys) {
        try {
          await getLambdaResponse(lambdaClient, `
            ALTER TABLE ${fk.foreign_table}
            ADD CONSTRAINT ${fk.constraint_name}
            FOREIGN KEY (${fk.foreign_column})
            REFERENCES users(id)
            ON DELETE CASCADE
          `);
          console.log(`      ✅ ${fk.constraint_name}`);
        } catch (e: any) {
          console.log(`      ⚠️  ${fk.constraint_name}: ${e.message}`);
        }
      }
    }
    
    console.log('\n✅ Users table migrated successfully!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

fixUsersTable()
  .then(() => {
    console.log('\n✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
