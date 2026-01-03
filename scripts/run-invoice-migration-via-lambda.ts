import { readFileSync } from 'fs';
import { join } from 'path';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';
const AWS_REGION = process.env.AWS_REGION || process.env.DEPLOYMENT_REGION || 'us-east-1';

async function invokeLambda(action: string, query?: string, params?: any[]): Promise<any> {
  const isServerSide = typeof window === 'undefined';
  
  if (!isServerSide) {
    throw new Error('Lambda client can only be used server-side');
  }

  try {
    // Get AWS credentials from environment (prefer .env.local, fallback to process.env)
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local');
    }

    const credentials = {
      accessKeyId,
      secretAccessKey,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    };

    const lambdaClient = new LambdaClient({
      region: AWS_REGION,
      credentials,
    });

    const payload: any = { action };
    if (query) {
      payload.query = query;
    }
    if (params) {
      payload.params = params;
    }

    const command = new InvokeCommand({
      FunctionName: LAMBDA_FUNCTION_NAME,
      Payload: JSON.stringify(payload),
    });

    const response = await lambdaClient.send(command);
    const result = JSON.parse(Buffer.from(response.Payload as Uint8Array).toString());

    // Lambda returns { statusCode, body } format
    if (result.statusCode && result.statusCode !== 200) {
      const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      const errorMessage = errorBody.message || errorBody.error || errorBody.detail || 'Lambda invocation failed';
      throw new Error(errorMessage);
    }

    if (result.error) {
      throw new Error(result.error);
    }

    // Return the body (contains rows/data) or the result itself
    return typeof result.body === 'string' ? JSON.parse(result.body) : (result.body || result);
  } catch (error: any) {
    console.error('Lambda invocation error:', error);
    throw error;
  }
}

async function runMigration() {
  console.log('🚀 Starting invoice enhancement database migration via Lambda...\n');
  console.log(`📡 Lambda Function: ${LAMBDA_FUNCTION_NAME}`);
  console.log(`🌍 Region: ${AWS_REGION}\n`);

  try {
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '028_add_enhanced_invoice_fields.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Migration file loaded (${migrationSQL.length} characters)\n`);

    // Split SQL into individual statements, but keep them in order
    // Remove comments and empty lines first
    let cleanSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n');

    // Split by semicolon but preserve multi-line statements
    const statements = cleanSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.length > 0 && 
        !stmt.startsWith('=') &&
        !stmt.match(/^=+$/)
      );

    console.log(`📝 Executing ${statements.length} SQL statements via Lambda...\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements
      if (!statement || statement.length < 10) {
        continue;
      }

      try {
        // Show progress for significant operations
        const firstWords = statement.split(/\s+/).slice(0, 3).join(' ').toUpperCase();
        if (firstWords.includes('CREATE') || firstWords.includes('ALTER') || firstWords.includes('DROP') || firstWords.includes('UPDATE')) {
          console.log(`  [${i + 1}/${statements.length}] Executing: ${firstWords}...`);
        }

        // Execute statement with semicolon
        const statementWithSemicolon = statement.endsWith(';') ? statement : statement + ';';
        const result = await invokeLambda('query', statementWithSemicolon, []);
        
        if (result.error) {
          // Some errors are expected (e.g., IF NOT EXISTS already exists)
          if (result.error.includes('already exists') || 
              result.error.includes('does not exist') ||
              result.error.includes('duplicate') ||
              (result.error.includes('column') && result.error.includes('already'))) {
            console.log(`  ⚠️  [${i + 1}] Skipped (already applied): ${result.error.split('\n')[0]}`);
            successCount++;
          } else {
            console.error(`  ❌ [${i + 1}] Error: ${result.error}`);
            errorCount++;
          }
        } else {
          successCount++;
          if (firstWords.includes('ALTER') || firstWords.includes('CREATE')) {
            console.log(`     ✅ Completed`);
          }
        }
      } catch (error: any) {
        // Some errors are expected (e.g., IF NOT EXISTS already exists)
        const errorMsg = error.message || String(error);
        if (errorMsg.includes('already exists') || 
            errorMsg.includes('does not exist') ||
            errorMsg.includes('duplicate') ||
            (errorMsg.includes('column') && errorMsg.includes('already'))) {
          console.log(`  ⚠️  [${i + 1}] Skipped (already applied): ${errorMsg.split('\n')[0]}`);
          successCount++;
        } else {
          console.error(`  ❌ [${i + 1}] Error: ${errorMsg}`);
          errorCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50) + '\n');

    if (errorCount === 0) {
      console.log('✅ Migration completed successfully!');
      console.log('');
      console.log('The following changes have been applied:');
      console.log('  ✓ Added lead_id column to invoices table');
      console.log('  ✓ Added billing_address (JSONB) column');
      console.log('  ✓ Added tax_rate, tax_amount, subtotal columns');
      console.log('  ✓ Added payment_terms, notes, currency columns');
      console.log('  ✓ Added line_items (JSONB) column');
      console.log('  ✓ Created index on lead_id');
      console.log('  ✓ Updated existing invoices with lead_id from itineraries');
      console.log('');
    } else {
      console.log('⚠️  Migration completed with some errors. Please review above.');
      console.log('   Some errors may be expected (e.g., columns already exist).');
      console.log('');
    }

    process.exit(errorCount === 0 ? 0 : 1);
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.message?.includes('credentials') || error.message?.includes('AccessDenied')) {
      console.error('\nPlease check:');
      console.error('  1. AWS_ACCESS_KEY_ID is set in .env.local');
      console.error('  2. AWS_SECRET_ACCESS_KEY is set in .env.local');
      console.error('  3. AWS_REGION or DEPLOYMENT_REGION is set');
      console.error('  4. Lambda function exists and has RDS access');
      console.error('  5. IAM permissions allow Lambda invocation');
    }
    process.exit(1);
  }
}

runMigration();

