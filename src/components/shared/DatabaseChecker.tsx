"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/CognitoAuthContext';

export const DatabaseChecker: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        // Check if users API endpoint is accessible
        const usersStatus: { accessible: boolean; error: string | null; data: any } = { accessible: false, error: null, data: null };
        try {
          const response = await fetch('/api/user/profile');
          usersStatus.accessible = response.ok;
          if (response.ok) {
            const data = await response.json();
            usersStatus.data = data;
          } else {
            usersStatus.error = `Status: ${response.status}`;
          }
        } catch (err: any) {
          usersStatus.error = err.message;
        }

        // Check current user profile if logged in
        let currentUserProfile = null;
        let currentUserError = null;
        
        if (user?.id) {
          try {
            const response = await fetch('/api/user/profile');
            if (response.ok) {
              const data = await response.json();
              currentUserProfile = data;
            } else {
              currentUserError = `Status: ${response.status}`;
            }
          } catch (err: any) {
            currentUserError = err.message;
          }
        }

        setDbStatus({
          usersTableAccessible: usersStatus.accessible,
          usersError: usersStatus.error,
          sampleQuery: usersStatus.accessible,
          sampleData: usersStatus.data,
          currentUserQuery: user?.id ? {
            accessible: !currentUserError,
            error: currentUserError,
            data: currentUserProfile
          } : null,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        setDbStatus({
          error: err instanceof Error ? err.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkDatabase();
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-blue-900/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🗄️ Database Status</h3>
      
      {isLoading ? (
        <div>Checking database...</div>
      ) : (
        <div className="space-y-2">
          <div>
            <strong>Users Table:</strong>
            <div className="text-xs mt-1">
              {dbStatus.usersTableAccessible ? (
                <span className="text-green-400">✅ Accessible</span>
              ) : (
                <span className="text-red-400">❌ Error: {dbStatus.usersError}</span>
              )}
            </div>
          </div>
          
          <div>
            <strong>Sample Query:</strong>
            <div className="text-xs mt-1">
              {dbStatus.sampleQuery ? (
                <span className="text-green-400">✅ Working</span>
              ) : (
                <span className="text-red-400">❌ Error: {dbStatus.sampleError}</span>
              )}
            </div>
          </div>
          
          {dbStatus.sampleData && (
            <div>
              <strong>Sample Data:</strong>
              <pre className="text-xs mt-1 overflow-auto max-h-20">
                {JSON.stringify(dbStatus.sampleData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseChecker;
