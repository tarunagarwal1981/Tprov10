"use client";

import React, { useState, useEffect } from 'react';

export const NetworkDebugger: React.FC = () => {
  const [networkStatus, setNetworkStatus] = useState<any>({});

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        // Check network connectivity
        const networkInfo = {
          online: navigator.onLine,
          connection: (navigator as any).connection ? {
            effectiveType: (navigator as any).connection.effectiveType,
            downlink: (navigator as any).connection.downlink,
            rtt: (navigator as any).connection.rtt
          } : null
        };
        
        // Test AWS API connection
        const apiStatus = { connected: false, error: null };
        try {
          const response = await fetch('/api/health', { method: 'GET' });
          apiStatus.connected = response.ok;
        } catch (err: any) {
          apiStatus.error = err.message;
        }
        
        setNetworkStatus({
          networkInfo,
          apiStatus,
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
          <strong>API Status:</strong>
          <div className="text-xs mt-1">
            {networkStatus.apiStatus?.connected ? '✅ Connected' : '❌ Disconnected'}
            {networkStatus.apiStatus?.error && (
              <div className="text-red-300 mt-1">{networkStatus.apiStatus.error}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkDebugger;
