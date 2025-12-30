/**
 * Verify Vouchers Table
 * Simple script to verify the vouchers table exists and has the expected structure
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

config({ path: resolve(process.cwd(), '.env.local') });

const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';
const AWS_REGION = process.env.AWS_REGION || process.env.DEPLOYMENT_REGION || 'us-east-1';

async function invokeLambda(action: string, query?: string, params?: any[]): Promise<any> {
  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: process.env.AWS_ACCESS_KEY_ID ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      sessionToken: process.env.AWS_SESSION_TOKEN,
    } : undefined,
  });

  const command = new InvokeCommand({
    FunctionName: LAMBDA_FUNCTION_NAME,
    Payload: JSON.stringify({ action, query, params }),
  });

  const response = await lambdaClient.send(command);
  if (!response.Payload) throw new Error('Lambda returned no payload');

  const payloadString = Buffer.from(response.Payload).toString('utf-8');
  const result = JSON.parse(payloadString);

  if (result.statusCode && result.statusCode !== 200) {
    throw new Error(result.body || result.error || 'Lambda returned error status');
  }
  if (result.error) throw new Error(result.error);

  return result.body || result;
}

async function verify() {
  console.log('🔍 Verifying vouchers table...\n');

  try {
    // Check if table exists
    const tableCheck = await invokeLambda('query', 
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name = 'vouchers'`
    );
    
    const tableResult = typeof tableCheck === 'string' ? JSON.parse(tableCheck) : tableCheck;
    const rows = tableResult?.rows || tableResult?.data || [];
    const exists = rows.length > 0;
    
    if (!exists) {
      console.log('❌ Vouchers table does not exist');
      return;
    }

    console.log('✅ Vouchers table exists!\n');

    // Get column count
    const colCount = await invokeLambda('query', 
      `SELECT COUNT(*) as count FROM information_schema.columns WHERE table_name = 'vouchers'`
    );
    const colCountResult = typeof colCount === 'string' ? JSON.parse(colCount) : colCount;
    const count = colCountResult?.rows?.[0]?.count || colCountResult?.data?.[0]?.count || 'unknown';
    console.log(`📊 Table has ${count} columns\n`);

    // Get key columns
    const columns = await invokeLambda('query', 
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'vouchers' 
       ORDER BY ordinal_position`
    );
    
    const colResult = typeof columns === 'string' ? JSON.parse(columns) : columns;
    const cols = colResult?.rows || colResult?.data || [];
    if (cols.length > 0) {
      console.log('📋 Key columns:');
      cols.slice(0, 15).forEach((col: any) => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
      if (cols.length > 15) {
        console.log(`   ... and ${cols.length - 15} more`);
      }
    }

    // Check for indexes
    const indexes = await invokeLambda('query', 
      `SELECT indexname FROM pg_indexes WHERE tablename = 'vouchers'`
    );
    const idxResult = typeof indexes === 'string' ? JSON.parse(indexes) : indexes;
    const idxs = idxResult?.rows || idxResult?.data || [];
    console.log(`\n📑 Found ${idxs.length} indexes on vouchers table`);

    // Check for functions
    const functions = await invokeLambda('query', 
      `SELECT routine_name FROM information_schema.routines 
       WHERE routine_name LIKE '%voucher%' AND routine_schema = 'public'`
    );
    const funcResult = typeof functions === 'string' ? JSON.parse(functions) : functions;
    const funcs = funcResult?.rows || funcResult?.data || [];
    console.log(`⚙️  Found ${funcs.length} voucher-related functions`);

    console.log('\n✅ Vouchers table verification complete!');
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
  }
}

verify().catch(console.error);

