"use client";

import React, { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export const DatabaseChecker: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        
        // Check if users table exists and is accessible
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('count')
          .limit(1);

        // Check if we can query the table structure
        const { data: sampleUser, error: sampleError } = await supabase
          .from('users')
          .select('id, email, role, name')
          .limit(1);

        // Try to get the current user's profile specifically
        const { data: { session } } = await supabase.auth.getSession();
        let currentUserProfile = null;
        let currentUserError = null;
        
        if (session?.user) {
          const result = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          currentUserProfile = result.data;
          currentUserError = result.error;
        }

        setDbStatus({
          usersTableAccessible: !usersError,
          usersError: usersError?.message || null,
          sampleQuery: !sampleError,
          sampleError: sampleError?.message || null,
          sampleData: sampleUser,
          currentUserQuery: session?.user ? {
            accessible: !currentUserError,
            error: currentUserError?.message || null,
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
