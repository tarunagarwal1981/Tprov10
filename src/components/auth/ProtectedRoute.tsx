'use client';

import React from 'react';
import { useAuth, useRBAC } from '@/context/CognitoAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { UserRole } from '@/lib/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  requiredPermissions = [],
  fallback 
}: ProtectedRouteProps) {
  const { user, isInitialized } = useAuth();
  const { hasRole, hasPermission, userRole } = useRBAC();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to initialize before checking user
    if (!isInitialized) {
      console.log('[ProtectedRoute] Waiting for auth initialization...');
      return;
    }

    // Only redirect if auth is initialized AND user is null
    if (!user) {
      console.log('[ProtectedRoute] User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    // Check role-based access
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => hasRole(role));
      if (!hasRequiredRole) {
        router.push('/unauthorized');
        return;
      }
    }

    // Check permission-based access
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every(permission => 
        hasPermission(permission as any)
      );
      if (!hasRequiredPermissions) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isInitialized, user, requiredRoles, requiredPermissions, hasRole, hasPermission, router]);

  // Show loading while initializing OR while waiting for user to be loaded
  if (!isInitialized) {
    console.log('[ProtectedRoute] Auth not initialized, showing loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show loading while user is being loaded (but auth is initialized)
  if (!user) {
    console.log('[ProtectedRoute] Auth initialized but no user, showing loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Check role-based access
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  // Check permission-based access
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      hasPermission(permission as any)
    );
    if (!hasRequiredPermissions) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
