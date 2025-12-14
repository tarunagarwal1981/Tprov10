/**
 * Script to fix multi_city_package_day_plans table structure
 * Ensures id column is UUID with DEFAULT gen_random_uuid()
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

async function fixDayPlansTable() {
  console.log('🔧 Fixing multi_city_package_day_plans table structure...');
  console.log(`📡 Using Lambda: ${LAMBDA_FUNCTION_NAME}`);
  console.log(`🌍 Region: ${AWS_REGION}`);
  console.log('');

  const lambdaClientConfig: {
    region: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  } = {
    region: AWS_REGION,
  };

  if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
    lambdaClientConfig.credentials = {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    };
  }

  const lambdaClient = new LambdaClient(lambdaClientConfig);

  try {
    // Check current table structure
    console.log('🔍 Checking current table structure...');
    const checkTableQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'multi_city_package_day_plans'
      AND column_name = 'id'
    `;

    const checkPayload = {
      action: 'query',
      query: checkTableQuery,
      params: [],
    };

    const checkResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify(checkPayload),
      })
    );

    const checkResult = JSON.parse(
      new TextDecoder().decode(checkResponse.Payload || new Uint8Array())
    );

    if (checkResult.error) {
      throw new Error(`Lambda error: ${checkResult.error}`);
    }

    const idColumn = checkResult.rows?.[0];
    
    if (!idColumn) {
      console.log('❌ Table or id column not found');
      return;
    }

    console.log('📋 Current id column structure:');
    console.log(`   - Type: ${idColumn.data_type}`);
    console.log(`   - Nullable: ${idColumn.is_nullable}`);
    console.log(`   - Default: ${idColumn.column_default || 'NULL'}`);
    console.log('');

    // Check if we need to fix it
    const needsFix = 
      idColumn.data_type !== 'uuid' || 
      !idColumn.column_default || 
      !idColumn.column_default.includes('gen_random_uuid');

    if (!needsFix) {
      console.log('✅ Table structure is correct!');
      return;
    }

    console.log('🔧 Fixing table structure...');

    // If the column is TEXT, we need to recreate it
    // If it's UUID but missing default, we can just add the default
    if (idColumn.data_type === 'text' || idColumn.data_type === 'character varying') {
      console.log('📝 Column is TEXT, converting to UUID...');
      
      // Step 1: Drop the existing primary key constraint
      const dropPKQuery = `
        ALTER TABLE multi_city_package_day_plans 
        DROP CONSTRAINT IF EXISTS multi_city_package_day_plans_pkey
      `;
      
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

      // Step 2: Add a new UUID column with default
      const addUUIDColumnQuery = `
        ALTER TABLE multi_city_package_day_plans 
        ADD COLUMN IF NOT EXISTS id_new UUID DEFAULT gen_random_uuid()
      `;
      
      await lambdaClient.send(
        new InvokeCommand({
          FunctionName: LAMBDA_FUNCTION_NAME,
          Payload: JSON.stringify({
            action: 'query',
            query: addUUIDColumnQuery,
            params: [],
          }),
        })
      );

      // Step 3: Populate the new column with UUIDs for existing rows
      const populateUUIDQuery = `
        UPDATE multi_city_package_day_plans 
        SET id_new = gen_random_uuid() 
        WHERE id_new IS NULL
      `;
      
      await lambdaClient.send(
        new InvokeCommand({
          FunctionName: LAMBDA_FUNCTION_NAME,
          Payload: JSON.stringify({
            action: 'query',
            query: populateUUIDQuery,
            params: [],
          }),
        })
      );

      // Step 4: Drop old column and rename new one
      const dropOldColumnQuery = `
        ALTER TABLE multi_city_package_day_plans 
        DROP COLUMN IF EXISTS id
      `;
      
      await lambdaClient.send(
        new InvokeCommand({
          FunctionName: LAMBDA_FUNCTION_NAME,
          Payload: JSON.stringify({
            action: 'query',
            query: dropOldColumnQuery,
            params: [],
          }),
        })
      );

      const renameColumnQuery = `
        ALTER TABLE multi_city_package_day_plans 
        RENAME COLUMN id_new TO id
      `;
      
      await lambdaClient.send(
        new InvokeCommand({
          FunctionName: LAMBDA_FUNCTION_NAME,
          Payload: JSON.stringify({
            action: 'query',
            query: renameColumnQuery,
            params: [],
          }),
        })
      );

      // Step 5: Add primary key constraint
      const addPKQuery = `
        ALTER TABLE multi_city_package_day_plans 
        ADD PRIMARY KEY (id)
      `;
      
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

      console.log('✅ Converted TEXT column to UUID with default');
    } else if (idColumn.data_type === 'uuid') {
      // Column is already UUID, just need to add default
      console.log('📝 Adding DEFAULT gen_random_uuid() to UUID column...');
      
      const addDefaultQuery = `
        ALTER TABLE multi_city_package_day_plans 
        ALTER COLUMN id SET DEFAULT gen_random_uuid()
      `;
      
      await lambdaClient.send(
        new InvokeCommand({
          FunctionName: LAMBDA_FUNCTION_NAME,
          Payload: JSON.stringify({
            action: 'query',
            query: addDefaultQuery,
            params: [],
          }),
        })
      );

      console.log('✅ Added DEFAULT gen_random_uuid() to id column');
    }

    // Verify the fix
    console.log('');
    console.log('🔍 Verifying fix...');
    const verifyResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: checkTableQuery,
          params: [],
        }),
      })
    );

    const verifyResult = JSON.parse(
      new TextDecoder().decode(verifyResponse.Payload || new Uint8Array())
    );

    const verifiedColumn = verifyResult.rows?.[0];
    console.log('📋 Updated id column structure:');
    console.log(`   - Type: ${verifiedColumn.data_type}`);
    console.log(`   - Nullable: ${verifiedColumn.is_nullable}`);
    console.log(`   - Default: ${verifiedColumn.column_default || 'NULL'}`);

    if (verifiedColumn.data_type === 'uuid' && verifiedColumn.column_default?.includes('gen_random_uuid')) {
      console.log('');
      console.log('✅ Table structure fixed successfully!');
    } else {
      console.log('');
      console.log('⚠️  Table structure may still need adjustment');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the script
fixDayPlansTable()
  .then(() => {
    console.log('');
    console.log('✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
