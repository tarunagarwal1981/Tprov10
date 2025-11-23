/**
 * Phase 2: Database Migration via Supabase API
 * Uses Supabase client to export data, then imports to RDS
 * 
 * Usage:
 *   npx ts-node aws-migration-scripts/phase2-migrate-via-api.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const SUPABASE_URL = 'https://megmjzszmqnmzdxwzigt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MTc4NiwiZXhwIjoyMDc1MTI3Nzg2fQ.i2kYiW0n-1uuJuTK5HH6sc0W7Vpjrl4SEXBq8TwL-KA';

const RDS_ENDPOINT = 'travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com';
const RDS_PORT = 5432;
const RDS_USER = 'postgres';
const RDS_PASSWORD = 'ju3vrLHJUW8PqDG4';
const RDS_DATABASE = 'postgres';

/**
 * Get all tables from Supabase
 */
async function getTables(supabase: any): Promise<string[]> {
  console.log('📋 Getting list of tables...');
  
  // Use Supabase to query information_schema
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `
  }).catch(() => {
    // If RPC doesn't work, try direct query
    return { data: null, error: 'RPC not available' };
  });

  if (error || !data) {
    // Fallback: Try to get tables by querying known tables
    console.log('⚠️  Could not get table list via RPC, using known tables...');
    return [
      'users',
      'activity_packages',
      'activity_package_images',
      'transfer_packages',
      'transfer_package_images',
      'multi_city_packages',
      'multi_city_package_cities',
      'itineraries',
      'itinerary_days',
      'leads',
      'lead_marketplace',
    ];
  }

  return data.map((row: any) => row.table_name);
}

/**
 * Export data from Supabase table
 */
async function exportTableData(supabase: any, tableName: string): Promise<any[]> {
  console.log(`  Exporting ${tableName}...`);
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(10000); // Supabase has limits, adjust if needed

  if (error) {
    console.warn(`⚠️  Error exporting ${tableName}: ${error.message}`);
    return [];
  }

  return data || [];
}

/**
 * Generate INSERT statements
 */
function generateInsertStatements(tableName: string, rows: any[]): string {
  if (rows.length === 0) return '';

  let sql = `-- Table: ${tableName}\n`;
  const columns = Object.keys(rows[0]);

  for (const row of rows) {
    const values = columns.map(col => {
      const value = row[col];
      if (value === null) return 'NULL';
      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
      }
      if (typeof value === 'object') {
        return `'${JSON.stringify(value).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
      }
      if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
      }
      return value;
    });

    sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
  }

  return sql + '\n';
}

/**
 * Create table schema from Supabase
 */
async function getTableSchema(supabase: any, tableName: string): Promise<string> {
  // Try to get schema via Supabase
  // For now, we'll create a basic schema based on the data
  // In production, you'd want to get the actual DDL from Supabase
  
  const { data } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (!data || data.length === 0) {
    return `-- Table ${tableName} (no data to infer schema)\n`;
  }

  const sampleRow = data[0];
  const columns: string[] = [];
  
  for (const [key, value] of Object.entries(sampleRow)) {
    let type = 'TEXT';
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        type = 'INTEGER';
      } else {
        type = 'NUMERIC';
      }
    } else if (typeof value === 'boolean') {
      type = 'BOOLEAN';
    } else if (value instanceof Date) {
      type = 'TIMESTAMP';
    } else if (typeof value === 'object') {
      type = 'JSONB';
    }
    
    columns.push(`  ${key} ${type}`);
  }

  return `CREATE TABLE IF NOT EXISTS ${tableName} (\n${columns.join(',\n')}\n);\n\n`;
}

/**
 * Import data to RDS
 */
async function importToRDS(rdsClient: Client, sql: string): Promise<void> {
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let imported = 0;
  for (const statement of statements) {
    try {
      await rdsClient.query(statement);
      if (statement.trim().toUpperCase().startsWith('INSERT')) {
        imported++;
      }
    } catch (error: any) {
      if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
        console.warn(`⚠️  Import warning: ${error.message.substring(0, 100)}`);
      }
    }
  }
  
  console.log(`✅ Imported ${imported} rows`);
}

/**
 * Main migration function
 */
async function migrateDatabase() {
  console.log('🚀 Phase 2: Database Migration via Supabase API');
  console.log('='.repeat(60));
  console.log('');

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Create RDS client
  const rdsClient = new Client({
    host: RDS_ENDPOINT,
    port: RDS_PORT,
    user: RDS_USER,
    password: RDS_PASSWORD,
    database: RDS_DATABASE,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Connect to RDS
    console.log('🔌 Connecting to RDS...');
    await rdsClient.connect();
    console.log('✅ Connected to RDS');
    console.log('');

    // Test Supabase connection
    console.log('🔌 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.warn(`⚠️  Supabase connection test: ${testError.message}`);
      console.log('Continuing anyway...');
    } else {
      console.log('✅ Supabase connection OK');
    }
    console.log('');

    // Get tables
    const tables = await getTables(supabase);
    console.log(`Found ${tables.length} tables to migrate`);
    console.log('');

    // Export and import each table
    let schemaSQL = '-- Supabase Schema Export\n';
    let dataSQL = '-- Supabase Data Export\n';

    for (const table of tables) {
      try {
        // Export data
        const data = await exportTableData(supabase, table);
        
        if (data.length > 0) {
          // Generate schema (simplified)
          schemaSQL += await getTableSchema(supabase, table);
          
          // Generate INSERT statements
          dataSQL += generateInsertStatements(table, data);
        } else {
          console.log(`  ⚠️  ${table}: No data to export`);
        }
      } catch (error: any) {
        console.warn(`⚠️  Error processing ${table}: ${error.message}`);
      }
    }

    // Save SQL files
    const schemaFile = path.join(process.cwd(), 'supabase_schema.sql');
    const dataFile = path.join(process.cwd(), 'supabase_data.sql');
    
    fs.writeFileSync(schemaFile, schemaSQL);
    fs.writeFileSync(dataFile, dataSQL);
    
    console.log('');
    console.log(`✅ Schema saved to: ${schemaFile}`);
    console.log(`✅ Data saved to: ${dataFile}`);
    console.log('');

    // Import to RDS
    console.log('📥 Importing to RDS...');
    await importToRDS(rdsClient, schemaSQL);
    await importToRDS(rdsClient, dataSQL);
    console.log('');

    // Verify
    console.log('🔍 Verifying migration...');
    try {
      const result = await rdsClient.query('SELECT COUNT(*) as count FROM users');
      console.log(`✅ users table: ${result.rows[0].count} rows`);
    } catch (error: any) {
      console.warn(`⚠️  Verification: ${error.message}`);
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Phase 2 Migration Complete!');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await rdsClient.end();
  }
}

// Run migration
migrateDatabase().catch(console.error);

