/**
 * SupabaseAuthContext - Simplified Authentication Context
 * Focuses on essential authentication functionality without complex database operations
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
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
  
  // Session management timers
  const lastActivityTime = useRef<number>(Date.now());
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const warningTimer = useRef<NodeJS.Timeout | null>(null);
  const warningShown = useRef<boolean>(false);
  
  // Session configuration
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

  // Simple initialization with proper error handling
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading('initializing');
        
        console.log('🔄 Initializing authentication...');
        
        // Get the current session without forcing a refresh
        // This allows the user to login fresh without interference
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[Auth] Session error:', sessionError);
          // Don't throw - just log and continue with no session
          console.log('[Auth] Continuing without session');
          setIsInitialized(true);
          setLoading('idle');
          return;
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
            
            // Try to get role from user metadata or email
            const metadataRole = session.user.user_metadata?.role as UserRole | undefined;
            const email = session.user.email || '';
            let fallbackRole: UserRole = 'USER';
            
            if (metadataRole && ['SUPER_ADMIN', 'ADMIN', 'TOUR_OPERATOR', 'TRAVEL_AGENT', 'USER'].includes(metadataRole)) {
              fallbackRole = metadataRole;
              console.log('🔍 Using role from user metadata:', fallbackRole);
            } else if (email.toLowerCase().includes('operator')) {
              fallbackRole = 'TOUR_OPERATOR';
              console.log('🔍 Detected operator email, assigning TOUR_OPERATOR role');
            } else if (email.toLowerCase().includes('admin')) {
              fallbackRole = 'ADMIN';
              console.log('🔍 Detected admin email, assigning ADMIN role');
            } else if (email.toLowerCase().includes('agent')) {
              fallbackRole = 'TRAVEL_AGENT';
              console.log('🔍 Detected agent email, assigning TRAVEL_AGENT role');
            }
            
            const userData: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              role: fallbackRole,
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
            
            console.log('👤 Init fallback user created with role:', userData.role);
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
        // Don't set error here - just continue without session
        // This allows fresh login attempts without interference
        console.log('[Auth] Init error, continuing without session');
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
      
      if (event === 'SIGNED_OUT') {
        // Clear user state on sign out
        setUser(null);
        setProfile(null);
        // If we're not already on the login page, redirect there
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
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
        console.log('📡 User ID:', data.user.id);
        
        try {
          // Use direct Supabase query (RLS policies handle security)
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (profileError) {
            console.error('❌ Profile query error:', profileError);
            setError({
              type: 'login_error',
              message: 'Failed to load user profile. Please try again.',
              timestamp: new Date()
            });
            return false;
          }
          
          if (!userProfile) {
            console.error('❌ No profile returned');
            setError({
              type: 'login_error',
              message: 'User profile not found. Please contact support.',
              timestamp: new Date()
            });
            return false;
          }
          
          console.log('✅ Profile loaded from Supabase:', userProfile);

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
                redirectUrl = '/agent';
                break;
              default:
                redirectUrl = '/';
            }
            console.log('✅ Login successful, redirecting to:', redirectUrl);
            return redirectUrl;
          } else {
            // Profile not found - this should not happen if user exists
            console.error('❌ No user profile found in database for user:', data.user.id);
            throw new Error('User profile not found in database. Please contact support.');
          }
        } catch (profileErr) {
          console.error('❌ Profile loading failed:', profileErr);
          setError({
            type: 'login_error',
            message: 'Failed to load user profile from database. Please try again or contact support.',
            timestamp: new Date()
          });
          return false;
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
          redirectUrl = '/agent';
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

  // ============================================================================
  // SESSION MANAGEMENT FUNCTIONS
  // ============================================================================

  const clearSessionTimers = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    if (warningTimer.current) {
      clearTimeout(warningTimer.current);
      warningTimer.current = null;
    }
    toast.dismiss('session-warning');
  };

  const showSessionWarning = () => {
    if (warningShown.current) return;
    
    warningShown.current = true;
    const minutesLeft = Math.floor(WARNING_TIME / 60000);
    
    toast.warning(`Your session will expire in ${minutesLeft} minutes due to inactivity.`, {
      duration: Infinity,
      id: 'session-warning',
      action: {
        label: 'Stay Logged In',
        onClick: () => {
          extendSession();
        },
      },
    });
    
    console.log(`⚠️ Session warning: ${minutesLeft} minutes remaining`);
  };

  const autoLogoutFromInactivity = async () => {
    console.log('🚪 Auto-logout due to inactivity');
    clearSessionTimers();
    
    toast.info('You have been logged out due to inactivity.', {
      duration: 5000,
    });
    
    // Don't call logout here to avoid circular dependency
    // Just clear state and redirect
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setError(null);
    
    if (typeof window !== 'undefined') {
      window.location.href = '/login?reason=inactivity';
    }
  };

  const extendSession = () => {
    if (!user) return;
    
    console.log('🔄 Session extended - resetting inactivity timer');
    
    toast.dismiss('session-warning');
    warningShown.current = false;
    lastActivityTime.current = Date.now();
    
    clearSessionTimers();
    
    // Set warning timer
    warningTimer.current = setTimeout(() => {
      showSessionWarning();
    }, INACTIVITY_TIMEOUT - WARNING_TIME);
    
    // Set logout timer
    inactivityTimer.current = setTimeout(() => {
      autoLogoutFromInactivity();
    }, INACTIVITY_TIMEOUT);
  };

  const trackActivity = () => {
    if (!user) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime.current;
    
    // Only reset if more than 1 minute has passed
    if (timeSinceLastActivity > 60000) {
      extendSession();
    }
  };

  // ============================================================================
  // SESSION MANAGEMENT EFFECT
  // ============================================================================

  useEffect(() => {
    if (!user || !isInitialized) {
      clearSessionTimers();
      return;
    }

    console.log('🔐 Session manager initialized');
    console.log(`⏱️  Inactivity timeout: ${INACTIVITY_TIMEOUT / 60000} minutes`);

    // Initialize timers
    extendSession();

    // Activity events to track
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach((event) => {
      window.addEventListener(event, trackActivity, { passive: true });
    });

    return () => {
      clearSessionTimers();
      activityEvents.forEach((event) => {
        window.removeEventListener(event, trackActivity);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isInitialized]);

  // ============================================================================
  // LOGOUT FUNCTION
  // ============================================================================

  const logout = async (): Promise<void> => {
    try {
      setLoading('authenticating');
      console.log('🚪 Logging out user...');
      
      // Clear session timers
      clearSessionTimers();
      
      // Sign out from Supabase (this clears the auth session)
      await supabase.auth.signOut();
      
      // Clear local state
      setUser(null);
      setProfile(null);
      setError(null);
      
      console.log('✅ Logout successful');
    } catch (err) {
      console.error('❌ Logout error:', err);
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
        console.log('🎯 Travel agent role - redirect to /agent');
        dashboardUrl = '/agent';
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