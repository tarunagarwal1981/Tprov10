import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/aws/cognito';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/auth/login
 * Sign in with email and password
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Cognito is configured
    if (!process.env.COGNITO_CLIENT_ID || !process.env.COGNITO_USER_POOL_ID) {
      console.error('❌ Cognito not configured:', {
        hasClientId: !!process.env.COGNITO_CLIENT_ID,
        hasUserPoolId: !!process.env.COGNITO_USER_POOL_ID,
      });
      return NextResponse.json(
        { 
          error: 'Authentication service not configured',
          message: 'Cognito environment variables are missing. Please contact the administrator.',
          details: 'COGNITO_CLIENT_ID and COGNITO_USER_POOL_ID must be set in environment variables.'
        },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const authResult = await signIn(email, password);
    
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

