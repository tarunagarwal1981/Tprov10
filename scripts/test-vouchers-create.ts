/**
 * Test creating vouchers table directly
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

config({ path: resolve(process.cwd(), '.env.local') });

const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';
const AWS_REGION = process.env.AWS_REGION || process.env.DEPLOYMENT_REGION || 'us-east-1';

async function invokeLambda(action: string, query?: string): Promise<any> {
  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: process.env.AWS_ACCESS_KEY_ID ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      sessionToken: process.env.AWS_SESSION_TOKEN,
    } : undefined,
  });

  const response = await lambdaClient.send(new InvokeCommand({
    FunctionName: LAMBDA_FUNCTION_NAME,
    Payload: JSON.stringify({ action, query }),
  }));

  if (!response.Payload) throw new Error('No payload');
  const result = JSON.parse(Buffer.from(response.Payload).toString('utf-8'));
  if (result.error) throw new Error(result.error);
  return result.body || result;
}

async function test() {
  console.log('Testing vouchers table creation...\n');
  
  // First check if it exists
  try {
    const check = await invokeLambda('query', 
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vouchers'`
    );
    console.log('Current check result:', JSON.stringify(check, null, 2));
    
    if (check?.rows && check.rows.length > 0) {
      console.log('✅ Table already exists!');
      return;
    }
  } catch (e: any) {
    console.log('Check error (expected if table doesn\'t exist):', e.message);
  }

  // Try to create just the table
  try {
    console.log('\nCreating vouchers table...');
    const create = await invokeLambda('query', `
      CREATE TABLE IF NOT EXISTS vouchers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        itinerary_id UUID NOT NULL,
        itinerary_item_id UUID NOT NULL,
        lead_id UUID NOT NULL,
        agent_id UUID NOT NULL,
        issued_by UUID,
        voucher_number TEXT UNIQUE NOT NULL,
        booking_reference TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'issued',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('Create result:', JSON.stringify(create, null, 2));
    console.log('✅ Table created!');
  } catch (e: any) {
    console.error('Create error:', e.message);
  }
}

test().catch(console.error);

