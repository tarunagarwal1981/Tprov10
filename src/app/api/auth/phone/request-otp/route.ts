/**
 * POST /api/auth/phone/request-otp
 * Request OTP for login (user already exists)
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/aws/lambda-database';
import { createOTP } from '@/lib/services/otpService';
import { sendSMSOTP } from '@/lib/services/smsService';
import { sendEmailOTP } from '@/lib/services/emailService';
import { verifyRecaptcha } from '@/lib/services/recaptchaService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { countryCode, phoneNumber, recaptchaToken } = await request.json();

    if (!countryCode || !phoneNumber) {
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

    // Verify user exists
    const user = await queryOne<{ id: string; email: string; phone_verified: boolean }>(
      `SELECT id, email, phone_verified 
       FROM users 
       WHERE country_code = $1 AND phone_number = $2`,
      [countryCode, phoneNumber]
    );

    if (!user) {
      // Don't reveal that user doesn't exist (security best practice)
      return NextResponse.json(
        { 
          success: true, 
          message: 'If this phone number is registered, an OTP has been sent.',
          // In reality, we don't send OTP, but we don't tell the user that
        },
        { status: 200 }
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
      email: user.email, // Send to registered email too
      purpose: 'login',
      ipAddress: clientIp,
      userAgent,
    });

    // Send OTP via SMS and Email
    const [smsResult, emailResult] = await Promise.all([
      sendSMSOTP(phoneNumber, countryCode, otpResult.code),
      sendEmailOTP(user.email, otpResult.code, 'login'),
    ]);

    // Log results
    if (!smsResult.success) {
      console.warn('Failed to send SMS OTP:', smsResult.error);
    }
    if (!emailResult.success) {
      console.warn('Failed to send Email OTP:', emailResult.error);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      otpSentTo: {
        phone: smsResult.success,
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
    console.error('Request OTP error:', error);
    
    // Handle rate limiting errors
    if (error.message?.includes('Rate limit')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to send OTP',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
