/**
 * Check the CHECK constraint details
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

async function checkCheckConstraint() {
  console.log('🔍 Checking CHECK constraint details...\n');
  console.log('='.repeat(80));

  // Get the CHECK constraint definition
  console.log('\n📊 Getting CHECK constraint definition...\n');
  try {
    const checkDef = await invokeQuery(`
      SELECT
        tc.constraint_name,
        cc.check_clause
      FROM information_schema.table_constraints tc
      JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_name = 'itinerary_items'
        AND tc.constraint_type = 'CHECK'
    `);
    
    if (checkDef.rows && checkDef.rows.length > 0) {
      console.log('CHECK constraint(s) found:');
      checkDef.rows.forEach((c: any) => {
        console.log(`  ${c.constraint_name}: ${c.check_clause}`);
      });
    } else {
      console.log('No CHECK constraints found');
    }
  } catch (error: any) {
    console.log('Error:', error.message);
  }
  console.log('');

  // Try INSERT without casting itinerary_id, day_id, package_id (since they're TEXT)
  console.log('\n📊 Step 2: Testing INSERT without casting TEXT columns...\n');
  try {
    const testOperatorId = 'ed6e2aa5-0dfb-4c7a-99e4-85f7e702f087';
    const testItineraryId = '4ecb42d5-f6d2-4474-9cb0-1efaa37a7542';
    
    const testInsert = await invokeQuery(`
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
    
    console.log('✅ INSERT without casting TEXT columns works!');
    console.log('Inserted:', testInsert.rows[0]);
    
    // Clean up
    await invokeQuery(`DELETE FROM itinerary_items WHERE id = $1`, [testInsert.rows[0].id]);
    console.log('🧹 Cleaned up');
  } catch (error: any) {
    console.log('❌ INSERT failed:', error.message);
    console.log('Error code:', (error as any).code);
  }
  console.log('');

  console.log('='.repeat(80));
}

checkCheckConstraint().catch((error) => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});

