#!/usr/bin/env node

/**
 * Run database migration via AWS Lambda
 * Uses the existing travel-app-database-service Lambda to execute SQL
 * Usage: node scripts/run-migration-via-lambda.js
 */

const fs = require('fs');
const path = require('path');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
require('dotenv').config({ path: '.env.local' });

async function runMigrationViaLambda() {
  console.log('🚀 Running migration via AWS Lambda\n');

  // Configure AWS SDK
  const lambdaClient = new LambdaClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const lambdaName = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/021_restructure_time_slots_schema.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log(`Invoking Lambda: ${lambdaName}`);
  console.log('Migration SQL:\n');
  console.log(migrationSQL.substring(0, 200) + '...\n');

  try {
    // Invoke Lambda with migration SQL
    const command = new InvokeCommand({
      FunctionName: lambdaName,
      Payload: JSON.stringify({
        action: 'execute',
        query: migrationSQL,
        params: [],
      }),
    });

    const response = await lambdaClient.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());

    if (result.error) {
      console.error('❌ Migration failed:');
      console.error(result.error);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    if (result.data) {
      console.log('Result:', result.data);
    }
  } catch (error) {
    console.error('❌ Failed to invoke Lambda:');
    console.error(error.message);
    console.error('\nPlease check:');
    console.error('  1. AWS credentials are correct');
    console.error('  2. Lambda function exists and has RDS access');
    console.error('  3. IAM permissions allow Lambda invocation');
    process.exit(1);
  }
}

runMigrationViaLambda();
