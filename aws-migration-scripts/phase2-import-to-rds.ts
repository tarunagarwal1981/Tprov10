/**
 * Phase 2: Import to RDS
 * Imports exported SQL files to RDS PostgreSQL
 * 
 * Usage:
 *   npx ts-node aws-migration-scripts/phase2-import-to-rds.ts
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const RDS_ENDPOINT = 'travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com';
const RDS_PORT = 5432;
const RDS_USER = 'postgres';
const RDS_PASSWORD = 'ju3vrLHJUW8PqDG4';
const RDS_DATABASE = 'postgres';

/**
 * Import SQL file to RDS
 */
async function importSQLFile(rdsClient: Client, filePath: string, description: string): Promise<void> {
  console.log(`📥 ${description}...`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const sql = fs.readFileSync(filePath, 'utf-8');
  
  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let executed = 0;
  let errors = 0;

  for (const statement of statements) {
    try {
      await rdsClient.query(statement);
      if (statement.trim().toUpperCase().startsWith('INSERT')) {
        executed++;
      } else if (statement.trim().toUpperCase().startsWith('CREATE')) {
        executed++;
      }
    } catch (error: any) {
      // Ignore errors for existing objects and duplicates
      const errorMsg = error.message.toLowerCase();
      if (!errorMsg.includes('already exists') && 
          !errorMsg.includes('duplicate key') &&
          !errorMsg.includes('relation already exists')) {
        errors++;
        if (errors <= 5) { // Only show first 5 errors
          console.warn(`    ⚠️  ${error.message.substring(0, 100)}`);
        }
      }
    }
  }
  
  console.log(`    ✅ Executed ${executed} statements${errors > 0 ? ` (${errors} warnings)` : ''}`);
}

/**
 * Verify migration
 */
async function verifyMigration(rdsClient: Client): Promise<void> {
  console.log('🔍 Verifying migration...');
  console.log('');

  const tables = [
    'users',
    'activity_packages',
    'transfer_packages',
    'multi_city_packages',
    'itineraries',
  ];

  for (const table of tables) {
    try {
      const result = await rdsClient.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = result.rows[0].count;
      console.log(`  ✅ ${table}: ${count} rows`);
    } catch (error: any) {
      console.log(`  ⚠️  ${table}: ${error.message.substring(0, 50)}`);
    }
  }
}

/**
 * Main import function
 */
async function importToRDS() {
  console.log('🚀 Phase 2: Importing to RDS');
  console.log('='.repeat(60));
  console.log('');

  // Create RDS client
  const rdsClient = new Client({
    host: RDS_ENDPOINT,
    port: RDS_PORT,
    user: RDS_USER,
    password: RDS_PASSWORD,
    database: RDS_DATABASE,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000, // 30 seconds
  });

  try {
    // Connect to RDS
    console.log('🔌 Connecting to RDS...');
    console.log(`   Host: ${RDS_ENDPOINT}`);
    await rdsClient.connect();
    console.log('✅ Connected to RDS');
    console.log('');

    // Import schema
    const schemaFile = path.join(process.cwd(), 'supabase_schema.sql');
    await importSQLFile(rdsClient, schemaFile, 'Importing schema');
    console.log('');

    // Import data
    const dataFile = path.join(process.cwd(), 'supabase_data.sql');
    await importSQLFile(rdsClient, dataFile, 'Importing data');
    console.log('');

    // Verify
    await verifyMigration(rdsClient);
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ Phase 2 Migration Complete!');
    console.log('='.repeat(60));
    console.log('');
    console.log('💾 Next Steps:');
    console.log('  1. Make RDS private again (for security)');
    console.log('  2. Update .env.local with RDS credentials');
    console.log('  3. Test database connection');
    console.log('  4. Proceed to Phase 3 (Cognito setup)');
    console.log('');

  } catch (error: any) {
    console.error('❌ Import failed:', error.message);
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('⚠️  Connection timeout. Possible reasons:');
      console.error('  1. RDS is not yet publicly accessible (wait a few minutes)');
      console.error('  2. Security group blocking connection');
      console.error('  3. RDS is still modifying');
      console.error('');
      console.error('Check RDS status:');
      console.error('  aws rds describe-db-instances --db-instance-identifier travel-app-db --query "DBInstances[0].DBInstanceStatus"');
    }
    process.exit(1);
  } finally {
    await rdsClient.end();
  }
}

// Run import
importToRDS().catch(console.error);

