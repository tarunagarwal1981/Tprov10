/**
 * Test different ways of passing UUID parameters
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

async function invokeQuery(sql: string, params: any[] = []): Promise<any> {
  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  const payload = {
    action: 'query',
    query: sql,
    params: params,
  };

  const command = new InvokeCommand({
    FunctionName: LAMBDA_FUNCTION_NAME,
    Payload: JSON.stringify(payload),
  });

  const response = await lambdaClient.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.Payload || new Uint8Array()));
  
  if (result.statusCode !== 200) {
    const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    throw new Error(`Query failed: ${JSON.stringify(errorBody)}`);
  }

  const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  return body;
}

async function testParameterPassing() {
  console.log('🔍 Testing different parameter passing methods...\n');
  console.log('='.repeat(80));

  const testOperatorId = 'ed6e2aa5-0dfb-4c7a-99e4-85f7e702f087';
  const testItineraryId = '4ecb42d5-f6d2-4474-9cb0-1efaa37a7542';

  // Test 1: Using uuid_in() function
  console.log('\n📊 Test 1: Using uuid_in() function...\n');
  try {
    const test1 = await invokeQuery(`
      INSERT INTO itinerary_items (
        id, itinerary_id, package_type, package_id, operator_id, package_title, configuration, unit_price, quantity, total_price, display_order
      ) VALUES (
        gen_random_uuid(),
        $1::text,
        $2::text,
        $3::text,
        uuid_in($4::cstring),
        $5::text,
        '{}'::jsonb,
        $6::numeric,
        $7::integer,
        $8::numeric,
        $9::integer
      )
      RETURNING id, operator_id
    `, [
      testItineraryId,
      'activity',
      '8b7af60d-ea0b-49f2-b3c5-977860655102',
      testOperatorId,
      'Test',
      100,
      1,
      100,
      0
    ]);
    
    console.log('✅ uuid_in() works!');
    console.log('Inserted:', test1.rows[0]);
    await invokeQuery(`DELETE FROM itinerary_items WHERE id = $1`, [test1.rows[0].id]);
    console.log('🧹 Cleaned up');
  } catch (error: any) {
    console.log('❌ uuid_in() failed:', error.message);
  }
  console.log('');

  // Test 2: Using a subquery to convert
  console.log('\n📊 Test 2: Using subquery to convert...\n');
  try {
    const test2 = await invokeQuery(`
      INSERT INTO itinerary_items (
        id, itinerary_id, package_type, package_id, operator_id, package_title, configuration, unit_price, quantity, total_price, display_order
      ) VALUES (
        gen_random_uuid(),
        $1::text,
        $2::text,
        $3::text,
        (SELECT $4::text::uuid),
        $5::text,
        '{}'::jsonb,
        $6::numeric,
        $7::integer,
        $8::numeric,
        $9::integer
      )
      RETURNING id, operator_id
    `, [
      testItineraryId,
      'activity',
      '8b7af60d-ea0b-49f2-b3c5-977860655102',
      testOperatorId,
      'Test',
      100,
      1,
      100,
      0
    ]);
    
    console.log('✅ Subquery conversion works!');
    console.log('Inserted:', test2.rows[0]);
    await invokeQuery(`DELETE FROM itinerary_items WHERE id = $1`, [test2.rows[0].id]);
    console.log('🧹 Cleaned up');
  } catch (error: any) {
    console.log('❌ Subquery conversion failed:', error.message);
  }
  console.log('');

  // Test 3: Check if there's a foreign key that's being validated
  console.log('\n📊 Test 3: Checking for implicit foreign key validation...\n');
  try {
    // Try to see if disabling triggers helps
    const test3 = await invokeQuery(`
      SET session_replication_role = 'replica';
      INSERT INTO itinerary_items (
        id, itinerary_id, package_type, package_id, operator_id, package_title, configuration, unit_price, quantity, total_price, display_order
      ) VALUES (
        gen_random_uuid(),
        $1::text,
        $2::text,
        $3::text,
        $4::uuid,
        $5::text,
        '{}'::jsonb,
        $6::numeric,
        $7::integer,
        $8::numeric,
        $9::integer
      )
      RETURNING id, operator_id;
      SET session_replication_role = 'origin';
    `, [
      testItineraryId,
      'activity',
      '8b7af60d-ea0b-49f2-b3c5-977860655102',
      testOperatorId,
      'Test',
      100,
      1,
      100,
      0
    ]);
    
    console.log('✅ With triggers disabled works!');
    console.log('Inserted:', test3.rows[0]);
    await invokeQuery(`DELETE FROM itinerary_items WHERE id = $1`, [test3.rows[0].id]);
    console.log('🧹 Cleaned up');
  } catch (error: any) {
    console.log('❌ With triggers disabled failed:', error.message);
  }
  console.log('');

  // Test 4: Check what happens if we verify operator_id exists first in the same query
  console.log('\n📊 Test 4: Verifying operator_id in same query...\n');
  try {
    const test4 = await invokeQuery(`
      WITH op_check AS (
        SELECT $4::uuid AS op_id
        WHERE EXISTS (SELECT 1 FROM users WHERE id = $4::uuid)
      )
      INSERT INTO itinerary_items (
        id, itinerary_id, package_type, package_id, operator_id, package_title, configuration, unit_price, quantity, total_price, display_order
      )
      SELECT
        gen_random_uuid(),
        $1::text,
        $2::text,
        $3::text,
        op_id,
        $5::text,
        '{}'::jsonb,
        $6::numeric,
        $7::integer,
        $8::numeric,
        $9::integer
      FROM op_check
      RETURNING id, operator_id
    `, [
      testItineraryId,
      'activity',
      '8b7af60d-ea0b-49f2-b3c5-977860655102',
      testOperatorId,
      'Test',
      100,
      1,
      100,
      0
    ]);
    
    console.log('✅ WITH clause works!');
    console.log('Inserted:', test4.rows[0]);
    await invokeQuery(`DELETE FROM itinerary_items WHERE id = $1`, [test4.rows[0].id]);
    console.log('🧹 Cleaned up');
  } catch (error: any) {
    console.log('❌ WITH clause failed:', error.message);
  }
  console.log('');

  console.log('='.repeat(80));
}

testParameterPassing().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

