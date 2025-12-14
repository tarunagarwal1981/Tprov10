/**
 * Script to check multi_city_package_day_plans table structure
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';

async function checkTable() {
  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    // Check if table exists
    console.log('🔍 Checking if table exists...');
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'multi_city_package_day_plans'
      ) as table_exists
    `;

    const checkResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: checkTableQuery,
          params: [],
        }),
      })
    );

    const checkResult = JSON.parse(
      new TextDecoder().decode(checkResponse.Payload || new Uint8Array())
    );

    if (checkResult.error) {
      throw new Error(`Lambda error: ${checkResult.error}`);
    }

    const tableExists = checkResult.rows?.[0]?.table_exists;

    if (!tableExists) {
      console.log('❌ Table does not exist. Creating it...');
      
      // Create the table with proper structure
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS multi_city_package_day_plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          package_id UUID NOT NULL,
          city_id UUID,
          day_number INTEGER NOT NULL CHECK (day_number > 0),
          city_name VARCHAR(255),
          title VARCHAR(255),
          description TEXT,
          photo_url TEXT,
          has_flights BOOLEAN DEFAULT false,
          time_slots JSONB DEFAULT '{"morning":{"time":"","activities":[],"transfers":[]},"afternoon":{"time":"","activities":[],"transfers":[]},"evening":{"time":"","activities":[],"transfers":[]}}'::jsonb,
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

      if (createResult.error) {
        throw new Error(`Failed to create table: ${createResult.error}`);
      }

      console.log('✅ Table created successfully!');
      return;
    }

    console.log('✅ Table exists. Checking structure...');
    
    // Get all columns
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'multi_city_package_day_plans'
      ORDER BY ordinal_position
    `;

    const columnsResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
          action: 'query',
          query: columnsQuery,
          params: [],
        }),
      })
    );

    const columnsResult = JSON.parse(
      new TextDecoder().decode(columnsResponse.Payload || new Uint8Array())
    );

    console.log('');
    console.log('📋 Table structure:');
    console.table(columnsResult.rows);

    // Check id column specifically
    const idColumn = columnsResult.rows?.find((col: any) => col.column_name === 'id');
    
    if (!idColumn) {
      console.log('');
      console.log('❌ id column not found!');
      return;
    }

    console.log('');
    console.log('📋 id column details:');
    console.log(`   - Type: ${idColumn.data_type}`);
    console.log(`   - Nullable: ${idColumn.is_nullable}`);
    console.log(`   - Default: ${idColumn.column_default || 'NULL'}`);

    // Check if it needs fixing
    if (idColumn.data_type !== 'uuid') {
      console.log('');
      console.log('⚠️  id column is not UUID type!');
    }

    if (!idColumn.column_default || !idColumn.column_default.includes('gen_random_uuid')) {
      console.log('');
      console.log('⚠️  id column is missing DEFAULT gen_random_uuid()!');
    }

    if (idColumn.data_type === 'uuid' && idColumn.column_default?.includes('gen_random_uuid')) {
      console.log('');
      console.log('✅ id column structure is correct!');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

checkTable();
