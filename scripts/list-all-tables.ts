/**
 * Script to list all tables in the database
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID ;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY ;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

async function listTables() {
  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    // List all tables
    console.log('🔍 Listing all tables in database...');
    const listQuery = `
      SELECT table_name, table_schema
      FROM information_schema.tables
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY table_schema, table_name
    `;

    const response = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: listQuery,
          params: [],
        }),
      })
    );

    const result = JSON.parse(
      new TextDecoder().decode(response.Payload || new Uint8Array())
    );

    if (result.error) {
      throw new Error(`Lambda error: ${result.error}`);
    }

    console.log('');
    console.log('📊 All tables in database:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (result.rows && result.rows.length > 0) {
      result.rows.forEach((row: any) => {
        console.log(`   ${row.table_schema}.${row.table_name}`);
      });
    } else {
      console.log('   (No tables found)');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Check for multi_city tables specifically
    const multiCityTables = result.rows?.filter((row: any) => 
      row.table_name.includes('multi_city')
    ) || [];

    if (multiCityTables.length > 0) {
      console.log('✅ Found multi_city tables:');
      multiCityTables.forEach((row: any) => {
        console.log(`   - ${row.table_schema}.${row.table_name}`);
      });
    } else {
      console.log('❌ No multi_city tables found');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

listTables();
