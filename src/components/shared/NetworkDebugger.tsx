"use client";

import React, { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export const NetworkDebugger: React.FC = () => {
  const [networkStatus, setNetworkStatus] = useState<any>({});

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        
        // Check network connectivity
        const networkInfo = {
          online: navigator.onLine,
          connection: (navigator as any).connection ? {
            effectiveType: (navigator as any).connection.effectiveType,
            downlink: (navigator as any).connection.downlink,
            rtt: (navigator as any).connection.rtt
          } : null
        };
        
        // Test Supabase REST API directly
        const { data: restData, error: restError } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        
        setNetworkStatus({
          networkInfo,
          supabaseUrl: (supabase as any).supabaseUrl,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        setNetworkStatus({
          error: err instanceof Error ? err.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }
    };

    checkNetwork();
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-green-900/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🌐 Network Status</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Online:</strong> {networkStatus.networkInfo?.online ? '✅ Yes' : '❌ No'}
        </div>
        
        {networkStatus.networkInfo?.connection && (
          <div>
            <strong>Connection:</strong>
            <div className="text-xs mt-1">
              Type: {networkStatus.networkInfo.connection.effectiveType}<br/>
              Speed: {networkStatus.networkInfo.connection.downlink} Mbps<br/>
              RTT: {networkStatus.networkInfo.connection.rtt} ms
            </div>
          </div>
        )}
        
        <div>
          <strong>Supabase URL:</strong>
          <div className="text-xs mt-1 break-all">
            {networkStatus.supabaseUrl}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkDebugger;
