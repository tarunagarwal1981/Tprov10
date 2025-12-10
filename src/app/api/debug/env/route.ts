import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Debug endpoint to check environment variables
 * DELETE THIS AFTER DEBUGGING - DO NOT DEPLOY TO PRODUCTION
 */
export async function GET(request: NextRequest) {
  // Check all Cognito-related env vars
  const envCheck = {
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID ? 'SET' : 'MISSING',
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID ? 'SET' : 'MISSING',
    DEPLOYMENT_REGION: process.env.DEPLOYMENT_REGION ? 'SET' : 'MISSING',
    REGION: process.env.REGION ? 'SET' : 'MISSING',
    // Show first few chars for verification (not full value for security)
    COGNITO_CLIENT_ID_VALUE: process.env.COGNITO_CLIENT_ID 
      ? `${process.env.COGNITO_CLIENT_ID.substring(0, 5)}...` 
      : 'NOT SET',
    COGNITO_USER_POOL_ID_VALUE: process.env.COGNITO_USER_POOL_ID 
      ? `${process.env.COGNITO_USER_POOL_ID.substring(0, 10)}...` 
      : 'NOT SET',
    // List all env vars that contain COGNITO
    allCognitoVars: Object.keys(process.env)
      .filter(k => k.includes('COGNITO'))
      .map(k => ({ key: k, set: !!process.env[k], value: process.env[k] ? `${process.env[k].substring(0, 20)}...` : 'NOT SET' })),
    // List all env vars that contain RDS
    allRdsVars: Object.keys(process.env)
      .filter(k => k.includes('RDS'))
      .map(k => ({ key: k, set: !!process.env[k], value: process.env[k] ? `${process.env[k].substring(0, 20)}...` : 'NOT SET' })),
  };

  return NextResponse.json({
    message: 'Environment variable check',
    ...envCheck,
    timestamp: new Date().toISOString(),
  });
}

