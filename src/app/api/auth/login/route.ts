import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Import signIn inside the function to avoid module-level errors
// This prevents import-time errors from causing HTML error pages

/**
 * POST /api/auth/login
 * Sign in with email and password
 */
export async function POST(request: NextRequest) {
  // Ensure we always return JSON, even for unexpected errors
  try {
    // Check if Cognito is configured
    const clientId = process.env.COGNITO_CLIENT_ID;
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    
    // Log all environment variables for debugging (in production too, since this is critical)
    console.log('🔍 Environment check:', {
      hasClientId: !!clientId,
      hasUserPoolId: !!userPoolId,
      clientIdLength: clientId?.length || 0,
      userPoolIdLength: userPoolId?.length || 0,
      allCognitoKeys: Object.keys(process.env).filter(k => k.includes('COGNITO')),
      deploymentRegion: process.env.DEPLOYMENT_REGION,
      nodeEnv: process.env.NODE_ENV,
    });
    
    if (!clientId || !userPoolId) {
      const errorDetails = {
        hasClientId: !!clientId,
        hasUserPoolId: !!userPoolId,
        clientIdValue: clientId ? 'SET' : 'MISSING',
        userPoolIdValue: userPoolId ? 'SET' : 'MISSING',
        allEnvKeys: Object.keys(process.env).filter(k => k.includes('COGNITO')),
        deploymentRegion: process.env.DEPLOYMENT_REGION || 'NOT SET',
        // Include all env var keys for debugging
        allEnvVarKeys: Object.keys(process.env).sort(),
      };
      
      console.error('❌ Cognito not configured:', JSON.stringify(errorDetails, null, 2));
      
      return NextResponse.json(
        { 
          error: 'Authentication service not configured',
          message: 'Cognito environment variables are missing. Please contact the administrator.',
          details: 'COGNITO_CLIENT_ID and COGNITO_USER_POOL_ID must be set in environment variables.',
          debug: errorDetails, // Always include debug info to help diagnose
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
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

    // Check user's auth_method in database first
    console.log('🔍 Checking user auth_method in database...');
    const user = await queryOne<{ auth_method: string | null }>(
      `SELECT auth_method FROM users WHERE email = $1`,
      [email]
    );
    
    // Store user for error handling
    let dbUser = user;

    if (user) {
      console.log('   User found, auth_method:', user.auth_method);
      
      // If user registered with phone OTP, they can't use email/password login
      if (user.auth_method === 'phone_otp') {
        console.log('❌ User registered with phone OTP, cannot use email/password login');
        return NextResponse.json(
          { 
            error: 'Invalid authentication method',
            message: 'This account was registered with phone number. Please use phone number login instead.',
            authMethod: 'phone_otp',
          },
          { status: 400 }
        );
      }
    } else {
      console.log('   User not found in database, proceeding with Cognito authentication');
    }

    console.log('🔐 Calling signIn...');
    // Import signIn dynamically to avoid module-level errors
    const { signIn, getUserByUsername } = await import('@/lib/aws/cognito');
    
    // Check if user exists in Cognito and their status
    try {
      const cognitoUser = await getUserByUsername(email);
      console.log('   Cognito user status:', cognitoUser.userStatus);
      console.log('   Cognito user enabled:', cognitoUser.enabled);
      
      // If user is not confirmed, they need to verify email first
      if (cognitoUser.userStatus === 'UNCONFIRMED') {
        return NextResponse.json(
          { 
            error: 'Email not verified',
            message: 'Please verify your email address before logging in. Check your inbox for the verification code.',
            requiresConfirmation: true,
          },
          { status: 403 }
        );
      }
    } catch (cognitoCheckError: any) {
      // If user doesn't exist in Cognito, that's also an error
      if (cognitoCheckError.name === 'UserNotFoundException') {
        console.log('❌ User not found in Cognito');
        return NextResponse.json(
          { 
            error: 'User not found',
            message: 'No account found with this email address. Please register first.',
          },
          { status: 404 }
        );
      }
      // Otherwise, continue with signIn attempt
      console.log('   Could not check Cognito user status, proceeding with signIn:', cognitoCheckError.message);
    }
    
    const authResult = await signIn(email, password);
    console.log('✅ SignIn successful');
    
    return NextResponse.json({ 
      accessToken: authResult.accessToken,
      idToken: authResult.idToken,
      refreshToken: authResult.refreshToken,
      expiresIn: authResult.expiresIn,
    });
    } catch (error: any) {
    console.error('❌ Login error:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    
    // If password is wrong and user has email_password auth_method, 
    // check if they might have been created via phone OTP
    if (error?.name === 'NotAuthorizedException' && dbUser?.auth_method === 'email_password') {
      console.log('⚠️  Password incorrect for email_password user - checking if user might have been created via phone OTP...');
      
      // Try to get Cognito user to check their custom attributes
      try {
        const { getUserByUsername } = await import('@/lib/aws/cognito');
        const cognitoUser = await getUserByUsername(email);
        const authMethod = cognitoUser.attributes['custom:auth_method'];
        
        if (authMethod === 'phone_otp') {
          console.log('❌ Mismatch detected: Database says email_password but Cognito says phone_otp');
          return NextResponse.json(
            { 
              error: 'Invalid authentication method',
              message: 'This account was registered with phone number. Please use phone number login instead.',
              authMethod: 'phone_otp',
              details: 'Database and Cognito auth_method mismatch detected',
            },
            { status: 400 }
          );
        }
      } catch (checkError) {
        // If we can't check, just proceed with normal error
        console.log('   Could not verify Cognito auth_method:', checkError);
      }
    }
    
    // Ensure we always return JSON, not HTML
    const errorResponse = {
      error: error?.name || 'Login failed',
      message: error?.message || 'Unknown error occurred',
      details: error?.toString() || 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && { stack: error?.stack }),
    };
    
    // Determine status code based on error type
    let statusCode = 500; // Default to 500 for server errors
    if (error?.name === 'NotAuthorizedException') {
      statusCode = 401;
    } else if (error?.name === 'UserNotFoundException') {
      statusCode = 404;
    } else if (error?.name === 'InvalidParameterException') {
      statusCode = 400;
    } else if (error?.message?.includes('not configured') || error?.message?.includes('Missing')) {
      statusCode = 500;
    }
    
    return NextResponse.json(
      errorResponse, 
      { 
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

