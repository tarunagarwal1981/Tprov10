/**
 * Run Sub-Agent System Migration
 * 
 * This script runs the migration to add parent_agent_id column and sub_agent_assignments table
 * Uses AWS credentials from .env.local
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { Pool } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function getRDSConfig() {
  // First, try environment variables
  if (process.env.RDS_HOST && process.env.RDS_PASSWORD) {
    return {
      host: process.env.RDS_HOST,
      port: parseInt(process.env.RDS_PORT || '5432'),
      database: process.env.RDS_DATABASE || process.env.RDS_DB || 'postgres',
      user: process.env.RDS_USERNAME || process.env.RDS_USER || 'postgres',
      password: process.env.RDS_PASSWORD,
    };
  }

  // Try to get from Secrets Manager
  try {
    const secretsClient = new SecretsManagerClient({
      region: process.env.AWS_REGION || process.env.DEPLOYMENT_REGION || 'us-east-1',
      credentials: process.env.AWS_ACCESS_KEY_ID ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        sessionToken: process.env.AWS_SESSION_TOKEN,
      } : undefined,
    });

    const secretResponse = await secretsClient.send(
      new GetSecretValueCommand({
        SecretId: process.env.SECRETS_MANAGER_SECRET_NAME || 'travel-app/dev/secrets',
      })
    );

    if (!secretResponse.SecretString) {
      throw new Error('Secret has no SecretString');
    }

    let secretString = secretResponse.SecretString;
    
    // Remove BOM if present
    if (secretString.charCodeAt(0) === 0xFEFF) {
      secretString = secretString.substring(1);
    }
    if (secretString.startsWith('ï»¿')) {
      secretString = secretString.substring(3);
    }
    secretString = secretString.replace(/^[\uFEFF\u200B]+/, '').trim();
    const firstBrace = secretString.indexOf('{');
    if (firstBrace > 0) {
      secretString = secretString.substring(firstBrace);
    }

    const secrets = JSON.parse(secretString);
    
    return {
      host: secrets.RDS_HOST || secrets.RDS_HOSTNAME || secrets.rds_host,
      port: parseInt(secrets.RDS_PORT || secrets.rds_port || '5432'),
      database: secrets.RDS_DATABASE || secrets.RDS_DB || secrets.rds_database || 'postgres',
      user: secrets.RDS_USERNAME || secrets.RDS_USER || secrets.rds_username || 'postgres',
      password: secrets.RDS_PASSWORD || secrets.rds_password,
    };
  } catch (error) {
    console.error('Failed to get secrets from Secrets Manager:', error);
    throw error;
  }
}

async function runMigration() {
  console.log('🚀 Starting Sub-Agent System Migration...\n');

  try {
    // Get RDS configuration
    console.log('📋 Getting RDS configuration...');
    const rdsConfig = await getRDSConfig();
    
    if (!rdsConfig.host || !rdsConfig.user || !rdsConfig.password) {
      throw new Error('Missing required RDS configuration. Please set RDS_HOST, RDS_USER, and RDS_PASSWORD in .env.local');
    }

    console.log(`✅ Connecting to: ${rdsConfig.host}:${rdsConfig.port}/${rdsConfig.database}`);
    console.log(`   User: ${rdsConfig.user}\n`);

    // Create connection pool
    const pool = new Pool({
      host: rdsConfig.host,
      port: rdsConfig.port,
      database: rdsConfig.database,
      user: rdsConfig.user,
      password: rdsConfig.password,
      ssl: {
        rejectUnauthorized: false, // For RDS
      },
      max: 1, // Single connection for migration
    });

    // Read migration file
    const migrationPath = resolve(process.cwd(), 'supabase/migrations/024_add_sub_agent_system.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log('✅ Migration file loaded\n');

    // Test connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected successfully\n');

    // Run migration
    console.log('🔄 Running migration...');
    await pool.query(migrationSQL);
    console.log('✅ Migration executed successfully\n');

    // Verify migration
    console.log('🔍 Verifying migration...');
    
    // Check if parent_agent_id column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'parent_agent_id'
    `);
    
    if (columnCheck.rows.length === 0) {
      throw new Error('parent_agent_id column was not created');
    }
    console.log('✅ parent_agent_id column exists');

    // Check if sub_agent_assignments table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'sub_agent_assignments'
    `);
    
    if (tableCheck.rows.length === 0) {
      throw new Error('sub_agent_assignments table was not created');
    }
    console.log('✅ sub_agent_assignments table exists');

    // Check if index exists
    const indexCheck = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'users' AND indexname = 'idx_users_parent_agent_id'
    `);
    
    if (indexCheck.rows.length === 0) {
      console.warn('⚠️  idx_users_parent_agent_id index not found (may have been created with different name)');
    } else {
      console.log('✅ idx_users_parent_agent_id index exists');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n✅ Sub-agent system is now ready:');
    console.log('   - parent_agent_id column added to users table');
    console.log('   - sub_agent_assignments table created');
    console.log('   - Indexes created');

    await pool.end();
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run migration
runMigration();

