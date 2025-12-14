/**
 * Test script to migrate a single table and see detailed errors
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID ;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY ;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

const TEST_TABLE = 'users'; // Start with a simple table

async function testMigration() {
  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    console.log(`Testing migration of ${TEST_TABLE}...\n`);

    // Step 1: Check current structure
    const checkQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1 AND column_name = 'id'
    `;

    const checkResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: checkQuery,
          params: [TEST_TABLE],
        }),
      })
    );

    const checkResult = JSON.parse(
      new TextDecoder().decode(checkResponse.Payload || new Uint8Array())
    );

    const checkBody = typeof checkResult.body === 'string' ? JSON.parse(checkResult.body) : checkResult.body;
    console.log('Current id column:', checkBody.rows?.[0]);

    // Step 2: Try to add temp column
    console.log('\nStep 1: Adding temp column...');
    const addTempQuery = `ALTER TABLE ${TEST_TABLE} ADD COLUMN id_new UUID DEFAULT gen_random_uuid()`;
    
    const addTempResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: addTempQuery,
          params: [],
        }),
      })
    );

    const addTempResult = JSON.parse(
      new TextDecoder().decode(addTempResponse.Payload || new Uint8Array())
    );

    console.log('Response:', JSON.stringify(addTempResult, null, 2));

    if (addTempResult.statusCode !== 200) {
      const errorBody = typeof addTempResult.body === 'string' ? JSON.parse(addTempResult.body) : addTempResult.body;
      console.error('Error:', errorBody);
      return;
    }

    const addTempBody = typeof addTempResult.body === 'string' ? JSON.parse(addTempResult.body) : addTempResult.body;
    
    if (addTempBody.error) {
      console.error('Database error:', addTempBody);
      return;
    }

    console.log('✅ Temp column added');

  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMigration();
