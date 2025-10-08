"use client";

import { useCallback } from 'react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { toast } from 'sonner';

export const useAuthErrorHandler = () => {
  const { logout } = useAuth();

  const handleAuthError = useCallback((error: any, customMessage?: string) => {
    console.error('Authentication error:', error);
    
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    
    // Check for specific authentication errors
    if (
      errorMessage.includes('Invalid Refresh Token') ||
      errorMessage.includes('JWT') ||
      errorMessage.includes('session') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('authentication')
    ) {
      const message = customMessage || 'Your session has expired. Please log in again.';
      toast.error(message, {
        duration: 5000,
        action: {
          label: 'Log In',
          onClick: () => {
            logout();
            window.location.href = '/login';
          }
        }
      });
      return true; // Indicates this was an auth error
    }
    
    return false; // Not an auth error
  }, [logout]);

  const handleApiError = useCallback((error: any, defaultMessage = 'An error occurred') => {
    if (handleAuthError(error)) {
      return; // Auth error was handled
    }
    
    // Handle other API errors
    const message = error?.message || defaultMessage;
    toast.error(message);
  }, [handleAuthError]);

  return {
    handleAuthError,
    handleApiError
  };
};

export default useAuthErrorHandler;
