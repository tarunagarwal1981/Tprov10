/**
 * Script to create fixed_departure_flight_packages table in RDS
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

async function createTable() {
  const lambdaClientConfig: {
    region: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  } = {
    region: AWS_REGION,
  };

  if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
    lambdaClientConfig.credentials = {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    };
  }

  const lambdaClient = new LambdaClient(lambdaClientConfig);

  try {
    console.log('🔧 Creating fixed_departure_flight_packages table...');
    console.log(`📡 Using Lambda: ${LAMBDA_FUNCTION_NAME}`);
    console.log(`🌍 Region: ${AWS_REGION}`);
    console.log('');

    // Check if table exists
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'fixed_departure_flight_packages'
      ) as exists
    `;

    const checkResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: checkQuery,
          params: [],
        }),
      })
    );

    const checkResult = JSON.parse(
      new TextDecoder().decode(checkResponse.Payload || new Uint8Array())
    );

    const checkBody = typeof checkResult.body === 'string' ? JSON.parse(checkResult.body) : checkResult.body;
    const exists = checkBody.rows?.[0]?.exists;

    if (exists) {
      console.log('✅ Table already exists!');
      return;
    }

    // Create table - using TEXT for operator_id to match other tables (will be migrated to UUID later if needed)
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS fixed_departure_flight_packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        operator_id TEXT NOT NULL,
        title VARCHAR(255) NOT NULL,
        short_description TEXT,
        destination_region VARCHAR(100),
        package_validity_date DATE,
        base_price DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (base_price >= 0),
        currency VARCHAR(3) DEFAULT 'USD',
        deposit_percent INTEGER DEFAULT 0 CHECK (deposit_percent >= 0 AND deposit_percent <= 100),
        balance_due_days INTEGER DEFAULT 7 CHECK (balance_due_days >= 0),
        payment_methods JSONB,
        visa_requirements TEXT,
        insurance_requirement VARCHAR(20) DEFAULT 'OPTIONAL' CHECK (insurance_requirement IN ('REQUIRED', 'OPTIONAL', 'NA')),
        health_requirements TEXT,
        terms_and_conditions TEXT,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    const createResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: createTableQuery,
          params: [],
        }),
      })
    );

    const createResult = JSON.parse(
      new TextDecoder().decode(createResponse.Payload || new Uint8Array())
    );

    if (createResult.statusCode !== 200) {
      const errorBody = typeof createResult.body === 'string' ? JSON.parse(createResult.body) : createResult.body;
      throw new Error(`Lambda error: ${errorBody.message || errorBody.error || JSON.stringify(createResult)}`);
    }

    const createBody = typeof createResult.body === 'string' ? JSON.parse(createResult.body) : createResult.body;
    
    if (createBody.error) {
      throw new Error(`Database error: ${createBody.message || createBody.error || JSON.stringify(createBody)}`);
    }

    console.log('✅ Table created successfully!');

    // Create index on operator_id
    const indexQuery = `CREATE INDEX IF NOT EXISTS idx_fixed_departure_flight_packages_operator ON fixed_departure_flight_packages(operator_id)`;
    
    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: indexQuery,
          params: [],
        }),
      })
    );

    console.log('✅ Index created!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

createTable()
  .then(() => {
    console.log('');
    console.log('✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
