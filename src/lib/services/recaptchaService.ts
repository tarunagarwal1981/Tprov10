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

    console.log('🔍 Sending reCAPTCHA verification to Google:', {
      url: RECAPTCHA_VERIFY_URL,
      hasSecretKey: !!RECAPTCHA_SECRET_KEY,
      secretKeyLength: RECAPTCHA_SECRET_KEY?.length || 0,
      secretKeyPrefix: RECAPTCHA_SECRET_KEY ? RECAPTCHA_SECRET_KEY.substring(0, 10) + '...' : 'not set',
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      remoteip: remoteip || 'not provided',
    });

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
      console.error('❌ Google reCAPTCHA API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return { valid: false, error: `Failed to verify reCAPTCHA: ${response.status} ${response.statusText}` };
    }

    const data: RecaptchaVerificationResult = await response.json();

    console.log('📥 Google reCAPTCHA API response:', {
      success: data.success,
      score: data.score,
      hostname: data.hostname,
      challenge_ts: data.challenge_ts,
      errorCodes: data['error-codes'] || [],
    });

    if (!data.success) {
      const errorCodes = data['error-codes'] || [];
      console.error('❌ reCAPTCHA verification failed:', {
        errorCodes,
        hostname: data.hostname,
        challenge_ts: data.challenge_ts,
        hasSecretKey: !!RECAPTCHA_SECRET_KEY,
        secretKeyLength: RECAPTCHA_SECRET_KEY?.length || 0,
      });
      return {
        valid: false,
        error: `reCAPTCHA verification failed: ${errorCodes.join(', ')}`,
      };
    }

    console.log('✅ reCAPTCHA verification successful:', {
      hostname: data.hostname,
      score: data.score,
      challenge_ts: data.challenge_ts,
    });

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
