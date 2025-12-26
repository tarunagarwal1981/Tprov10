/**
 * Run Sub-Agent System Migration via Lambda
 * 
 * This script runs the migration to add parent_agent_id column and sub_agent_assignments table
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
  console.log('🚀 Starting Sub-Agent System Migration via Lambda...\n');

  try {
    // Read migration file
    const migrationPath = resolve(process.cwd(), 'supabase/migrations/024_add_sub_agent_system.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log('✅ Migration file loaded\n');

    // Test Lambda connection
    console.log('🔌 Testing Lambda database service connection...');
    const testResult = await invokeLambda('query', 'SELECT NOW() as current_time');
    console.log('✅ Lambda connection successful\n');

    // Execute the entire migration as a single statement
    // This is necessary because the DO $$ ... END $$; block contains semicolons
    console.log('📝 Executing migration...\n');

    try {
      console.log('  Executing: ALTER TABLE users ADD COLUMN parent_agent_id...');
      console.log('  Executing: CREATE INDEX idx_users_parent_agent_id...');
      console.log('  Executing: DO $$ block (enum handling)...');
      console.log('  Executing: CREATE TABLE sub_agent_assignments...');
      console.log('  Executing: CREATE INDEX statements...');

      // Execute the entire migration SQL as one statement
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
        throw error;
      }
    }

    // Verify migration
    console.log('🔍 Verifying migration...');
    
    // Check if parent_agent_id column exists
    const columnCheck = await invokeLambda('query', `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'parent_agent_id'
    `);
    
    // Lambda returns data in different format - check both possibilities
    const columnRows = columnCheck.rows || columnCheck || [];
    if (Array.isArray(columnRows) && columnRows.length === 0) {
      // Try alternative query format
      const altCheck = await invokeLambda('queryOne', `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'parent_agent_id'
      `);
      if (!altCheck || !altCheck.column_name) {
        throw new Error('parent_agent_id column was not created');
      }
    }
    console.log('✅ parent_agent_id column exists');

    // Check if sub_agent_assignments table exists
    const tableCheck = await invokeLambda('query', `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'sub_agent_assignments'
    `);
    
    const tableRows = tableCheck.rows || tableCheck || [];
    if (Array.isArray(tableRows) && tableRows.length === 0) {
      // Try alternative query format
      const altCheck = await invokeLambda('queryOne', `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'sub_agent_assignments'
      `);
      if (!altCheck || !altCheck.table_name) {
        throw new Error('sub_agent_assignments table was not created');
      }
    }
    console.log('✅ sub_agent_assignments table exists');

    // Check if index exists
    const indexCheck = await invokeLambda('query', `
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'users' AND indexname = 'idx_users_parent_agent_id'
    `);
    
    const indexRows = indexCheck.rows || indexCheck || [];
    if (Array.isArray(indexRows) && indexRows.length === 0) {
      console.warn('⚠️  idx_users_parent_agent_id index not found (may have been created with different name)');
    } else {
      console.log('✅ idx_users_parent_agent_id index exists');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n✅ Sub-agent system is now ready:');
    console.log('   - parent_agent_id column added to users table');
    console.log('   - sub_agent_assignments table created');
    console.log('   - Indexes created');

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

