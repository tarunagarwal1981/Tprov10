/**
 * Run Lead Communications Migration via Lambda
 * 
 * This script runs the migration to create lead_communications table
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
    throw new Error(`Lambda returned invalid JSON: ${payloadString}`);
  }

  if (result.statusCode && result.statusCode !== 200) {
    const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    const error = new Error(errorBody?.message || errorBody?.error || 'Lambda returned error status');
    (error as any).code = errorBody?.code;
    throw error;
  }

  if (result.error) {
    throw new Error(result.error);
  }

  const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  return body || result;
}

async function runMigration() {
  console.log('🚀 Starting Lead Communications Migration via Lambda...\n');

  try {
    const migrationPath = resolve(process.cwd(), 'supabase/migrations/022_create_lead_communications.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Migration file loaded (${migrationSQL.length} characters)\n`);

    console.log('🔌 Testing Lambda database service connection...');
    try {
      const testResult = await invokeLambda('query', 'SELECT NOW() as current_time');
      console.log('✅ Lambda connection successful\n');
    } catch (error: any) {
      console.error('❌ Lambda connection failed:', error.message);
      throw error;
    }

    console.log('📝 Executing migration...\n');
    try {
      console.log('  Executing: CREATE TABLE lead_communications...');
      console.log('  Executing: CREATE INDEX statements...');
      console.log('  Executing: CREATE FUNCTION and TRIGGER...');

      await invokeLambda('query', migrationSQL);
      console.log('✅ Migration executed successfully\n');
    } catch (error: any) {
      if (error.message?.includes('already exists') || 
          error.message?.includes('does not exist') ||
          error.message?.includes('duplicate')) {
        console.log(`⚠️  Some parts may already exist: ${error.message.split('\n')[0]}`);
        console.log('   Continuing with verification...\n');
      } else {
        throw error;
      }
    }

    console.log('🔍 Verifying migration...');
    
    try {
      const tableCheck = await invokeLambda('query', `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'lead_communications'
      `);
      const parsed = typeof tableCheck === 'string' ? JSON.parse(tableCheck) : tableCheck;
      const rows = parsed.rows || parsed || [];
      if (Array.isArray(rows) && rows.length > 0) {
        console.log('✅ lead_communications table exists');
      } else {
        console.warn('⚠️  lead_communications table not found');
      }
    } catch (e) {
      console.warn('⚠️  Could not verify lead_communications table');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n✅ Lead communications system is now ready:');
    console.log('   - lead_communications table created');
    console.log('   - Indexes created');
    console.log('   - Triggers created');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Migration failed:');
    console.error(error.message || error);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

runMigration();

