/**
 * Migration Status Checker
 * 
 * Checks which migration tables/columns already exist in the database.
 * Useful for verifying migration status before/after running.
 * 
 * Usage:
 *   npm run migrate:check
 */

import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function checkMigration() {
  console.log('🔍 Checking database migration status...\n');

  try {
    // Direct database connection
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
    
    const checks = [
      {
        name: 'Users table - phone auth columns',
        query: `
          SELECT 
            column_name, 
            data_type, 
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'users' 
            AND column_name IN ('country_code', 'phone_number', 'phone_verified', 'email_verified', 'auth_method', 'profile_completion_percentage', 'onboarding_completed')
          ORDER BY column_name;
        `,
      },
      {
        name: 'OTP codes table',
        query: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'otp_codes'
          ) as exists;
        `,
      },
      {
        name: 'Account details table',
        query: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'account_details'
          ) as exists;
        `,
      },
      {
        name: 'Brand details table',
        query: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'brand_details'
          ) as exists;
        `,
      },
      {
        name: 'Business details table',
        query: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'business_details'
          ) as exists;
        `,
      },
      {
        name: 'Documents table',
        query: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'documents'
          ) as exists;
        `,
      },
      {
        name: 'OTP rate limits table',
        query: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'otp_rate_limits'
          ) as exists;
        `,
      },
      {
        name: 'Profile completion function',
        query: `
          SELECT EXISTS (
            SELECT FROM pg_proc 
            WHERE proname = 'calculate_profile_completion'
          ) as exists;
        `,
      },
    ];

    console.log('📊 Migration Status:\n');
    console.log('='.repeat(60));

    for (const check of checks) {
      try {
        const result = await pool.query(check.query);
        
        if (check.name.includes('columns')) {
          const columns = result.rows;
          if (columns.length === 0) {
            console.log(`❌ ${check.name}: Not found`);
          } else {
            console.log(`✅ ${check.name}: Found ${columns.length} column(s)`);
            columns.forEach((col: any) => {
              console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
            });
          }
        } else {
          const exists = result.rows[0]?.exists;
          console.log(`${exists ? '✅' : '❌'} ${check.name}: ${exists ? 'Exists' : 'Not found'}`);
        }
      } catch (error: any) {
        console.log(`❌ ${check.name}: Error - ${error.message}`);
      }
    }

    console.log('='.repeat(60));
    console.log('\n✅ Status check complete!\n');

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Check failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkMigration();

