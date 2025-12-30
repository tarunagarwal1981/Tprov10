/**
 * Extract userId from either Cognito token or phone auth session
 * Supports both authentication methods
 * Returns the database UUID, not the Cognito username (email)
 */

import { getUser } from '@/lib/aws/cognito';
import { queryOne } from '@/lib/aws/lambda-database';

/**
 * Extract userId from token (Cognito or phone auth session)
 * @param token - Cognito access token or phone auth session (base64 JSON)
 * @returns userId (database UUID) or null if invalid
 */
export async function getUserIdFromToken(token: string): Promise<string | null> {
  if (!token) {
    return null;
  }

  // Try Cognito token first
  try {
    const userInfo = await getUser(token);
    const email = userInfo.username || userInfo.attributes?.email;
    
    if (!email) {
      console.warn('[getUserIdFromToken] No email found in Cognito user info');
      return null;
    }

    // Look up user in database by email to get UUID
    const dbUser = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    if (!dbUser) {
      console.warn('[getUserIdFromToken] User not found in database for email:', email);
      return null;
    }

    return dbUser.id;
  } catch (error: any) {
    // Cognito validation failed, try phone auth session as fallback
    // Always attempt phone auth fallback regardless of error type
    // This handles cases where Cognito fails due to network issues, timeouts, etc.
    console.log('[getUserIdFromToken] Cognito validation failed, trying phone auth session fallback:', error.name || error.message);
    
      try {
        // Try to decode as phone auth session (base64 encoded JSON)
        const sessionData = JSON.parse(atob(token));
        if (sessionData.authMethod === 'phone_otp' && sessionData.userId) {
          console.log('[getUserIdFromToken] Using phone auth session userId:', sessionData.userId);
          return sessionData.userId;
      } else {
        console.warn('[getUserIdFromToken] Phone auth session decoded but missing required fields');
        return null;
      }
    } catch (e) {
      // Not a phone auth session either
      console.warn('[getUserIdFromToken] Token is neither Cognito token nor phone auth session. Cognito error:', error.name || error.message);
      return null;
    }
  }
}

