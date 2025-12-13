/**
 * SMS Service - Twilio Implementation
 * Handles SMS OTP delivery via Twilio (Alternative to AWS SNS)
 * 
 * Benefits:
 * - No approval needed (works immediately)
 * - Easy setup (just API keys)
 * - Reliable delivery
 * - Better error messages
 */

import twilio from 'twilio';

// Initialize Twilio client
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
  }

  return twilio(accountSid, authToken);
};

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'Travselbuy'; // Max 11 chars

/**
 * Send OTP via SMS using Twilio
 */
export async function sendSMSOTP(
  phoneNumber: string,
  countryCode: string,
  otpCode: string
): Promise<{ messageId?: string; success: boolean; error?: string }> {
  try {
    // Format phone number with country code
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    // OTP message template
    const message = `Your verification code is ${otpCode}. Valid for 10 minutes. Do not share this code with anyone. - ${SMS_SENDER_ID}`;

    // Validate Twilio phone number is set
    if (!TWILIO_PHONE_NUMBER) {
      throw new Error('TWILIO_PHONE_NUMBER environment variable is not set');
    }

    // Get Twilio client
    const client = getTwilioClient();

    // Send SMS via Twilio
    const response = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: fullPhoneNumber,
    });

    console.log('✅ Twilio SMS sent successfully:', {
      messageId: response.sid,
      to: fullPhoneNumber,
      status: response.status,
    });

    return {
      success: true,
      messageId: response.sid,
    };
  } catch (error: any) {
    console.error('❌ Twilio SMS sending error:', {
      error: error.message,
      code: error.code,
      status: error.status,
      phoneNumber: `${countryCode}${phoneNumber}`,
    });

    // Provide user-friendly error messages
    let errorMessage = 'Failed to send SMS';
    
    if (error.code === 21211) {
      errorMessage = 'Invalid phone number format';
    } else if (error.code === 21608) {
      errorMessage = 'Unverified phone number (trial account restriction)';
    } else if (error.code === 21614) {
      errorMessage = 'Invalid "To" phone number';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send SMS with custom message
 */
export async function sendSMS(
  phoneNumber: string,
  countryCode: string,
  message: string
): Promise<{ messageId?: string; success: boolean; error?: string }> {
  try {
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    if (!TWILIO_PHONE_NUMBER) {
      throw new Error('TWILIO_PHONE_NUMBER environment variable is not set');
    }

    const client = getTwilioClient();

    const response = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: fullPhoneNumber,
    });

    console.log('✅ Twilio SMS sent successfully:', {
      messageId: response.sid,
      to: fullPhoneNumber,
      status: response.status,
    });

    return {
      success: true,
      messageId: response.sid,
    };
  } catch (error: any) {
    console.error('❌ Twilio SMS sending error:', {
      error: error.message,
      code: error.code,
      status: error.status,
      phoneNumber: `${countryCode}${phoneNumber}`,
    });

    let errorMessage = 'Failed to send SMS';
    
    if (error.code === 21211) {
      errorMessage = 'Invalid phone number format';
    } else if (error.code === 21608) {
      errorMessage = 'Unverified phone number (trial account restriction)';
    } else if (error.code === 21614) {
      errorMessage = 'Invalid "To" phone number';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
