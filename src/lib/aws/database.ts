/**
 * AWS RDS PostgreSQL Database Connection
 * 
 * This module provides a connection pool for PostgreSQL database queries
 * replacing Supabase client calls with direct PostgreSQL queries.
 */

import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';

// Database connection configuration
const poolConfig: PoolConfig = {
  host: process.env.RDS_HOSTNAME || process.env.RDS_HOST,
  port: parseInt(process.env.RDS_PORT || '5432'),
  database: process.env.RDS_DATABASE || 'postgres',
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  ssl: process.env.RDS_SSL === 'true' ? {
    rejectUnauthorized: false, // For RDS, use proper certificate in production
  } : undefined,
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum number of clients in the pool
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'), // Close idle clients after 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '30000'), // Return an error after 30 seconds if connection could not be established
};

// Validate required environment variables
if (!poolConfig.host || !poolConfig.user || !poolConfig.password) {
  console.warn('⚠️  Missing RDS database configuration. Set RDS_HOSTNAME, RDS_USERNAME, and RDS_PASSWORD');
}

// Create connection pool
export const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

/**
 * Execute a database query
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns Query result
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: result.rowCount });
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', { text, params, error });
    throw error;
  }
}

/**
 * Execute a query and return a single row
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns Single row or null
 */
export async function queryOne<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const result = await pool.query<T>(text, params);
  return result.rows[0] || null;
}

/**
 * Execute a query and return all rows
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns Array of rows
 */
export async function queryMany<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

/**
 * Execute a transaction
 * @param callback - Function that receives a client and returns a promise
 * @returns Result of the callback
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// Export pool for advanced usage
export { pool as default };

