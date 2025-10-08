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
  login: (email: string, password: string, rememberMe?: boolean) => Promise<string | false>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: UserRole;
    profile: any;
  }) => Promise<string | false>;
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

  // Simple initialization with proper error handling
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading('initializing');
        
        console.log('🔄 Initializing authentication...');
        
        // First, try to refresh the session if there's a stored refresh token
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.log('[Auth] Refresh failed:', refreshError.message);
          // Clear any invalid session data
          await supabase.auth.signOut();
        }
        
        // Get the current session (either refreshed or existing)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[Auth] Session error:', sessionError);
          throw sessionError;
        }
        
        console.log('[Auth] getSession() ->', session ? 'session found' : 'no session');
        
        if (session?.user) {
          console.log('👤 Session found, loading user profile from database...');
          
          // Load user profile from database to get the correct role
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          console.log('[Auth] profile query url:', `${(supabase as any).rest?.url || 'n/a'}/users`);
          if (profileError) console.log('[Auth] profile error:', profileError);

          console.log('📊 User profile from database:', userProfile);
          if (profileError) {
            console.error('❌ Profile error during init:', profileError);
          }

          if (userProfile) {
            // Parse the JSON profile field
            const profileData = typeof userProfile.profile === 'string' 
              ? JSON.parse(userProfile.profile) 
              : userProfile.profile || {};
            
            const userData: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: userProfile.name || session.user.email?.split('@')[0] || 'User',
              role: userProfile.role as UserRole, // Use role from database
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
              avatar_url: profileData.avatar_url || session.user.user_metadata?.avatar_url,
              phone: userProfile.phone || session.user.user_metadata?.phone,
              created_at: new Date(userProfile.created_at || session.user.created_at),
              updated_at: new Date(userProfile.updated_at || session.user.updated_at || session.user.created_at),
            };
            
            console.log('👤 User initialized with role:', userData.role);
            setUser(userData);
            setProfile(userData.profile);
          } else {
            // Fallback if no profile found in database
            console.warn('⚠️ No user profile found in database during init, using default');
            const userData: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              role: 'USER', // Default fallback
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
        } else {
          console.log('🔓 No active session found');
        }
        
        setIsInitialized(true);
        setLoading('idle');
      } catch (err) {
        console.error('❌ Auth init error:', err);
        setError({
          type: 'init_error',
          message: 'Failed to initialize authentication. Please log in again.',
          timestamp: new Date()
        });
        // Clear any invalid session data
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setIsInitialized(true);
        setLoading('idle');
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', event, session ? 'session exists' : 'no session');
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setError({
            type: 'session_expired',
            message: 'Your session has expired. Please log in again.',
            timestamp: new Date()
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Token was refreshed successfully, reload user profile
          try {
            const { data: userProfile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (userProfile && !profileError) {
              const profileData = typeof userProfile.profile === 'string' 
                ? JSON.parse(userProfile.profile) 
                : userProfile.profile || {};
              
              const userData: User = {
                id: session.user.id,
                email: session.user.email || '',
                name: userProfile.name || session.user.email?.split('@')[0] || 'User',
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
                avatar_url: profileData.avatar_url || session.user.user_metadata?.avatar_url,
                phone: userProfile.phone || session.user.user_metadata?.phone,
                created_at: new Date(userProfile.created_at || session.user.created_at),
                updated_at: new Date(userProfile.updated_at || session.user.updated_at || session.user.created_at),
              };
              
              setUser(userData);
              setProfile(userData.profile);
              console.log('[Auth] User profile refreshed after token refresh');
            }
          } catch (err) {
            console.error('[Auth] Error refreshing user profile after token refresh:', err);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const login = async (email: string, password: string, rememberMe?: boolean): Promise<string | false> => {
    try {
      setLoading('authenticating');
      setError(null);
      
      console.log('🔐 Starting login process for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('[Auth] signInWithPassword endpoint:', (supabase as any).auth?.url || 'n/a');
      
      if (error) {
        console.error('❌ Supabase auth error:', error);
        setError({
          type: 'login_error',
          message: error.message,
          timestamp: new Date()
        });
        return false;
      }
      
      console.log('✅ Sign in successful, Supabase user:', data.user);
      
      if (data.user) {
        // Load user profile from database to get the correct role
        console.log('🔍 Loading user profile from database...');
        
        try {
          // Test basic Supabase connection first
          const { data: testData, error: testError } = await supabase
            .from('users')
            .select('count')
            .limit(1);
          
          // Add timeout to prevent hanging
          const profileQuery = supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => {
              reject(new Error('Profile query timeout'));
            }, 5000)
          );

          const { data: userProfile, error: profileError } = await Promise.race([
            profileQuery,
            timeoutPromise
          ]) as any;
          
          if (profileError) {
            console.error('❌ Profile error:', profileError.message);
          }

          if (userProfile) {
            // Parse the JSON profile field
            const profileData = typeof userProfile.profile === 'string' 
              ? JSON.parse(userProfile.profile) 
              : userProfile.profile || {};
            
            const fullUser: User = {
              id: data.user.id,
              email: data.user.email || '',
              name: userProfile.name || data.user.email?.split('@')[0] || 'User',
              role: userProfile.role as UserRole, // Use role from database
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
              avatar_url: profileData.avatar_url || data.user.user_metadata?.avatar_url,
              phone: userProfile.phone || data.user.user_metadata?.phone,
              created_at: new Date(userProfile.created_at || data.user.created_at),
              updated_at: new Date(userProfile.updated_at || data.user.updated_at || data.user.created_at),
            };
            
            console.log('👤 Full user object created:', fullUser);
            console.log('🎭 User role from database:', fullUser.role);
            
            setUser(fullUser);
            setProfile(fullUser.profile);
            // Determine redirect URL immediately based on role
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
                redirectUrl = '/agent/dashboard';
                break;
              default:
                redirectUrl = '/';
            }
            return redirectUrl;
          } else {
            // Fallback if no profile found in database
            console.warn('⚠️ No user profile found in database, using default');
            const userData: User = {
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
              role: 'USER', // Default fallback
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
            // Default users go to home
            return '/';
          }
        } catch (profileErr) {
          console.error('❌ Profile loading failed:', profileErr);
          // Fallback to default user if profile loading fails
          console.warn('⚠️ Using fallback user data due to profile loading error');
          const fallbackUser: User = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            role: 'USER', // Default fallback
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
          setUser(fallbackUser);
          setProfile(fallbackUser.profile);
          return '/';
        }
      }
      
      return false;
    } catch (err) {
      console.error('❌ Login error:', err);
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

  const register = async (userData: {
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
      
      // Step 1: Create user account with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone,
            role: userData.role,
          }
        }
      });
      
      if (authError) {
        console.error('❌ Supabase auth error:', authError);
        setError({
          type: 'registration_error',
          message: authError.message,
          timestamp: new Date()
        });
        return false;
      }
      
      if (!authData.user) {
        console.error('❌ No user returned from signup');
        setError({
          type: 'registration_error',
          message: 'Registration failed - no user created',
          timestamp: new Date()
        });
        return false;
      }
      
      console.log('✅ User account created, ID:', authData.user.id);
      
      // Small delay to allow database triggers to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 2: Check if user profile already exists (might be created by database trigger)
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email, name, phone, role, profile')
        .eq('id', authData.user.id)
        .single();
      
      let profileData;
      let profileError;
      
      if (existingUser) {
        console.log('⚠️ User profile already exists, updating with registration data...');
        // Update existing user profile with registration data
        const { data, error } = await supabase
          .from('users')
          .update({
            email: userData.email,
            name: userData.name,
            phone: userData.phone,
            role: userData.role,
            profile: userData.profile,
            updated_at: new Date().toISOString(),
          })
          .eq('id', authData.user.id)
          .select()
          .single();
        
        profileData = data;
        profileError = error;
      } else {
        console.log('📝 Creating new user profile...');
        // Create new user profile
        const { data, error } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            phone: userData.phone,
            role: userData.role,
            profile: userData.profile,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        profileData = data;
        profileError = error;
      }
      
      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        setError({
          type: 'registration_error',
          message: 'Account created but profile setup failed. Please contact support.',
          timestamp: new Date()
        });
        return false;
      }
      
      console.log('✅ User profile created/updated successfully');
      
      // Step 4: Set up the user in the context
      const fullUser: User = {
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        profile: {
          timezone: userData.profile.timezone || 'UTC',
          language: userData.profile.language || 'en',
          currency: userData.profile.currency || 'USD',
          notification_preferences: {
            email: userData.profile.notification_preferences?.email ?? true,
            sms: userData.profile.notification_preferences?.sms ?? false,
            push: userData.profile.notification_preferences?.push ?? true,
            marketing: userData.profile.notification_preferences?.marketing ?? false,
          },
        },
        preferences: userData.profile.preferences || {},
        avatar_url: userData.profile.avatar_url,
        phone: userData.phone,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      setUser(fullUser);
      setProfile(fullUser.profile);
      
      // Determine redirect URL based on role
      let redirectUrl = '/';
      switch (userData.role) {
        case 'SUPER_ADMIN':
        case 'ADMIN':
          redirectUrl = '/admin/dashboard';
          break;
        case 'TOUR_OPERATOR':
          redirectUrl = '/operator/dashboard';
          break;
        case 'TRAVEL_AGENT':
          redirectUrl = '/agent/dashboard';
          break;
        default:
          redirectUrl = '/';
      }
      
      console.log('🎉 Registration completed successfully, redirecting to:', redirectUrl);
      return redirectUrl;
      
    } catch (err) {
      console.error('❌ Registration error:', err);
      setError({
        type: 'registration_error',
        message: 'Registration failed. Please try again.',
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
    console.log('🎯 getRedirectPath called with user:', user);
    console.log('🎯 getRedirectPath user role:', user?.role);
    
    if (!user) {
      console.log('🎯 No user - redirect to /login');
      return '/login';
    }
    
    const role = user.role;
    console.log('🎯 Using role:', role);
    
    let dashboardUrl = '/';
    
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        console.log('🎯 Admin role - redirect to /admin/dashboard');
        dashboardUrl = '/admin/dashboard';
        break;
      case 'TOUR_OPERATOR':
        console.log('🎯 Tour operator role - redirect to /operator/dashboard');
        dashboardUrl = '/operator/dashboard';
        break;
      case 'TRAVEL_AGENT':
        console.log('🎯 Travel agent role - redirect to /agent/dashboard');
        dashboardUrl = '/agent/dashboard';
        break;
      default:
        console.warn('⚠️ Unknown role:', role, '- redirect to /');
        dashboardUrl = '/';
    }
    
    console.log('🎯 Final dashboard URL:', dashboardUrl);
    return dashboardUrl;
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
    register,
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
    role: user?.role || null, // Changed from 'USER' to null to avoid false defaults
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

export default SupabaseAuthProvider;