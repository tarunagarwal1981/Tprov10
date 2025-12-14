/**
 * Test script to identify the exact error when inserting into multi_city_pricing_packages
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

async function testInsert() {
  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    // First, check the table structure
    console.log('🔍 Checking table structure...');
    const checkTableQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'multi_city_pricing_packages'
      ORDER BY ordinal_position
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
      console.error('Error checking table:', checkResult.error);
      return;
    }

    console.log('📋 Table structure:');
    console.table(checkResult.rows);

    // Test insert with sample data
    console.log('\n🧪 Testing INSERT with sample data...');
    const testInsertQuery = `
      INSERT INTO multi_city_pricing_packages (
        package_id, package_name, pricing_type, has_child_age_restriction,
        child_min_age, child_max_age
      ) VALUES ($1, $2, $3::multi_city_pricing_type, $4, $5, $6)
      RETURNING id
    `;

    const testPayload = {
      action: 'query',
      query: testInsertQuery,
      params: [
        '00000000-0000-0000-0000-000000000000', // dummy package_id
        'Test Package',
        'PRIVATE_PACKAGE',
        false,
        null,
        null,
      ],
    };

    const testResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify(testPayload),
      })
    );

    const testResult = JSON.parse(
      new TextDecoder().decode(testResponse.Payload || new Uint8Array())
    );

    if (testResult.error) {
      console.error('❌ INSERT failed:', testResult.error);
      console.error('Full error:', JSON.stringify(testResult, null, 2));
    } else {
      console.log('✅ INSERT succeeded!');
      console.log('Result:', testResult.rows);
    }
  } catch (error: any) {
    console.error('❌ Script error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testInsert();
