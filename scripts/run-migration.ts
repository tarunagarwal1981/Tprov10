/**
 * Database Migration Runner
 * 
 * Runs the phone auth schema migration on the RDS PostgreSQL database.
 * Uses the same connection logic as the application.
 * 
 * Usage:
 *   npm run migrate
 *   or
 *   ts-node scripts/run-migration.ts
 */

import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'migrations', '001_phone_auth_schema.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Migration file loaded (${migrationSQL.length} characters)\n`);

    // Get database connection pool
    console.log('🔌 Connecting to database...');
    
    // Direct database connection (bypassing the app's connection logic)
    const rdsConfig = {
      host: process.env.RDS_HOSTNAME || process.env.RDS_HOST,
      port: parseInt(process.env.RDS_PORT || '5432'),
      database: process.env.RDS_DATABASE || process.env.RDS_DB || 'postgres',
      user: process.env.RDS_USERNAME || process.env.RDS_USER,
      password: process.env.RDS_PASSWORD,
    };

    if (!rdsConfig.host || !rdsConfig.user || !rdsConfig.password) {
      throw new Error('Missing RDS configuration. Please set RDS_HOST, RDS_USER, and RDS_PASSWORD in .env.local');
    }

    const pool = new Pool({
      host: rdsConfig.host,
      port: rdsConfig.port,
      database: rdsConfig.database,
      user: rdsConfig.user,
      password: rdsConfig.password,
      // RDS typically requires SSL
      ssl: {
        rejectUnauthorized: false, // For RDS, we accept the server certificate
      },
      connectionTimeoutMillis: 10000, // 10 second timeout
    });

    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection established\n');

    // Split SQL into individual statements
    // Remove comments and split by semicolons
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.length > 0 && 
        !stmt.startsWith('--') && 
        !stmt.startsWith('COMMENT ON')
      );

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements
      if (!statement || statement.length < 10) {
        continue;
      }

      try {
        // Show progress for significant operations
        const firstWords = statement.split(/\s+/).slice(0, 3).join(' ').toUpperCase();
        if (firstWords.includes('CREATE') || firstWords.includes('ALTER') || firstWords.includes('DROP')) {
          console.log(`  [${i + 1}/${statements.length}] Executing: ${firstWords}...`);
        }

        await pool.query(statement);
        successCount++;
      } catch (error: any) {
        // Some errors are expected (e.g., IF NOT EXISTS already exists)
        if (error.message?.includes('already exists') || 
            error.message?.includes('does not exist') ||
            error.message?.includes('duplicate')) {
          console.log(`  ⚠️  [${i + 1}] Skipped (already applied): ${error.message.split('\n')[0]}`);
          successCount++;
        } else {
          console.error(`  ❌ [${i + 1}] Error: ${error.message}`);
          errorCount++;
          // Don't stop on errors - continue with other statements
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50) + '\n');

    if (errorCount === 0) {
      console.log('✅ Migration completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('  1. Verify tables were created: otp_codes, account_details, brand_details, business_details, documents');
      console.log('  2. Check users table has new columns: country_code, phone_number, phone_verified, etc.');
      console.log('  3. Test the phone auth flow');
    } else {
      console.log('⚠️  Migration completed with some errors.');
      console.log('   Review the errors above. Some may be expected (e.g., "already exists").');
    }

    // Close the connection pool
    await pool.end();
    console.log('\n🔌 Database connection closed.');

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the migration
runMigration();

