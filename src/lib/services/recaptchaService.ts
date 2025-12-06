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
    console.warn('⚠️  RECAPTCHA_SECRET_KEY not set. Skipping verification in development.');
    // In development, allow requests without reCAPTCHA if key is not set
    if (process.env.NODE_ENV === 'development') {
      return { valid: true };
    }
    return { valid: false, error: 'reCAPTCHA not configured' };
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

    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      return { valid: false, error: 'Failed to verify reCAPTCHA' };
    }

    const data: RecaptchaVerificationResult = await response.json();

    if (!data.success) {
      const errorCodes = data['error-codes'] || [];
      return {
        valid: false,
        error: `reCAPTCHA verification failed: ${errorCodes.join(', ')}`,
      };
    }

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
