/**
 * Deep dive into the operator_id error - check everything
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '/0KocZx7f1XpkrvFe6mREMRCS5etRya/+xnnOn7y';
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

async function deepDive() {
  console.log('🔍 Deep dive into operator_id error...\n');
  console.log('='.repeat(80));

  // Get full table definition
  console.log('\n📊 Step 1: Full table definition...\n');
  try {
    const tableDef = await invokeQuery(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'itinerary_items'
      ORDER BY ordinal_position
    `);
    
    console.log('Table columns:');
    tableDef.rows.forEach((col: any) => {
      console.log(`  ${col.column_name.padEnd(25)} ${col.udt_name.padEnd(15)} nullable: ${col.is_nullable.padEnd(3)} default: ${col.column_default || 'NULL'}`);
    });
  } catch (error: any) {
    console.log('Error:', error.message);
  }
  console.log('');

  // Check ALL constraints
  console.log('\n📊 Step 2: ALL constraints on itinerary_items...\n');
  try {
    const allConstraints = await invokeQuery(`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = 'itinerary_items'
      ORDER BY tc.constraint_type, tc.constraint_name
    `);
    
    console.log('All constraints:');
    allConstraints.rows.forEach((c: any) => {
      console.log(`  ${c.constraint_type.padEnd(15)} ${c.constraint_name.padEnd(40)} ${c.column_name || 'N/A'}`);
      if (c.foreign_table_name) {
        console.log(`    → ${c.foreign_table_name}.${c.foreign_column_name}`);
      }
    });
  } catch (error: any) {
    console.log('Error:', error.message);
  }
  console.log('');

  // Try INSERT with $4::uuid instead of CAST($4 AS uuid)
  console.log('\n📊 Step 3: Testing INSERT with $4::uuid syntax...\n');
  try {
    const testOperatorId = 'ed6e2aa5-0dfb-4c7a-99e4-85f7e702f087';
    const testItineraryId = '4ecb42d5-f6d2-4474-9cb0-1efaa37a7542';
    
    const testInsert = await invokeQuery(`
      INSERT INTO itinerary_items (
        id, itinerary_id, package_type, package_id, operator_id, package_title, configuration, unit_price, quantity, total_price, display_order
      ) VALUES (
        gen_random_uuid(),
        $1::uuid,
        $2::text,
        $3::uuid,
        $4::uuid,
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
    
    console.log('✅ INSERT with $4::uuid syntax works!');
    console.log('Inserted:', testInsert.rows[0]);
    
    // Clean up
    await invokeQuery(`DELETE FROM itinerary_items WHERE id = $1`, [testInsert.rows[0].id]);
    console.log('🧹 Cleaned up');
  } catch (error: any) {
    console.log('❌ INSERT with $4::uuid failed:', error.message);
    console.log('Error code:', (error as any).code);
  }
  console.log('');

  // Check if there's an index that might be causing issues
  console.log('\n📊 Step 4: Checking indexes on operator_id...\n');
  try {
    const indexes = await invokeQuery(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'itinerary_items'
        AND indexdef LIKE '%operator_id%'
    `);
    
    if (indexes.rows && indexes.rows.length > 0) {
      console.log('Indexes found:');
      indexes.rows.forEach((idx: any) => {
        console.log(`  ${idx.indexname}: ${idx.indexdef}`);
      });
    } else {
      console.log('No indexes found on operator_id');
    }
  } catch (error: any) {
    console.log('Error:', error.message);
  }
  console.log('');

  console.log('='.repeat(80));
}

deepDive().catch((error) => {
  console.error('❌ Deep dive failed:', error);
  process.exit(1);
});

