/**
 * Script to create multi_city_pricing_type enum in RDS
 * This enum is required for the pricing_type column in multi_city_pricing_packages
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

async function createPricingTypeEnum() {
  console.log('🔧 Creating multi_city_pricing_type enum...');
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
    // First, check if enum exists
    console.log('🔍 Checking if enum exists...');
    const checkEnumQuery = `
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'multi_city_pricing_type'
      ) as exists
    `;

    const checkPayload = {
      action: 'query',
      query: checkEnumQuery,
      params: [],
    };

    const checkResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify(checkPayload),
      })
    );

    const checkResult = JSON.parse(
      new TextDecoder().decode(checkResponse.Payload || new Uint8Array())
    );

    if (checkResult.error) {
      throw new Error(`Lambda error: ${checkResult.error}`);
    }

    const enumExists = checkResult.rows?.[0]?.exists;

    if (enumExists) {
      console.log('✅ Enum already exists!');
      
      // Check what values it has
      console.log('🔍 Checking enum values...');
      const checkValuesQuery = `
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'multi_city_pricing_type')
        ORDER BY enumsortorder
      `;

      const valuesPayload = {
        action: 'query',
        query: checkValuesQuery,
        params: [],
      };

      const valuesResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: LAMBDA_FUNCTION_NAME,
          Payload: JSON.stringify(valuesPayload),
        })
      );

      const valuesResult = JSON.parse(
        new TextDecoder().decode(valuesResponse.Payload || new Uint8Array())
      );

      if (valuesResult.rows) {
        console.log('📋 Current enum values:');
        valuesResult.rows.forEach((row: any) => {
          console.log(`   - ${row.enumlabel}`);
        });
      }

      // Check if SIC and PRIVATE_PACKAGE exist
      const hasSIC = valuesResult.rows?.some((row: any) => row.enumlabel === 'SIC');
      const hasPrivatePackage = valuesResult.rows?.some((row: any) => row.enumlabel === 'PRIVATE_PACKAGE');

      if (!hasSIC) {
        console.log('➕ Adding SIC to enum...');
        const addSICQuery = `ALTER TYPE multi_city_pricing_type ADD VALUE IF NOT EXISTS 'SIC'`;
        const addSICPayload = {
          action: 'query',
          query: addSICQuery,
          params: [],
        };
        await lambdaClient.send(
          new InvokeCommand({
            FunctionName: LAMBDA_FUNCTION_NAME,
            Payload: JSON.stringify(addSICPayload),
          })
        );
        console.log('✅ SIC added');
      }

      if (!hasPrivatePackage) {
        console.log('➕ Adding PRIVATE_PACKAGE to enum...');
        const addPrivateQuery = `ALTER TYPE multi_city_pricing_type ADD VALUE IF NOT EXISTS 'PRIVATE_PACKAGE'`;
        const addPrivatePayload = {
          action: 'query',
          query: addPrivateQuery,
          params: [],
        };
        await lambdaClient.send(
          new InvokeCommand({
            FunctionName: LAMBDA_FUNCTION_NAME,
            Payload: JSON.stringify(addPrivatePayload),
          })
        );
        console.log('✅ PRIVATE_PACKAGE added');
      }

      return;
    }

    console.log('📝 Enum does not exist. Creating it...');

    // Create the enum with all values
    const createEnumQuery = `
      DO $$ BEGIN
        CREATE TYPE multi_city_pricing_type AS ENUM ('SIC', 'PRIVATE_PACKAGE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    const createPayload = {
      action: 'query',
      query: createEnumQuery,
      params: [],
    };

    const createResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify(createPayload),
      })
    );

    const createResult = JSON.parse(
      new TextDecoder().decode(createResponse.Payload || new Uint8Array())
    );

    if (createResult.error) {
      throw new Error(`Lambda error: ${createResult.error}`);
    }

    console.log('✅ Successfully created multi_city_pricing_type enum!');
    console.log('');
    console.log('📋 Enum values:');
    console.log('   - SIC');
    console.log('   - PRIVATE_PACKAGE');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the script
createPricingTypeEnum()
  .then(() => {
    console.log('');
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
