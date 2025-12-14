/**
 * Script to add foreign key constraints and indexes to multi_city_package_day_plans
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

async function setupConstraints() {
  console.log('🔧 Setting up constraints and indexes for multi_city_package_day_plans...');
  console.log(`📡 Using Lambda: ${LAMBDA_FUNCTION_NAME}`);
  console.log(`🌍 Region: ${AWS_REGION}`);
  console.log('');

  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    // Add foreign key constraint for package_id
    console.log('🔗 Adding foreign key constraint for package_id...');
    const addPackageFKQuery = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'multi_city_package_day_plans_package_id_fkey'
        ) THEN
          ALTER TABLE multi_city_package_day_plans
          ADD CONSTRAINT multi_city_package_day_plans_package_id_fkey
          FOREIGN KEY (package_id) 
          REFERENCES multi_city_packages(id) 
          ON DELETE CASCADE;
        END IF;
      END $$;
    `;

    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: addPackageFKQuery,
          params: [],
        }),
      })
    );
    console.log('✅ Foreign key constraint for package_id added');

    // Add foreign key constraint for city_id (nullable, so ON DELETE SET NULL)
    console.log('🔗 Adding foreign key constraint for city_id...');
    const addCityFKQuery = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'multi_city_package_day_plans_city_id_fkey'
        ) THEN
          ALTER TABLE multi_city_package_day_plans
          ADD CONSTRAINT multi_city_package_day_plans_city_id_fkey
          FOREIGN KEY (city_id) 
          REFERENCES multi_city_package_cities(id) 
          ON DELETE SET NULL;
        END IF;
      END $$;
    `;

    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: addCityFKQuery,
          params: [],
        }),
      })
    );
    console.log('✅ Foreign key constraint for city_id added');

    // Add indexes for performance
    console.log('📊 Adding indexes...');
    
    const indexes = [
      {
        name: 'idx_multi_city_package_day_plans_package_id',
        query: 'CREATE INDEX IF NOT EXISTS idx_multi_city_package_day_plans_package_id ON multi_city_package_day_plans(package_id)',
      },
      {
        name: 'idx_multi_city_package_day_plans_city_id',
        query: 'CREATE INDEX IF NOT EXISTS idx_multi_city_package_day_plans_city_id ON multi_city_package_day_plans(city_id)',
      },
      {
        name: 'idx_multi_city_package_day_plans_day_number',
        query: 'CREATE INDEX IF NOT EXISTS idx_multi_city_package_day_plans_day_number ON multi_city_package_day_plans(package_id, day_number)',
      },
    ];

    for (const index of indexes) {
      await lambdaClient.send(
        new InvokeCommand({
          FunctionName: LAMBDA_FUNCTION_NAME,
          Payload: JSON.stringify({
            action: 'query',
            query: index.query,
            params: [],
          }),
        })
      );
      console.log(`✅ Index ${index.name} created`);
    }

    console.log('');
    console.log('✅ All constraints and indexes set up successfully!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

setupConstraints()
  .then(() => {
    console.log('');
    console.log('✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
