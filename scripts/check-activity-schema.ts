/**
 * Script to check activity package table schemas in RDS
 * Uses the Lambda database connection
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';
const AWS_REGION = process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1';

async function checkActivitySchema() {
  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
  });

  try {
    console.log('🔍 Checking activity_packages table schema...\n');

    // Get detailed column information for activity_packages
    const schemaQuery = `
      SELECT 
        column_name,
        data_type,
        udt_name,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns
      WHERE table_name = 'activity_packages'
      ORDER BY ordinal_position
    `;

    const response = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: schemaQuery,
          params: [],
        }),
      })
    );

    const result = JSON.parse(
      new TextDecoder().decode(response.Payload || new Uint8Array())
    );

    if (result.statusCode !== 200) {
      const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      throw new Error(`Lambda error: ${JSON.stringify(errorBody)}`);
    }

    const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    const columns = body.rows || [];

    console.log('📊 activity_packages table structure:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      'Column Name'.padEnd(35) +
      'Type'.padEnd(20) +
      'Nullable'.padEnd(10) +
      'Default'
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    columns.forEach((col: any) => {
      const type = col.udt_name || col.data_type;
      const nullable = col.is_nullable === 'YES' ? 'YES' : 'NO';
      const defaultVal = col.column_default || '';
      console.log(
        col.column_name.padEnd(35) +
        type.padEnd(20) +
        nullable.padEnd(10) +
        defaultVal.substring(0, 40)
      );
    });

    console.log('\n');

    // Check for POINT type columns
    const pointColumns = columns.filter((col: any) => 
      col.udt_name === 'point' || col.data_type === 'USER-DEFINED' && col.udt_name === 'point'
    );

    if (pointColumns.length > 0) {
      console.log('📍 POINT type columns found:');
      pointColumns.forEach((col: any) => {
        console.log(`   - ${col.column_name} (${col.udt_name})`);
      });
      console.log('');
    }

    // Check array columns
    const arrayColumns = columns.filter((col: any) => 
      col.data_type === 'ARRAY' || col.udt_name?.endsWith('[]')
    );

    if (arrayColumns.length > 0) {
      console.log('📋 ARRAY type columns found:');
      arrayColumns.forEach((col: any) => {
        console.log(`   - ${col.column_name} (${col.udt_name})`);
      });
      console.log('');
    }

    // Check related tables
    console.log('\n🔍 Checking related tables...\n');

    const relatedTables = [
      'activity_package_time_slots',
      'activity_package_variants',
      'activity_package_faqs',
      'activity_package_images',
    ];

    for (const tableName of relatedTables) {
      const tableQuery = `
        SELECT 
          column_name,
          data_type,
          udt_name,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position
      `;

      const tableResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: LAMBDA_FUNCTION_NAME,
          Payload: JSON.stringify({
            action: 'query',
            query: tableQuery,
            params: [],
          }),
        })
      );

      const tableResult = JSON.parse(
        new TextDecoder().decode(tableResponse.Payload || new Uint8Array())
      );

      if (tableResult.statusCode === 200) {
        const tableBody = typeof tableResult.body === 'string' ? JSON.parse(tableResult.body) : tableResult.body;
        const tableColumns = tableBody.rows || [];

        console.log(`📊 ${tableName} structure:`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        tableColumns.forEach((col: any) => {
          const type = col.udt_name || col.data_type;
          const nullable = col.is_nullable === 'YES' ? 'YES' : 'NO';
          console.log(
            `   ${col.column_name.padEnd(35)} ${type.padEnd(20)} ${nullable}`
          );
        });
        console.log('');
      }
    }

    console.log('✅ Schema check complete!');

  } catch (error: any) {
    console.error('❌ Error checking schema:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

checkActivitySchema();
