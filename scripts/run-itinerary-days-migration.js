/**
 * Run Migration: Enhance Itinerary Days
 * Executes migration 017_enhance_itinerary_days.sql via AWS Lambda
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('🚀 Running itinerary_days enhancement migration via AWS Lambda\n');

  // Configure AWS SDK
  const lambdaClient = new LambdaClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_ACCESS_KEY_ID ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN }),
    } : undefined, // Use default credential provider chain if not set
  });

  const lambdaName = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/017_enhance_itinerary_days.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log(`📄 Migration file: ${migrationPath}`);
  console.log(`📏 SQL length: ${migrationSQL.length} characters`);
  console.log(`🔧 Lambda function: ${lambdaName}`);
  console.log(`🌍 AWS Region: ${process.env.AWS_REGION || 'us-east-1'}\n`);

  // Split SQL into statements (handling multi-line statements)
  // Remove comments first
  const sqlWithoutComments = migrationSQL
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
  
  // Split by semicolon, but keep multi-line statements together
  const statements = sqlWithoutComments
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => 
      stmt.length > 0 && 
      !stmt.match(/^COMMENT ON/i)
    );

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip very short statements (likely empty after filtering)
    if (statement.length < 10) {
      continue;
    }

    // Show progress
    const firstWords = statement.split(/\s+/).slice(0, 3).join(' ').toUpperCase();
    console.log(`[${i + 1}/${statements.length}] Executing: ${firstWords}...`);

    try {
      const command = new InvokeCommand({
        FunctionName: lambdaName,
        Payload: JSON.stringify({
          action: 'query',
          query: statement + ';', // Add semicolon back
          params: [],
        }),
      });

      const response = await lambdaClient.send(command);
      const result = JSON.parse(Buffer.from(response.Payload).toString());

      if (result.statusCode !== 200) {
        const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
        const errorMsg = errorBody.error || errorBody.message || errorBody.detail || 'Unknown error';
        
        // Some errors are expected (e.g., column already exists, index already exists)
        if (errorMsg.includes('already exists') || 
            errorMsg.includes('duplicate') ||
            errorMsg.includes('does not exist') ||
            errorMsg.includes('relation') && errorMsg.includes('already exists')) {
          console.log(`  ⚠️  Skipped (already applied or not applicable): ${errorMsg.split('\n')[0]}\n`);
          successCount++;
        } else {
          console.error(`  ❌ Error: ${errorMsg}`);
          if (errorBody.detail) {
            console.error(`     Detail: ${errorBody.detail}`);
          }
          console.error('');
          errorCount++;
          errors.push(`Statement ${i + 1}: ${errorMsg}`);
        }
      } else {
        console.log(`  ✅ Success\n`);
        successCount++;
      }
    } catch (error) {
      console.error(`  ❌ Lambda invocation failed: ${error.message}\n`);
      errorCount++;
      errors.push(`Statement ${i + 1}: ${error.message}`);
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log('='.repeat(60));

  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    errors.forEach(err => console.log(`  - ${err}`));
  }

  if (errorCount === 0) {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Migration completed with errors. Please review above.');
    process.exit(1);
  }
}

// Run migration
runMigration().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

