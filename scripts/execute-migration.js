/**
 * Execute Database Migration
 * Uses the existing database connection from the app
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  const pool = new Pool({
    host: process.env.RDS_HOSTNAME || process.env.RDS_HOST,
    port: parseInt(process.env.RDS_PORT || '5432'),
    database: process.env.RDS_DATABASE || process.env.RDS_DB || 'postgres',
    user: process.env.RDS_USERNAME || process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 10000,
  });

  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/001_phone_auth_schema.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Migration file loaded (${migrationSQL.length} characters)\n`);

    // Split into statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.length > 0 && 
        !stmt.startsWith('--') && 
        !stmt.startsWith('COMMENT ON')
      );

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.length < 10) continue;

      try {
        const firstWords = statement.split(/\s+/).slice(0, 3).join(' ').toUpperCase();
        if (firstWords.includes('CREATE') || firstWords.includes('ALTER') || firstWords.includes('DROP')) {
          process.stdout.write(`  [${i + 1}/${statements.length}] ${firstWords}... `);
        }

        await pool.query(statement);
        successCount++;
        if (firstWords.includes('CREATE') || firstWords.includes('ALTER') || firstWords.includes('DROP')) {
          console.log('✅');
        }
      } catch (error) {
        if (error.message?.includes('already exists') || 
            error.message?.includes('does not exist') ||
            error.message?.includes('duplicate')) {
          successCount++;
          if (firstWords.includes('CREATE') || firstWords.includes('ALTER') || firstWords.includes('DROP')) {
            console.log('⚠️  (already exists)');
          }
        } else {
          errorCount++;
          console.error(`\n  ❌ [${i + 1}] Error: ${error.message}`);
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50) + '\n');

    if (errorCount === 0) {
      console.log('✅ Migration completed successfully!\n');
      
      // Verify
      console.log('🔍 Verifying migration...');
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('otp_codes', 'account_details', 'brand_details', 'business_details', 'documents', 'otp_rate_limits')
        ORDER BY table_name;
      `);
      
      console.log(`✅ Found ${result.rows.length} new tables:`);
      result.rows.forEach(row => console.log(`   - ${row.table_name}`));
    } else {
      console.log('⚠️  Migration completed with some errors.');
    }

    await pool.end();
    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }
}

runMigration();

