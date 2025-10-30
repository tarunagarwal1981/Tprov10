/**
 * AWS Cognito Authentication Library
 * Drop-in replacement for Supabase Auth
 */

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand,
  UpdateUserAttributesCommand,
  GlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";

// Configuration
const config = {
  region: process.env.NEXT_PUBLIC_COGNITO_REGION || "us-east-1",
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
};

const client = new CognitoIdentityProviderClient({ region: config.region });

// Types
export interface CognitoUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  email_verified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: CognitoUser | null;
  tokens: AuthTokens | null;
  error: Error | null;
}

/**
 * Sign in with email and password
 * Equivalent to: supabase.auth.signInWithPassword()
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: config.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await client.send(command);

    if (!response.AuthenticationResult) {
      throw new Error("Authentication failed");
    }

    // Get user details
    const user = await getUserFromToken(response.AuthenticationResult.AccessToken!);

    return {
      user,
      tokens: {
        accessToken: response.AuthenticationResult.AccessToken!,
        idToken: response.AuthenticationResult.IdToken!,
        refreshToken: response.AuthenticationResult.RefreshToken!,
        expiresIn: response.AuthenticationResult.ExpiresIn!,
      },
      error: null,
    };
  } catch (error: any) {
    return {
      user: null,
      tokens: null,
      error: new Error(error.message || "Sign in failed"),
    };
  }
}

/**
 * Sign up with email and password
 * Equivalent to: supabase.auth.signUp()
 */
export async function signUp(
  email: string,
  password: string,
  metadata?: { name?: string; role?: string }
): Promise<AuthResponse> {
  try {
    const userAttributes = [
      { Name: "email", Value: email },
    ];

    if (metadata?.name) {
      userAttributes.push({ Name: "name", Value: metadata.name });
    }

    if (metadata?.role) {
      userAttributes.push({ Name: "custom:role", Value: metadata.role });
    }

    const command = new SignUpCommand({
      ClientId: config.clientId,
      Username: email,
      Password: password,
      UserAttributes: userAttributes,
    });

    const response = await client.send(command);

    // Cognito requires email verification by default
    // User needs to confirm email before they can sign in

    return {
      user: {
        id: response.UserSub!,
        email: email,
        name: metadata?.name,
        role: metadata?.role,
        email_verified: false,
      },
      tokens: null, // No tokens until email is verified
      error: null,
    };
  } catch (error: any) {
    return {
      user: null,
      tokens: null,
      error: new Error(error.message || "Sign up failed"),
    };
  }
}

/**
 * Confirm email with verification code
 * Equivalent to: supabase.auth.verifyOtp()
 */
export async function confirmSignUp(
  email: string,
  code: string
): Promise<{ error: Error | null }> {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: config.clientId,
      Username: email,
      ConfirmationCode: code,
    });

    await client.send(command);

    return { error: null };
  } catch (error: any) {
    return {
      error: new Error(error.message || "Email confirmation failed"),
    };
  }
}

/**
 * Sign out
 * Equivalent to: supabase.auth.signOut()
 */
export async function signOut(accessToken: string): Promise<{ error: Error | null }> {
  try {
    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });

    await client.send(command);

    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cognito_tokens');
      localStorage.removeItem('cognito_user');
    }

    return { error: null };
  } catch (error: any) {
    return {
      error: new Error(error.message || "Sign out failed"),
    };
  }
}

/**
 * Request password reset
 * Equivalent to: supabase.auth.resetPasswordForEmail()
 */
export async function resetPasswordForEmail(
  email: string
): Promise<{ error: Error | null }> {
  try {
    const command = new ForgotPasswordCommand({
      ClientId: config.clientId,
      Username: email,
    });

    await client.send(command);

    return { error: null };
  } catch (error: any) {
    return {
      error: new Error(error.message || "Password reset request failed"),
    };
  }
}

/**
 * Confirm password reset with code
 */
export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string
): Promise<{ error: Error | null }> {
  try {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: config.clientId,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });

    await client.send(command);

    return { error: null };
  } catch (error: any) {
    return {
      error: new Error(error.message || "Password reset failed"),
    };
  }
}

/**
 * Get current user from access token
 */
export async function getUserFromToken(accessToken: string): Promise<CognitoUser> {
  const command = new GetUserCommand({
    AccessToken: accessToken,
  });

  const response = await client.send(command);

  const attributes = response.UserAttributes || [];
  const getAttr = (name: string) => 
    attributes.find(attr => attr.Name === name)?.Value;

  return {
    id: response.Username!,
    email: getAttr("email")!,
    name: getAttr("name"),
    role: getAttr("custom:role"),
    email_verified: getAttr("email_verified") === "true",
  };
}

/**
 * Update user profile
 * Equivalent to: supabase.auth.updateUser()
 */
export async function updateUserAttributes(
  accessToken: string,
  attributes: { name?: string; [key: string]: any }
): Promise<{ error: Error | null }> {
  try {
    const userAttributes = Object.entries(attributes).map(([key, value]) => ({
      Name: key === 'name' ? 'name' : `custom:${key}`,
      Value: String(value),
    }));

    const command = new UpdateUserAttributesCommand({
      AccessToken: accessToken,
      UserAttributes: userAttributes,
    });

    await client.send(command);

    return { error: null };
  } catch (error: any) {
    return {
      error: new Error(error.message || "Update failed"),
    };
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens | null> {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: config.clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const response = await client.send(command);

    if (!response.AuthenticationResult) {
      return null;
    }

    return {
      accessToken: response.AuthenticationResult.AccessToken!,
      idToken: response.AuthenticationResult.IdToken!,
      refreshToken: refreshToken, // Refresh token doesn't change
      expiresIn: response.AuthenticationResult.ExpiresIn!,
    };
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}

/**
 * Storage helpers (similar to Supabase's session storage)
 */
export const storage = {
  setTokens: (tokens: AuthTokens) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cognito_tokens', JSON.stringify(tokens));
    }
  },

  getTokens: (): AuthTokens | null => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cognito_tokens');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  },

  setUser: (user: CognitoUser) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cognito_user', JSON.stringify(user));
    }
  },

  getUser: (): CognitoUser | null => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cognito_user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cognito_tokens');
      localStorage.removeItem('cognito_user');
    }
  },
};

/**
 * OAuth sign in (Google, GitHub, etc.)
 */
export function getOAuthUrl(provider: 'Google' | 'GitHub'): string {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const redirectUri = encodeURIComponent(
    `${window.location.origin}/auth/callback`
  );

  return `https://${domain}/oauth2/authorize?identity_provider=${provider}&redirect_uri=${redirectUri}&response_type=CODE&client_id=${config.clientId}&scope=email openid profile`;
}

export default {
  signInWithPassword,
  signUp,
  confirmSignUp,
  signOut,
  resetPasswordForEmail,
  confirmPasswordReset,
  getUserFromToken,
  updateUserAttributes,
  refreshAccessToken,
  storage,
  getOAuthUrl,
};

