'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User, UserRole, UserProfile } from '@/lib/types';

// Minimal types
export type AuthLoadingState = 'idle' | 'initializing' | 'authenticating';

export interface AuthError {
  type: string;
  message: string;
  timestamp: Date;
}

export interface AuthContextState {
  user: User | null;
  profile: UserProfile | null;
  session: any | null;
  loading: AuthLoadingState;
  isInitialized: boolean;
  error: AuthError | null;
  userRole: UserRole | null;
  
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
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState<AuthLoadingState>('initializing');
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const supabase = createSupabaseBrowserClient();

  const userRole = user?.role || null;

  // Simple initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading('initializing');
        
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user as User);
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
  }, []); // Empty dependency array

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
        setUser(data.user as User);
        setSession(data.session);
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
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        setError({
          type: 'oauth_error',
          message: 'Google login failed',
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
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        setError({
          type: 'oauth_error',
          message: 'GitHub login failed',
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
      setSession(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading('idle');
    }
  };

  const getRedirectPath = (): string => {
    if (!user) return '/login';
    
    switch (userRole) {
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

  const contextValue: AuthContextState = {
    user,
    profile,
    session,
    loading,
    isInitialized,
    error,
    userRole,
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
    displayName: profile?.name || user?.name || user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    avatar: profile?.avatar_url || '',
    role: user?.role || 'USER',
  };
};

export default SupabaseAuthProvider;
