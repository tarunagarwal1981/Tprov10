/**
 * Lambda Database Client
 * 
 * Calls the dedicated database Lambda function instead of connecting directly.
 * This is more robust because the Lambda runs in the same VPC as RDS.
 */

const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';
const AWS_REGION = process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1';

/**
 * Invoke the database Lambda function
 */
async function invokeLambda(
  action: string, 
  query?: string, 
  params?: any[], 
  transactionQueries?: Array<{ query: string; params?: any[] }>
): Promise<any> {
  // In server-side environment (Amplify/Lambda), use AWS SDK
  // Check for AWS execution environment OR if we're in a server context (not browser)
  const isServerSide = typeof window === 'undefined';
  
  // In Amplify, we should always try to use Lambda if we're server-side
  // Amplify API routes run in Lambda, so we can use the SDK
  if (!isServerSide) {
    throw new Error('Lambda client can only be used server-side');
  }
  
  try {
    const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
    
    // Log environment info for debugging
    console.log(`[Lambda Client] Environment check:`, {
      AWS_EXECUTION_ENV: process.env.AWS_EXECUTION_ENV,
      AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET',
      AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN ? 'SET' : 'NOT SET',
    });
    
    // For local development, use explicit credentials from environment variables
    // For production (Amplify/Lambda), use default provider chain (execution role)
    const isLocalDev = !process.env.AWS_EXECUTION_ENV && !process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    const clientConfig: any = {
      region: AWS_REGION,
    };
    
    // In local development, use environment variables if available
    // The SDK will automatically pick up AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from env
    if (isLocalDev && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN }),
      };
      console.log('[Lambda Client] Using credentials from environment variables (local dev)');
    } else if (isLocalDev) {
      console.warn('[Lambda Client] ⚠️  No AWS credentials found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local for local development');
    }
    
    const client = new LambdaClient(clientConfig);
    
    console.log(`[Lambda Client] Lambda client created for region: ${AWS_REGION}`);
    
    const payload: any = {
      action,
      query,
      params,
    };
    
    // Add transaction queries if provided
    if (transactionQueries) {
      payload.transactionQueries = transactionQueries;
    }
    
    console.log(`[Lambda Client] Invoking ${LAMBDA_FUNCTION_NAME} with action: ${action}`);
    console.log(`[Lambda Client] Region: ${AWS_REGION}`);
    
    const command = new InvokeCommand({
      FunctionName: LAMBDA_FUNCTION_NAME,
      Payload: JSON.stringify(payload),
    });
    
    const response = await client.send(command);
    
    if (!response.Payload) {
      throw new Error('Lambda returned no payload');
    }
    
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    if (result.statusCode !== 200) {
      const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      console.error(`[Lambda Client] Lambda returned error:`, {
        statusCode: result.statusCode,
        errorBody,
        fullResult: result,
      });
      
      // Create an error object that preserves the original error details
      const error = new Error(errorBody.message || errorBody.error || 'Lambda invocation failed');
      (error as any).code = errorBody.code;
      (error as any).originalError = errorBody;
      throw error;
    }
    
    const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    console.log(`[Lambda Client] Lambda invocation successful for action: ${action}`);
    return body;
  } catch (error: any) {
    console.error(`[Lambda Client] Error invoking Lambda:`, error);
    
    // If it's a permission error, provide helpful message
    if (error.name === 'AccessDeniedException' || error.message?.includes('AccessDenied')) {
      throw new Error(`Lambda invoke permission denied. Please grant Amplify service role permission to invoke ${LAMBDA_FUNCTION_NAME}`);
    }
    
    // If Lambda not found
    if (error.name === 'ResourceNotFoundException') {
      throw new Error(`Lambda function ${LAMBDA_FUNCTION_NAME} not found. Please check DATABASE_LAMBDA_NAME environment variable.`);
    }
    
    throw error;
  }
}

/**
 * Execute a database query
 */
export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const result = await invokeLambda('query', text, params);
  return {
    rows: result.rows || [],
    rowCount: result.rowCount || 0,
  };
}

/**
 * Execute a query and return a single row
 */
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const result = await invokeLambda('queryOne', text, params);
  return result.row || null;
}

/**
 * Execute a query and return all rows
 */
export async function queryMany<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await invokeLambda('queryMany', text, params);
  return result.rows || [];
}

/**
 * Execute a transaction
 * @param callback - Function that receives a mock client and returns a promise
 * @returns Result of the callback
 * 
 * Note: The client passed to callback is a mock that collects queries.
 * All queries are executed in a single Lambda transaction call.
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  // Collect queries from the callback
  const queries: Array<{ query: string; params?: any[] }> = [];
  
  // Mock client that collects queries instead of executing them
  const mockClient = {
    query: async (text: string, params?: any[]) => {
      queries.push({ query: text, params });
      // Return a mock result structure
      return {
        rows: [],
        rowCount: 0,
      };
    },
  };
  
  // Execute callback to collect queries
  const callbackResult = await callback(mockClient);
  
  // Execute all queries in a transaction via Lambda
  if (queries.length > 0) {
    const result = await invokeLambda('transaction', undefined, undefined, queries);
    // Return the callback result (not the transaction result)
    return callbackResult;
  }
  
  return callbackResult;
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await invokeLambda('test');
    return result.success === true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

