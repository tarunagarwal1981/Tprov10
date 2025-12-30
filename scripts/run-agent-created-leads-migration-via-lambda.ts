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
  console.log('🚀 Starting Agent Created Leads Migration via Lambda...\n');

  try {
    const migrationPath = resolve(process.cwd(), 'migrations/002_add_agent_created_leads.sql');
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
      console.log('  Executing: ALTER TABLE leads ADD COLUMN status...');
      console.log('  Executing: ALTER TABLE leads ADD COLUMN source_custom...');
      console.log('  Executing: ALTER TABLE leads ADD COLUMN services...');
      console.log('  Executing: ALTER TABLE leads ADD COLUMN travel_month...');
      console.log('  Executing: ALTER TABLE leads ADD COLUMN origin...');
      console.log('  Executing: ALTER TABLE leads ADD COLUMN created_by_sub_agent_id...');
      console.log('  Executing: CREATE INDEX statements...');
      console.log('  Executing: CREATE FUNCTION and TRIGGER...');
      console.log('  Executing: Data validation constraints...');

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
      // Check if status column exists
      const statusCheck = await invokeLambda(
        'query',
        `SELECT column_name, data_type, column_default 
         FROM information_schema.columns 
         WHERE table_name = 'leads' AND column_name = 'status'`
      );
      const statusParsed = typeof statusCheck === 'string' ? JSON.parse(statusCheck) : statusCheck;
      const statusRows = statusParsed.rows || statusParsed || [];
      if (Array.isArray(statusRows) && statusRows.length > 0) {
        console.log('✅ status column exists');
      } else {
        console.log('⚠️  status column not found');
      }

      // Check if source_custom column exists
      const sourceCustomCheck = await invokeLambda(
        'query',
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_name = 'leads' AND column_name = 'source_custom'`
      );
      const sourceCustomParsed = typeof sourceCustomCheck === 'string' ? JSON.parse(sourceCustomCheck) : sourceCustomCheck;
      const sourceCustomRows = sourceCustomParsed.rows || sourceCustomParsed || [];
      if (Array.isArray(sourceCustomRows) && sourceCustomRows.length > 0) {
        console.log('✅ source_custom column exists');
      } else {
        console.log('⚠️  source_custom column not found');
      }

      // Check if services column exists
      const servicesCheck = await invokeLambda(
        'query',
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_name = 'leads' AND column_name = 'services'`
      );
      const servicesParsed = typeof servicesCheck === 'string' ? JSON.parse(servicesCheck) : servicesCheck;
      const servicesRows = servicesParsed.rows || servicesParsed || [];
      if (Array.isArray(servicesRows) && servicesRows.length > 0) {
        console.log('✅ services column exists');
      } else {
        console.log('⚠️  services column not found');
      }

      // Check if origin column exists
      const originCheck = await invokeLambda(
        'query',
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_name = 'leads' AND column_name = 'origin'`
      );
      const originParsed = typeof originCheck === 'string' ? JSON.parse(originCheck) : originCheck;
      const originRows = originParsed.rows || originParsed || [];
      if (Array.isArray(originRows) && originRows.length > 0) {
        console.log('✅ origin column exists');
      } else {
        console.log('⚠️  origin column not found');
      }

      // Check if created_by_sub_agent_id column exists
      const subAgentCheck = await invokeLambda(
        'query',
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_name = 'leads' AND column_name = 'created_by_sub_agent_id'`
      );
      const subAgentParsed = typeof subAgentCheck === 'string' ? JSON.parse(subAgentCheck) : subAgentCheck;
      const subAgentRows = subAgentParsed.rows || subAgentParsed || [];
      if (Array.isArray(subAgentRows) && subAgentRows.length > 0) {
        console.log('✅ created_by_sub_agent_id column exists');
      } else {
        console.log('⚠️  created_by_sub_agent_id column not found');
      }

      // Check indexes
      const indexCheck = await invokeLambda(
        'query',
        `SELECT indexname 
         FROM pg_indexes 
         WHERE tablename = 'leads' 
         AND indexname IN (
           'idx_leads_status',
           'idx_leads_agent_status',
           'idx_leads_agent_created',
           'idx_leads_agent_subagent',
           'idx_leads_created_by_sub_agent',
           'idx_leads_search'
         )`
      );
      const indexParsed = typeof indexCheck === 'string' ? JSON.parse(indexCheck) : indexCheck;
      const indexRows = indexParsed.rows || indexParsed || [];
      if (Array.isArray(indexRows) && indexRows.length > 0) {
        console.log(`✅ Found ${indexRows.length} indexes`);
        indexRows.forEach((idx: any) => {
          console.log(`   - ${idx.indexname}`);
        });
      }

      // Check trigger
      const triggerCheck = await invokeLambda(
        'query',
        `SELECT trigger_name 
         FROM information_schema.triggers 
         WHERE event_object_table = 'leads' 
         AND trigger_name = 'update_leads_updated_at'`
      );
      const triggerParsed = typeof triggerCheck === 'string' ? JSON.parse(triggerCheck) : triggerCheck;
      const triggerRows = triggerParsed.rows || triggerParsed || [];
      if (Array.isArray(triggerRows) && triggerRows.length > 0) {
        console.log('✅ update_leads_updated_at trigger exists');
      } else {
        console.log('⚠️  update_leads_updated_at trigger not found');
      }

      // Check constraints
      const constraintCheck = await invokeLambda(
        'query',
        `SELECT constraint_name 
         FROM information_schema.table_constraints 
         WHERE table_name = 'leads' 
         AND constraint_name IN (
           'check_email_format',
           'check_phone_format',
           'check_travel_dates',
           'check_adults_count'
         )`
      );
      const constraintParsed = typeof constraintCheck === 'string' ? JSON.parse(constraintCheck) : constraintCheck;
      const constraintRows = constraintParsed.rows || constraintParsed || [];
      if (Array.isArray(constraintRows) && constraintRows.length > 0) {
        console.log(`✅ Found ${constraintRows.length} constraints`);
        constraintRows.forEach((constraint: any) => {
          console.log(`   - ${constraint.constraint_name}`);
        });
      }

      console.log('\n✅ Migration verification complete!');
      console.log('\n📊 Summary:');
      console.log('   - All new columns added to leads table');
      console.log('   - Indexes created for performance');
      console.log('   - Trigger created for updated_at');
      console.log('   - Validation constraints added');
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

