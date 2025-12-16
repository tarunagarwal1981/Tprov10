/**
 * Script to check the actual database table structure
 * Run with: node check-db-schema.js
 */

const { Pool } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
require('dotenv').config({ path: '.env.local' });

// Use provided AWS credentials
process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'REDACTED_AWS_ACCESS_KEY';
process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '/REDACTED_AWS_SECRET_KEY/';
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Try to get RDS credentials from Secrets Manager or environment
async function getRDSConfig() {
  // First, try environment variables
  if (process.env.RDS_HOST && process.env.RDS_PASSWORD) {
    return {
      host: process.env.RDS_HOST,
      port: parseInt(process.env.RDS_PORT || '5432'),
      database: process.env.RDS_DB || 'postgres',
      user: process.env.RDS_USER || 'postgres',
      password: process.env.RDS_PASSWORD,
    };
  }

  // Try to get from Secrets Manager
  try {
    const secretsClient = new SecretsManagerClient({
      region: process.env.AWS_REGION || process.env.DEPLOYMENT_REGION || 'us-east-1',
    });

    const secretResponse = await secretsClient.send(
      new GetSecretValueCommand({
        SecretId: process.env.SECRETS_MANAGER_SECRET_NAME || 'travel-app/dev/secrets',
      })
    );

    if (!secretResponse.SecretString) {
      throw new Error('Secret has no SecretString');
    }

    let secretString = secretResponse.SecretString;
    
    // Remove BOM if present
    if (secretString.charCodeAt(0) === 0xFEFF) {
      secretString = secretString.substring(1);
    }
    if (secretString.startsWith('ï»¿')) {
      secretString = secretString.substring(3);
    }
    secretString = secretString.replace(/^[\uFEFF\u200B]+/, '').trim();
    const firstBrace = secretString.indexOf('{');
    if (firstBrace > 0) {
      secretString = secretString.substring(firstBrace);
    }

    const secrets = JSON.parse(secretString);
    
    return {
      host: secrets.RDS_HOST || secrets.RDS_HOSTNAME || 'travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com',
      port: parseInt(secrets.RDS_PORT || '5432'),
      database: secrets.RDS_DATABASE || secrets.RDS_DB || 'postgres',
      user: secrets.RDS_USERNAME || secrets.RDS_USER || 'postgres',
      password: secrets.RDS_PASSWORD || 'ju3vrLHJUW8PqDG4',
    };
  } catch (error) {
    console.warn('Could not fetch from Secrets Manager, using defaults:', error.message);
    // Fallback to defaults
    return {
      host: 'travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'ju3vrLHJUW8PqDG4',
    };
  }
}

let pool = null;

// Use Lambda to query database instead of direct connection
async function queryViaLambda(query, params = []) {
  const lambdaClient = new LambdaClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const command = new InvokeCommand({
    FunctionName: 'travel-app-database-service',
    Payload: JSON.stringify({
      action: 'query',
      query,
      params,
    }),
  });

  const response = await lambdaClient.send(command);
  const result = JSON.parse(Buffer.from(response.Payload).toString());
  
  if (result.statusCode !== 200) {
    const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    throw new Error(errorBody.error || errorBody.message || 'Lambda error');
  }
  
  const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
  return body;
}

async function checkTableSchema() {
  try {
    console.log('Connecting to database via Lambda...');
    
    // Get column information for activity_packages table
    const result = await queryViaLambda(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'activity_packages'
      ORDER BY ordinal_position;
    `);

    console.log('\n=== activity_packages Table Schema ===\n');
    console.log('Column Name'.padEnd(40), 'Data Type'.padEnd(20), 'Nullable'.padEnd(10), 'Default');
    console.log('-'.repeat(100));
    
    result.rows.forEach(row => {
      const dataType = row.udt_name === 'jsonb' ? 'JSONB' : row.data_type.toUpperCase();
      console.log(
        row.column_name.padEnd(40),
        dataType.padEnd(20),
        row.is_nullable.padEnd(10),
        row.column_default || ''
      );
    });

    // Check for JSONB columns specifically
    const jsonbColumns = result.rows.filter(row => row.udt_name === 'jsonb');
    console.log('\n=== JSONB Columns ===');
    if (jsonbColumns.length > 0) {
      jsonbColumns.forEach(col => {
        console.log(`- ${col.column_name}`);
      });
    } else {
      console.log('No JSONB columns found');
    }

    // Check activity_package_time_slots table
    console.log('\n=== activity_package_time_slots Table Schema ===\n');
    const timeSlotsResult = await queryViaLambda(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'activity_package_time_slots'
      ORDER BY ordinal_position;
    `);

    console.log('Column Name'.padEnd(40), 'Data Type'.padEnd(20), 'Nullable'.padEnd(10), 'Default');
    console.log('-'.repeat(100));
    
    timeSlotsResult.rows.forEach(row => {
      const dataType = row.udt_name === 'jsonb' ? 'JSONB' : row.data_type.toUpperCase();
      console.log(
        row.column_name.padEnd(40),
        dataType.padEnd(20),
        row.is_nullable.padEnd(10),
        row.column_default || ''
      );
    });

    // Check activity_package_variants table
    console.log('\n=== activity_package_variants Table Schema ===\n');
    const variantsResult = await queryViaLambda(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'activity_package_variants'
      ORDER BY ordinal_position;
    `);

    console.log('Column Name'.padEnd(40), 'Data Type'.padEnd(20), 'Nullable'.padEnd(10), 'Default');
    console.log('-'.repeat(100));
    
    variantsResult.rows.forEach(row => {
      const dataType = row.udt_name === 'jsonb' ? 'JSONB' : row.data_type.toUpperCase();
      console.log(
        row.column_name.padEnd(40),
        dataType.padEnd(20),
        row.is_nullable.padEnd(10),
        row.column_default || ''
      );
    });

    // Check activity_pricing_packages table
    console.log('\n=== activity_pricing_packages Table Schema ===\n');
    try {
      const pricingResult = await queryViaLambda(`
        SELECT 
          column_name,
          data_type,
          udt_name,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'activity_pricing_packages'
        ORDER BY ordinal_position;
      `);

      console.log('Column Name'.padEnd(40), 'Data Type'.padEnd(20), 'Nullable'.padEnd(10), 'Default');
      console.log('-'.repeat(100));
      
      pricingResult.rows.forEach(row => {
        const dataType = row.udt_name === 'jsonb' ? 'JSONB' : row.data_type.toUpperCase();
        console.log(
          row.column_name.padEnd(40),
          dataType.padEnd(20),
          row.is_nullable.padEnd(10),
          row.column_default || ''
        );
      });

      // Check for JSONB columns in pricing packages
      const pricingJsonbColumns = pricingResult.rows.filter(row => row.udt_name === 'jsonb');
      if (pricingJsonbColumns.length > 0) {
        console.log('\n=== JSONB Columns in activity_pricing_packages ===');
        pricingJsonbColumns.forEach(col => {
          console.log(`- ${col.column_name}`);
        });
      }
    } catch (error) {
      console.log('⚠️  Could not fetch activity_pricing_packages table:', error.message);
    }

    console.log('\n✅ Database check complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkTableSchema();

