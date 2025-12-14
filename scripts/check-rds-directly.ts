/**
 * Script to directly connect to RDS and check tables and columns
 */

import { Client } from 'pg';

const RDS_CONFIG = {
  host: process.env.RDS_HOST || process.env.RDS_HOSTNAME || 'travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com',
  port: parseInt(process.env.RDS_PORT || '5432'),
  database: process.env.RDS_DATABASE || process.env.RDS_DB || 'postgres',
  user: process.env.RDS_USERNAME || process.env.RDS_USER || 'postgres',
  password: process.env.RDS_PASSWORD || process.env.PGPASSWORD || (() => {
    console.error('❌ RDS_PASSWORD or PGPASSWORD environment variable is required');
    console.error('Please set it before running this script:');
    console.error('  export RDS_PASSWORD=your_password');
    process.exit(1);
  })(),
  ssl: {
    rejectUnauthorized: false,
  },
};

async function checkRDS() {
  const client = new Client(RDS_CONFIG);

  try {
    console.log('🔌 Connecting to RDS...');
    await client.connect();
    console.log('✅ Connected to RDS!');
    console.log('');

    // List all tables
    console.log('📋 Listing all tables...');
    const tablesQuery = `
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY table_schema, table_name
    `;

    const tablesResult = await client.query(tablesQuery);
    
    console.log(`Found ${tablesResult.rows.length} tables:`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (tablesResult.rows.length === 0) {
      console.log('   (No tables found)');
    } else {
      tablesResult.rows.forEach((row) => {
        console.log(`   ${row.table_schema}.${row.table_name}`);
      });
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Check for multi_city tables specifically
    const multiCityTables = tablesResult.rows.filter((row) => 
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

        const columnsResult = await client.query(columnsQuery, [table.table_name]);
        
        columnsResult.rows.forEach((col) => {
          const defaultStr = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          const nullableStr = col.is_nullable === 'YES' ? ' NULL' : ' NOT NULL';
          const lengthStr = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
          console.log(`      - ${col.column_name}: ${col.data_type}${lengthStr}${nullableStr}${defaultStr}`);
        });
      }
    } else {
      console.log('❌ No multi_city tables found');
    }

    // Check for enum types
    console.log('\n🔍 Checking enum types...');
    const enumQuery = `
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e'
      ORDER BY typname
    `;

    const enumResult = await client.query(enumQuery);
    
    if (enumResult.rows.length > 0) {
      console.log('Found enum types:');
      for (const enumType of enumResult.rows) {
        console.log(`\n   📌 ${enumType.typname}:`);
        
        const enumValuesQuery = `
          SELECT enumlabel 
          FROM pg_enum 
          WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = $1)
          ORDER BY enumsortorder
        `;
        
        const valuesResult = await client.query(enumValuesQuery, [enumType.typname]);
        const values = valuesResult.rows.map((r) => r.enumlabel).join(', ');
        console.log(`      Values: ${values}`);
      }
    } else {
      console.log('   (No enum types found)');
    }

    // Check specific tables we need
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
      
      const existsResult = await client.query(existsQuery, [tableName]);
      const exists = existsResult.rows[0].exists;
      
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
        
        const keyColsResult = await client.query(keyColumnsQuery, [tableName]);
        if (keyColsResult.rows.length > 0) {
          keyColsResult.rows.forEach((col) => {
            const defaultStr = col.column_default ? ` (default: ${col.column_default})` : '';
            console.log(`      ${col.column_name}: ${col.data_type}${defaultStr}`);
          });
        }
      }
    }

    await client.end();
    console.log('\n✅ Check complete!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
}

checkRDS();
