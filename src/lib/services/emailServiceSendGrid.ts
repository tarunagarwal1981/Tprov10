/**
 * Email Service - SendGrid Implementation
 * Handles email OTP delivery via SendGrid (Alternative to AWS SES)
 * 
 * Benefits:
 * - No approval needed (works immediately)
 * - Easy setup (just API keys)
 * - Reliable delivery
 * - Better error messages
 * - Free tier: 100 emails/day
 */

import sgMail from '@sendgrid/mail';

// Initialize SendGrid client
const initializeSendGrid = () => {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    throw new Error('SendGrid API key not configured. Set SENDGRID_API_KEY environment variable');
  }

  sgMail.setApiKey(apiKey);
  return sgMail;
};

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.SES_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@travclan.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || process.env.SES_FROM_NAME || 'TravClan';

/**
 * Send OTP via Email using SendGrid
 */
export async function sendEmailOTP(
  email: string,
  otpCode: string,
  purpose: 'login' | 'signup' | 'verify_phone' | 'verify_email' = 'login'
): Promise<{ messageId?: string; success: boolean; error?: string }> {
  try {
    const mailer = initializeSendGrid();

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
            <h1 style="color: white; margin: 0;">${purpose === 'signup' ? 'Welcome to TravClan!' : 'Verification Code'}</h1>
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
${purpose === 'signup' ? 'Welcome to TravClan!' : 'Verification Code'}

${purpose === 'signup' 
  ? 'Thank you for signing up! Please use the code below to verify your email address:'
  : 'Your verification code is:'}

${otpCode}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

---
This is an automated message. Please do not reply to this email.
    `.trim();

    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: subject,
      text: textBody,
      html: htmlBody,
    };

    console.log('📧 Sending email via SendGrid');
    console.log('   To:', email);
    console.log('   From:', `${FROM_NAME} <${FROM_EMAIL}>`);
    console.log('   Subject:', subject);

    const response = await mailer.send(msg);

    console.log('✅ SendGrid email sent successfully:', {
      messageId: response[0]?.headers?.['x-message-id'] || 'N/A',
      statusCode: response[0]?.statusCode,
      to: email,
    });

    return {
      success: true,
      messageId: response[0]?.headers?.['x-message-id'] || undefined,
    };
  } catch (error: any) {
    console.error('❌ SendGrid email sending error:', {
      error: error.message,
      code: error.code,
      response: error.response?.body,
      email: email,
    });

    // Provide user-friendly error messages
    let errorMessage = 'Failed to send email';
    
    if (error.code === 403) {
      errorMessage = 'SendGrid API key is invalid or has insufficient permissions';
    } else if (error.code === 400) {
      errorMessage = 'Invalid email address or request format';
    } else if (error.response?.body?.errors) {
      errorMessage = error.response.body.errors.map((e: any) => e.message).join(', ');
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
 * Send generic email via SendGrid
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<{ messageId?: string; success: boolean; error?: string }> {
  try {
    const mailer = initializeSendGrid();

    const msg = {
      to: to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: subject,
      html: htmlBody,
      ...(textBody && { text: textBody }),
    };

    console.log('📧 Sending email via SendGrid');
    console.log('   To:', to);
    console.log('   Subject:', subject);

    const response = await mailer.send(msg);

    console.log('✅ SendGrid email sent successfully:', {
      messageId: response[0]?.headers?.['x-message-id'] || 'N/A',
      statusCode: response[0]?.statusCode,
      to: to,
    });

    return {
      success: true,
      messageId: response[0]?.headers?.['x-message-id'] || undefined,
    };
  } catch (error: any) {
    console.error('❌ SendGrid email sending error:', {
      error: error.message,
      code: error.code,
      response: error.response?.body,
      to: to,
    });

    let errorMessage = 'Failed to send email';
    
    if (error.code === 403) {
      errorMessage = 'SendGrid API key is invalid or has insufficient permissions';
    } else if (error.code === 400) {
      errorMessage = 'Invalid email address or request format';
    } else if (error.response?.body?.errors) {
      errorMessage = error.response.body.errors.map((e: any) => e.message).join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

