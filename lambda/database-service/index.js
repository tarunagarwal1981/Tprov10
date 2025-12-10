"use strict";
/**
 * Database Service Lambda
 *
 * Handles all database operations for the travel app.
 * Runs in the same VPC as RDS for direct access.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const pg_1 = require("pg");
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
// Initialize connection pool (reused across invocations)
let pool = null;
const secretsClient = new client_secrets_manager_1.SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });
const SECRET_NAME = process.env.SECRETS_MANAGER_SECRET_NAME || 'travel-app/dev/secrets';
/**
 * Initialize database connection pool
 */
async function getPool() {
    if (pool) {
        return pool;
    }
    try {
        // Fetch all RDS config from Secrets Manager
        const secretResponse = await secretsClient.send(new client_secrets_manager_1.GetSecretValueCommand({ SecretId: SECRET_NAME }));
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
        pool = new pg_1.Pool({
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
    }
    catch (error) {
        console.error('[Database] Failed to initialize pool:', error);
        throw error;
    }
}
/**
 * Lambda handler
 */
const handler = async (event) => {
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
    }
    catch (error) {
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
exports.handler = handler;
