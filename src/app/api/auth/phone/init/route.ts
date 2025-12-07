/**
 * POST /api/auth/phone/init
 * Initialize phone authentication flow
 * Checks if phone exists and returns the appropriate mode (login or signup)
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/aws/database';
import { verifyRecaptcha } from '@/lib/services/recaptchaService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { countryCode, phoneNumber, recaptchaToken } = body;

    console.log('📥 Received phone init request');
    console.log('   Country code:', countryCode);
    console.log('   Phone number:', phoneNumber ? phoneNumber.substring(0, 3) + '***' : 'missing');
    console.log('   Has reCAPTCHA token:', !!recaptchaToken);
    console.log('   Token length:', recaptchaToken?.length || 0);
    console.log('   Token prefix:', recaptchaToken?.substring(0, 20) + '...' || 'none');
    console.log('   Has secret key:', !!process.env.RECAPTCHA_SECRET_KEY);
    console.log('   Secret key length:', process.env.RECAPTCHA_SECRET_KEY?.length || 0);
    console.log('   Secret key prefix:', process.env.RECAPTCHA_SECRET_KEY ? process.env.RECAPTCHA_SECRET_KEY.substring(0, 10) + '...' : 'not set');

    if (!countryCode || !phoneNumber) {
      console.error('❌ Missing required fields:', { countryCode, phoneNumber });
      return NextResponse.json(
        { error: 'Country code and phone number are required' },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA
    if (recaptchaToken) {
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
      
      console.log('🔍 Verifying reCAPTCHA token...');
      console.log('   Token length:', recaptchaToken.length);
      console.log('   Token prefix:', recaptchaToken.substring(0, 20) + '...');
      console.log('   Has secret key:', !!process.env.RECAPTCHA_SECRET_KEY);
      
      const recaptchaResult = await verifyRecaptcha(recaptchaToken, clientIp);
      if (!recaptchaResult.valid) {
        console.error('❌ reCAPTCHA verification failed');
        console.error('   Error:', recaptchaResult.error);
        console.error('   Score:', recaptchaResult.score || 'N/A');
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed', details: recaptchaResult.error },
          { status: 400 }
        );
      }
      console.log('✅ reCAPTCHA verification passed');
      console.log('   Score:', recaptchaResult.score || 'N/A (v2)');
    } else if (process.env.NODE_ENV === 'production') {
      // Require reCAPTCHA in production
      return NextResponse.json(
        { error: 'reCAPTCHA token is required' },
        { status: 400 }
      );
    }

    // Check if user exists with this phone number
    const user = await queryOne<{
      id: string;
      email: string;
      name: string;
      phone_verified: boolean;
      auth_method: string;
    }>(
      `SELECT id, email, name, phone_verified, auth_method 
       FROM users 
       WHERE country_code = $1 AND phone_number = $2`,
      [countryCode, phoneNumber]
    );

    if (user) {
      // User exists - login flow
      return NextResponse.json({
        mode: 'login',
        userExists: true,
        email: user.email ? `${user.email.slice(0, 3)}***@${user.email.split('@')[1]}` : null, // Masked email
        phoneVerified: user.phone_verified,
      });
    } else {
      // User doesn't exist - signup flow
      return NextResponse.json({
        mode: 'signup',
        userExists: false,
      });
    }
  } catch (error: any) {
    console.error('Phone init error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initialize phone authentication',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
