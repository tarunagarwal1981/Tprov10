/**
 * OTP Service
 * Handles OTP generation, storage, verification, and rate limiting
 */

import { query, queryOne, queryMany, transaction } from '@/lib/aws/database';
import crypto from 'crypto';

export interface OTPRequest {
  phoneNumber: string;
  countryCode: string;
  email?: string;
  purpose: 'login' | 'signup' | 'verify_phone' | 'verify_email';
  ipAddress?: string;
  userAgent?: string;
}

export interface OTPVerification {
  phoneNumber: string;
  countryCode: string;
  code: string;
  purpose: 'login' | 'signup' | 'verify_phone' | 'verify_email';
}

export interface OTPRecord {
  id: string;
  phone_number: string;
  country_code: string;
  email?: string;
  code: string;
  purpose: string;
  expires_at: Date;
  attempts: number;
  max_attempts: number;
  verified: boolean;
  verified_at?: Date;
  created_at: Date;
}

// OTP Configuration
const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10, // OTP expires in 10 minutes
  MAX_ATTEMPTS: 5, // Maximum verification attempts
  RATE_LIMIT_WINDOW_MINUTES: 15, // Rate limit window
  MAX_REQUESTS_PER_WINDOW: 3, // Max OTP requests per window
};

/**
 * Generate a random 6-digit OTP
 */
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Check rate limiting for OTP requests
 */
export async function checkRateLimit(
  identifier: string,
  identifierType: 'phone' | 'email' | 'ip'
): Promise<{ allowed: boolean; remainingRequests: number; resetAt: Date }> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - OTP_CONFIG.RATE_LIMIT_WINDOW_MINUTES);
  const windowEnd = new Date();

  // Get current request count in the window
  const result = await queryOne<{ request_count: number; window_start: Date }>(
    `SELECT request_count, window_start 
     FROM otp_rate_limits 
     WHERE identifier = $1 
       AND identifier_type = $2 
       AND window_start >= $3 
       AND window_end <= $4
     ORDER BY window_start DESC 
     LIMIT 1`,
    [identifier, identifierType, windowStart, windowEnd]
  );

  if (!result) {
    // No previous requests in this window, allow
    return {
      allowed: true,
      remainingRequests: OTP_CONFIG.MAX_REQUESTS_PER_WINDOW - 1,
      resetAt: new Date(windowEnd.getTime() + OTP_CONFIG.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000),
    };
  }

  const remainingRequests = Math.max(0, OTP_CONFIG.MAX_REQUESTS_PER_WINDOW - result.request_count);

  if (result.request_count >= OTP_CONFIG.MAX_REQUESTS_PER_WINDOW) {
    // Rate limit exceeded
    const resetAt = new Date(result.window_start.getTime() + OTP_CONFIG.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
    return {
      allowed: false,
      remainingRequests: 0,
      resetAt,
    };
  }

  return {
    allowed: true,
    remainingRequests,
    resetAt: new Date(windowEnd.getTime() + OTP_CONFIG.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000),
  };
}

/**
 * Record an OTP request for rate limiting
 */
async function recordOTPRequest(
  identifier: string,
  identifierType: 'phone' | 'email' | 'ip'
): Promise<void> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - OTP_CONFIG.RATE_LIMIT_WINDOW_MINUTES);
  const windowEnd = new Date();

  await query(
    `INSERT INTO otp_rate_limits (identifier, identifier_type, request_count, window_start, window_end)
     VALUES ($1, $2, 1, $3, $4)
     ON CONFLICT (identifier, identifier_type, window_start) 
     DO UPDATE SET request_count = otp_rate_limits.request_count + 1`,
    [identifier, identifierType, windowStart, windowEnd]
  );
}

/**
 * Create and store an OTP
 */
export async function createOTP(request: OTPRequest): Promise<{ code: string; expiresAt: Date }> {
  // Check rate limits for phone
  const phoneRateLimit = await checkRateLimit(
    `${request.countryCode}${request.phoneNumber}`,
    'phone'
  );
  if (!phoneRateLimit.allowed) {
    throw new Error(
      `Rate limit exceeded. Please try again after ${phoneRateLimit.resetAt.toISOString()}`
    );
  }

  // Check rate limits for email if provided
  if (request.email) {
    const emailRateLimit = await checkRateLimit(request.email, 'email');
    if (!emailRateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded for email. Please try again after ${emailRateLimit.resetAt.toISOString()}`
      );
    }
  }

  // Check rate limits for IP if provided
  if (request.ipAddress) {
    const ipRateLimit = await checkRateLimit(request.ipAddress, 'ip');
    if (!ipRateLimit.allowed) {
      throw new Error('Too many requests from this IP. Please try again later.');
    }
  }

  // Generate OTP
  const code = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_CONFIG.EXPIRY_MINUTES);

  // Invalidate any existing unverified OTPs for this phone/purpose
  await query(
    `UPDATE otp_codes 
     SET verified = TRUE 
     WHERE country_code = $1 
       AND phone_number = $2 
       AND purpose = $3 
       AND verified = FALSE 
       AND expires_at > NOW()`,
    [request.countryCode, request.phoneNumber, request.purpose]
  );

  // Store new OTP
  await query(
    `INSERT INTO otp_codes 
     (phone_number, country_code, email, code, purpose, expires_at, max_attempts, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      request.phoneNumber,
      request.countryCode,
      request.email || null,
      code,
      request.purpose,
      expiresAt,
      OTP_CONFIG.MAX_ATTEMPTS,
      request.ipAddress || null,
      request.userAgent || null,
    ]
  );

  // Record rate limit
  await recordOTPRequest(`${request.countryCode}${request.phoneNumber}`, 'phone');
  if (request.email) {
    await recordOTPRequest(request.email, 'email');
  }
  if (request.ipAddress) {
    await recordOTPRequest(request.ipAddress, 'ip');
  }

  return { code, expiresAt };
}

/**
 * Verify an OTP code
 */
export async function verifyOTP(verification: OTPVerification): Promise<{
  valid: boolean;
  record?: OTPRecord;
  message?: string;
}> {
  // Find the most recent unverified OTP for this phone/purpose
  const otpRecord = await queryOne<OTPRecord>(
    `SELECT * FROM otp_codes 
     WHERE country_code = $1 
       AND phone_number = $2 
       AND purpose = $3 
       AND verified = FALSE 
       AND expires_at > NOW()
     ORDER BY created_at DESC 
     LIMIT 1`,
    [verification.countryCode, verification.phoneNumber, verification.purpose]
  );

  if (!otpRecord) {
    return {
      valid: false,
      message: 'OTP not found or expired. Please request a new OTP.',
    };
  }

  // Check if max attempts exceeded
  if (otpRecord.attempts >= otpRecord.max_attempts) {
    return {
      valid: false,
      message: 'Maximum verification attempts exceeded. Please request a new OTP.',
    };
  }

  // Increment attempts
  await query(
    `UPDATE otp_codes 
     SET attempts = attempts + 1 
     WHERE id = $1`,
    [otpRecord.id]
  );

  // Verify code
  if (otpRecord.code !== verification.code) {
    return {
      valid: false,
      message: 'Invalid OTP code. Please try again.',
    };
  }

  // Mark as verified
  await query(
    `UPDATE otp_codes 
     SET verified = TRUE, verified_at = NOW() 
     WHERE id = $1`,
    [otpRecord.id]
  );

  return {
    valid: true,
    record: otpRecord,
  };
}

/**
 * Get the latest OTP for a phone (for testing/debugging)
 */
export async function getLatestOTP(
  countryCode: string,
  phoneNumber: string,
  purpose: string
): Promise<OTPRecord | null> {
  return queryOne<OTPRecord>(
    `SELECT * FROM otp_codes 
     WHERE country_code = $1 
       AND phone_number = $2 
       AND purpose = $3
     ORDER BY created_at DESC 
     LIMIT 1`,
    [countryCode, phoneNumber, purpose]
  );
}

/**
 * Cleanup expired OTPs (run via cron or scheduled Lambda)
 */
export async function cleanupExpiredOTPs(): Promise<number> {
  const result = await query(
    `DELETE FROM otp_codes 
     WHERE expires_at < NOW() - INTERVAL '1 day' 
       OR (verified = TRUE AND verified_at < NOW() - INTERVAL '7 days')`
  );
  return result.rowCount || 0;
}

/**
 * Cleanup old rate limit records (run via cron or scheduled Lambda)
 */
export async function cleanupRateLimits(): Promise<number> {
  const result = await query(
    `DELETE FROM otp_rate_limits 
     WHERE window_end < NOW() - INTERVAL '1 hour'`
  );
  return result.rowCount || 0;
}
