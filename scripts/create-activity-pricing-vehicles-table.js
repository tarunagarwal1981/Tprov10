/**
 * Create activity_pricing_package_vehicles table in RDS via the Lambda DB service.
 * Run once with: node scripts/create-activity-pricing-vehicles-table.js
 *
 * This aligns RDS with the existing backend pricing vehicles logic,
 * without changing any frontend fields or structure.
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
require('dotenv').config({ path: '.env.local' });

// Use provided / local AWS credentials (same pattern as other scripts)
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

async function createVehiclesTable() {
  try {
    console.log('🔧 Creating activity_pricing_package_vehicles table in RDS (if missing)...');

    // Create table if it doesn't exist.
    await queryViaLambda(
      `
      CREATE TABLE IF NOT EXISTS activity_pricing_package_vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pricing_package_id UUID NOT NULL REFERENCES activity_pricing_packages(id) ON DELETE CASCADE,

        vehicle_type VARCHAR(50) NOT NULL,
        vehicle_name VARCHAR(100) NOT NULL,
        capacity INTEGER NOT NULL,
        price_adjustment NUMERIC(10, 2),
        display_order INTEGER NOT NULL DEFAULT 0,

        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    );

    // Index for fast lookup by pricing package
    await queryViaLambda(
      `
      CREATE INDEX IF NOT EXISTS idx_activity_pricing_package_vehicles_package_id
        ON activity_pricing_package_vehicles(pricing_package_id);
    `
    );

    console.log('✅ activity_pricing_package_vehicles table created / verified.');
  } catch (error) {
    console.error(
      '❌ Failed to create activity_pricing_package_vehicles table:',
      error.message
    );
    console.error(error.stack);
    process.exit(1);
  }
}

createVehiclesTable();


