/**
 * Cloudflare Turnstile Service
 * Verifies Turnstile tokens with Cloudflare's API
 * Simpler and more privacy-focused than Google reCAPTCHA
 */

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileVerificationResult {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify Turnstile token
 */
export async function verifyTurnstile(
  token: string,
  remoteip?: string
): Promise<{ valid: boolean; error?: string }> {
  if (!TURNSTILE_SECRET_KEY) {
    console.warn('⚠️  TURNSTILE_SECRET_KEY not set. Skipping verification in development.');
    // In development, allow requests without Turnstile if key is not set
    if (process.env.NODE_ENV === 'development') {
      return { valid: true };
    }
    return { valid: false, error: 'Turnstile not configured' };
  }

  if (!token) {
    return { valid: false, error: 'Turnstile token is required' };
  }

  try {
    const formData = new URLSearchParams({
      secret: TURNSTILE_SECRET_KEY,
      response: token,
      ...(remoteip && { remoteip }),
    });

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      return { valid: false, error: 'Failed to verify Turnstile' };
    }

    const data: TurnstileVerificationResult = await response.json();

    if (!data.success) {
      const errorCodes = data['error-codes'] || [];
      return {
        valid: false,
        error: `Turnstile verification failed: ${errorCodes.join(', ')}`,
      };
    }

    return { valid: true };
  } catch (error: any) {
    console.error('Turnstile verification error:', error);
    return {
      valid: false,
      error: error.message || 'Failed to verify Turnstile',
    };
  }
}
