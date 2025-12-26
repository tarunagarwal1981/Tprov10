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
    // Not a valid Cognito token, try phone auth session
    // Catch any Cognito-related errors and try phone auth session fallback
    const isCognitoError = 
      error.name === 'NotAuthorizedException' || 
      error.name === 'InvalidParameterException' ||
      error.message?.includes('Invalid Access Token') ||
      error.message?.includes('Invalid token');
    
    if (isCognitoError) {
      try {
        // Try to decode as phone auth session (base64 encoded JSON)
        const sessionData = JSON.parse(atob(token));
        if (sessionData.authMethod === 'phone_otp' && sessionData.userId) {
          console.log('[getUserIdFromToken] Using phone auth session userId:', sessionData.userId);
          return sessionData.userId;
        }
      } catch (e) {
        // Not a phone auth session either
        console.warn('[getUserIdFromToken] Token is neither Cognito token nor phone auth session');
        return null;
      }
    }
    // For non-Cognito errors, return null instead of throwing
    // This allows the calling code to handle the error gracefully
    console.warn('[getUserIdFromToken] Unexpected error:', error.name, error.message);
    return null;
  }
}

