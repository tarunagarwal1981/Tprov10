/**
 * Script to add package_name column to multi_city_pricing_packages table
 * Uses AWS credentials to access RDS via Lambda function
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

// AWS credentials from user
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

async function addPackageNameColumn() {
  console.log('🔧 Adding package_name column to multi_city_pricing_packages table...');
  console.log(`📡 Using Lambda: ${LAMBDA_FUNCTION_NAME}`);
  console.log(`🌍 Region: ${AWS_REGION}`);
  console.log('');

  // Initialize Lambda client with credentials (if provided)
  // If credentials are not provided, AWS SDK will use default credentials (IAM role, ~/.aws/credentials, etc.)
  const lambdaClientConfig: {
    region: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  } = {
    region: AWS_REGION,
  };

  // Only add credentials if both are provided
  if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
    lambdaClientConfig.credentials = {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    };
  } else {
    console.log('ℹ️  Using default AWS credentials (IAM role, ~/.aws/credentials, or environment)');
  }

  const lambdaClient = new LambdaClient(lambdaClientConfig);

  try {
    // First, check if column already exists
    console.log('🔍 Checking if package_name column exists...');
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'multi_city_pricing_packages' 
      AND column_name = 'package_name'
    `;

    const checkPayload = {
      action: 'query',
      query: checkColumnQuery,
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

    const columnExists = checkResult.rows && checkResult.rows.length > 0;

    if (columnExists) {
      console.log('✅ Column package_name already exists!');
      return;
    }

    console.log('📝 Column does not exist. Adding it now...');

    // Add the column
    const addColumnQuery = `
      ALTER TABLE multi_city_pricing_packages 
      ADD COLUMN IF NOT EXISTS package_name VARCHAR(255)
    `;

    const addPayload = {
      action: 'query',
      query: addColumnQuery,
      params: [],
    };

    const addResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify(addPayload),
      })
    );

    const addResult = JSON.parse(
      new TextDecoder().decode(addResponse.Payload || new Uint8Array())
    );

    if (addResult.error) {
      throw new Error(`Lambda error: ${addResult.error}`);
    }

    console.log('✅ Successfully added package_name column!');
    console.log('');
    console.log('📋 Column details:');
    console.log('   - Name: package_name');
    console.log('   - Type: VARCHAR(255)');
    console.log('   - Table: multi_city_pricing_packages');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the script
addPackageNameColumn()
  .then(() => {
    console.log('');
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
