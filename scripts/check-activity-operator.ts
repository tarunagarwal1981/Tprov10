/**
 * Check specific activity's operator_id
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

async function checkActivity() {
  const activityId = '8d4579e0-fef5-44d4-8318-9acb0b150c0b';
  
  console.log(`Checking activity: ${activityId}\n`);
  
  const query = `
    SELECT 
      ap.id,
      ap.title,
      ap.operator_id,
      CASE WHEN u.id IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as operator_exists,
      u.email as operator_email
    FROM activity_packages ap
    LEFT JOIN users u ON ap.operator_id::text = u.id::text
    WHERE ap.id::text = $1
  `;
  
  const result = await invokeQuery(query, [activityId]);
  
  if (result.rows && result.rows.length > 0) {
    console.table(result.rows);
    
    const activity = result.rows[0];
    if (activity.operator_exists === 'MISSING') {
      console.log('\n⚠️  Operator still missing! Updating...');
      
      // Get the correct operator_id
      const operatorQuery = `SELECT id FROM users WHERE email = 'operator@gmail.com' LIMIT 1`;
      const operatorResult = await invokeQuery(operatorQuery, []);
      
      if (operatorResult.rows && operatorResult.rows.length > 0) {
        const correctOperatorId = operatorResult.rows[0].id;
        console.log(`Correct operator_id: ${correctOperatorId}`);
        
        // Update this specific activity
        const updateQuery = `
          UPDATE activity_packages
          SET operator_id = $1::text
          WHERE id::text = $2
          RETURNING id, title, operator_id
        `;
        
        const updateResult = await invokeQuery(updateQuery, [correctOperatorId, activityId]);
        console.log('\n✅ Updated activity:');
        console.table(updateResult.rows);
      }
    } else {
      console.log('\n✅ Operator exists in users table');
    }
  } else {
    console.log('Activity not found');
  }
}

checkActivity().catch(console.error);

