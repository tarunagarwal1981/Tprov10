import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { userId, email, accessToken } = await request.json();

    // Support both old (Supabase) and new (Cognito) formats
    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Missing userId or email' },
        { status: 400 }
      );
    }

    // If accessToken provided, verify with Cognito (optional - for security)
    if (accessToken) {
      try {
        const { getUser } = await import('@/lib/aws/cognito');
        await getUser(accessToken);
        // Token is valid, proceed with database query
      } catch (error) {
        console.error('Cognito token verification failed:', error);
        // Continue anyway - token verification is optional for profile lookup
      }
    }

    // Fetch user profile from RDS database (server-side)
    console.log('📡 [SERVER] Fetching user profile for:', userId || email);
    
    try {
      const { queryOne } = await import('@/lib/aws/database');
      
      const profile = await queryOne<{
        id: string;
        email: string;
        name: string;
        role: string;
        phone?: string;
        profile?: any;
        created_at: Date;
        updated_at: Date;
      }>('SELECT * FROM users WHERE id = $1 OR email = $2 LIMIT 1', [userId || '', email || '']);

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
      // Handle database connection errors (common in local development when RDS is in private subnet)
      if (dbError.code === 'ETIMEDOUT' || dbError.message?.includes('timeout') || dbError.message?.includes('Connection terminated')) {
        console.warn('⚠️  [SERVER] Database connection timeout - RDS may be in private subnet');
        console.warn('   This is expected in local development. Using Cognito user info as fallback.');
        
        // Fallback: Use Cognito user info if database is unavailable
        if (accessToken && email) {
          try {
            const { getUser } = await import('@/lib/aws/cognito');
            const cognitoUser = await getUser(accessToken);
            
            // Extract user attributes
            const userSub = cognitoUser.attributes['sub'] || cognitoUser.username || userId || '';
            const userName = cognitoUser.attributes['name'] || email.split('@')[0] || 'User';
            const userRole = cognitoUser.attributes['custom:role'] || 'agent';
            const userPhone = cognitoUser.attributes['phone_number'];
            
            // Return a minimal profile from Cognito
            return NextResponse.json({
              profile: {
                id: userId || userSub,
                email: email,
                name: userName,
                role: userRole,
                phone: userPhone,
                profile: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            });
          } catch (cognitoError) {
            console.error('❌ [SERVER] Cognito fallback also failed:', cognitoError);
          }
        }
        
        // If no fallback available, return error but with helpful message
        return NextResponse.json(
          { 
            error: 'Database unavailable',
            message: 'RDS database is not accessible from local development. This is expected if RDS is in a private subnet.',
            details: 'For local development, ensure RDS is publicly accessible or use a VPN/bastion host.',
            fallback: 'Try deploying to Amplify where VPC access is available.'
          },
          { status: 503 } // Service Unavailable
        );
      }
      
      // Re-throw other database errors
      throw dbError;
    }

  } catch (error) {
    console.error('❌ [SERVER] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

