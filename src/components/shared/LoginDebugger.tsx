"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/CognitoAuthContext';

export const LoginDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { user, loading, error, isInitialized } = useAuth();
  const [awsStatus, setAwsStatus] = useState<any>({});

  useEffect(() => {
    const checkAwsConnection = async () => {
      try {
        // Check AWS Cognito status
        const cognitoStatus = {
          hasRegion: !!process.env.NEXT_PUBLIC_AWS_REGION,
          region: process.env.NEXT_PUBLIC_AWS_REGION || 'not set',
        };

        // Check API connection
        const apiStatus = { connected: false, error: null };
        try {
          const response = await fetch('/api/health', { method: 'GET' });
          apiStatus.connected = response.ok;
        } catch (err: any) {
          apiStatus.error = err.message;
        }
        
        setAwsStatus({
          cognitoStatus,
          apiStatus,
        });
      } catch (err) {
        setAwsStatus({
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

    checkAwsConnection();
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
          <strong>AWS Status:</strong>
          <pre className="text-xs mt-1 overflow-auto max-h-20">
            {JSON.stringify(awsStatus, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default LoginDebugger;
