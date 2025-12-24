#!/usr/bin/env node

/**
 * Run database migration using AWS RDS connection
 * Uses AWS credentials from .env.local for authentication
 * Usage: node scripts/run-migration.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Configure AWS SDK if credentials are available
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
  process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
  process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
  console.log('✅ AWS credentials loaded from .env.local');
}

async function runMigration() {
  console.log('🚀 Running migration: 021_restructure_time_slots_schema.sql\n');

  // Get RDS connection parameters
  const rdsConfig = {
    host: process.env.RDS_HOSTNAME || process.env.RDS_HOST,
    port: parseInt(process.env.RDS_PORT || '5432'),
    database: process.env.RDS_DATABASE || process.env.RDS_DB || 'postgres',
    user: process.env.RDS_USERNAME || process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    ssl: process.env.RDS_SSL === 'true' ? {
      rejectUnauthorized: false,
    } : undefined,
  };

  // Validate required parameters
  if (!rdsConfig.host || !rdsConfig.user || !rdsConfig.password) {
    console.error('❌ Error: Missing required RDS connection parameters');
    console.error('\nPlease set these in .env.local:');
    console.error('  RDS_HOSTNAME or RDS_HOST');
    console.error('  RDS_USERNAME or RDS_USER');
    console.error('  RDS_PASSWORD');
    process.exit(1);
  }

  console.log('Connecting to AWS RDS...');
  console.log(`  Host: ${rdsConfig.host}`);
  console.log(`  Port: ${rdsConfig.port}`);
  console.log(`  Database: ${rdsConfig.database}`);
  console.log(`  User: ${rdsConfig.user}\n`);

  // Create connection pool
  const pool = new Pool(rdsConfig);

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/021_restructure_time_slots_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...\n');

    // Execute migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    console.error('\nPlease check:');
    console.error('  1. RDS connection parameters are correct');
    console.error('  2. Your IP is allowed in RDS security group');
    console.error('  3. Network connectivity to RDS endpoint');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
