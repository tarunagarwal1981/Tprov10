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
  
  // In Amplify, we should always try to use Lambda if we're server-side
  // Amplify API routes run in Lambda, so we can use the SDK
  if (!isServerSide) {
    throw new Error('Lambda client can only be used server-side');
  }
  
  try {
    const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
    
    // In Amplify/Lambda environments, the SDK automatically uses the execution role's credentials
    // Don't specify credentials explicitly - let the SDK use the default provider chain
    const client = new LambdaClient({ 
      region: AWS_REGION,
      // credentials will be automatically provided by the execution role
    });
    
    const payload = {
      action,
      query,
      params,
    };
    
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
      console.error(`[Lambda Client] Lambda returned error:`, errorBody);
      throw new Error(errorBody.message || errorBody.error || 'Lambda invocation failed');
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

