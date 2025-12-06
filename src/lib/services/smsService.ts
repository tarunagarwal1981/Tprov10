/**
 * SMS Service
 * Handles SMS OTP delivery via AWS SNS
 */

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || process.env.DEPLOYMENT_REGION || 'us-east-1',
});

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
  try {
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
  try {
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
