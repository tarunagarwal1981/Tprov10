/**
 * AWS Cognito Authentication Client
 * 
 * This module provides authentication functions using AWS Cognito,
 * replacing Supabase Auth functionality.
 */

import { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ 
  region: process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1' 
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

if (!USER_POOL_ID || !CLIENT_ID) {
  console.error('❌ Missing Cognito configuration:');
  console.error('  COGNITO_USER_POOL_ID:', USER_POOL_ID ? '✅ Set' : '❌ Missing');
  console.error('  COGNITO_CLIENT_ID:', CLIENT_ID ? '✅ Set' : '❌ Missing');
  throw new Error('Cognito environment variables are not configured. Please set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID in your environment variables.');
}

export interface AuthResult {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface UserAttributes {
  email: string;
  emailVerified?: boolean;
  name?: string;
  role?: string;
  [key: string]: string | boolean | undefined;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });
  
  const response = await client.send(command);
  
  if (!response.AuthenticationResult) {
    throw new Error('Authentication failed');
  }
  
  return {
    accessToken: response.AuthenticationResult.AccessToken!,
    idToken: response.AuthenticationResult.IdToken!,
    refreshToken: response.AuthenticationResult.RefreshToken!,
    expiresIn: response.AuthenticationResult.ExpiresIn,
  };
}

/**
 * Sign up a new user
 */
export async function signUp(
  email: string, 
  password: string, 
  attributes: Omit<UserAttributes, 'email'> = {}
): Promise<{ userSub: string; codeDeliveryDetails?: any }> {
  const userAttributes = Object.entries(attributes)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => ({
      Name: key.startsWith('custom:') ? key : key === 'emailVerified' ? 'email_verified' : key,
      Value: String(value),
    }));

  const command = new SignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: userAttributes,
  });
  
  const response = await client.send(command);
  
  return {
    userSub: response.UserSub!,
    codeDeliveryDetails: response.CodeDeliveryDetails,
  };
}

/**
 * Confirm user sign up with verification code
 */
export async function confirmSignUp(email: string, code: string): Promise<void> {
  const command = new ConfirmSignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });
  
  await client.send(command);
}

/**
 * Get user information from access token
 */
export async function getUser(accessToken: string) {
  const command = new GetUserCommand({
    AccessToken: accessToken,
  });
  
  const response = await client.send(command);
  
  // Parse user attributes
  const attributes: Record<string, string> = {};
  response.UserAttributes?.forEach(attr => {
    if (attr.Name && attr.Value) {
      attributes[attr.Name] = attr.Value;
    }
  });
  
  return {
    username: response.Username,
    attributes,
    mfaOptions: response.MFAOptions,
  };
}

/**
 * Get user by username (admin operation)
 */
export async function getUserByUsername(username: string) {
  const command = new AdminGetUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
  });
  
  const response = await client.send(command);
  
  const attributes: Record<string, string> = {};
  response.UserAttributes?.forEach(attr => {
    if (attr.Name && attr.Value) {
      attributes[attr.Name] = attr.Value;
    }
  });
  
  return {
    username: response.Username,
    attributes,
    userStatus: response.UserStatus,
    enabled: response.Enabled,
    userCreateDate: response.UserCreateDate,
    userLastModifiedDate: response.UserLastModifiedDate,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(refreshToken: string): Promise<AuthResult> {
  const command = new InitiateAuthCommand({
    ClientId: CLIENT_ID,
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  });
  
  const response = await client.send(command);
  
  if (!response.AuthenticationResult) {
    throw new Error('Token refresh failed');
  }
  
  return {
    accessToken: response.AuthenticationResult.AccessToken!,
    idToken: response.AuthenticationResult.IdToken!,
    refreshToken: refreshToken, // Refresh token doesn't change
    expiresIn: response.AuthenticationResult.ExpiresIn,
  };
}

/**
 * Initiate password reset
 */
export async function forgotPassword(email: string): Promise<{ codeDeliveryDetails?: any }> {
  const command = new ForgotPasswordCommand({
    ClientId: CLIENT_ID,
    Username: email,
  });
  
  const response = await client.send(command);
  
  return {
    codeDeliveryDetails: response.CodeDeliveryDetails,
  };
}

/**
 * Confirm password reset with verification code
 */
export async function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  const command = new ConfirmForgotPasswordCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  });
  
  await client.send(command);
}

/**
 * Sign out user (invalidates all tokens)
 */
export async function signOut(accessToken: string): Promise<void> {
  const command = new GlobalSignOutCommand({
    AccessToken: accessToken,
  });
  
  await client.send(command);
}

/**
 * Verify and decode JWT token (client-side)
 * Note: For production, use a proper JWT library like 'jsonwebtoken' or 'jose'
 */
export function decodeToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const base64Url = parts[1];
    if (!base64Url) {
      return null;
    }
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString()
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Get user ID from token
 */
export function getUserIdFromToken(idToken: string): string | null {
  const decoded = decodeToken(idToken);
  return decoded?.sub || null;
}

/**
 * Get user email from token
 */
export function getUserEmailFromToken(idToken: string): string | null {
  const decoded = decodeToken(idToken);
  return decoded?.email || null;
}

