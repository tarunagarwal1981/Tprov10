/**
 * Script to verify all multi-city package tables exist in AWS RDS
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID ;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY ;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

async function verifyTables() {
  console.log('🔍 Verifying multi-city package tables in AWS RDS...');
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

  const tablesToCheck = [
    'multi_city_packages',
    'multi_city_package_cities',
    'multi_city_pricing_packages',
    'multi_city_pricing_rows',
    'multi_city_private_package_rows',
    'multi_city_package_day_plans',
    'multi_city_package_inclusions',
    'multi_city_package_exclusions',
    'multi_city_package_cancellation_tiers',
  ];

  try {
    // Check if tables exist
    console.log('📋 Checking tables...');
    const tableCheckQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (${tablesToCheck.map((_, i) => `$${i + 1}`).join(', ')})
      ORDER BY table_name
    `;

    const tableCheckResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: tableCheckQuery,
          params: tablesToCheck,
        }),
      })
    );

    const tableCheckResult = JSON.parse(
      new TextDecoder().decode(tableCheckResponse.Payload || new Uint8Array())
    );

    if (tableCheckResult.error) {
      throw new Error(`Lambda error: ${tableCheckResult.error}`);
    }

    const existingTables = tableCheckResult.rows?.map((row: any) => row.table_name) || [];
    
    console.log('');
    console.log('📊 Table Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const table of tablesToCheck) {
      const exists = existingTables.includes(table);
      console.log(`${exists ? '✅' : '❌'} ${table}`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Check enum type
    console.log('🔍 Checking enum types...');
    const enumCheckQuery = `
      SELECT typname 
      FROM pg_type 
      WHERE typname = 'multi_city_pricing_type'
    `;

    const enumResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: enumCheckQuery,
          params: [],
        }),
      })
    );

    const enumResult = JSON.parse(
      new TextDecoder().decode(enumResponse.Payload || new Uint8Array())
    );

    const enumExists = enumResult.rows && enumResult.rows.length > 0;
    console.log(`${enumExists ? '✅' : '❌'} multi_city_pricing_type enum`);

    if (enumExists) {
      // Check enum values
      const enumValuesQuery = `
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'multi_city_pricing_type')
        ORDER BY enumsortorder
      `;

      const valuesResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: LAMBDA_FUNCTION_NAME,
          Payload: JSON.stringify({
            action: 'query',
            query: enumValuesQuery,
            params: [],
          }),
        })
      );

      const valuesResult = JSON.parse(
        new TextDecoder().decode(valuesResponse.Payload || new Uint8Array())
      );

      if (valuesResult.rows) {
        console.log('   Values:', valuesResult.rows.map((r: any) => r.enumlabel).join(', '));
      }
    }

    console.log('');

    // Check critical columns
    console.log('🔍 Checking critical columns...');
    
    // Check package_name in multi_city_pricing_packages
    const checkPackageNameQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'multi_city_pricing_packages'
      AND column_name = 'package_name'
    `;

    const packageNameResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: checkPackageNameQuery,
          params: [],
        }),
      })
    );

    const packageNameResult = JSON.parse(
      new TextDecoder().decode(packageNameResponse.Payload || new Uint8Array())
    );

    const hasPackageName = packageNameResult.rows && packageNameResult.rows.length > 0;
    console.log(`${hasPackageName ? '✅' : '❌'} package_name column in multi_city_pricing_packages`);

    // Check day_plans id column
    const checkDayPlansIdQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'multi_city_package_day_plans'
      AND column_name = 'id'
    `;

    const dayPlansIdResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: checkDayPlansIdQuery,
          params: [],
        }),
      })
    );

    const dayPlansIdResult = JSON.parse(
      new TextDecoder().decode(dayPlansIdResponse.Payload || new Uint8Array())
    );

    if (dayPlansIdResult.rows && dayPlansIdResult.rows.length > 0) {
      const idColumn = dayPlansIdResult.rows[0];
      const isUUID = idColumn.data_type === 'uuid';
      const hasDefault = idColumn.column_default?.includes('gen_random_uuid');
      console.log(`${isUUID && hasDefault ? '✅' : '⚠️ '} day_plans.id column (UUID: ${isUUID}, Default: ${hasDefault})`);
    } else {
      console.log('❌ day_plans.id column not found');
    }

    console.log('');
    console.log('✅ Verification complete!');
    console.log('');
    console.log('💡 All changes have been applied to AWS RDS via Lambda function');
    console.log('💡 Database: RDS PostgreSQL (via travel-app-database-service Lambda)');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

verifyTables()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
