/**
 * Phase 2: Database Migration Script
 * Exports from Supabase and imports to RDS using Node.js pg library
 * 
 * Usage:
 *   npx ts-node aws-migration-scripts/phase2-migrate-database.ts
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
// Get connection details from Supabase Dashboard → Settings → Database
// Use "Connection string" → "URI" format
const SUPABASE_CONNECTION_STRING = process.env.SUPABASE_DB_CONNECTION_STRING || '';
const SUPABASE_PROJECT_REF = 'megmjzszmqnmzdxwzigt';
const SUPABASE_HOST = process.env.SUPABASE_DB_HOST || `db.${SUPABASE_PROJECT_REF}.supabase.co`;
const SUPABASE_PORT = parseInt(process.env.SUPABASE_DB_PORT || '5432');
const SUPABASE_USER = 'postgres';
const SUPABASE_DATABASE = 'postgres';

const RDS_ENDPOINT = 'travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com';
const RDS_PORT = 5432;
const RDS_USER = 'postgres';
const RDS_PASSWORD = 'ju3vrLHJUW8PqDG4';
const RDS_DATABASE = 'postgres';

interface TableInfo {
  table_name: string;
  row_count: number;
}

/**
 * Get Supabase database password from environment or prompt
 */
function getSupabasePassword(): string {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    console.error('❌ SUPABASE_DB_PASSWORD environment variable not set!');
    console.error('');
    console.error('Get your Supabase database password from:');
    console.error(`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/settings/database`);
    console.error('');
    console.error('Then set it:');
    console.error('  $env:SUPABASE_DB_PASSWORD="your_password"');
    console.error('');
    process.exit(1);
  }
  return password;
}

/**
 * Export schema from Supabase
 */
async function exportSchema(supabaseClient: Client): Promise<string> {
  console.log('📤 Exporting schema from Supabase...');
  
  const schemaQueries = [
    // Get all table creation statements
    `SELECT 
      'CREATE TABLE IF NOT EXISTS ' || schemaname || '.' || tablename || ' (' || 
      string_agg(column_name || ' ' || data_type || 
        CASE 
          WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')'
          ELSE ''
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
        ', '
      ) || ');' as create_statement
    FROM information_schema.columns
    WHERE table_schema = 'public'
    GROUP BY schemaname, tablename;`,
    
    // Get indexes
    `SELECT indexdef || ';' as create_index
    FROM pg_indexes
    WHERE schemaname = 'public';`,
    
    // Get functions
    `SELECT pg_get_functiondef(oid) || ';' as create_function
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace;`,
  ];

  let schemaSQL = '-- Supabase Schema Export\n';
  schemaSQL += '-- Generated: ' + new Date().toISOString() + '\n\n';

  for (const query of schemaQueries) {
    try {
      const result = await supabaseClient.query(query);
      for (const row of result.rows) {
        const statement = Object.values(row)[0];
        if (statement && typeof statement === 'string') {
          schemaSQL += statement + '\n\n';
        }
      }
    } catch (error: any) {
      console.warn(`⚠️  Warning in schema export: ${error.message}`);
    }
  }

  return schemaSQL;
}

/**
 * Export data from Supabase
 */
async function exportData(supabaseClient: Client): Promise<string> {
  console.log('📤 Exporting data from Supabase...');
  
  // Get all tables
  const tablesResult = await supabaseClient.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  let dataSQL = '-- Supabase Data Export\n';
  dataSQL += '-- Generated: ' + new Date().toISOString() + '\n\n';

  for (const table of tablesResult.rows) {
    const tableName = table.table_name;
    console.log(`  Exporting table: ${tableName}`);
    
    try {
      // Get all data from table
      const dataResult = await supabaseClient.query(`SELECT * FROM ${tableName}`);
      
      if (dataResult.rows.length > 0) {
        // Generate INSERT statements
        const columns = Object.keys(dataResult.rows[0]);
        dataSQL += `-- Table: ${tableName}\n`;
        
        for (const row of dataResult.rows) {
          const values = columns.map(col => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            return value;
          });
          
          dataSQL += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        dataSQL += '\n';
      }
    } catch (error: any) {
      console.warn(`⚠️  Warning exporting ${tableName}: ${error.message}`);
    }
  }

  return dataSQL;
}

/**
 * Import schema to RDS
 */
async function importSchema(rdsClient: Client, schemaSQL: string): Promise<void> {
  console.log('📥 Importing schema to RDS...');
  
  // Split by semicolons and execute each statement
  const statements = schemaSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      await rdsClient.query(statement);
    } catch (error: any) {
      // Ignore errors for existing objects
      if (!error.message.includes('already exists')) {
        console.warn(`⚠️  Schema import warning: ${error.message}`);
      }
    }
  }
  
  console.log('✅ Schema imported to RDS');
}

/**
 * Import data to RDS
 */
async function importData(rdsClient: Client, dataSQL: string): Promise<void> {
  console.log('📥 Importing data to RDS...');
  
  // Split by semicolons and execute each statement
  const statements = dataSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let imported = 0;
  for (const statement of statements) {
    try {
      await rdsClient.query(statement);
      imported++;
    } catch (error: any) {
      console.warn(`⚠️  Data import warning: ${error.message}`);
    }
  }
  
  console.log(`✅ Data imported to RDS (${imported} rows)`);
}

/**
 * Verify migration
 */
async function verifyMigration(rdsClient: Client): Promise<void> {
  console.log('🔍 Verifying migration...');
  
  try {
    // Check if users table exists and has data
    const usersResult = await rdsClient.query('SELECT COUNT(*) as count FROM users');
    console.log(`  ✅ users table: ${usersResult.rows[0].count} rows`);
    
    // Check other key tables
    const tables = ['activity_packages', 'transfer_packages', 'multi_city_packages'];
    for (const table of tables) {
      try {
        const result = await rdsClient.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ✅ ${table}: ${result.rows[0].count} rows`);
      } catch (error) {
        console.log(`  ⚠️  ${table}: table does not exist (may be normal)`);
      }
    }
  } catch (error: any) {
    console.warn(`⚠️  Verification warning: ${error.message}`);
  }
}

/**
 * Main migration function
 */
async function migrateDatabase() {
  console.log('🚀 Phase 2: Database Migration');
  console.log('='.repeat(60));
  console.log('');

  const supabasePassword = getSupabasePassword();

  // Create Supabase client
  let supabaseClient: Client;
  
  if (SUPABASE_CONNECTION_STRING) {
    // Use connection string if provided
    supabaseClient = new Client({
      connectionString: SUPABASE_CONNECTION_STRING.replace('<PASSWORD>', supabasePassword),
      ssl: { rejectUnauthorized: false },
    });
  } else {
    // Use individual parameters
    supabaseClient = new Client({
      host: SUPABASE_HOST,
      port: SUPABASE_PORT,
      user: SUPABASE_USER,
      password: supabasePassword,
      database: SUPABASE_DATABASE,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000, // 10 second timeout
    });
  }

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
    // Connect to databases
    console.log('🔌 Connecting to Supabase...');
    await supabaseClient.connect();
    console.log('✅ Connected to Supabase');
    
    console.log('🔌 Connecting to RDS...');
    await rdsClient.connect();
    console.log('✅ Connected to RDS');
    console.log('');

    // Export schema
    const schemaSQL = await exportSchema(supabaseClient);
    const schemaFile = path.join(process.cwd(), 'supabase_schema.sql');
    fs.writeFileSync(schemaFile, schemaSQL);
    console.log(`✅ Schema saved to: ${schemaFile}`);
    console.log('');

    // Export data
    const dataSQL = await exportData(supabaseClient);
    const dataFile = path.join(process.cwd(), 'supabase_data.sql');
    fs.writeFileSync(dataFile, dataSQL);
    console.log(`✅ Data saved to: ${dataFile}`);
    console.log('');

    // Import schema
    await importSchema(rdsClient, schemaSQL);
    console.log('');

    // Import data
    await importData(rdsClient, dataSQL);
    console.log('');

    // Verify
    await verifyMigration(rdsClient);
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ Phase 2 Migration Complete!');
    console.log('='.repeat(60));
    console.log('');
    console.log('📋 Summary:');
    console.log(`  Schema file: ${schemaFile}`);
    console.log(`  Data file: ${dataFile}`);
    console.log(`  RDS Endpoint: ${RDS_ENDPOINT}`);
    console.log('');
    console.log('💾 Next Steps:');
    console.log('  1. Update .env.local with RDS credentials');
    console.log('  2. Test database connection');
    console.log('  3. Proceed to Phase 3 (Cognito setup)');
    console.log('');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await supabaseClient.end();
    await rdsClient.end();
  }
}

// Run migration
migrateDatabase().catch(console.error);

export { migrateDatabase };

