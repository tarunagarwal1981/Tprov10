/**
 * Unified CAPTCHA verification service
 * Supports Google reCAPTCHA and Cloudflare Turnstile
 */

import { verifyRecaptcha } from './recaptchaService';
import { verifyTurnstile } from './turnstileService';

const CAPTCHA_PROVIDER = process.env.CAPTCHA_PROVIDER || 'recaptcha';

export async function verifyCaptcha(token: string, remoteip?: string) {
  if (CAPTCHA_PROVIDER === 'turnstile') {
    return verifyTurnstile(token, remoteip);
  }
  // Default to reCAPTCHA
  return verifyRecaptcha(token, remoteip);
}
