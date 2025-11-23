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
    return NextResponse.json(
      { 
        error: error.name || 'Login failed', 
        message: error.message || 'Unknown error',
        details: error.toString()
      },
      { status: 400 }
    );
  }
}

