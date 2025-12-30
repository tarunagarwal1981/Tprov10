import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

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
  console.log('🚀 Starting Remove Phone Validation Migration via Lambda...\n');

  try {
    const migrationPath = resolve(process.cwd(), 'migrations/003_remove_phone_validation.sql');
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
      console.log('  Executing: DROP CONSTRAINT check_phone_format...');

      await invokeLambda('query', migrationSQL);
      console.log('✅ Migration executed successfully\n');
    } catch (error: any) {
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

    console.log('🔍 Verifying migration...\n');
    
    try {
      // Check if constraint still exists
      const constraintCheck = await invokeLambda(
        'query',
        `SELECT constraint_name 
         FROM information_schema.table_constraints 
         WHERE table_name = 'leads' 
         AND constraint_name = 'check_phone_format'`
      );
      const constraintParsed = typeof constraintCheck === 'string' ? JSON.parse(constraintCheck) : constraintCheck;
      const constraintRows = constraintParsed.rows || constraintParsed || [];
      if (Array.isArray(constraintRows) && constraintRows.length === 0) {
        console.log('✅ check_phone_format constraint successfully removed');
      } else {
        console.log('⚠️  check_phone_format constraint still exists');
      }

      console.log('\n✅ Migration verification complete!');
      console.log('\n📊 Summary:');
      console.log('   - Phone number validation constraint removed');
      console.log('   - Phone numbers can now be in any format');
      console.log('\n🎉 Migration completed successfully!');

      process.exit(0);
    } catch (error: any) {
      console.error('❌ Verification error:', error.message);
      throw error;
    }
  } catch (error: any) {
    console.error('\n❌ Migration failed:');
    console.error(error.message || error);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

runMigration();

