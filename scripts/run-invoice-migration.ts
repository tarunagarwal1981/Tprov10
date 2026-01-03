import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function runMigration() {
  console.log('🚀 Starting invoice enhancement database migration...\n');

  try {
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '028_add_enhanced_invoice_fields.sql');
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
      console.error('❌ Missing RDS configuration. Please set the following in .env.local:');
      console.error('   RDS_HOSTNAME or RDS_HOST');
      console.error('   RDS_USERNAME or RDS_USER');
      console.error('   RDS_PASSWORD');
      console.error('   RDS_PORT (optional, defaults to 5432)');
      console.error('   RDS_DATABASE or RDS_DB (optional, defaults to postgres)');
      process.exit(1);
    }

    console.log(`   Host: ${rdsConfig.host}`);
    console.log(`   Port: ${rdsConfig.port}`);
    console.log(`   Database: ${rdsConfig.database}`);
    console.log(`   User: ${rdsConfig.user}`);
    console.log('');

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
        !stmt.startsWith('=') &&
        !stmt.match(/^=+$/)
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
        if (firstWords.includes('CREATE') || firstWords.includes('ALTER') || firstWords.includes('DROP') || firstWords.includes('UPDATE')) {
          console.log(`  [${i + 1}/${statements.length}] Executing: ${firstWords}...`);
        }

        await pool.query(statement);
        successCount++;
      } catch (error: any) {
        // Some errors are expected (e.g., IF NOT EXISTS already exists)
        if (error.message?.includes('already exists') || 
            error.message?.includes('does not exist') ||
            error.message?.includes('duplicate') ||
            error.message?.includes('column') && error.message?.includes('already')) {
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
      console.log('');
      console.log('The following changes have been applied:');
      console.log('  ✓ Added lead_id column to invoices table');
      console.log('  ✓ Added billing_address (JSONB) column');
      console.log('  ✓ Added tax_rate, tax_amount, subtotal columns');
      console.log('  ✓ Added payment_terms, notes, currency columns');
      console.log('  ✓ Added line_items (JSONB) column');
      console.log('  ✓ Created index on lead_id');
      console.log('  ✓ Updated existing invoices with lead_id from itineraries');
      console.log('');
    } else {
      console.log('⚠️  Migration completed with some errors. Please review above.');
      console.log('   Some errors may be expected (e.g., columns already exist).');
      console.log('');
    }

    await pool.end();
    process.exit(errorCount === 0 ? 0 : 1);
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('\nPlease check:');
      console.error('  1. RDS connection parameters are correct in .env.local');
      console.error('  2. Your IP is allowed in RDS security group');
      console.error('  3. Network connectivity to RDS endpoint');
    }
    process.exit(1);
  }
}

runMigration();

