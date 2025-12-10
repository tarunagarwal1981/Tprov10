import { NextRequest, NextResponse } from 'next/server';
import { verifyRecaptcha } from '@/lib/services/recaptchaService';
import { getLatestOTP, createOTP } from '@/lib/services/otpService';
import { sendSMS } from '@/lib/services/smsService';
import { sendEmailOTP } from '@/lib/services/emailService';
import { queryOne } from '@/lib/aws/lambda-database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/phone/resend-otp
 * 
 * Resend OTP code (if previous one expired or not received)
 */
export async function POST(request: NextRequest) {
  try {
    const { country_code, phone_number, purpose, recaptcha_token } = await request.json();
    
    // Validate input
    if (!country_code || !phone_number) {
      return NextResponse.json(
        { error: 'Country code and phone number are required' },
        { status: 400 }
      );
    }
    
    const authPurpose = (purpose || 'login') as 'login' | 'signup' | 'verify_phone' | 'verify_email';
    
    // Verify reCAPTCHA (optional but recommended)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    if (recaptcha_token) {
      const recaptchaResult = await verifyRecaptcha(recaptcha_token, clientIp);
      if (!recaptchaResult.valid) {
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed', message: recaptchaResult.error || 'Invalid reCAPTCHA' },
          { status: 400 }
        );
      }
    }
    
    // Get user email if exists
    let email: string | undefined;
    if (authPurpose === 'login') {
      const user = await queryOne<{ email: string }>(
        `SELECT email FROM users 
         WHERE country_code = $1 AND phone_number = $2`,
        [country_code, phone_number]
      );
      email = user?.email;
    }
    
    // Check if there's a recent OTP (within last 1 minute)
    const latestOTP = await getLatestOTP(country_code, phone_number, authPurpose);
    if (latestOTP && new Date(latestOTP.created_at).getTime() > Date.now() - 60000) {
      return NextResponse.json(
        { 
          error: 'Please wait before requesting a new OTP',
          message: 'You can request a new OTP after 1 minute'
        },
        { status: 429 }
      );
    }
    
    // Create new OTP
    const otpResult = await createOTP({
      countryCode: country_code,
      phoneNumber: phone_number,
      purpose: authPurpose,
      email,
      ipAddress: clientIp,
      userAgent,
    });
    
    // Send OTP via SMS and Email
    const smsResult = await sendSMS(country_code, phone_number, otpResult.code);
    const emailResult = email ? await sendEmailOTP(email, otpResult.code, authPurpose) : { success: false };
    
    if (!smsResult.success && !emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'OTP resent to your phone and email',
      // In development, return OTP for testing (remove in production)
      ...(process.env.NODE_ENV === 'development' && {
        otp_code: otpResult.code,
        warning: 'OTP returned in development mode only'
      })
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to resend OTP',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

