/**
 * Additional Authentication Hooks and Utilities
 * Companion hooks for the SupabaseAuthContext
 */

'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useAuth, useRBAC, useSession } from './SupabaseAuthContext';
import type { UserRole, Permission, RouteAccessLevel } from './SupabaseAuthContext';

// ============================================================================
// AUTHENTICATION STATUS HOOKS
// ============================================================================

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const { user, isInitialized } = useAuth();
  return isInitialized && !!user;
};

/**
 * Hook to get authentication loading state
 */
export const useAuthLoading = () => {
  const { loading, isInitialized } = useAuth();
  
  return {
    loading,
    isInitialized,
    isLoading: loading !== 'idle',
    isInitializing: loading === 'initializing',
    isAuthenticating: loading === 'authenticating',
    isUpdatingProfile: loading === 'updating_profile',
    isUploadingAvatar: loading === 'uploading_avatar',
  };
};

/**
 * Hook to get authentication error state
 */
export const useAuthError = () => {
  const { error, retryCount, clearError, retry } = useAuth();
  
  return {
    error,
    retryCount,
    hasError: !!error,
    canRetry: error?.retryable && retryCount < 3,
    clearError,
    retry,
  };
};

// ============================================================================
// ROLE-BASED ACCESS CONTROL HOOKS
// ============================================================================

/**
 * Hook to check if user has specific role
 */
export const useHasRole = (role: UserRole): boolean => {
  const { hasRole } = useRBAC();
  return hasRole(role);
};

/**
 * Hook to check if user has specific permission
 */
export const useHasPermission = (permission: Permission): boolean => {
  const { hasPermission } = useRBAC();
  return hasPermission(permission);
};

/**
 * Hook to check if user can access specific route
 */
export const useCanAccessRoute = (route: string, accessLevel: RouteAccessLevel): boolean => {
  const { canAccessRoute } = useRBAC();
  return canAccessRoute(route, accessLevel);
};

/**
 * Hook to get user role information
 */
export const useUserRole = () => {
  const { userRole, permissions, isAdmin, isOperator, isAgent } = useRBAC();
  
  return {
    userRole,
    permissions,
    isAdmin,
    isOperator,
    isAgent,
    isSuperAdmin: userRole === 'SUPER_ADMIN',
    isAdminOrSuper: isAdmin,
    isOperatorOrAbove: isOperator || isAdmin,
    isAgentOrAbove: isAgent || isOperator || isAdmin,
  };
};

// ============================================================================
// SESSION MANAGEMENT HOOKS
// ============================================================================

/**
 * Hook to get session information
 */
export const useSessionInfo = () => {
  const { session, sessionActivity, isOnline, trackActivity, refreshSession } = useSession();
  
  return {
    session,
    sessionActivity,
    isOnline,
    trackActivity,
    refreshSession,
    isSessionValid: !!session && sessionActivity.isActive,
    lastActivity: sessionActivity.lastActivity,
    isActive: sessionActivity.isActive,
    rememberMe: sessionActivity.rememberMe,
  };
};

/**
 * Hook to track user activity
 */
export const useActivityTracker = () => {
  const { trackActivity, sessionActivity } = useSession();
  const [isIdle, setIsIdle] = useState(false);
  
  useEffect(() => {
    const checkIdle = () => {
      const now = new Date();
      const timeSinceActivity = now.getTime() - sessionActivity.lastActivity.getTime();
      const idleThreshold = 5 * 60 * 1000; // 5 minutes
      
      setIsIdle(timeSinceActivity > idleThreshold);
    };
    
    const interval = setInterval(checkIdle, 60000); // Check every minute
    checkIdle(); // Initial check
    
    return () => clearInterval(interval);
  }, [sessionActivity.lastActivity]);
  
  return {
    trackActivity,
    isIdle,
    lastActivity: sessionActivity.lastActivity,
  };
};

// ============================================================================
// USER PROFILE HOOKS
// ============================================================================

/**
 * Hook to get user profile information
 */
export const useUserProfile = () => {
  const { user, profile, updateProfile, uploadAvatar } = useAuth();
  
  const updateUserProfile = useCallback(async (data: any) => {
    return await updateProfile(data);
  }, [updateProfile]);
  
  const uploadUserAvatar = useCallback(async (file: File) => {
    return await uploadAvatar(file);
  }, [uploadAvatar]);
  
  return {
    user,
    profile,
    updateProfile: updateUserProfile,
    uploadAvatar: uploadUserAvatar,
    hasProfile: !!profile,
    profileComplete: !!(profile && user?.name && user?.email),
  };
};

// ============================================================================
// AUTHENTICATION ACTIONS HOOKS
// ============================================================================

/**
 * Hook for authentication actions
 */
export const useAuthActions = () => {
  const {
    login,
    loginWithGoogle,
    loginWithGithub,
    register,
    logout,
    resetPassword,
    updatePassword,
  } = useAuth();
  
  const loginWithEmail = useCallback(async (email: string, password: string, rememberMe?: boolean) => {
    return await login(email, password, rememberMe);
  }, [login]);
  
  const loginWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    if (provider === 'google') {
      return await loginWithGoogle();
    } else if (provider === 'github') {
      return await loginWithGithub();
    }
    return false;
  }, [loginWithGoogle, loginWithGithub]);
  
  const registerUser = useCallback(async (userData: any) => {
    return await register(userData);
  }, [register]);
  
  const signOut = useCallback(async () => {
    await logout();
  }, [logout]);
  
  const resetUserPassword = useCallback(async (email: string) => {
    return await resetPassword(email);
  }, [resetPassword]);
  
  const changePassword = useCallback(async (newPassword: string) => {
    return await updatePassword(newPassword);
  }, [updatePassword]);
  
  return {
    login: loginWithEmail,
    loginWithOAuth,
    register: registerUser,
    logout: signOut,
    resetPassword: resetUserPassword,
    updatePassword: changePassword,
  };
};

// ============================================================================
// ROUTE PROTECTION HOOKS
// ============================================================================

/**
 * Hook for route protection
 */
export const useRouteProtection = () => {
  const { canAccessRoute, getRedirectPath } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  
  const protectRoute = useCallback((route: string, accessLevel: RouteAccessLevel) => {
    if (!isAuthenticated && accessLevel !== 'public') {
      return '/login';
    }
    
    if (!canAccessRoute(route, accessLevel)) {
      return getRedirectPath();
    }
    
    return null; // Access granted
  }, [isAuthenticated, canAccessRoute, getRedirectPath]);
  
  const canAccess = useCallback((route: string, accessLevel: RouteAccessLevel) => {
    return canAccessRoute(route, accessLevel);
  }, [canAccessRoute]);
  
  return {
    protectRoute,
    canAccess,
    getRedirectPath,
  };
};

// ============================================================================
// AUTHENTICATION STATE HOOKS
// ============================================================================

/**
 * Hook to get comprehensive authentication state
 */
export const useAuthState = () => {
  const auth = useAuth();
  const rbac = useRBAC();
  const session = useSession();
  const loading = useAuthLoading();
  const error = useAuthError();
  
  return {
    ...auth,
    ...rbac,
    ...session,
    ...loading,
    ...error,
  };
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to get user display information
 */
export const useUserDisplay = () => {
  const { user, profile } = useAuth();
  
  const displayName = useMemo(() => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  }, [user]);
  
  const displayEmail = useMemo(() => {
    return user?.email || '';
  }, [user]);
  
  const displayAvatar = useMemo(() => {
    return user?.avatar_url || profile?.avatar_url || null;
  }, [user, profile]);
  
  const initials = useMemo(() => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'U';
  }, [user]);
  
  return {
    displayName,
    displayEmail,
    displayAvatar,
    initials,
    hasAvatar: !!displayAvatar,
  };
};

/**
 * Hook to get authentication status for UI
 */
export const useAuthStatus = () => {
  const isAuthenticated = useIsAuthenticated();
  const { loading, isInitialized } = useAuthLoading();
  const { hasError, error } = useAuthError();
  
  return {
    isAuthenticated,
    isLoading: loading !== 'idle',
    isInitialized,
    hasError,
    error,
    isReady: isInitialized && !hasError,
    canShowContent: isInitialized && (isAuthenticated || !hasError),
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
  useHasRole,
  useHasPermission,
  useCanAccessRoute,
  useUserRole,
  useSessionInfo,
  useActivityTracker,
  useUserProfile,
  useAuthActions,
  useRouteProtection,
  useAuthState,
  useUserDisplay,
  useAuthStatus,
};
