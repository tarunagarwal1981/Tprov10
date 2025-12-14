/**
 * Script to test table creation and see actual responses
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

async function testCreation() {
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
    // First, test a simple query to see if connection works
    console.log('🔍 Testing database connection...');
    const testQuery = 'SELECT NOW() as current_time, current_database() as db_name';
    
    const testResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: testQuery,
          params: [],
        }),
      })
    );

    const testResult = JSON.parse(
      new TextDecoder().decode(testResponse.Payload || new Uint8Array())
    );

    if (testResult.statusCode !== 200) {
      console.error('❌ Lambda returned error:', testResult);
      return;
    }

    const body = typeof testResult.body === 'string' ? JSON.parse(testResult.body) : testResult.body;
    
    if (body.error) {
      console.error('❌ Database error:', body.error);
      return;
    }

    console.log('✅ Database connection works!');
    if (body.rows && body.rows.length > 0) {
      console.log(`   Database: ${body.rows[0].db_name}`);
      console.log(`   Current time: ${body.rows[0].current_time}`);
    }
    console.log('');

    // Now try to create a test table
    console.log('🔧 Creating test table...');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS test_table_creation (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    const createResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: createTableQuery,
          params: [],
        }),
      })
    );

    const createResult = JSON.parse(
      new TextDecoder().decode(createResponse.Payload || new Uint8Array())
    );

    console.log('📋 Create table response:');
    console.log(JSON.stringify(createResult, null, 2));
    console.log('');

    if (createResult.statusCode !== 200) {
      console.error('❌ Lambda returned error status:', createResult.statusCode);
      const errorBody = typeof createResult.body === 'string' ? JSON.parse(createResult.body) : createResult.body;
      console.error('Error body:', errorBody);
      return;
    }

    const createBody = typeof createResult.body === 'string' ? JSON.parse(createResult.body) : createResult.body;
    
    if (createBody.error) {
      console.error('❌ Database error:', createBody.error);
      return;
    }

    console.log('✅ Table creation query executed');

    // Now check if it exists
    console.log('🔍 Checking if table exists...');
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'test_table_creation'
      ) as exists
    `;

    const checkResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: checkQuery,
          params: [],
        }),
      })
    );

    const checkResult = JSON.parse(
      new TextDecoder().decode(checkResponse.Payload || new Uint8Array())
    );

    const checkBody = typeof checkResult.body === 'string' ? JSON.parse(checkResult.body) : checkResult.body;
    
    if (checkBody.rows && checkBody.rows.length > 0) {
      console.log(`   Table exists: ${checkBody.rows[0].exists}`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

testCreation();
