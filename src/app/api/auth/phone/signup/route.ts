/**
 * POST /api/auth/phone/signup
 * Create new user account with phone number and send OTP
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/aws/lambda-database';
import { createOTP } from '@/lib/services/otpService';
import { sendSMSOTP } from '@/lib/services/smsService';
import { sendEmailOTP } from '@/lib/services/emailService';
import { verifyCaptcha } from '@/lib/services/captchaService';
import { signUp } from '@/lib/aws/cognito';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const {
      countryCode,
      phoneNumber,
      email,
      name,
      companyName,
      recaptchaToken,
    } = await request.json();

    // Validation
    if (!countryCode || !phoneNumber || !email || !name) {
      return NextResponse.json(
        { error: 'Country code, phone number, email, and name are required' },
        { status: 400 }
      );
    }

    // Verify email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA
    if (recaptchaToken) {
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
      
      const recaptchaResult = await verifyRecaptcha(recaptchaToken, clientIp);
      if (!recaptchaResult.valid) {
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed', details: recaptchaResult.error },
          { status: 400 }
        );
      }
    } else if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'reCAPTCHA token is required' },
        { status: 400 }
      );
    }

    // Check if phone number already exists
    const existingPhoneUser = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE country_code = $1 AND phone_number = $2`,
      [countryCode, phoneNumber]
    );

    if (existingPhoneUser) {
      return NextResponse.json(
        { error: 'Phone number already registered. Please login instead.' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingEmailUser = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (existingEmailUser) {
      return NextResponse.json(
        { error: 'Email already registered. Please login instead.' },
        { status: 409 }
      );
    }

    // Create OTP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const otpResult = await createOTP({
      phoneNumber,
      countryCode,
      email,
      purpose: 'signup',
      ipAddress: clientIp,
      userAgent,
    });

    // Send OTP via SMS and Email
    const [smsResult, emailResult] = await Promise.all([
      sendSMSOTP(phoneNumber, countryCode, otpResult.code),
      sendEmailOTP(email, otpResult.code, 'signup'),
    ]);

    // Log results (don't fail if SMS/Email fails - OTP is still created)
    if (!smsResult.success) {
      console.warn('Failed to send SMS OTP:', smsResult.error);
    }
    if (!emailResult.success) {
      console.warn('Failed to send Email OTP:', emailResult.error);
    }

    // Store temporary user data (we'll create the actual user after OTP verification)
    // For now, we'll just return success - user creation happens in verify-otp
    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      otpSentTo: {
        phone: true,
        email: emailResult.success,
      },
      expiresAt: otpResult.expiresAt,
      // In development, return OTP for testing (remove in production!)
      ...(process.env.NODE_ENV === 'development' && { 
        debugOtp: otpResult.code,
        warning: 'OTP exposed in development mode only',
      }),
    });
  } catch (error: any) {
    console.error('Phone signup error:', error);
    
    // Handle rate limiting errors
    if (error.message?.includes('Rate limit')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create account',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
