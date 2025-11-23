/**
 * Phase 2: Export from Supabase
 * Exports schema and data from Supabase to SQL files
 * 
 * Usage:
 *   npx ts-node aws-migration-scripts/phase2-export-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const SUPABASE_URL = 'https://megmjzszmqnmzdxwzigt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MTc4NiwiZXhwIjoyMDc1MTI3Nzg2fQ.i2kYiW0n-1uuJuTK5HH6sc0W7Vpjrl4SEXBq8TwL-KA';

/**
 * Known tables in the database
 */
const KNOWN_TABLES = [
  'users',
  'activity_packages',
  'activity_package_images',
  'activity_package_time_slots',
  'activity_package_variants',
  'activity_package_faqs',
  'activity_ticket_only_pricing',
  'activity_ticket_with_transfer_pricing',
  'transfer_packages',
  'transfer_package_images',
  'transfer_package_vehicles',
  'transfer_package_stops',
  'transfer_additional_services',
  'transfer_hourly_pricing',
  'transfer_point_to_point_pricing',
  'multi_city_packages',
  'multi_city_package_cities',
  'multi_city_package_images',
  'multi_city_package_inclusions',
  'multi_city_package_exclusions',
  'multi_city_package_cancellation_tiers',
  'multi_city_pricing_packages',
  'multi_city_pricing_rows',
  'multi_city_private_package_rows',
  'multi_city_hotel_packages',
  'multi_city_hotel_package_cities',
  'multi_city_hotel_package_city_hotels',
  'multi_city_hotel_package_images',
  'multi_city_hotel_package_inclusions',
  'multi_city_hotel_package_exclusions',
  'multi_city_hotel_pricing_packages',
  'itineraries',
  'itinerary_days',
  'itinerary_items',
  'itinerary_queries',
  'leads',
  'lead_marketplace',
  'destinations',
  'hotels',
  'activities',
  'bookings',
];

/**
 * Export data from Supabase table
 */
async function exportTableData(supabase: any, tableName: string): Promise<any[]> {
  console.log(`  📤 Exporting ${tableName}...`);
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(50000); // Supabase limit

    if (error) {
      console.warn(`    ⚠️  Error: ${error.message}`);
      return [];
    }

    const count = data?.length || 0;
    console.log(`    ✅ Exported ${count} rows`);
    return data || [];
  } catch (error: any) {
    console.warn(`    ⚠️  Exception: ${error.message}`);
    return [];
  }
}

/**
 * Generate INSERT statements
 */
function generateInsertStatements(tableName: string, rows: any[]): string {
  if (rows.length === 0) return '';

  let sql = `-- Table: ${tableName} (${rows.length} rows)\n`;
  const columns = Object.keys(rows[0]);

  for (const row of rows) {
    const values = columns.map(col => {
      const value = row[col];
      if (value === null) return 'NULL';
      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
      }
      if (typeof value === 'object' && value !== null) {
        return `'${JSON.stringify(value).replace(/'/g, "''").replace(/\\/g, '\\\\')}'::jsonb`;
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
 * Generate CREATE TABLE statement from sample data
 */
function generateCreateTable(tableName: string, sampleRow: any): string {
  const columns: string[] = [];
  
  for (const [key, value] of Object.entries(sampleRow)) {
    let type = 'TEXT';
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        type = value > 2147483647 ? 'BIGINT' : 'INTEGER';
      } else {
        type = 'NUMERIC';
      }
    } else if (typeof value === 'boolean') {
      type = 'BOOLEAN';
    } else if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
      type = 'TIMESTAMP WITH TIME ZONE';
    } else if (typeof value === 'object' && value !== null) {
      type = 'JSONB';
    }
    
    columns.push(`  ${key} ${type}`);
  }

  return `CREATE TABLE IF NOT EXISTS ${tableName} (\n${columns.join(',\n')}\n);\n\n`;
}

/**
 * Main export function
 */
async function exportFromSupabase() {
  console.log('🚀 Phase 2: Exporting from Supabase');
  console.log('='.repeat(60));
  console.log('');

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Test connection
  console.log('🔌 Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.warn(`⚠️  Connection test: ${error.message}`);
    } else {
      console.log('✅ Supabase connection OK');
    }
  } catch (error: any) {
    console.error(`❌ Connection failed: ${error.message}`);
    process.exit(1);
  }
  console.log('');

  let schemaSQL = '-- Supabase Schema Export\n';
  schemaSQL += '-- Generated: ' + new Date().toISOString() + '\n\n';
  
  let dataSQL = '-- Supabase Data Export\n';
  dataSQL += '-- Generated: ' + new Date().toISOString() + '\n\n';

  let totalRows = 0;
  let tablesExported = 0;

  // Export each table
  for (const table of KNOWN_TABLES) {
    try {
      const data = await exportTableData(supabase, table);
      
      if (data.length > 0) {
        // Generate schema from first row
        schemaSQL += generateCreateTable(table, data[0]);
        
        // Generate INSERT statements
        dataSQL += generateInsertStatements(table, data);
        
        totalRows += data.length;
        tablesExported++;
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
  
  const schemaSize = (fs.statSync(schemaFile).size / 1024).toFixed(2);
  const dataSize = (fs.statSync(dataFile).size / 1024).toFixed(2);

  console.log('');
  console.log('='.repeat(60));
  console.log('✅ Export Complete!');
  console.log('='.repeat(60));
  console.log('');
  console.log('📋 Summary:');
  console.log(`  Tables exported: ${tablesExported}`);
  console.log(`  Total rows: ${totalRows}`);
  console.log(`  Schema file: ${schemaFile} (${schemaSize} KB)`);
  console.log(`  Data file: ${dataFile} (${dataSize} KB)`);
  console.log('');
  console.log('💾 Next Steps:');
  console.log('  1. Make RDS publicly accessible (temporarily) OR');
  console.log('  2. Use EC2 instance in VPC to import, OR');
  console.log('  3. Use AWS Systems Manager Session Manager');
  console.log('');
  console.log('To import to RDS, run:');
  console.log('  psql --host=[RDS_ENDPOINT] --username=postgres --dbname=postgres --file=supabase_schema.sql');
  console.log('  psql --host=[RDS_ENDPOINT] --username=postgres --dbname=postgres --file=supabase_data.sql');
  console.log('');
}

// Run export
exportFromSupabase().catch(console.error);

