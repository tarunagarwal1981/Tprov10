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
async function invokeLambda(action: string, query?: string, params?: any[]): Promise<any> {
  // In server-side environment (Amplify/Lambda), use AWS SDK
  // Check for AWS execution environment OR if we're in a server context (not browser)
  const isServerSide = typeof window === 'undefined';
  const isAWSEnv = process.env.AWS_EXECUTION_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AMPLIFY_ENV;
  
  if (isServerSide && (isAWSEnv || LAMBDA_FUNCTION_NAME)) {
    const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
    
    const client = new LambdaClient({ region: AWS_REGION });
    
    const payload = {
      action,
      query,
      params,
    };
    
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
      throw new Error(errorBody.message || errorBody.error || 'Lambda invocation failed');
    }
    
    const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    return body;
  }
  
  // For local development, fall back to direct database connection
  // (This won't work if RDS is in private subnet, but allows local testing)
  throw new Error('Database Lambda not available. Use direct connection for local development.');
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

