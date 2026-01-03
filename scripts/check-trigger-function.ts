/**
 * Check the trigger function that's causing the issue
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

async function checkTriggerFunction() {
  console.log('🔍 Checking trigger function...\n');
  console.log('='.repeat(80));

  // Get the function definition
  console.log('\n📊 Getting function definition...\n');
  try {
    const functionDef = await invokeQuery(`
      SELECT 
        p.proname AS function_name,
        pg_get_functiondef(p.oid) AS function_definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'recalculate_itinerary_total_price'
      AND n.nspname = 'public'
    `);
    
    if (functionDef.rows && functionDef.rows.length > 0) {
      console.log('Function definition:');
      console.log(functionDef.rows[0].function_definition);
      console.log('');
    } else {
      console.log('Function not found');
    }
  } catch (error: any) {
    console.log('Error getting function:', error.message);
  }

  // Check if there are any other functions that might reference operator_id
  console.log('\n📊 Checking for other functions referencing operator_id...\n');
  try {
    const otherFunctions = await invokeQuery(`
      SELECT 
        p.proname AS function_name,
        pg_get_functiondef(p.oid) AS function_definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE pg_get_functiondef(p.oid) LIKE '%operator_id%'
      AND n.nspname = 'public'
    `);
    
    if (otherFunctions.rows && otherFunctions.rows.length > 0) {
      console.log(`Found ${otherFunctions.rows.length} function(s) referencing operator_id:`);
      otherFunctions.rows.forEach((f: any, i: number) => {
        console.log(`\n${i + 1}. ${f.function_name}:`);
        console.log(f.function_definition.substring(0, 500) + '...');
      });
    } else {
      console.log('No other functions found referencing operator_id');
    }
  } catch (error: any) {
    console.log('Error checking functions:', error.message);
  }

  console.log('\n' + '='.repeat(80));
}

checkTriggerFunction().catch((error) => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});

