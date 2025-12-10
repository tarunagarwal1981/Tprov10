/**
 * CognitoAuthContext - AWS Cognito Authentication Context
 * Replaces Supabase Auth with AWS Cognito
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { signOut, getUser, refreshToken, decodeToken, getUserIdFromToken, getUserEmailFromToken } from '@/lib/aws/cognito';
import type { User, UserRole, UserProfile } from '@/lib/types';
import { toast } from 'sonner';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type AuthLoadingState = 'idle' | 'initializing' | 'authenticating';

export interface AuthError {
  type: string;
  message: string;
  timestamp: Date;
}

export interface AuthContextState {
  user: User | null;
  profile: UserProfile | null;
  userRole: UserRole | null;
  loading: AuthLoadingState;
  isInitialized: boolean;
  error: AuthError | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<string | false>;
  loginWithPhoneOTP: (countryCode: string, phoneNumber: string, otp: string) => Promise<string | false>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: UserRole;
    profile: any;
  }) => Promise<string | false>;
  registerWithPhoneOTP: (userData: {
    countryCode: string;
    phoneNumber: string;
    email: string;
    name: string;
    companyName?: string;
    role: 'TRAVEL_AGENT' | 'TOUR_OPERATOR';
    otp: string;
  }) => Promise<string | false>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithGithub: () => Promise<boolean>;
  logout: () => Promise<void>;
  getRedirectPath: () => string;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

// Token storage keys
const TOKEN_STORAGE_KEY = 'cognito_tokens';
const ACCESS_TOKEN_KEY = 'cognito_access_token';
const ID_TOKEN_KEY = 'cognito_id_token';
const REFRESH_TOKEN_KEY = 'cognito_refresh_token';

// Helper functions for token storage
const getStoredTokens = () => {
  if (typeof window === 'undefined') return null;
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const idToken = localStorage.getItem(ID_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (accessToken && idToken) {
      return { accessToken, idToken, refreshToken };
    }
  } catch (error) {
    console.error('Error reading tokens from storage:', error);
  }
  return null;
};

const storeTokens = (accessToken: string, idToken: string, refreshToken: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(ID_TOKEN_KEY, idToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch (error) {
    console.error('Error storing tokens:', error);
  }
};

const clearStoredTokens = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(ID_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

export const CognitoAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<AuthLoadingState>('initializing');
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  // Load user profile from RDS database via API route
  const loadUserProfile = useCallback(async (userId: string, email: string) => {
    try {
      // Call API route to get user profile (server-side database query)
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle database unavailable error gracefully
        if (response.status === 503 && errorData.message?.includes('Database unavailable')) {
          console.warn('⚠️  Database unavailable in local development. Using minimal profile from Cognito.');
          
          // Return a minimal user profile from Cognito info
          const minimalUser: User = {
            id: userId,
            email: email,
            name: email.split('@')[0] || 'User',
            role: 'TRAVEL_AGENT', // Default role
            profile: {
              timezone: 'UTC',
              language: 'en',
              currency: 'USD',
              notification_preferences: {
                email: true,
                sms: false,
                push: true,
                marketing: false,
              },
            },
            preferences: {},
            created_at: new Date(),
            updated_at: new Date(),
          };
          
          setUser(minimalUser);
          setProfile(minimalUser.profile);
          return minimalUser;
        }
        
        throw new Error(errorData.message || 'Failed to load user profile');
      }

      const { profile: userProfile } = await response.json();

      if (userProfile) {
        const profileData = typeof userProfile.profile === 'string' 
          ? JSON.parse(userProfile.profile) 
          : userProfile.profile || {};
        
        const fullUser: User = {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name || email.split('@')[0] || 'User',
          role: userProfile.role as UserRole,
          profile: {
            timezone: profileData.timezone || 'UTC',
            language: profileData.language || 'en',
            currency: profileData.currency || 'USD',
            notification_preferences: {
              email: profileData.notification_preferences?.email ?? true,
              sms: profileData.notification_preferences?.sms ?? false,
              push: profileData.notification_preferences?.push ?? true,
              marketing: profileData.notification_preferences?.marketing ?? false,
            },
          },
          preferences: profileData.preferences || {},
          avatar_url: profileData.avatar_url,
          phone: userProfile.phone,
          created_at: new Date(userProfile.created_at),
          updated_at: new Date(userProfile.updated_at || userProfile.created_at),
        };
        
        setUser(fullUser);
        setProfile(fullUser.profile);
        return fullUser;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
    return null;
  }, []);

  // Initialize auth state from stored tokens
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading('initializing');
        
        const tokens = getStoredTokens();
        if (tokens && tokens.accessToken) {
          try {
            // Verify token is still valid and get user info
            const userInfo = await getUser(tokens.accessToken);
            const userId = getUserIdFromToken(tokens.idToken) || userInfo.username;
            const email = getUserEmailFromToken(tokens.idToken) || userInfo.attributes.email;
            
            if (userId && email) {
              await loadUserProfile(userId, email);
            }
          } catch (error) {
            console.error('Error validating stored tokens:', error);
            // Tokens invalid, clear them
            clearStoredTokens();
          }
        }
        
        setIsInitialized(true);
        setLoading('idle');
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsInitialized(true);
        setLoading('idle');
      }
    };

    initAuth();
  }, [loadUserProfile]);

  const login = useCallback(async (email: string, password: string, rememberMe?: boolean): Promise<string | false> => {
    try {
      setLoading('authenticating');
      setError(null);
      
      console.log('🔐 Starting login process for:', email);
      
      // Call API route for login (server-side)
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!loginResponse.ok) {
        const error = await loginResponse.json();
        throw new Error(error.message || error.error || 'Login failed');
      }

      const authResult = await loginResponse.json();
      
      // Store tokens
      storeTokens(authResult.accessToken, authResult.idToken, authResult.refreshToken);
      
      // Get user info
      const userInfo = await getUser(authResult.accessToken);
      const userId = getUserIdFromToken(authResult.idToken) || userInfo.username;
      const userEmail = getUserEmailFromToken(authResult.idToken) || email;
      
      if (!userId || !userEmail) {
        throw new Error('Failed to get user information from tokens');
      }
      
      // Load user profile from database
      const fullUser = await loadUserProfile(userId, userEmail);
      
      if (fullUser) {
        // Determine redirect URL based on role
        let redirectUrl = '/';
        switch (fullUser.role) {
          case 'SUPER_ADMIN':
          case 'ADMIN':
            redirectUrl = '/admin/dashboard';
            break;
          case 'TOUR_OPERATOR':
            redirectUrl = '/operator/dashboard';
            break;
          case 'TRAVEL_AGENT':
            redirectUrl = '/agent';
            break;
          default:
            redirectUrl = '/';
        }
        console.log('✅ Login successful, redirecting to:', redirectUrl);
        return redirectUrl;
      }
      
      return false;
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError({
        type: 'login_error',
        message: err.message || 'Login failed',
        timestamp: new Date()
      });
      return false;
    } finally {
      setLoading('idle');
    }
  }, [loadUserProfile]);

  const register = useCallback(async (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: UserRole;
    profile: any;
  }): Promise<string | false> => {
    try {
      setLoading('authenticating');
      setError(null);
      
      console.log('📝 Starting registration process for:', userData.email);
      
      // Call API route for registration (server-side)
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
          profile: userData.profile,
        }),
      });

      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        throw new Error(error.message || error.error || 'Registration failed');
      }

      const signUpResult = await registerResponse.json();
      
      // Note: In Cognito, user needs to verify email before they can login
      // For now, we'll create the user profile in the database
      // The user will need to confirm their email first
      
      toast.success('Registration successful! Please check your email to verify your account.');
      
      return '/login?verified=false';
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      setError({
        type: 'registration_error',
        message: err.message || 'Registration failed',
        timestamp: new Date()
      });
      return false;
    } finally {
      setLoading('idle');
    }
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      setLoading('authenticating');
      setError(null);
      
      // Redirect to Cognito hosted UI for Google OAuth
      const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || 'travel-app-auth-2285.auth.us-east-1.amazoncognito.com';
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '20t43em6vuke645ka10s4slgl9';
      const redirectUri = `${window.location.origin}/auth/callback`;
      
      const authUrl = `https://${cognitoDomain}/oauth2/authorize?client_id=${clientId}&response_type=code&scope=email+openid+profile&redirect_uri=${encodeURIComponent(redirectUri)}&identity_provider=Google`;
      
      window.location.href = authUrl;
      return true;
    } catch (err: any) {
      console.error('❌ Google login error:', err);
      setError({
        type: 'oauth_error',
        message: 'Google login failed',
        timestamp: new Date()
      });
      return false;
    } finally {
      setLoading('idle');
    }
  }, []);

  const loginWithGithub = useCallback(async (): Promise<boolean> => {
    // GitHub OAuth not configured, return false
    setError({
      type: 'oauth_error',
      message: 'GitHub login is not available',
      timestamp: new Date()
    });
    return false;
  }, []);

  const loginWithPhoneOTP = useCallback(async (
    countryCode: string,
    phoneNumber: string,
    otp: string
  ): Promise<string | false> => {
    try {
      setLoading('authenticating');
      setError(null);

      console.log('📱 Starting phone OTP login for:', `${countryCode}${phoneNumber}`);

      const response = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode,
          phoneNumber,
          code: otp,
          purpose: 'login',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'OTP verification failed');
      }

      const result = await response.json();

      if (!result.authenticated || !result.user) {
        throw new Error('Authentication failed');
      }

      // For phone OTP, we need to handle authentication differently
      // The verify-otp endpoint returns user info but not Cognito tokens
      // We'll need to create a session or use a different auth mechanism
      // For now, store user info and create a minimal session
      if (typeof window !== 'undefined') {
        // Store user info
        localStorage.setItem('phoneAuthUser', JSON.stringify(result.user));
        // Create a temporary session token (in production, use proper JWT)
        const sessionToken = btoa(JSON.stringify({
          userId: result.user.id,
          email: result.user.email,
          authMethod: 'phone_otp',
          timestamp: Date.now(),
        }));
        localStorage.setItem('phoneAuthSession', sessionToken);
      }

      // Load user profile
      const fullUser = await loadUserProfile(result.user.id, result.user.email);

      const resolvedRole: UserRole =
        (fullUser?.role as UserRole | undefined) || result.user.role || 'TRAVEL_AGENT';
      const completion = (fullUser as any)?.profile_completion_percentage || 0;
      const onboardingCompleted = (fullUser as any)?.onboarding_completed || false;
      const needsOnboarding = resolvedRole === 'TRAVEL_AGENT' && (completion < 100 || !onboardingCompleted);
      // Determine redirect URL based on role and profile completion (non-blocking for agents)
      let redirectUrl = '/';
      switch (resolvedRole) {
        case 'SUPER_ADMIN':
        case 'ADMIN':
          redirectUrl = '/admin/dashboard';
          break;
        case 'TOUR_OPERATOR':
          redirectUrl = '/operator/dashboard';
          break;
        case 'TRAVEL_AGENT':
          redirectUrl = needsOnboarding ? '/agent?onboarding=1' : '/agent';
          break;
        default:
          redirectUrl = '/';
      }
      console.log('✅ Phone OTP login successful, redirecting to:', redirectUrl);
      return redirectUrl;

      return false;
    } catch (err: any) {
      console.error('❌ Phone OTP login error:', err);
      setError({
        type: 'login_error',
        message: err.message || 'Phone OTP login failed',
        timestamp: new Date()
      });
      return false;
    } finally {
      setLoading('idle');
    }
  }, [loadUserProfile]);

  const registerWithPhoneOTP = useCallback(async (userData: {
    countryCode: string;
    phoneNumber: string;
    email: string;
    name: string;
    companyName?: string;
    role: 'TRAVEL_AGENT' | 'TOUR_OPERATOR';
    otp: string;
  }): Promise<string | false> => {
    try {
      setLoading('authenticating');
      setError(null);

      console.log('📱 Starting phone OTP registration for:', userData.email);

      const response = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: userData.countryCode,
          phoneNumber: userData.phoneNumber,
          code: userData.otp,
          purpose: 'signup',
          email: userData.email,
          name: userData.name,
          companyName: userData.companyName,
          role: userData.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'OTP verification failed');
      }

      const result = await response.json();

      if (!result.authenticated || !result.user) {
        throw new Error('Registration failed');
      }

      // Store user info temporarily
      if (typeof window !== 'undefined') {
        localStorage.setItem('phoneAuthUser', JSON.stringify(result.user));
      }

      // Load user profile
      const fullUser = await loadUserProfile(result.user.id, result.user.email);

      const resolvedRole = (fullUser?.role as UserRole | undefined) || result.user.role || userData.role || 'TRAVEL_AGENT';
      const completion = (fullUser as any)?.profile_completion_percentage || 0;
      const onboardingCompleted = (fullUser as any)?.onboarding_completed || false;
      const needsOnboarding = resolvedRole === 'TRAVEL_AGENT' && (completion < 100 || !onboardingCompleted);
      const redirectUrl =
        resolvedRole === 'TOUR_OPERATOR'
          ? '/operator/dashboard'
          : needsOnboarding
            ? '/agent?onboarding=1'
            : '/agent';
      console.log('✅ Phone OTP registration successful, redirecting to:', redirectUrl);
      if (needsOnboarding) {
        toast.success('Account created! Please complete your profile.', { duration: 4000 });
      } else {
        toast.success('Account created successfully!');
      }
      return redirectUrl;

      return false;
    } catch (err: any) {
      console.error('❌ Phone OTP registration error:', err);
      setError({
        type: 'registration_error',
        message: err.message || 'Phone OTP registration failed',
        timestamp: new Date()
      });
      return false;
    } finally {
      setLoading('idle');
    }
  }, [loadUserProfile]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      const tokens = getStoredTokens();
      if (tokens?.accessToken) {
        await signOut(tokens.accessToken);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      clearStoredTokens();
      setUser(null);
      setProfile(null);
      setError(null);
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, []);

  const getRedirectPath = useCallback((): string => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return '/admin/dashboard';
      case 'TOUR_OPERATOR':
        return '/operator/dashboard';
      case 'TRAVEL_AGENT':
        return '/agent';
      default:
        return '/';
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const userRole = useMemo(() => user?.role || null, [user]);

  const value = useMemo<AuthContextState>(() => ({
    user,
    profile,
    userRole,
    loading,
    isInitialized,
    error,
    login,
    loginWithPhoneOTP,
    register,
    registerWithPhoneOTP,
    loginWithGoogle,
    loginWithGithub,
    logout,
    getRedirectPath,
    clearError,
  }), [user, profile, userRole, loading, isInitialized, error, login, loginWithPhoneOTP, register, registerWithPhoneOTP, loginWithGoogle, loginWithGithub, logout, getRedirectPath, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a CognitoAuthProvider');
  }
  return context;
};

// Helper hooks for backward compatibility
export const useIsAuthenticated = () => {
  const { user, isInitialized } = useAuth();
  return {
    isAuthenticated: !!user,
    isInitialized,
  };
};

export const useAuthLoading = () => {
  const { loading, isInitialized } = useAuth();
  return {
    loading,
    isInitialized,
    isLoading: loading !== 'idle',
  };
};

export const useUserDisplay = () => {
  const { user, profile } = useAuth();
  
  return {
    displayName: user?.name || user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    avatar: user?.avatar_url || '',
    role: user?.role || null,
  };
};

// Permission types
export type Permission = 
  | 'create_packages'
  | 'edit_packages'
  | 'delete_packages'
  | 'manage_users'
  | 'view_analytics'
  | 'manage_bookings'
  | 'access_admin_panel'
  | 'manage_operators'
  | 'manage_agents';

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'create_packages',
    'edit_packages',
    'delete_packages',
    'manage_users',
    'view_analytics',
    'manage_bookings',
    'access_admin_panel',
    'manage_operators',
    'manage_agents',
  ],
  ADMIN: [
    'create_packages',
    'edit_packages',
    'delete_packages',
    'manage_users',
    'view_analytics',
    'manage_bookings',
    'access_admin_panel',
    'manage_operators',
    'manage_agents',
  ],
  TOUR_OPERATOR: [
    'create_packages',
    'edit_packages',
    'delete_packages',
    'manage_bookings',
    'view_analytics',
  ],
  TRAVEL_AGENT: [
    'manage_bookings',
    'view_analytics',
  ],
  USER: [
    'view_analytics',
  ],
};

export const useRBAC = () => {
  const { userRole } = useAuth();
  
  const hasRole = useCallback((role: UserRole): boolean => {
    return userRole === role;
  }, [userRole]);
  
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!userRole) return false;
    return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
  }, [userRole]);
  
  const canAccessRoute = useCallback((route: string, accessLevel: 'public' | 'authenticated' | 'admin' | 'operator' | 'agent'): boolean => {
    if (accessLevel === 'public') return true;
    if (accessLevel === 'authenticated') return !!userRole;
    if (accessLevel === 'admin') return hasRole('ADMIN') || hasRole('SUPER_ADMIN');
    if (accessLevel === 'operator') return hasRole('TOUR_OPERATOR') || hasRole('ADMIN') || hasRole('SUPER_ADMIN');
    if (accessLevel === 'agent') return hasRole('TRAVEL_AGENT') || hasRole('ADMIN') || hasRole('SUPER_ADMIN');
    
    return false;
  }, [userRole, hasRole]);

  const permissions = useMemo(() => userRole ? ROLE_PERMISSIONS[userRole] || [] : [], [userRole]);
  
  const isAdmin = useMemo(() => hasRole('ADMIN') || hasRole('SUPER_ADMIN'), [hasRole]);
  const isOperator = useMemo(() => hasRole('TOUR_OPERATOR'), [hasRole]);
  const isAgent = useMemo(() => hasRole('TRAVEL_AGENT'), [hasRole]);
  
  return {
    hasRole,
    hasPermission,
    canAccessRoute,
    userRole,
    permissions,
    isAdmin,
    isOperator,
    isAgent,
  };
};

