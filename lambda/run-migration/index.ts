/**
 * Lambda Function: Run Database Migration
 * 
 * This Lambda function runs the phone auth database migration.
 * It should be deployed in the same VPC as your RDS instance.
 * 
 * Usage:
 *   Invoke via AWS Console, CLI, or API Gateway
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

interface MigrationEvent {
  action?: 'check' | 'migrate';
}

export const handler = async (event: MigrationEvent = {}) => {
  const action = event.action || 'migrate';
  
  console.log(`🚀 Starting migration ${action}...`);

  try {
    // Get RDS configuration from environment variables
    const rdsConfig = {
      host: process.env.RDS_HOSTNAME || process.env.RDS_HOST,
      port: parseInt(process.env.RDS_PORT || '5432'),
      database: process.env.RDS_DATABASE || process.env.RDS_DB || 'postgres',
      user: process.env.RDS_USERNAME || process.env.RDS_USER,
      password: process.env.RDS_PASSWORD,
    };

    if (!rdsConfig.host || !rdsConfig.user || !rdsConfig.password) {
      throw new Error('Missing RDS configuration in Lambda environment variables');
    }

    // Create database connection pool
    const pool = new Pool({
      host: rdsConfig.host,
      port: rdsConfig.port,
      database: rdsConfig.database,
      user: rdsConfig.user,
      password: rdsConfig.password,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 10000,
    });

    if (action === 'check') {
      return await checkMigrationStatus(pool);
    } else {
      return await runMigration(pool);
    }
  } catch (error: any) {
    console.error('Migration error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
    };
  }
};

async function checkMigrationStatus(pool: Pool) {
  const checks = [
    {
      name: 'Users table - phone auth columns',
      query: `
        SELECT 
          column_name, 
          data_type, 
          is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND column_name IN ('country_code', 'phone_number', 'phone_verified', 'email_verified', 'auth_method', 'profile_completion_percentage', 'onboarding_completed')
        ORDER BY column_name;
      `,
    },
    {
      name: 'OTP codes table',
      query: `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'otp_codes') as exists;`,
    },
    {
      name: 'Account details table',
      query: `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'account_details') as exists;`,
    },
    {
      name: 'Brand details table',
      query: `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brand_details') as exists;`,
    },
    {
      name: 'Business details table',
      query: `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_details') as exists;`,
    },
    {
      name: 'Documents table',
      query: `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') as exists;`,
    },
    {
      name: 'OTP rate limits table',
      query: `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'otp_rate_limits') as exists;`,
    },
  ];

  const results: Record<string, any> = {};

  for (const check of checks) {
    try {
      const result = await pool.query(check.query);
      if (check.name.includes('columns')) {
        results[check.name] = {
          exists: result.rows.length > 0,
          columns: result.rows,
        };
      } else {
        results[check.name] = {
          exists: result.rows[0]?.exists || false,
        };
      }
    } catch (error: any) {
      results[check.name] = {
        exists: false,
        error: error.message,
      };
    }
  }

  await pool.end();

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      action: 'check',
      results,
    }),
  };
}

async function runMigration(pool: Pool) {
  // Read migration SQL file
  // In Lambda, the file should be in the deployment package
  const migrationSQL = readFileSync(
    join(__dirname, '../../migrations/001_phone_auth_schema.sql'),
    'utf-8'
  );

  // Split SQL into statements
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => 
      stmt.length > 0 && 
      !stmt.startsWith('--') && 
      !stmt.startsWith('COMMENT ON')
    );

  console.log(`Executing ${statements.length} SQL statements...`);

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    if (!statement || statement.length < 10) {
      continue;
    }

    try {
      await pool.query(statement);
      successCount++;
    } catch (error: any) {
      // Some errors are expected (e.g., IF NOT EXISTS already exists)
      if (error.message?.includes('already exists') || 
          error.message?.includes('does not exist') ||
          error.message?.includes('duplicate')) {
        successCount++;
      } else {
        errorCount++;
        errors.push(`Statement ${i + 1}: ${error.message}`);
      }
    }
  }

  await pool.end();

  return {
    statusCode: errorCount === 0 ? 200 : 500,
    body: JSON.stringify({
      success: errorCount === 0,
      action: 'migrate',
      summary: {
        total: statements.length,
        successful: successCount,
        errors: errorCount,
      },
      errors: errors.length > 0 ? errors : undefined,
    }),
  };
}

