"use client";

import React, { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export const NetworkDebugger: React.FC = () => {
  const [networkStatus, setNetworkStatus] = useState<any>({});

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        console.log('🌐 Starting network diagnostics...');
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
        
        console.log('🌐 Network info:', networkInfo);
        
        // Test actual connectivity with a simple fetch
        console.log('🌐 Testing actual network connectivity...');
        try {
          const connectivityTest = await fetch('https://httpbin.org/get', {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-cache'
          });
          console.log('🌐 Connectivity test result:', connectivityTest.status);
        } catch (connectivityError) {
          console.log('🌐 Connectivity test failed:', connectivityError);
        }
        
        // Test direct HTTP request to Supabase
        const supabaseUrl = (supabase as any).supabaseUrl;
        console.log('🌐 Testing direct HTTP request to:', supabaseUrl);
        
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'HEAD',
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
            }
          });
          
          console.log('🌐 Direct HTTP response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          });
        } catch (httpError) {
          console.error('🌐 Direct HTTP request failed:', httpError);
        }
        
        // Test Supabase REST API directly
        console.log('🌐 Testing Supabase REST API...');
        const { data: restData, error: restError } = await supabase
          .from('users')
          .select('count')
          .limit(1);
          
        console.log('🌐 REST API test result:', { data: restData, error: restError });
        
        setNetworkStatus({
          networkInfo,
          supabaseUrl,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('🌐 Network check error:', err);
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
