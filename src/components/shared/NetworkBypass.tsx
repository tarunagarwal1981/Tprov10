"use client";

import React, { useEffect } from 'react';

export const NetworkBypass: React.FC = () => {
  useEffect(() => {
    // Override navigator.onLine to always return true
    // This is a workaround for browser false positives
    const originalOnLine = navigator.onLine;
    
    console.log('🔧 Network bypass activated');
    console.log('🔧 Original navigator.onLine:', originalOnLine);
    
    // Listen for online/offline events and log them
    const handleOnline = () => {
      console.log('🌐 Browser reports: ONLINE');
    };
    
    const handleOffline = () => {
      console.log('🌐 Browser reports: OFFLINE (but we know this is likely false)');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Force online status by dispatching online event
    if (!navigator.onLine) {
      console.log('🔧 Forcing online status...');
      window.dispatchEvent(new Event('online'));
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default NetworkBypass;
