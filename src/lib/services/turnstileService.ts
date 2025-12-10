/**
 * Cloudflare Turnstile Verification Service
 * Verifies Turnstile tokens server-side
 */

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileVerificationResult {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

export async function verifyTurnstile(
  token: string,
  remoteip?: string
): Promise<{ valid: boolean; error?: string }> {
  if (!TURNSTILE_SECRET_KEY) {
    console.error('❌ TURNSTILE_SECRET_KEY not set in environment variables!');
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Skipping Turnstile verification in development mode only');
      return { valid: true };
    }
    return { valid: false, error: 'Turnstile not configured - TURNSTILE_SECRET_KEY missing' };
  }

  if (!token) {
    return { valid: false, error: 'Turnstile token is required' };
  }

  try {
    const params = new URLSearchParams({
      secret: TURNSTILE_SECRET_KEY,
      response: token,
      ...(remoteip && { remoteip }),
    });

    console.log('🔍 Sending Turnstile verification to Cloudflare');
    console.log('   URL:', TURNSTILE_VERIFY_URL);
    console.log('   Has secret key:', !!TURNSTILE_SECRET_KEY);
    console.log('   Secret key length:', TURNSTILE_SECRET_KEY?.length || 0);
    console.log('   Token length:', token.length);
    console.log('   Token prefix:', token.substring(0, 20) + '...');
    console.log('   Remote IP:', remoteip || 'not provided');

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    console.log('📥 Cloudflare Turnstile API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cloudflare Turnstile API error');
      console.error('   Status:', response.status);
      console.error('   Status text:', response.statusText);
      console.error('   Body:', errorText);
      return { valid: false, error: `Failed to verify Turnstile: ${response.status} ${response.statusText}` };
    }

    const data: TurnstileVerificationResult = await response.json();

    console.log('📥 Cloudflare Turnstile API response:');
    console.log('   Success:', data.success);
    console.log('   Hostname:', data.hostname || 'N/A');
    console.log('   Challenge timestamp:', data.challenge_ts || 'N/A');
    console.log('   Error codes:', data['error-codes'] || []);
    if (data['error-codes'] && data['error-codes'].length > 0) {
      console.error('   ⚠️ ERROR CODES:', data['error-codes'].join(', '));
    }

    if (!data.success) {
      const errorCodes = data['error-codes'] || [];
      console.error('❌ Turnstile verification failed');
      console.error('   Error codes:', errorCodes.join(', '));
      console.error('   Hostname:', data.hostname || 'N/A');
      console.error('   Challenge timestamp:', data.challenge_ts || 'N/A');
      return {
        valid: false,
        error: `Turnstile verification failed: ${errorCodes.join(', ')}`,
      };
    }

    console.log('✅ Turnstile verification successful');
    console.log('   Hostname:', data.hostname || 'N/A');
    console.log('   Challenge timestamp:', data.challenge_ts || 'N/A');

    return { valid: true };
  } catch (error: any) {
    console.error('Turnstile verification error:', error);
    return {
      valid: false,
      error: error.message || 'Failed to verify Turnstile',
    };
  }
}

    if (data['error-codes'] && data['error-codes'].length > 0) {
      console.error('   ⚠️ ERROR CODES:', data['error-codes'].join(', '));
    }

    if (!data.success) {
      const errorCodes = data['error-codes'] || [];
      console.error('❌ Turnstile verification failed');
      console.error('   Error codes:', errorCodes.join(', '));
      console.error('   Hostname:', data.hostname || 'N/A');
      console.error('   Challenge timestamp:', data.challenge_ts || 'N/A');
      return {
        valid: false,
        error: `Turnstile verification failed: ${errorCodes.join(', ')}`,
      };
    }

    console.log('✅ Turnstile verification successful');
    console.log('   Hostname:', data.hostname || 'N/A');
    console.log('   Challenge timestamp:', data.challenge_ts || 'N/A');

    return { valid: true };
  } catch (error: any) {
    console.error('Turnstile verification error:', error);
    return {
      valid: false,
      error: error.message || 'Failed to verify Turnstile',
    };
  }
}
