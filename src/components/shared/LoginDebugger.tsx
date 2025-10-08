"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export const LoginDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { user, loading, error, isInitialized } = useAuth();
  const [supabaseStatus, setSupabaseStatus] = useState<any>({});

  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        
        // Check environment variables
        const envCheck = {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        };

        // Check Supabase connection
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        setSupabaseStatus({
          envCheck,
          session: session ? 'exists' : 'none',
          sessionError: sessionError?.message || null,
          supabaseUrl: (supabase as any).supabaseUrl || 'unknown',
        });
      } catch (err) {
        setSupabaseStatus({
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    };

    // Update debug info immediately
    setDebugInfo({
      user: user ? { id: user.id, email: user.email, role: user.role } : null,
      loading,
      error: error ? { type: error.type, message: error.message } : null,
      isInitialized,
      timestamp: new Date().toISOString(),
    });

    checkSupabaseConnection();
  }, [user, loading, error, isInitialized]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔧 Login Debug Info</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Auth State:</strong>
          <pre className="text-xs mt-1 overflow-auto max-h-20">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong>Supabase Status:</strong>
          <pre className="text-xs mt-1 overflow-auto max-h-20">
            {JSON.stringify(supabaseStatus, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default LoginDebugger;
