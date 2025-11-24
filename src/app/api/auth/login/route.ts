import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/aws/cognito';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/auth/login
 * Sign in with email and password
 */
export async function POST(request: NextRequest) {
  // Wrap everything in try-catch to ensure we always return JSON
  try {
    // Check if Cognito is configured
    if (!process.env.COGNITO_CLIENT_ID || !process.env.COGNITO_USER_POOL_ID) {
      const errorDetails = {
        hasClientId: !!process.env.COGNITO_CLIENT_ID,
        hasUserPoolId: !!process.env.COGNITO_USER_POOL_ID,
        clientIdValue: process.env.COGNITO_CLIENT_ID ? 'SET' : 'MISSING',
        userPoolIdValue: process.env.COGNITO_USER_POOL_ID ? 'SET' : 'MISSING',
        allEnvKeys: Object.keys(process.env).filter(k => k.includes('COGNITO')),
        deploymentRegion: process.env.DEPLOYMENT_REGION || 'NOT SET',
      };
      
      console.error('❌ Cognito not configured:', JSON.stringify(errorDetails, null, 2));
      
      return NextResponse.json(
        { 
          error: 'Authentication service not configured',
          message: 'Cognito environment variables are missing. Please contact the administrator.',
          details: 'COGNITO_CLIENT_ID and COGNITO_USER_POOL_ID must be set in environment variables.',
          debug: errorDetails,
        },
        { status: 500 }
      );
    }

    // Parse request body
    let email: string;
    let password: string;
    
    try {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }
    
    console.log('🔐 Login attempt:', { email, hasPassword: !!password });

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('🔐 Calling signIn...');
    const authResult = await signIn(email, password);
    console.log('✅ SignIn successful');
    
    return NextResponse.json({ 
      accessToken: authResult.accessToken,
      idToken: authResult.idToken,
      refreshToken: authResult.refreshToken,
      expiresIn: authResult.expiresIn,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Ensure we always return JSON, not HTML
    const errorResponse = {
      error: error.name || 'Login failed',
      message: error.message || 'Unknown error',
      details: error.toString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
    
    // Determine status code based on error type
    let statusCode = 400;
    if (error.name === 'NotAuthorizedException') {
      statusCode = 401;
    } else if (error.name === 'UserNotFoundException') {
      statusCode = 404;
    } else if (error.message?.includes('not configured')) {
      statusCode = 500;
    }
    
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

