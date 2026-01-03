/**
 * Check if there's a foreign key constraint on operator_id
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
  
  let body;
  if (result.statusCode === 200) {
    body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  } else {
    throw new Error(result.body?.error || 'Query failed');
  }

  return body;
}

async function checkConstraint() {
  console.log('Checking foreign key constraints on itinerary_items.operator_id...\n');
  
  const query = `
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_type
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'itinerary_items'
      AND kcu.column_name = 'operator_id';
  `;
  
  const result = await invokeQuery(query, []);
  
  console.log('Foreign key constraints on operator_id:');
  if (result.rows && result.rows.length > 0) {
    console.table(result.rows);
    console.log('\n⚠️  Foreign key constraint exists! This might be causing the type mismatch.');
  } else {
    console.log('   No foreign key constraints found on operator_id');
  }
  
  // Also check the column type
  console.log('\nChecking column type...');
  const typeQuery = `
    SELECT 
      column_name,
      data_type,
      udt_name
    FROM information_schema.columns
    WHERE table_name = 'itinerary_items'
      AND column_name = 'operator_id';
  `;
  
  const typeResult = await invokeQuery(typeQuery, []);
  console.table(typeResult.rows || []);
}

checkConstraint().catch(console.error);

