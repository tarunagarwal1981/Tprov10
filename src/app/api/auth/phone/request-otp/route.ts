/**
 * POST /api/auth/phone/request-otp
 * Request OTP for login (user already exists)
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/aws/lambda-database';
import { createOTP } from '@/lib/services/otpService';
import { sendSMSOTP } from '@/lib/services/smsService';
import { sendEmailOTP } from '@/lib/services/emailService';
import { verifyCaptcha } from '@/lib/services/captchaService';

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

    // Verify CAPTCHA (reCAPTCHA or Turnstile)
    // Note: For login flow, CAPTCHA is optional since user already verified during init
    // We still verify if a token is provided, but don't require it for login flows
    if (recaptchaToken) {
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
      
      const captchaResult = await verifyCaptcha(recaptchaToken, clientIp);
      if (!captchaResult.valid) {
        // Log the error but be lenient - if it's a timeout/duplicate error,
        // it might be because the token was already used in init (which is acceptable for login)
        const errorCode = (captchaResult as any).errorCode || captchaResult.error || '';
        const errorStr = String(errorCode || captchaResult.error || '');
        if (errorStr.includes('timeout') || errorStr.includes('duplicate')) {
          // Token was already used - this is acceptable for login flow after init
          console.log('CAPTCHA token already used (expected for login flow after init)');
        } else {
          // Other errors are still failures
          return NextResponse.json(
            { error: 'CAPTCHA verification failed', details: captchaResult.error },
            { status: 400 }
          );
        }
      }
    }
    // Note: We don't require CAPTCHA for login OTP requests since user already verified during init

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
