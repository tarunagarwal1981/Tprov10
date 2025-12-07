import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { userId } = body;
    const { email, accessToken } = body;

    // Support both old (Supabase) and new (Cognito) formats
    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Missing userId or email' },
        { status: 400 }
      );
    }

    // If accessToken provided, verify with Cognito (optional - for security)
    // Also support phone OTP sessions
    if (accessToken) {
      try {
        const { getUser } = await import('@/lib/aws/cognito');
        await getUser(accessToken);
        // Token is valid, proceed with database query
      } catch (error) {
        console.error('Cognito token verification failed:', error);
        // Check if it's a phone OTP session (base64 encoded JSON)
        try {
          const sessionData = JSON.parse(atob(accessToken));
          if (sessionData.authMethod === 'phone_otp' && sessionData.userId) {
            // Valid phone OTP session, use userId from session
            if (!userId && sessionData.userId) {
              userId = sessionData.userId;
            }
          }
        } catch (e) {
          // Not a phone OTP session, continue with original userId/email
        }
        // Continue anyway - token verification is optional for profile lookup
      }
    }

    // Fetch user profile from RDS database (server-side)
    console.log('📡 [SERVER] Fetching user profile for:', userId || email);
    console.log('📡 [SERVER] DATABASE_LAMBDA_NAME:', process.env.DATABASE_LAMBDA_NAME || 'NOT SET');
    
    try {
      // Use Lambda database service for reliable VPC access
      console.log('📡 [SERVER] Importing Lambda database client...');
      const { queryOne } = await import('@/lib/aws/lambda-database');
      console.log('📡 [SERVER] Lambda database client imported, calling queryOne...');
      
      const profile = await queryOne<{
        id: string;
        email: string;
        name: string;
        role: string;
        phone?: string;
        profile?: any;
        profile_completion_percentage?: number;
        onboarding_completed?: boolean;
        created_at: Date;
        updated_at: Date;
      }>('SELECT id, email, name, role, phone, profile, profile_completion_percentage, onboarding_completed, created_at, updated_at FROM users WHERE id = $1 OR email = $2 LIMIT 1', [userId || '', email || '']);

      if (!profile) {
        console.error('❌ [SERVER] No profile found for user:', userId || email);
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        );
      }

      console.log('✅ [SERVER] Profile fetched successfully:', profile.email);
      return NextResponse.json({ profile });
    } catch (dbError: any) {
      // Log full database error for debugging in CloudWatch
      console.error('❌ [SERVER] Database error while loading user profile:', {
        code: dbError?.code,
        name: dbError?.name,
        message: dbError?.message,
        stack: dbError?.stack,
      });

      // Handle database connection errors (common if RDS network/Security Group/VPC is misconfigured)
      if (
        dbError.code === 'ETIMEDOUT' ||
        dbError.message?.includes('timeout') ||
        dbError.message?.includes('Connection terminated')
      ) {
        console.warn('⚠️  [SERVER] Database connection timeout / network issue');
        
        return NextResponse.json(
          { 
            error: 'Database unavailable',
            message: 'Failed to connect to RDS database (timeout or network issue).',
            dbError: {
              code: dbError.code,
              name: dbError.name,
              message: dbError.message,
            }
          },
          { status: 503 } // Service Unavailable
        );
      }
      
      // Other database errors – surface details to help debugging in dev
      return NextResponse.json(
        {
          error: 'Database query failed',
          dbError: {
            code: dbError.code,
            name: dbError.name,
            message: dbError.message,
          },
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [SERVER] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

