/**
 * Create activity_package_faqs table in RDS via the Lambda DB service.
 * Run once with: node scripts/create-activity-faqs-table.js
 *
 * This aligns RDS with the existing backend code that reads/writes FAQs,
 * without changing any frontend fields or structure.
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
require('dotenv').config({ path: '.env.local' });

// Use provided / local AWS credentials (same pattern as check-db-schema.js)
process.env.AWS_ACCESS_KEY_ID =
  process.env.AWS_ACCESS_KEY_ID || 'REDACTED_AWS_ACCESS_KEY';
process.env.AWS_SECRET_ACCESS_KEY =
  process.env.AWS_SECRET_ACCESS_KEY || '/REDACTED_AWS_SECRET_KEY/';
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';

async function queryViaLambda(query, params = []) {
  const lambdaClient = new LambdaClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const command = new InvokeCommand({
    FunctionName: process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service',
    Payload: JSON.stringify({
      action: 'query',
      query,
      params,
    }),
  });

  const response = await lambdaClient.send(command);
  const result = JSON.parse(Buffer.from(response.Payload).toString());

  if (result.statusCode !== 200) {
    const errorBody =
      typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    throw new Error(errorBody.error || errorBody.message || 'Lambda error');
  }

  const body =
    typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  return body;
}

async function createFaqTable() {
  try {
    console.log('🔧 Creating activity_package_faqs table in RDS (if missing)...');

    // Create table if it doesn't exist.
    // NOTE: We use TEXT for category instead of the Supabase-specific enum faq_category
    // to keep RDS simple and compatible with the existing backend code.
    await queryViaLambda(
      `
      CREATE TABLE IF NOT EXISTS activity_package_faqs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        package_id UUID NOT NULL REFERENCES activity_packages(id) ON DELETE CASCADE,

        -- FAQ Details
        question VARCHAR(200) NOT NULL,
        answer TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'GENERAL',
        display_order INTEGER NOT NULL DEFAULT 0,

        -- Timestamps
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    );

    // Helpful indexes (match Supabase schema conceptually)
    await queryViaLambda(
      `
      CREATE INDEX IF NOT EXISTS idx_activity_package_faqs_package_id
        ON activity_package_faqs(package_id);

      CREATE INDEX IF NOT EXISTS idx_activity_package_faqs_category
        ON activity_package_faqs(package_id, category);
    `
    );

    console.log('✅ activity_package_faqs table created / verified.');
  } catch (error) {
    console.error('❌ Failed to create activity_package_faqs table:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createFaqTable();


