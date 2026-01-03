/**
 * Test how Lambda database service passes parameters and if that's causing the issue
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

async function testParameterTypes() {
  console.log('🔍 Testing Lambda parameter type handling...\n');
  console.log('='.repeat(80));

  const testOperatorId = 'ed6e2aa5-0dfb-4c7a-99e4-85f7e702f087';
  const testItineraryId = '4ecb42d5-f6d2-4474-9cb0-1efaa37a7542';

  // Test: What if we use a prepared statement approach?
  // Actually, let me check if the issue is that we need to use $4::uuid::text::uuid
  // Or maybe we need to ensure the cast happens in a way that PostgreSQL understands

  // Test 1: Try using the parameter directly without any column that requires UUID comparison
  console.log('\n📊 Test 1: Insert into a test table with operator_id UUID column...\n');
  try {
    // Create a test table
    await invokeQuery(`
      CREATE TABLE IF NOT EXISTS test_operator_insert (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        operator_id UUID NOT NULL,
        test_text TEXT
      )
    `);
    
    const test1 = await invokeQuery(`
      INSERT INTO test_operator_insert (operator_id, test_text)
      VALUES ($1::uuid, 'test')
      RETURNING id, operator_id
    `, [testOperatorId]);
    
    console.log('✅ Direct INSERT into test table works!');
    console.log('Inserted:', test1.rows[0]);
    
    await invokeQuery(`DROP TABLE test_operator_insert`);
    console.log('🧹 Cleaned up test table');
  } catch (error: any) {
    console.log('❌ Test table INSERT failed:', error.message);
    // Try to clean up anyway
    try {
      await invokeQuery(`DROP TABLE IF EXISTS test_operator_insert`);
    } catch {}
  }
  console.log('');

  // Test 2: Check if the issue is specific to itinerary_items table
  console.log('\n📊 Test 2: Check if issue is specific to itinerary_items...\n');
  console.log('The error happens even with minimal INSERT into itinerary_items');
  console.log('This suggests the issue is with the table itself or a trigger');
  console.log('');

  // Test 3: Try disabling the trigger temporarily
  console.log('\n📊 Test 3: Try INSERT with trigger disabled...\n');
  try {
    // We can't use multiple statements, so let's try a different approach
    // Actually, let me check if we can use a transaction or if the trigger is the issue
    
    // Try using a DO block to disable trigger, insert, re-enable
    const test3 = await invokeQuery(`
      DO $$
      DECLARE
        result_id UUID;
      BEGIN
        -- Disable trigger
        ALTER TABLE itinerary_items DISABLE TRIGGER recalculate_itinerary_price_on_item_change;
        
        -- Insert
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
        RETURNING id INTO result_id;
        
        -- Re-enable trigger
        ALTER TABLE itinerary_items ENABLE TRIGGER recalculate_itinerary_price_on_item_change;
        
        -- Return result
        RAISE NOTICE 'Inserted ID: %', result_id;
      END $$;
      SELECT id, operator_id FROM itinerary_items WHERE id = (SELECT id FROM itinerary_items ORDER BY created_at DESC LIMIT 1);
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
    
    console.log('✅ INSERT with trigger disabled works!');
    console.log('This means the trigger is causing the issue!');
  } catch (error: any) {
    console.log('❌ DO block approach failed:', error.message);
    console.log('(This might be because we can\'t use parameters in DO blocks this way)');
  }
  console.log('');

  // Test 4: Check the trigger function more carefully
  console.log('\n📊 Test 4: Examining trigger function for operator_id usage...\n');
  try {
    const triggerFunc = await invokeQuery(`
      SELECT pg_get_functiondef(oid) AS function_def
      FROM pg_proc
      WHERE proname = 'recalculate_itinerary_total_price'
    `);
    
    if (triggerFunc.rows && triggerFunc.rows.length > 0) {
      const funcDef = triggerFunc.rows[0].function_def;
      console.log('Trigger function definition:');
      console.log(funcDef);
      console.log('');
      
      // Check if it references operator_id
      if (funcDef.includes('operator_id')) {
        console.log('⚠️  Trigger function references operator_id!');
      } else {
        console.log('✅ Trigger function does NOT reference operator_id');
      }
    }
  } catch (error: any) {
    console.log('Error:', error.message);
  }
  console.log('');

  console.log('='.repeat(80));
}

testParameterTypes().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

