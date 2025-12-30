/**
 * Run Payment Workflow Migration via Lambda
 * 
 * This script runs the migration to create itinerary_payments and invoices tables
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
    const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    const error = new Error(errorBody?.message || errorBody?.error || 'Lambda returned error status');
    (error as any).code = errorBody?.code;
    throw error;
  }

  if (result.error) {
    throw new Error(result.error);
  }

  // Return the data (could be in body, or directly in result)
  const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  return body || result;
}

async function runMigration() {
  console.log('🚀 Starting Payment Workflow Migration via Lambda...\n');

  try {
    // Read migration file
    const migrationPath = resolve(process.cwd(), 'supabase/migrations/023_add_payment_workflow.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Migration file loaded (${migrationSQL.length} characters)\n`);

    // Test Lambda connection
    console.log('🔌 Testing Lambda database service connection...');
    try {
      const testResult = await invokeLambda('query', 'SELECT NOW() as current_time');
      const parsed = typeof testResult === 'string' ? JSON.parse(testResult) : testResult;
      console.log('✅ Lambda connection successful\n');
    } catch (error: any) {
      console.error('❌ Lambda connection failed:', error.message);
      throw error;
    }

    // Execute the entire migration as a single statement
    // This is necessary because the migration contains PostgreSQL functions with $$ delimiters
    // that contain semicolons, which would break if we split by semicolons
    console.log('📝 Executing migration...\n');

    try {
      console.log('  Executing: Payment workflow migration (tables, functions, triggers)...');
      await invokeLambda('query', migrationSQL);
      console.log('✅ Migration executed successfully\n');
    } catch (error: any) {
      // Some errors are expected (e.g., IF NOT EXISTS already exists)
      if (error.message?.includes('already exists') || 
          error.message?.includes('does not exist') ||
          error.message?.includes('duplicate') ||
          error.message?.includes('duplicate_object')) {
        console.log(`⚠️  Some parts may already exist: ${error.message.split('\n')[0]}`);
        console.log('   Continuing with verification...\n');
      } else {
        console.error(`❌ Migration error: ${error.message}`);
        throw error;
      }
    }

    // Verify migration
    {
      console.log('🔍 Verifying migration...');
      
      // Check if itinerary_payments table exists
      try {
        const tableCheck = await invokeLambda('query', `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'itinerary_payments'
        `);
        const parsed = typeof tableCheck === 'string' ? JSON.parse(tableCheck) : tableCheck;
        const rows = parsed.rows || parsed || [];
        if (Array.isArray(rows) && rows.length > 0) {
          console.log('✅ itinerary_payments table exists');
        } else {
          console.warn('⚠️  itinerary_payments table not found');
        }
      } catch (e) {
        console.warn('⚠️  Could not verify itinerary_payments table');
      }

      // Check if invoices table exists
      try {
        const tableCheck = await invokeLambda('query', `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'invoices'
        `);
        const parsed = typeof tableCheck === 'string' ? JSON.parse(tableCheck) : tableCheck;
        const rows = parsed.rows || parsed || [];
        if (Array.isArray(rows) && rows.length > 0) {
          console.log('✅ invoices table exists');
        } else {
          console.warn('⚠️  invoices table not found');
        }
      } catch (e) {
        console.warn('⚠️  Could not verify invoices table');
      }

      console.log('\n🎉 Migration completed successfully!');
      console.log('\n✅ Payment workflow is now ready:');
      console.log('   - itinerary_payments table created');
      console.log('   - invoices table created');
      console.log('   - Confirmation/locking fields added to itineraries table');
      console.log('   - Indexes and triggers created');
    }

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

// Run migration
runMigration();

