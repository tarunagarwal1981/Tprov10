/**
 * Script to check RDS tables via Lambda function
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

async function checkViaLambda() {
  // Initialize Lambda client with credentials (if provided)
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
    console.log('🔌 Checking RDS via Lambda function...');
    console.log(`📡 Lambda: ${LAMBDA_FUNCTION_NAME}`);
    console.log(`🌍 Region: ${AWS_REGION}`);
    console.log('');

    // List all tables
    console.log('📋 Listing all tables...');
    const tablesQuery = `
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY table_schema, table_name
    `;

    const tablesResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: tablesQuery,
          params: [],
        }),
      })
    );

    const tablesResult = JSON.parse(
      new TextDecoder().decode(tablesResponse.Payload || new Uint8Array())
    );

    // Handle Lambda response format
    let tablesBody;
    if (tablesResult.statusCode === 200) {
      tablesBody = typeof tablesResult.body === 'string' ? JSON.parse(tablesResult.body) : tablesResult.body;
    } else {
      throw new Error(`Lambda error: ${JSON.stringify(tablesResult)}`);
    }

    if (tablesBody.error) {
      throw new Error(`Database error: ${tablesBody.error}`);
    }

    const allTables = tablesBody.rows || [];
    
    console.log(`Found ${allTables.length} tables:`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (allTables.length === 0) {
      console.log('   (No tables found)');
    } else {
      allTables.forEach((row: any) => {
        console.log(`   ${row.table_schema}.${row.table_name}`);
      });
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Filter multi_city tables
    const multiCityTables = allTables.filter((row: any) => 
      row.table_name.includes('multi_city')
    );

    if (multiCityTables.length > 0) {
      console.log('✅ Found multi_city tables:');
      
      for (const table of multiCityTables) {
        console.log(`\n📊 Table: ${table.table_name}`);
        console.log('   Columns:');
        
        const columnsQuery = `
          SELECT 
            column_name, 
            data_type, 
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `;

        const columnsResponse = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: LAMBDA_FUNCTION_NAME,
            Payload: JSON.stringify({
              action: 'query',
              query: columnsQuery,
              params: [table.table_name],
            }),
          })
        );

        const columnsResult = JSON.parse(
          new TextDecoder().decode(columnsResponse.Payload || new Uint8Array())
        );

        const columnsBody = typeof columnsResult.body === 'string' ? JSON.parse(columnsResult.body) : columnsResult.body;
        const columns = columnsBody.rows || [];
        
        columns.forEach((col: any) => {
          const defaultStr = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          const nullableStr = col.is_nullable === 'YES' ? ' NULL' : ' NOT NULL';
          const lengthStr = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
          console.log(`      - ${col.column_name}: ${col.data_type}${lengthStr}${nullableStr}${defaultStr}`);
        });
      }
    } else {
      console.log('❌ No multi_city tables found');
    }

    // Check enum types
    console.log('\n🔍 Checking enum types...');
    const enumQuery = `
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e'
      ORDER BY typname
    `;

    const enumResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: enumQuery,
          params: [],
        }),
      })
    );

    const enumResult = JSON.parse(
      new TextDecoder().decode(enumResponse.Payload || new Uint8Array())
    );

    const enumBody = typeof enumResult.body === 'string' ? JSON.parse(enumResult.body) : enumResult.body;
    const enumTypes = enumBody.rows || [];
    
    if (enumTypes.length > 0) {
      console.log('Found enum types:');
      for (const enumType of enumTypes) {
        console.log(`\n   📌 ${enumType.typname}:`);
        
        const enumValuesQuery = `
          SELECT enumlabel 
          FROM pg_enum 
          WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = $1)
          ORDER BY enumsortorder
        `;
        
        const valuesResponse = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: LAMBDA_FUNCTION_NAME,
            Payload: JSON.stringify({
              action: 'query',
              query: enumValuesQuery,
              params: [enumType.typname],
            }),
          })
        );

        const valuesResult = JSON.parse(
          new TextDecoder().decode(valuesResponse.Payload || new Uint8Array())
        );

        const valuesBody = typeof valuesResult.body === 'string' ? JSON.parse(valuesResult.body) : valuesResult.body;
        const values = (valuesBody.rows || []).map((r: any) => r.enumlabel).join(', ');
        console.log(`      Values: ${values}`);
      }
    } else {
      console.log('   (No enum types found)');
    }

    // Check specific required tables
    console.log('\n🔍 Checking required tables for multi-city packages...');
    const requiredTables = [
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

    for (const tableName of requiredTables) {
      const existsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        ) as exists
      `;
      
      const existsResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: LAMBDA_FUNCTION_NAME,
          Payload: JSON.stringify({
            action: 'query',
            query: existsQuery,
            params: [tableName],
          }),
        })
      );

      const existsResult = JSON.parse(
        new TextDecoder().decode(existsResponse.Payload || new Uint8Array())
      );

      const existsBody = typeof existsResult.body === 'string' ? JSON.parse(existsResult.body) : existsResult.body;
      const exists = existsBody.rows?.[0]?.exists || false;
      
      console.log(`${exists ? '✅' : '❌'} ${tableName}`);
      
      if (exists) {
        // Check key columns
        const keyColumnsQuery = `
          SELECT column_name, data_type, column_default
          FROM information_schema.columns
          WHERE table_name = $1
          AND column_name IN ('id', 'package_id', 'package_name', 'pricing_type')
          ORDER BY column_name
        `;
        
        const keyColsResponse = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: LAMBDA_FUNCTION_NAME,
            Payload: JSON.stringify({
              action: 'query',
              query: keyColumnsQuery,
              params: [tableName],
            }),
          })
        );

        const keyColsResult = JSON.parse(
          new TextDecoder().decode(keyColsResponse.Payload || new Uint8Array())
        );

        const keyColsBody = typeof keyColsResult.body === 'string' ? JSON.parse(keyColsResult.body) : keyColsResult.body;
        const keyCols = keyColsBody.rows || [];
        
        if (keyCols.length > 0) {
          keyCols.forEach((col: any) => {
            const defaultStr = col.column_default ? ` (default: ${col.column_default})` : '';
            console.log(`      ${col.column_name}: ${col.data_type}${defaultStr}`);
          });
        }
      }
    }

    console.log('\n✅ Check complete!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

checkViaLambda();
