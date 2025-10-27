"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { toast } from 'sonner';

/**
 * Session Manager Hook
 * 
 * Handles:
 * - Inactivity timeout (30 minutes)
 * - Session expiration warnings (5 minutes before)
 * - Auto logout on inactivity
 * - Activity tracking
 * 
 * Industry Standards:
 * - Inactivity timeout: 30 minutes
 * - Warning: 5 minutes before timeout
 * - Activity events: mouse, keyboard, touch, scroll
 */

interface SessionManagerConfig {
  inactivityTimeout?: number; // milliseconds (default: 30 minutes)
  warningTime?: number; // milliseconds before timeout to warn (default: 5 minutes)
  enabled?: boolean; // enable/disable (default: true)
}

export const useSessionManager = (config: SessionManagerConfig = {}) => {
  const {
    inactivityTimeout = 30 * 60 * 1000, // 30 minutes
    warningTime = 5 * 60 * 1000, // 5 minutes before timeout
    enabled = true,
  } = config;

  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(inactivityTimeout);

  const lastActivityTime = useRef<number>(Date.now());
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const warningTimer = useRef<NodeJS.Timeout | null>(null);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);
  const warningShown = useRef<boolean>(false);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    if (warningTimer.current) {
      clearTimeout(warningTimer.current);
      warningTimer.current = null;
    }
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
  }, []);

  // Show warning before logout
  const showExpiryWarning = useCallback(() => {
    if (warningShown.current) return;
    
    warningShown.current = true;
    setShowWarning(true);
    
    const warningDuration = warningTime;
    let remaining = warningDuration;
    
    // Start countdown
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
    }
    
    countdownTimer.current = setInterval(() => {
      remaining -= 1000;
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        if (countdownTimer.current) {
          clearInterval(countdownTimer.current);
        }
      }
    }, 1000);
    
    const minutesLeft = Math.floor(warningDuration / 60000);
    
    toast.warning(`Your session will expire in ${minutesLeft} minutes due to inactivity.`, {
      duration: Infinity,
      id: 'session-warning',
      action: {
        label: 'Stay Logged In',
        onClick: () => {
          extendSession();
        },
      },
      onDismiss: () => {
        // If dismissed without action, still track it
        warningShown.current = false;
        setShowWarning(false);
      },
    });
    
    console.log(`⚠️ Session warning: ${minutesLeft} minutes remaining`);
  }, [warningTime]);

  // Auto logout on inactivity
  const autoLogout = useCallback(async () => {
    console.log('🚪 Auto-logout due to inactivity');
    clearAllTimers();
    
    // Dismiss any existing toasts
    toast.dismiss('session-warning');
    
    // Show logout message
    toast.info('You have been logged out due to inactivity.', {
      duration: 5000,
    });
    
    await logout();
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login?reason=inactivity';
    }
  }, [logout, clearAllTimers]);

  // Extend/reset session
  const extendSession = useCallback(() => {
    console.log('🔄 Session extended - resetting inactivity timer');
    
    // Dismiss warning
    toast.dismiss('session-warning');
    warningShown.current = false;
    setShowWarning(false);
    setTimeRemaining(inactivityTimeout);
    
    // Update last activity
    lastActivityTime.current = Date.now();
    
    // Reset timers
    clearAllTimers();
    
    // Set warning timer (shows warning before logout)
    warningTimer.current = setTimeout(() => {
      showExpiryWarning();
    }, inactivityTimeout - warningTime);
    
    // Set inactivity timer (auto logout)
    inactivityTimer.current = setTimeout(() => {
      autoLogout();
    }, inactivityTimeout);
  }, [inactivityTimeout, warningTime, showExpiryWarning, autoLogout, clearAllTimers]);

  // Track user activity
  const trackActivity = useCallback(() => {
    if (!enabled || !user) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime.current;
    
    // Only reset if more than 1 minute has passed (avoid excessive resets)
    if (timeSinceLastActivity > 60000) {
      extendSession();
    }
  }, [enabled, user, extendSession]);

  // Set up activity listeners
  useEffect(() => {
    if (!enabled || !user) {
      clearAllTimers();
      return;
    }

    console.log('🔐 Session manager initialized');
    console.log(`⏱️  Inactivity timeout: ${inactivityTimeout / 60000} minutes`);
    console.log(`⚠️  Warning time: ${warningTime / 60000} minutes before timeout`);

    // Initialize timers
    extendSession();

    // Activity event types to track
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, trackActivity, { passive: true });
    });

    // Cleanup
    return () => {
      clearAllTimers();
      activityEvents.forEach((event) => {
        window.removeEventListener(event, trackActivity);
      });
      toast.dismiss('session-warning');
    };
  }, [enabled, user, trackActivity, extendSession, clearAllTimers, inactivityTimeout, warningTime]);

  return {
    showWarning,
    timeRemaining,
    extendSession,
    trackActivity,
  };
};

export default useSessionManager;

