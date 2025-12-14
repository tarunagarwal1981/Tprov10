/**
 * Script to fix multi_city_package_day_plans.id column to have a default value
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

async function fixIdColumn() {
  console.log('🔧 Fixing multi_city_package_day_plans.id column...');
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
    // Since the column is TEXT type, we'll add a default that generates a UUID as text
    // Using gen_random_uuid()::text to generate UUID and cast to text
    console.log('📝 Adding DEFAULT gen_random_uuid()::text to id column...');
    
    const addDefaultQuery = `
      ALTER TABLE multi_city_package_day_plans 
      ALTER COLUMN id SET DEFAULT gen_random_uuid()::text
    `;

    const response = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: addDefaultQuery,
          params: [],
        }),
      })
    );

    const result = JSON.parse(
      new TextDecoder().decode(response.Payload || new Uint8Array())
    );

    // Handle Lambda response format
    if (result.statusCode !== 200) {
      const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      throw new Error(`Lambda error: ${errorBody.error || JSON.stringify(result)}`);
    }

    const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    
    if (body.error) {
      throw new Error(`Database error: ${body.error}`);
    }

    console.log('✅ Default value added successfully!');

    // Verify the fix
    console.log('🔍 Verifying fix...');
    const verifyQuery = `
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'multi_city_package_day_plans'
      AND column_name = 'id'
    `;

    const verifyResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: verifyQuery,
          params: [],
        }),
      })
    );

    const verifyResult = JSON.parse(
      new TextDecoder().decode(verifyResponse.Payload || new Uint8Array())
    );

    const verifyBody = typeof verifyResult.body === 'string' ? JSON.parse(verifyResult.body) : verifyResult.body;
    const idColumn = verifyBody.rows?.[0];

    if (idColumn) {
      console.log('');
      console.log('📋 Updated id column:');
      console.log(`   - Type: ${idColumn.data_type}`);
      console.log(`   - Nullable: ${idColumn.is_nullable}`);
      console.log(`   - Default: ${idColumn.column_default || 'NULL'}`);
      
      if (idColumn.column_default && idColumn.column_default.includes('gen_random_uuid')) {
        console.log('');
        console.log('✅ Column fixed successfully!');
      } else {
        console.log('');
        console.log('⚠️  Default might not be set correctly');
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

fixIdColumn()
  .then(() => {
    console.log('');
    console.log('✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
