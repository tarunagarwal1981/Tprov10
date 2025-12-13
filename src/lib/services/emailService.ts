/**
 * Email Service
 * Handles email OTP delivery via SendGrid or AWS SES
 * 
 * To use SendGrid instead of AWS SES:
 * 1. Set EMAIL_PROVIDER=sendgrid in environment variables (default)
 * 2. Set SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME
 * 3. Install: npm install @sendgrid/mail
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Choose email provider: 'sendgrid' or 'aws'
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'sendgrid';

// AWS SES client (only initialized if using AWS)
const sesClient = EMAIL_PROVIDER === 'aws' ? new SESClient({
  region: process.env.AWS_REGION || process.env.DEPLOYMENT_REGION || 'us-east-1',
}) : null;

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.SES_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@travclan.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || process.env.SES_FROM_NAME || 'Travselbuy';

/**
 * Send OTP via Email using SendGrid or AWS SES
 */
export async function sendEmailOTP(
  email: string,
  otpCode: string,
  purpose: 'login' | 'signup' | 'verify_phone' | 'verify_email' = 'login'
): Promise<{ messageId?: string; success: boolean; error?: string }> {
  // Use SendGrid if configured
  if (EMAIL_PROVIDER === 'sendgrid') {
    try {
      // Dynamic import to avoid loading SendGrid if not needed
      const { sendEmailOTP: sendGridSendEmailOTP } = await import('./emailServiceSendGrid');
      return await sendGridSendEmailOTP(email, otpCode, purpose);
    } catch (error: any) {
      console.error('Failed to load SendGrid email service:', error);
      return {
        success: false,
        error: 'SendGrid email service not available. Install @sendgrid/mail package: npm install @sendgrid/mail',
      };
    }
  }

  // Default to AWS SES
  try {
    if (!sesClient) {
      throw new Error('AWS SES client not initialized');
    }

    const subject = purpose === 'signup' 
      ? 'Welcome! Verify your email address'
      : 'Your verification code';

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #FF6B35 0%, #E05A2A 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">${purpose === 'signup' ? 'Welcome to Travselbuy!' : 'Verification Code'}</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              ${purpose === 'signup' 
                ? 'Thank you for signing up! Please use the code below to verify your email address:'
                : 'Your verification code is:'}
            </p>
            <div style="background: white; border: 2px dashed #FF6B35; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h2 style="color: #FF6B35; font-size: 32px; letter-spacing: 5px; margin: 0; font-family: 'Courier New', monospace;">
                ${otpCode}
              </h2>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              This code will expire in <strong>10 minutes</strong>.
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">
              If you didn't request this code, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const textBody = `
${purpose === 'signup' ? 'Welcome to Travselbuy!' : 'Verification Code'}

${purpose === 'signup' 
  ? 'Thank you for signing up! Please use the code below to verify your email address:'
  : 'Your verification code is:'}

${otpCode}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

---
This is an automated message. Please do not reply to this email.
    `.trim();

    const command = new SendEmailCommand({
      Source: `${FROM_NAME} <${FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const response = await sesClient.send(command);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send generic email via SendGrid or AWS SES
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<{ messageId?: string; success: boolean; error?: string }> {
  // Use SendGrid if configured
  if (EMAIL_PROVIDER === 'sendgrid') {
    try {
      const { sendEmail: sendGridSendEmail } = await import('./emailServiceSendGrid');
      return await sendGridSendEmail(to, subject, htmlBody, textBody);
    } catch (error: any) {
      console.error('Failed to load SendGrid email service:', error);
      return {
        success: false,
        error: 'SendGrid email service not available. Install @sendgrid/mail package: npm install @sendgrid/mail',
      };
    }
  }

  // Default to AWS SES
  try {
    if (!sesClient) {
      throw new Error('AWS SES client not initialized');
    }

    const command = new SendEmailCommand({
      Source: `${FROM_NAME} <${FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          ...(textBody && {
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          }),
        },
      },
    });

    const response = await sesClient.send(command);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}
