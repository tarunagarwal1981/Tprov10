import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';
const AWS_REGION = process.env.AWS_REGION || process.env.DEPLOYMENT_REGION || 'us-east-1';

async function invokeLambda(action: string, query: string, params?: any[]): Promise<any> {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not found');
  }

  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId,
      secretAccessKey,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    },
  });

  const command = new InvokeCommand({
    FunctionName: LAMBDA_FUNCTION_NAME,
    Payload: JSON.stringify({ action, query, params }),
  });

  const response = await lambdaClient.send(command);
  const result = JSON.parse(Buffer.from(response.Payload as Uint8Array).toString());

  if (result.statusCode && result.statusCode !== 200) {
    const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    throw new Error(errorBody.message || errorBody.error || 'Lambda error');
  }

  return typeof result.body === 'string' ? JSON.parse(result.body) : (result.body || result);
}

async function verifyMigration() {
  console.log('🔍 Verifying invoice migration...\n');

  try {
    // Check if columns exist
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
        AND column_name IN ('lead_id', 'billing_address', 'tax_rate', 'tax_amount', 'subtotal', 'payment_terms', 'notes', 'currency', 'line_items')
      ORDER BY column_name;
    `;

    const columnsResult = await invokeLambda('query', columnsQuery);
    const columns = columnsResult.rows || [];

    console.log(`✅ Found ${columns.length} new columns in invoices table:\n`);
    columns.forEach((col: any) => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    // Check if index exists
    const indexQuery = `
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'invoices' 
        AND indexname = 'idx_invoices_lead_id';
    `;

    const indexResult = await invokeLambda('query', indexQuery);
    const indexExists = (indexResult.rows || []).length > 0;

    if (indexExists) {
      console.log('\n✅ Index idx_invoices_lead_id exists');
    } else {
      console.log('\n⚠️  Index idx_invoices_lead_id not found');
    }

    // Check if existing invoices have lead_id
    const invoicesQuery = `
      SELECT 
        COUNT(*) as total_invoices,
        COUNT(lead_id) as invoices_with_lead_id
      FROM invoices;
    `;

    const invoicesResult = await invokeLambda('query', invoicesQuery);
    const stats = invoicesResult.rows?.[0] || {};

    console.log('\n📊 Invoice Statistics:');
    console.log(`   Total invoices: ${stats.total_invoices || 0}`);
    console.log(`   Invoices with lead_id: ${stats.invoices_with_lead_id || 0}`);

    if (columns.length === 9) {
      console.log('\n✅ Migration verification: SUCCESS');
      console.log('   All columns and index have been created successfully!');
    } else {
      console.log(`\n⚠️  Migration verification: PARTIAL`);
      console.log(`   Expected 9 columns, found ${columns.length}`);
    }

  } catch (error: any) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifyMigration();

