/**
 * reCAPTCHA Service
 * Verifies reCAPTCHA tokens with Google's API
 */

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export interface RecaptchaVerificationResult {
  success: boolean;
  score?: number; // For v3
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Verify reCAPTCHA token (supports both v2 and v3)
 */
export async function verifyRecaptcha(
  token: string,
  remoteip?: string
): Promise<{ valid: boolean; score?: number; error?: string }> {
  if (!RECAPTCHA_SECRET_KEY) {
    console.error('❌ RECAPTCHA_SECRET_KEY not set in environment variables!');
    console.error('   Check Amplify environment variables: RECAPTCHA_SECRET_KEY');
    // In development, allow requests without reCAPTCHA if key is not set
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Skipping verification in development mode only');
      return { valid: true };
    }
    return { valid: false, error: 'reCAPTCHA not configured - RECAPTCHA_SECRET_KEY missing' };
  }

  if (!token) {
    return { valid: false, error: 'reCAPTCHA token is required' };
  }

  try {
    const params = new URLSearchParams({
      secret: RECAPTCHA_SECRET_KEY,
      response: token,
      ...(remoteip && { remoteip }),
    });

    console.log('🔍 Sending reCAPTCHA verification to Google');
    console.log('   URL:', RECAPTCHA_VERIFY_URL);
    console.log('   Has secret key:', !!RECAPTCHA_SECRET_KEY);
    console.log('   Secret key length:', RECAPTCHA_SECRET_KEY?.length || 0);
    console.log('   Secret key prefix:', RECAPTCHA_SECRET_KEY ? RECAPTCHA_SECRET_KEY.substring(0, 10) + '...' : 'not set');
    console.log('   Token length:', token.length);
    console.log('   Token prefix:', token.substring(0, 20) + '...');
    console.log('   Remote IP:', remoteip || 'not provided');

    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    console.log('📥 Google reCAPTCHA API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google reCAPTCHA API error');
      console.error('   Status:', response.status);
      console.error('   Status text:', response.statusText);
      console.error('   Body:', errorText);
      return { valid: false, error: `Failed to verify reCAPTCHA: ${response.status} ${response.statusText}` };
    }

    const data: RecaptchaVerificationResult = await response.json();

    console.log('📥 Google reCAPTCHA API response:');
    console.log('   Success:', data.success);
    console.log('   Score:', data.score || 'N/A (v2)');
    console.log('   Hostname:', data.hostname || 'N/A');
    console.log('   Challenge timestamp:', data.challenge_ts || 'N/A');
    console.log('   Error codes:', data['error-codes'] || []);
    if (data['error-codes'] && data['error-codes'].length > 0) {
      console.error('   ⚠️ ERROR CODES:', data['error-codes'].join(', '));
    }

    if (!data.success) {
      const errorCodes = data['error-codes'] || [];
      console.error('❌ reCAPTCHA verification failed');
      console.error('   Error codes:', errorCodes.join(', '));
      console.error('   Hostname:', data.hostname || 'N/A');
      console.error('   Challenge timestamp:', data.challenge_ts || 'N/A');
      console.error('   Has secret key:', !!RECAPTCHA_SECRET_KEY);
      console.error('   Secret key length:', RECAPTCHA_SECRET_KEY?.length || 0);
      return {
        valid: false,
        error: `reCAPTCHA verification failed: ${errorCodes.join(', ')}`,
      };
    }

    console.log('✅ reCAPTCHA verification successful');
    console.log('   Hostname:', data.hostname || 'N/A');
    console.log('   Score:', data.score || 'N/A (v2)');
    console.log('   Challenge timestamp:', data.challenge_ts || 'N/A');

    // For v3, check score (0.0 to 1.0, higher is better)
    // Typically, scores above 0.5 are considered legitimate
    if (data.score !== undefined) {
      const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5');
      if (data.score < minScore) {
        return {
          valid: false,
          error: `reCAPTCHA score too low: ${data.score}`,
          score: data.score,
        };
      }
      return { valid: true, score: data.score };
    }

    // For v2, success is enough
    return { valid: true };
  } catch (error: any) {
    console.error('reCAPTCHA verification error:', error);
    return {
      valid: false,
      error: error.message || 'Failed to verify reCAPTCHA',
    };
  }
}
