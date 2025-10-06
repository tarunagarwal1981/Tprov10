/**
 * SupabaseAuthContext - Simplified Authentication Context
 * Focuses on essential authentication functionality without complex database operations
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User, UserRole, UserProfile } from '@/lib/types';

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
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithGithub: () => Promise<boolean>;
  logout: () => Promise<void>;
  getRedirectPath: () => string;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<AuthLoadingState>('initializing');
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const supabase = createSupabaseBrowserClient();

  // Simple initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading('initializing');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Create a proper User object from Supabase user
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            role: (session.user.user_metadata?.role as UserRole) || 'USER',
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
            avatar_url: session.user.user_metadata?.avatar_url,
            phone: session.user.user_metadata?.phone,
            created_at: new Date(session.user.created_at),
            updated_at: new Date(session.user.updated_at || session.user.created_at),
          };
          setUser(userData);
          setProfile(userData.profile);
        }
        
        setIsInitialized(true);
        setLoading('idle');
      } catch (err) {
        console.error('Auth init error:', err);
        setError({
          type: 'init_error',
          message: 'Failed to initialize authentication',
          timestamp: new Date()
        });
        setIsInitialized(true);
        setLoading('idle');
      }
    };

    initAuth();
  }, [supabase.auth]); // Include supabase.auth dependency

  const login = async (email: string, password: string, rememberMe?: boolean): Promise<boolean> => {
    try {
      setLoading('authenticating');
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError({
          type: 'login_error',
          message: error.message,
          timestamp: new Date()
        });
        return false;
      }
      
      if (data.user) {
        // Create a proper User object from Supabase user
        const userData: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          role: (data.user.user_metadata?.role as UserRole) || 'USER',
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
          avatar_url: data.user.user_metadata?.avatar_url,
          phone: data.user.user_metadata?.phone,
          created_at: new Date(data.user.created_at),
          updated_at: new Date(data.user.updated_at || data.user.created_at),
        };
        setUser(userData);
        setProfile(userData.profile);
        return true;
      }
      
      return false;
    } catch (err) {
      setError({
        type: 'login_error',
        message: 'Login failed',
        timestamp: new Date()
      });
      return false;
    } finally {
      setLoading('idle');
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      setLoading('authenticating');
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        setError({
          type: 'oauth_error',
          message: error.message,
          timestamp: new Date()
        });
        return false;
      }
      
      return true;
    } catch (err) {
      setError({
        type: 'oauth_error',
        message: 'Google login failed',
        timestamp: new Date()
      });
      return false;
    } finally {
      setLoading('idle');
    }
  };

  const loginWithGithub = async (): Promise<boolean> => {
    try {
      setLoading('authenticating');
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        setError({
          type: 'oauth_error',
          message: error.message,
          timestamp: new Date()
        });
        return false;
      }
      
      return true;
    } catch (err) {
      setError({
        type: 'oauth_error',
        message: 'GitHub login failed',
        timestamp: new Date()
      });
      return false;
    } finally {
      setLoading('idle');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading('authenticating');
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      setError({
        type: 'logout_error',
        message: 'Logout failed',
        timestamp: new Date()
      });
    } finally {
      setLoading('idle');
    }
  };

  const getRedirectPath = (): string => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return '/admin';
      case 'TOUR_OPERATOR':
        return '/operator';
      case 'TRAVEL_AGENT':
        return '/agent';
      default:
        return '/dashboard';
    }
  };

  const clearError = () => {
    setError(null);
  };

  const userRole = user?.role || null;

  const contextValue: AuthContextState = {
    user,
    profile,
    userRole,
    loading,
    isInitialized,
    error,
    login,
    loginWithGoogle,
    loginWithGithub,
    logout,
    getRedirectPath,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

// Simple hooks
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
    role: user?.role || 'USER',
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

export default SupabaseAuthProvider;