import { NextRequest, NextResponse } from 'next/server';
import { signUp } from '@/lib/aws/cognito';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, role, profile } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    const result = await signUp(email, password, {
      name,
      phone,
      role,
      ...profile,
    });
    
    return NextResponse.json({ 
      userId: result.userId,
      email: result.email,
      requiresConfirmation: result.requiresConfirmation,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        error: error.name || 'Registration failed', 
        message: error.message || 'Unknown error',
        details: error.toString()
      },
      { status: 400 }
    );
  }
}

