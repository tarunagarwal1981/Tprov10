/**
 * SMS Service
 * Handles SMS OTP delivery via AWS SNS or Twilio
 * 
 * To use Twilio instead of AWS SNS:
 * 1. Set SMS_PROVIDER=twilio in environment variables
 * 2. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 * 3. Install: npm install twilio
 */

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// Choose SMS provider: 'aws' or 'twilio'
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'twilio';

// AWS SNS client (only initialized if using AWS)
const snsClient = SMS_PROVIDER === 'aws' ? new SNSClient({
  region: process.env.AWS_REGION || process.env.DEPLOYMENT_REGION || 'us-east-1',
}) : null;

// SNS Topic ARN for SMS (if using topic) or direct SMS
const SMS_TOPIC_ARN = process.env.SNS_SMS_TOPIC_ARN;
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'TRAVCLAN'; // Max 11 chars

/**
 * Send OTP via SMS using AWS SNS
 */
export async function sendSMSOTP(
  phoneNumber: string,
  countryCode: string,
  otpCode: string
): Promise<{ messageId?: string; success: boolean; error?: string }> {
  // Use Twilio if configured
  if (SMS_PROVIDER === 'twilio') {
    try {
      // Dynamic import to avoid loading Twilio if not needed
      const { sendSMSOTP: twilioSendSMSOTP } = await import('./smsServiceTwilio');
      return await twilioSendSMSOTP(phoneNumber, countryCode, otpCode);
    } catch (error: any) {
      console.error('Failed to load Twilio SMS service:', error);
      return {
        success: false,
        error: 'Twilio SMS service not available. Install twilio package: npm install twilio',
      };
    }
  }

  // Default to AWS SNS
  try {
    if (!snsClient) {
      throw new Error('AWS SNS client not initialized');
    }

    // Format phone number with country code
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    // OTP message template
    const message = `Your verification code is ${otpCode}. Valid for 10 minutes. Do not share this code with anyone. - ${SMS_SENDER_ID}`;

    // For production, you might want to use a dedicated SNS topic
    // For now, we'll use direct SMS publishing
    const command = new PublishCommand({
      PhoneNumber: fullPhoneNumber,
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: SMS_SENDER_ID,
        },
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional', // Use 'Promotional' for marketing
        },
      },
    });

    const response = await snsClient.send(command);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error: any) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
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
  // Use Twilio if configured
  if (SMS_PROVIDER === 'twilio') {
    try {
      const { sendSMS: twilioSendSMS } = await import('./smsServiceTwilio');
      return await twilioSendSMS(phoneNumber, countryCode, message);
    } catch (error: any) {
      console.error('Failed to load Twilio SMS service:', error);
      return {
        success: false,
        error: 'Twilio SMS service not available. Install twilio package: npm install twilio',
      };
    }
  }

  // Default to AWS SNS
  try {
    if (!snsClient) {
      throw new Error('AWS SNS client not initialized');
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    const command = new PublishCommand({
      PhoneNumber: fullPhoneNumber,
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: SMS_SENDER_ID,
        },
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
    });

    const response = await snsClient.send(command);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error: any) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}
