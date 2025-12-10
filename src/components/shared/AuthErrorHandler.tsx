"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/CognitoAuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export const AuthErrorHandler: React.FC = () => {
  const { error, clearError, logout } = useAuth();
  const router = useRouter();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!error) return null;

  // Don't show init errors as they're handled during initialization
  if (error.type === 'init_error') return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
        <FiAlertTriangle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800 dark:text-red-200">
          Authentication Error
        </AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-300 mt-2">
          {error.message}
        </AlertDescription>
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-red-700 border-red-300 hover:bg-red-100"
          >
            <FiRefreshCw className="h-3 w-3 mr-1" />
            Refresh Page
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-red-700 border-red-300 hover:bg-red-100"
          >
            Log In Again
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="text-red-600 hover:text-red-800"
          >
            Dismiss
          </Button>
        </div>
      </Alert>
    </div>
  );
};

export default AuthErrorHandler;
