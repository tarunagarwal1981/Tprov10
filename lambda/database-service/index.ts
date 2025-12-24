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

    // Remove BOM (Byte Order Mark) if present
    // The BOM can appear as:
    // 1. Unicode character U+FEFF
    // 2. UTF-8 bytes EF BB BF interpreted as characters (ï»¿)
    // 3. Literal string "ï»¿"
    let secretString = secretResponse.SecretString;
    
    // Remove Unicode BOM character (U+FEFF)
    if (secretString.charCodeAt(0) === 0xFEFF) {
      secretString = secretString.substring(1);
    }
    
    // Remove literal BOM characters "ï»¿" (UTF-8 BOM bytes interpreted as text)
    if (secretString.startsWith('ï»¿')) {
      secretString = secretString.substring(3);
    }
    
    // Remove any remaining BOM characters using regex
    secretString = secretString.replace(/^[\uFEFF\u200B]+/, '').trim();
    
    // Final check: if still starts with non-JSON characters, find first {
    const firstBrace = secretString.indexOf('{');
    if (firstBrace > 0) {
      secretString = secretString.substring(firstBrace);
    }

    const secrets = JSON.parse(secretString);

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
    const { action, query, params, transactionQueries } = event;

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
        // Process params to handle JSONB values that might be strings
        // When params come through Lambda, JSONB values might be strings that need parsing
        const processedParams = (params || []).map((param: any, index: number) => {
          // If it's a string that looks like JSON, try to parse it
          if (typeof param === 'string' && (param.startsWith('[') || param.startsWith('{'))) {
            try {
              const parsed = JSON.parse(param);
              // Only return parsed if it's an object or array (valid JSONB)
              if (typeof parsed === 'object' && parsed !== null) {
                return parsed;
              }
            } catch (e) {
              // Not valid JSON, return as-is
            }
          }
          return param;
        });
        const result = await dbPool.query(query, processedParams);
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

      case 'transaction':
        // Transaction: Execute multiple queries in a transaction
        // event.transactionQueries is an array of { query: string, params: any[] }
        if (!event.transactionQueries || !Array.isArray(event.transactionQueries)) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing transactionQueries parameter (array of queries)' }),
          };
        }
        
        const client = await dbPool.connect();
        try {
          await client.query('BEGIN');
          const results: any[] = [];
          
          for (const { query: q, params } of event.transactionQueries) {
            const result = await client.query(q, params || []);
            results.push({
              rows: result.rows,
              rowCount: result.rowCount,
            });
          }
          
          await client.query('COMMIT');
          return {
            statusCode: 200,
            body: JSON.stringify({
              success: true,
              results,
            }),
          };
        } catch (error: any) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Unknown action: ${action}` }),
        };
    }
  } catch (error: any) {
    console.error('[Database] Error:', {
      error,
      message: error?.message,
      code: error?.code,
      name: error?.name,
      stack: error?.stack,
      detail: error?.detail,
      constraint: error?.constraint,
      table: error?.table,
      column: error?.column,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Database operation failed',
        message: error?.message || 'Unknown database error',
        code: error?.code,
        detail: error?.detail,
        constraint: error?.constraint,
      }),
    };
  }
};

