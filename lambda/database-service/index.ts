/**
 * Database Service Lambda
 * 
 * Handles all database operations for the travel app.
 * Runs in the same VPC as RDS for direct access.
 */

import { Pool } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Initialize connection pool (reused across invocations)
let pool: Pool | null = null;

const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });
const SECRET_NAME = process.env.SECRETS_MANAGER_SECRET_NAME || 'travel-app/dev/secrets';

/**
 * Initialize database connection pool
 */
async function getPool(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  try {
    // Fetch all RDS config from Secrets Manager
    const secretResponse = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: SECRET_NAME })
    );

    if (!secretResponse.SecretString) {
      throw new Error('Secret has no SecretString');
    }

    const secrets = JSON.parse(secretResponse.SecretString);

    pool = new Pool({
      host: secrets.RDS_HOST || secrets.RDS_HOSTNAME,
      port: parseInt(secrets.RDS_PORT || '5432'),
      database: secrets.RDS_DATABASE || secrets.RDS_DB || 'postgres',
      user: secrets.RDS_USERNAME || secrets.RDS_USER,
      password: secrets.RDS_PASSWORD,
      ssl: {
        rejectUnauthorized: false, // RDS uses SSL
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    console.log('[Database] Connection pool initialized');
    return pool;
  } catch (error) {
    console.error('[Database] Failed to initialize pool:', error);
    throw error;
  }
}

/**
 * Lambda handler
 */
export const handler = async (event: any) => {
  console.log('[Database] Event:', JSON.stringify(event, null, 2));

  try {
    const { action, query, params } = event;

    if (!action) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing action parameter' }),
      };
    }

    const dbPool = await getPool();

    switch (action) {
      case 'query':
        if (!query) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing query parameter' }),
          };
        }
        const result = await dbPool.query(query, params || []);
        return {
          statusCode: 200,
          body: JSON.stringify({
            rows: result.rows,
            rowCount: result.rowCount,
          }),
        };

      case 'queryOne':
        if (!query) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing query parameter' }),
          };
        }
        const resultOne = await dbPool.query(query, params || []);
        return {
          statusCode: 200,
          body: JSON.stringify({
            row: resultOne.rows[0] || null,
          }),
        };

      case 'queryMany':
        if (!query) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing query parameter' }),
          };
        }
        const resultMany = await dbPool.query(query, params || []);
        return {
          statusCode: 200,
          body: JSON.stringify({
            rows: resultMany.rows,
          }),
        };

      case 'test':
        const testResult = await dbPool.query('SELECT NOW() as current_time');
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            time: testResult.rows[0].current_time,
          }),
        };

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Unknown action: ${action}` }),
        };
    }
  } catch (error: any) {
    console.error('[Database] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Database operation failed',
        message: error.message,
        code: error.code,
      }),
    };
  }
};

