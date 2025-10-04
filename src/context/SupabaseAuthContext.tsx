/**
 * SupabaseAuthContext - Premium Authentication Context
 * Comprehensive authentication state management with role-based access control
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient, withErrorHandling, SupabaseError } from '@/lib/supabase/client';
import type { User, UserRole, UserProfile } from '@/lib/types';
import { toast } from 'sonner';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Authentication loading states
 */
export type AuthLoadingState = 
  | 'idle'
  | 'initializing'
  | 'authenticating'
  | 'loading_profile'
  | 'updating_profile'
  | 'uploading_avatar'
  | 'resetting_password'
  | 'updating_password';

/**
 * Authentication error types
 */
export type AuthErrorType = 
  | 'network_error'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_not_found'
  | 'email_already_exists'
  | 'weak_password'
  | 'session_expired'
  | 'permission_denied'
  | 'profile_update_failed'
  | 'avatar_upload_failed'
  | 'unknown_error';

/**
 * Authentication error interface
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  code?: string;
  retryable: boolean;
  timestamp: Date;
}

/**
 * User registration data
 */
export interface UserRegistrationData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
  profile?: Partial<UserProfile>;
}

/**
 * Profile update data
 */
export interface ProfileUpdateData {
  name?: string;
  phone?: string;
  profile?: Partial<UserProfile>;
}

/**
 * Session activity tracking
 */
export interface SessionActivity {
  lastActivity: Date;
  isActive: boolean;
  tabCount: number;
  rememberMe: boolean;
}

/**
 * Permission types
 */
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

/**
 * Route access levels
 */
export type RouteAccessLevel = 'public' | 'authenticated' | 'admin' | 'operator' | 'agent';

/**
 * Authentication context state
 */
export interface AuthContextState {
  // User data
  user: User | null;
  profile: UserProfile | null;
  session: any | null;
  
  // Loading states
  loading: AuthLoadingState;
  isInitialized: boolean;
  
  // Error handling
  error: AuthError | null;
  retryCount: number;
  
  // Session management
  sessionActivity: SessionActivity;
  isOnline: boolean;
  
  // Role and permissions
  userRole: UserRole | null;
  permissions: Permission[];
  
  // Authentication functions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithGithub: () => Promise<boolean>;
  register: (userData: UserRegistrationData) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  updateProfile: (data: ProfileUpdateData) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<string | null>;
  
  // Role-based functions
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
  canAccessRoute: (route: string, accessLevel: RouteAccessLevel) => boolean;
  getRedirectPath: () => string;
  
  // Utility functions
  clearError: () => void;
  retry: () => Promise<void>;
  refreshSession: () => Promise<void>;
  trackActivity: () => void;
}

/**
 * Authentication context provider props
 */
export interface AuthProviderProps {
  children: React.ReactNode;
  sessionTimeout?: number; // in minutes
  activityTimeout?: number; // in minutes
  enableRememberMe?: boolean;
  enableActivityTracking?: boolean;
}

// ============================================================================
// PERMISSION MAPPINGS
// ============================================================================

/**
 * Role to permissions mapping
 */
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

/**
 * Route access requirements
 */
const ROUTE_ACCESS: Record<string, RouteAccessLevel> = {
  '/': 'public',
  '/login': 'public',
  '/register': 'public',
  '/dashboard': 'authenticated',
  '/admin': 'admin',
  '/operator': 'operator',
  '/agent': 'agent',
  '/profile': 'authenticated',
  '/bookings': 'authenticated',
  '/packages': 'public',
  '/packages/create': 'operator',
  '/packages/edit': 'operator',
  '/analytics': 'admin',
  '/users': 'admin',
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const AuthContext = createContext<AuthContextState | undefined>(undefined);

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Create authentication error
 */
const createAuthError = (
  type: AuthErrorType,
  message: string,
  code?: string,
  retryable: boolean = false
): AuthError => ({
  type,
  message,
  code,
  retryable,
  timestamp: new Date(),
});

/**
 * Get user-friendly error message
 */
const getUserFriendlyMessage = (error: any): string => {
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (message.includes('email not confirmed')) {
      return 'Please check your email and click the confirmation link before signing in.';
    }
    if (message.includes('user not found')) {
      return 'No account found with this email address. Please check your email or create a new account.';
    }
    if (message.includes('email already registered')) {
      return 'An account with this email already exists. Please try signing in instead.';
    }
    if (message.includes('password should be at least')) {
      return 'Password must be at least 6 characters long. Please choose a stronger password.';
    }
    if (message.includes('network')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    if (message.includes('session')) {
      return 'Your session has expired. Please sign in again.';
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
};

// ============================================================================
// AUTHENTICATION PROVIDER
// ============================================================================

export const SupabaseAuthProvider: React.FC<AuthProviderProps> = ({
  children,
  sessionTimeout = 30, // 30 minutes
  activityTimeout = 15, // 15 minutes
  enableRememberMe = true,
  enableActivityTracking = true,
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState<AuthLoadingState>('initializing');
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [sessionActivity, setSessionActivity] = useState<SessionActivity>({
    lastActivity: new Date(),
    isActive: true,
    tabCount: 1,
    rememberMe: false,
  });
  const [isOnline, setIsOnline] = useState(true);

  // ============================================================================
  // SUPABASE CLIENT
  // ============================================================================
  
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  // ============================================================================
  // ONLINE/OFFLINE DETECTION
  // ============================================================================
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ============================================================================
  // ACTIVITY TRACKING
  // ============================================================================
  
  const trackActivity = useCallback(() => {
    if (!enableActivityTracking) return;
    
    setSessionActivity(prev => ({
      ...prev,
      lastActivity: new Date(),
      isActive: true,
    }));
  }, [enableActivityTracking]);

  useEffect(() => {
    if (!enableActivityTracking) return;
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
    };
  }, [trackActivity]);

  // ============================================================================
  // SESSION TIMEOUT HANDLING
  // ============================================================================
  
  useEffect(() => {
    if (!session || !enableActivityTracking) return;
    
    const checkActivity = () => {
      const now = new Date();
      const timeSinceActivity = now.getTime() - sessionActivity.lastActivity.getTime();
      const timeoutMs = sessionTimeout * 60 * 1000;
      
      if (timeSinceActivity > timeoutMs && !sessionActivity.rememberMe) {
        logout();
        toast.warning('Session expired due to inactivity');
      }
    };
    
    const interval = setInterval(checkActivity, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [session, sessionActivity, sessionTimeout, enableActivityTracking]);

  // ============================================================================
  // TAB COUNT TRACKING
  // ============================================================================
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        trackActivity();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackActivity]);

  // ============================================================================
  // PROFILE LOADING
  // ============================================================================
  
  const loadUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      setLoading('loading_profile');
      
      const { data, error } = await withErrorHandling(() =>
        supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()
      );
      
      if (error) {
        console.error('Error loading user profile:', error);
        return null;
      }
      
      return data?.profile || null;
    } catch (err) {
      console.error('Error loading user profile:', err);
      return null;
    } finally {
      setLoading('idle');
    }
  }, [supabase]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading('initializing');
        
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user as User);
          
          // Load user profile
          const userProfile = await loadUserProfile(initialSession.user.id);
          setProfile(userProfile);
        }
        
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            
            if (session?.user) {
              setSession(session);
              setUser(session.user as User);
              
              // Load user profile
              const userProfile = await loadUserProfile(session.user.id);
              setProfile(userProfile);
            } else {
              setSession(null);
              setUser(null);
              setProfile(null);
            }
            
            setError(null);
            setRetryCount(0);
          }
        );
        
        setIsInitialized(true);
        setLoading('idle');
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(createAuthError('unknown_error', 'Failed to initialize authentication'));
        setLoading('idle');
      }
    };
    
    initializeAuth();
  }, [supabase, loadUserProfile]);

  // ============================================================================
  // AUTHENTICATION FUNCTIONS
  // ============================================================================
  
  const login = useCallback(async (
    email: string, 
    password: string, 
    rememberMe: boolean = false
  ): Promise<boolean> => {
    try {
      setLoading('authenticating');
      setError(null);
      
      const { data, error } = await withErrorHandling(() =>
        supabase.auth.signInWithPassword({
          email,
          password,
        })
      );
      
      if (error) {
        const errorType = error.message.includes('Invalid login credentials') 
          ? 'invalid_credentials' 
          : 'unknown_error';
        
        setError(createAuthError(
          errorType,
          getUserFriendlyMessage(error),
          error.code,
          true
        ));
        
        toast.error(getUserFriendlyMessage(error));
        return false;
      }
      
      if (data.user) {
        setSessionActivity(prev => ({ ...prev, rememberMe }));
        toast.success('Welcome back!');
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Login error:', err);
      setError(createAuthError('unknown_error', 'Login failed. Please try again.'));
      toast.error('Login failed. Please try again.');
      return false;
    } finally {
      setLoading('idle');
    }
  }, [supabase]);

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      setLoading('authenticating');
      setError(null);
      
      const { data, error } = await withErrorHandling(() =>
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        })
      );
      
      if (error) {
        setError(createAuthError('unknown_error', 'Google login failed'));
        toast.error('Google login failed');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Google login error:', err);
      setError(createAuthError('unknown_error', 'Google login failed'));
      toast.error('Google login failed');
      return false;
    } finally {
      setLoading('idle');
    }
  }, [supabase]);

  const loginWithGithub = useCallback(async (): Promise<boolean> => {
    try {
      setLoading('authenticating');
      setError(null);
      
      const { data, error } = await withErrorHandling(() =>
        supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        })
      );
      
      if (error) {
        setError(createAuthError('unknown_error', 'GitHub login failed'));
        toast.error('GitHub login failed');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('GitHub login error:', err);
      setError(createAuthError('unknown_error', 'GitHub login failed'));
      toast.error('GitHub login failed');
      return false;
    } finally {
      setLoading('idle');
    }
  }, [supabase]);

  const register = useCallback(async (userData: UserRegistrationData): Promise<boolean> => {
    try {
      setLoading('authenticating');
      setError(null);
      
      const { data, error } = await withErrorHandling(() =>
        supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              name: userData.name,
              phone: userData.phone,
              role: userData.role || 'TRAVEL_AGENT',
            },
          },
        })
      );
      
      if (error) {
        const errorType = error.message.includes('already registered') 
          ? 'email_already_exists' 
          : 'unknown_error';
        
        setError(createAuthError(
          errorType,
          getUserFriendlyMessage(error),
          error.code,
          true
        ));
        
        toast.error(getUserFriendlyMessage(error));
        return false;
      }
      
      if (data.user) {
        // Create user profile in database
        const { error: profileError } = await withErrorHandling(() =>
          supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: userData.email,
              name: userData.name,
              phone: userData.phone,
              role: userData.role || 'TRAVEL_AGENT',
              profile: userData.profile || {},
            })
        );
        
        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
        
        toast.success('Account created successfully! Please check your email to confirm your account.');
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Registration error:', err);
      setError(createAuthError('unknown_error', 'Registration failed. Please try again.'));
      toast.error('Registration failed. Please try again.');
      return false;
    } finally {
      setLoading('idle');
    }
  }, [supabase]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading('authenticating');
      
      const { error } = await withErrorHandling(() =>
        supabase.auth.signOut()
      );
      
      if (error) {
        console.error('Logout error:', error);
        toast.error('Logout failed');
      } else {
        toast.success('Signed out successfully');
      }
      
      // Clear local state
      setUser(null);
      setProfile(null);
      setSession(null);
      setError(null);
      setRetryCount(0);
      setSessionActivity({
        lastActivity: new Date(),
        isActive: true,
        tabCount: 1,
        rememberMe: false,
      });
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Logout failed');
    } finally {
      setLoading('idle');
    }
  }, [supabase]);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      setLoading('resetting_password');
      setError(null);
      
      const { error } = await withErrorHandling(() =>
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
      );
      
      if (error) {
        setError(createAuthError('unknown_error', 'Password reset failed'));
        toast.error('Password reset failed');
        return false;
      }
      
      toast.success('Password reset email sent! Check your inbox.');
      return true;
    } catch (err) {
      console.error('Password reset error:', err);
      setError(createAuthError('unknown_error', 'Password reset failed'));
      toast.error('Password reset failed');
      return false;
    } finally {
      setLoading('idle');
    }
  }, [supabase]);

  const updatePassword = useCallback(async (newPassword: string): Promise<boolean> => {
    try {
      setLoading('updating_password');
      setError(null);
      
      const { error } = await withErrorHandling(() =>
        supabase.auth.updateUser({
          password: newPassword,
        })
      );
      
      if (error) {
        setError(createAuthError('unknown_error', 'Password update failed'));
        toast.error('Password update failed');
        return false;
      }
      
      toast.success('Password updated successfully!');
      return true;
    } catch (err) {
      console.error('Password update error:', err);
      setError(createAuthError('unknown_error', 'Password update failed'));
      toast.error('Password update failed');
      return false;
    } finally {
      setLoading('idle');
    }
  }, [supabase]);

  const updateProfile = useCallback(async (data: ProfileUpdateData): Promise<boolean> => {
    try {
      setLoading('updating_profile');
      setError(null);
      
      if (!user) {
        setError(createAuthError('permission_denied', 'User not authenticated'));
        return false;
      }
      
      const { error } = await withErrorHandling(() =>
        supabase
          .from('users')
          .update({
            name: data.name,
            phone: data.phone,
            profile: data.profile,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      );
      
      if (error) {
        setError(createAuthError('profile_update_failed', 'Profile update failed'));
        toast.error('Profile update failed');
        return false;
      }
      
      // Update local state
      if (data.name) {
        setUser(prev => prev ? { ...prev, name: data.name! } : null);
      }
      
      if (data.profile) {
        setProfile(prev => prev ? { ...prev, ...data.profile } : data.profile!);
      }
      
      toast.success('Profile updated successfully!');
      return true;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(createAuthError('profile_update_failed', 'Profile update failed'));
      toast.error('Profile update failed');
      return false;
    } finally {
      setLoading('idle');
    }
  }, [supabase, user]);

  const uploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    try {
      setLoading('uploading_avatar');
      setError(null);
      
      if (!user) {
        setError(createAuthError('permission_denied', 'User not authenticated'));
        return null;
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await withErrorHandling(() =>
        supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          })
      );
      
      if (uploadError) {
        setError(createAuthError('avatar_upload_failed', 'Avatar upload failed'));
        toast.error('Avatar upload failed');
        return null;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Update user profile with new avatar URL
      await updateProfile({
        profile: {
          ...profile,
          avatar_url: publicUrl,
        },
      });
      
      toast.success('Avatar updated successfully!');
      return publicUrl;
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError(createAuthError('avatar_upload_failed', 'Avatar upload failed'));
      toast.error('Avatar upload failed');
      return null;
    } finally {
      setLoading('idle');
    }
  }, [supabase, user, profile, updateProfile]);

  // ============================================================================
  // ROLE-BASED FUNCTIONS
  // ============================================================================
  
  const userRole = useMemo(() => user?.role || null, [user]);
  
  const permissions = useMemo(() => {
    if (!userRole) return [];
    return ROLE_PERMISSIONS[userRole] || [];
  }, [userRole]);
  
  const hasRole = useCallback((role: UserRole): boolean => {
    return userRole === role;
  }, [userRole]);
  
  const hasPermission = useCallback((permission: Permission): boolean => {
    return permissions.includes(permission);
  }, [permissions]);
  
  const canAccessRoute = useCallback((route: string, accessLevel: RouteAccessLevel): boolean => {
    if (accessLevel === 'public') return true;
    if (accessLevel === 'authenticated') return !!user;
    if (accessLevel === 'admin') return hasRole('ADMIN') || hasRole('SUPER_ADMIN');
    if (accessLevel === 'operator') return hasRole('TOUR_OPERATOR') || hasRole('ADMIN') || hasRole('SUPER_ADMIN');
    if (accessLevel === 'agent') return hasRole('TRAVEL_AGENT') || hasRole('ADMIN') || hasRole('SUPER_ADMIN');
    
    return false;
  }, [user, hasRole]);
  
  const getRedirectPath = useCallback((): string => {
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
  }, [user, userRole]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);
  
  const retry = useCallback(async (): Promise<void> => {
    if (retryCount >= 3) {
      setError(createAuthError('unknown_error', 'Maximum retry attempts reached'));
      return;
    }
    
    setRetryCount(prev => prev + 1);
    
    try {
      await refreshSession();
    } catch (err) {
      console.error('Retry failed:', err);
    }
  }, [retryCount]);
  
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const { error } = await withErrorHandling(() =>
        supabase.auth.refreshSession()
      );
      
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Session refresh failed:', err);
      throw err;
    }
  }, [supabase]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================
  
  const contextValue = useMemo<AuthContextState>(() => ({
    // User data
    user,
    profile,
    session,
    
    // Loading states
    loading,
    isInitialized,
    
    // Error handling
    error,
    retryCount,
    
    // Session management
    sessionActivity,
    isOnline,
    
    // Role and permissions
    userRole,
    permissions,
    
    // Authentication functions
    login,
    loginWithGoogle,
    loginWithGithub,
    register,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
    uploadAvatar,
    
    // Role-based functions
    hasRole,
    hasPermission,
    canAccessRoute,
    getRedirectPath,
    
    // Utility functions
    clearError,
    retry,
    refreshSession,
    trackActivity,
  }), [
    user,
    profile,
    session,
    loading,
    isInitialized,
    error,
    retryCount,
    sessionActivity,
    isOnline,
    userRole,
    permissions,
    login,
    loginWithGoogle,
    loginWithGithub,
    register,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
    uploadAvatar,
    hasRole,
    hasPermission,
    canAccessRoute,
    getRedirectPath,
    clearError,
    retry,
    refreshSession,
    trackActivity,
  ]);

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Use authentication context hook
 */
export const useAuth = (): AuthContextState => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider');
  }
  
  return context;
};

/**
 * Use authentication with type safety
 */
export const useAuthTyped = <T extends UserRole = UserRole>(): AuthContextState & {
  user: User & { role: T } | null;
  userRole: T | null;
} => {
  const context = useAuth();
  
  return {
    ...context,
    user: context.user as (User & { role: T }) | null,
    userRole: context.userRole as T | null,
  };
};

/**
 * Use role-based access control
 */
export const useRBAC = () => {
  const { hasRole, hasPermission, canAccessRoute, userRole, permissions } = useAuth();
  
  return {
    hasRole,
    hasPermission,
    canAccessRoute,
    userRole,
    permissions,
    isAdmin: hasRole('ADMIN') || hasRole('SUPER_ADMIN'),
    isOperator: hasRole('TOUR_OPERATOR'),
    isAgent: hasRole('TRAVEL_AGENT'),
  };
};

/**
 * Use session management
 */
export const useSession = () => {
  const { session, sessionActivity, isOnline, trackActivity, refreshSession } = useAuth();
  
  return {
    session,
    sessionActivity,
    isOnline,
    trackActivity,
    refreshSession,
    isSessionValid: !!session && sessionActivity.isActive,
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default SupabaseAuthProvider;
export { AuthContext };
export type {
  AuthContextState,
  AuthProviderProps,
  AuthLoadingState,
  AuthErrorType,
  AuthError,
  UserRegistrationData,
  ProfileUpdateData,
  SessionActivity,
  Permission,
  RouteAccessLevel,
};

