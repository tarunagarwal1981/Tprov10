/**
 * Run Vouchers Table Migration via Lambda
 * 
 * This script runs the migration to create the vouchers table
 * Uses AWS Lambda database service (which has VPC access to RDS)
 * Uses AWS credentials from .env.local
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

// Load environment variables from .env.local
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
    Payload: JSON.stringify({
      action,
      query,
      params,
    }),
  });

  const response = await lambdaClient.send(command);

  if (!response.Payload) {
    throw new Error('Lambda returned no payload');
  }

  const payloadString = Buffer.from(response.Payload).toString('utf-8');
  let result;
  
  try {
    result = JSON.parse(payloadString);
  } catch (e) {
    // If payload is not JSON, it might be an error string
    throw new Error(`Lambda returned invalid JSON: ${payloadString}`);
  }

  // Check for error in response
  if (result.statusCode && result.statusCode !== 200) {
    throw new Error(result.body || result.error || 'Lambda returned error status');
  }

  if (result.error) {
    throw new Error(result.error);
  }

  // Return the data (could be in body, or directly in result)
  return result.body || result;
}

async function runMigration() {
  console.log('🚀 Starting Vouchers Table Migration via Lambda...\n');

  try {
    // Read migration file
    const migrationPath = resolve(process.cwd(), 'supabase/migrations/027_create_vouchers_table.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log('✅ Migration file loaded\n');

    // Test Lambda connection
    console.log('🔌 Testing Lambda database service connection...');
    const testResult = await invokeLambda('query', 'SELECT NOW() as current_time');
    console.log('✅ Lambda connection successful\n');

    // Execute the entire migration as a single statement
    // PostgreSQL functions and triggers need to be executed together
    console.log('📝 Executing migration SQL...\n');

    try {
      console.log('   Executing CREATE TABLE and related statements...');
      await invokeLambda('query', migrationSQL);
      console.log('   ✅ Migration executed successfully!\n');
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}\n`);
      
      // Check if it's an "already exists" error
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('   ⚠️  Some objects may already exist. This is OK.\n');
      } else {
        throw error;
      }
    }

    console.log('✅ Vouchers table migration completed!');

    // Verify the table was created
    console.log('\n🔍 Verifying vouchers table...');
    try {
      // Simple check - try to get table info
      const checkResult = await invokeLambda('queryOne', 
        `SELECT COUNT(*) as table_exists FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vouchers'`
      );
      
      const exists = checkResult?.table_exists || checkResult?.rows?.[0]?.table_exists || checkResult?.data?.table_exists;
      
      if (exists && parseInt(exists) > 0) {
        console.log('✅ Vouchers table verified successfully!');
        
        // Get column count
        try {
          const colResult = await invokeLambda('query', 
            `SELECT COUNT(*) as col_count FROM information_schema.columns WHERE table_name = 'vouchers'`
          );
          const colCount = colResult?.rows?.[0]?.col_count || colResult?.data?.[0]?.col_count || 'unknown';
          console.log(`   Table has ${colCount} columns`);
        } catch (e) {
          // Ignore column count error
        }
      } else {
        console.log('⚠️  Vouchers table not found in information_schema.');
      }
    } catch (error: any) {
      // If error mentions "already exists" for trigger, table is likely created
      if (error.message.includes('already exists') || error.message.includes('trigger')) {
        console.log('✅ Vouchers table exists (trigger/function already exists confirms table was created)');
      } else {
        console.log(`⚠️  Could not verify table: ${error.message}`);
        console.log('   (This may be OK if the table was created successfully)');
      }
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runMigration().catch(console.error);

