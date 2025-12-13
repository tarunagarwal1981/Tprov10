/**
 * Get access token from either Cognito tokens or phone auth session
 * @returns access token string or null if not found
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Try Cognito tokens first
  const tokens = localStorage.getItem('cognito_tokens');
  if (tokens) {
    try {
      const parsed = JSON.parse(tokens);
      if (parsed.accessToken) {
        return parsed.accessToken;
      }
    } catch (e) {
      // Invalid token format
    }
  }

  // Try phone auth session
  const phoneSession = localStorage.getItem('phoneAuthSession');
  if (phoneSession) {
    return phoneSession;
  }

  return null;
}

