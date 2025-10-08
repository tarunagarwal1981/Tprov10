/**
 * Perfect Dashboard Layout Component
 * Comprehensive layout system with authentication, role-based access, and multiple variants
 */

'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useRBAC, useIsAuthenticated, useAuthLoading } from '@/context/SupabaseAuthContext';
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/types';
import {
  FiLoader,
  FiAlertTriangle,
  FiShield,
  FiArrowLeft,
  FiRefreshCw,
  FiWifi,
  FiWifiOff,
} from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  requiredRole?: UserRole[];
  requiredPermissions?: string[];
  loading?: boolean;
  variant?: 'default' | 'compact' | 'fullwidth' | 'centered';
  showHeader?: boolean;
  showSidebar?: boolean;
  className?: string;
  contentClassName?: string;
}

interface LoadingState {
  isLoading: boolean;
  message?: string;
}

interface LayoutState {
  isSidebarCollapsed: boolean;
  isSidebarOpen: boolean;
  isOnline: boolean;
  scrollPosition: number;
}

// ============================================================================
// LOADING COMPONENTS
// ============================================================================

const BrandedSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <motion.div
    className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >
    <div className="text-center">
      <motion.div
        className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-zinc-200 border-t-indigo-600"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <motion.h2
        className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        TravelPro
      </motion.h2>
      <motion.p
        className="text-sm text-zinc-600 dark:text-zinc-400 mt-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.p>
    </div>
  </motion.div>
);

const TopLoadingBar: React.FC<{ progress: number }> = ({ progress }) => (
  <motion.div
    className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"
    initial={{ scaleX: 0 }}
    animate={{ scaleX: progress / 100 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    style={{ transformOrigin: 'left' }}
  />
);

const SkeletonCard: React.FC = () => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="space-y-3">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
      </div>
    </CardContent>
  </Card>
);

const ContentSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 animate-pulse"></div>
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 animate-pulse"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

// ============================================================================
// ERROR COMPONENTS
// ============================================================================

const AccessDeniedPage: React.FC<{ 
  title: string; 
  message: string; 
  onRetry?: () => void;
}> = ({ title, message, onRetry }) => (
  <motion.div
    className="flex min-h-screen items-center justify-center p-4"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="w-full max-w-md">
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <FiShield className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          {title}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          {message}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            <FiRefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

const OfflinePage: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <motion.div
    className="flex min-h-screen items-center justify-center p-4"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="w-full max-w-md">
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
          <FiWifiOff className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          You&apos;re Offline
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Please check your internet connection and try again.
        </p>
        <Button onClick={onRetry} variant="outline">
          <FiWifi className="h-4 w-4 mr-2" />
          Check Connection
        </Button>
      </CardContent>
    </Card>
  </motion.div>
);

// ============================================================================
// BACKGROUND PATTERNS
// ============================================================================

const DotGridPattern: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'absolute inset-0 opacity-30',
      'bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.15)_1px,transparent_0)]',
      'dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)]',
      'bg-[length:20px_20px]',
      className
    )}
  />
);

const AnimatedGradient: React.FC<{ className?: string }> = ({ className }) => (
  <motion.div
    className={cn(
      'absolute inset-0 opacity-5',
      'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
      className
    )}
    animate={{
      background: [
        'linear-gradient(45deg, #6366f1, #8b5cf6, #ec4899)',
        'linear-gradient(45deg, #8b5cf6, #ec4899, #6366f1)',
        'linear-gradient(45deg, #ec4899, #6366f1, #8b5cf6)',
      ],
    }}
    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
  />
);

// ============================================================================
// MAIN DASHBOARD LAYOUT COMPONENT
// ============================================================================

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  requiredRole = [],
  requiredPermissions = [],
  loading = false,
  variant = 'default',
  showHeader = true,
  showSidebar = true,
  className,
  contentClassName,
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [layoutState, setLayoutState] = useState<LayoutState>({
    isSidebarCollapsed: false,
    isSidebarOpen: false,
    isOnline: true,
    scrollPosition: 0,
  });
  
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    message: 'Initializing...',
  });
  
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeProgress, setRouteProgress] = useState(0);
  
  // ============================================================================
  // HOOKS
  // ============================================================================
  
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { hasRole, hasPermission, userRole } = useRBAC();
  const { isAuthenticated } = useIsAuthenticated();
  const { isInitialized, isLoading } = useAuthLoading();

  // Use JSON.stringify to create stable references for arrays
  const requiredRoleKey = JSON.stringify(requiredRole);
  const requiredPermissionsKey = JSON.stringify(requiredPermissions);
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setLayoutState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setLayoutState(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Scroll position tracking
  useEffect(() => {
    const handleScroll = () => {
      setLayoutState(prev => ({ ...prev, scrollPosition: window.scrollY }));
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Authentication and authorization check
  useEffect(() => {
    if (!isInitialized) {
      setLoadingState({ isLoading: true, message: 'Initializing...' });
      return;
    }
    
    if (!isAuthenticated) {
      setLoadingState({ isLoading: false });
      router.push('/login');
      return;
    }
    
    // Check role-based access
    if (requiredRole.length > 0) {
      const hasRequiredRole = requiredRole.some(role => hasRole(role));
      if (!hasRequiredRole) {
        setLoadingState({ isLoading: false });
        return;
      }
    }
    
    // Check permission-based access
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every(permission => 
        hasPermission(permission as any)
      );
      if (!hasRequiredPermissions) {
        setLoadingState({ isLoading: false });
        return;
      }
    }
    
    setLoadingState({ isLoading: false });
  }, [
    isInitialized,
    isAuthenticated,
    requiredRoleKey,
    requiredPermissionsKey,
    hasRole,
    hasPermission,
    requiredRole,
    requiredPermissions,
    router,
  ]);
  
  // Route change loading
  useEffect(() => {
    const handleRouteChangeStart = () => {
      setRouteLoading(true);
      setRouteProgress(0);
    };
    
    const handleRouteChangeComplete = () => {
      setRouteLoading(false);
      setRouteProgress(100);
      setTimeout(() => setRouteProgress(0), 300);
    };
    
    // Simulate route change progress
    if (routeLoading) {
      const interval = setInterval(() => {
        setRouteProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
    return undefined;
  }, [routeLoading]);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleSidebarToggle = useCallback(() => {
    setLayoutState(prev => ({
      ...prev,
      isSidebarOpen: !prev.isSidebarOpen,
    }));
  }, []);
  
  const handleSidebarCollapse = useCallback(() => {
    setLayoutState(prev => ({
      ...prev,
      isSidebarCollapsed: !prev.isSidebarCollapsed,
    }));
  }, []);
  
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);
  
  // ============================================================================
  // ACCESS CONTROL LOGIC
  // ============================================================================
  
  const hasAccess = useCallback(() => {
    if (!isAuthenticated) return false;
    
    // Check role-based access
    if (requiredRole.length > 0) {
      const hasRequiredRole = requiredRole.some(role => hasRole(role));
      if (!hasRequiredRole) return false;
    }
    
    // Check permission-based access
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every(permission => 
        hasPermission(permission as any)
      );
      if (!hasRequiredPermissions) return false;
    }
    
    return true;
  }, [isAuthenticated, requiredRole, requiredPermissions, hasRole, hasPermission]);
  
  // ============================================================================
  // RENDER CONDITIONS
  // ============================================================================
  
  // Show loading spinner during initialization
  if (loadingState.isLoading) {
    return <BrandedSpinner message={loadingState.message} />;
  }
  
  // Show offline page if offline
  if (!layoutState.isOnline) {
    return <OfflinePage onRetry={handleRetry} />;
  }
  
  // Show access denied if no permission
  if (!hasAccess()) {
    return (
      <AccessDeniedPage
        title="Access Denied"
        message="You don't have permission to access this page."
        onRetry={handleRetry}
      />
    );
  }
  
  // ============================================================================
  // LAYOUT VARIANTS
  // ============================================================================
  
  const getLayoutClasses = () => {
    switch (variant) {
      case 'fullwidth':
        return 'flex flex-col min-h-screen';
      case 'centered':
        return 'flex items-center justify-center min-h-screen p-4';
      case 'compact':
        return 'flex h-screen';
      default:
        return 'flex h-screen';
    }
  };
  
  const getContentClasses = () => {
    const baseClasses = 'flex-1 flex flex-col overflow-hidden';
    
    if (variant === 'centered') {
      return 'w-full max-w-4xl';
    }
    
    if (variant === 'fullwidth') {
      return 'flex-1';
    }
    
    return baseClasses;
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className={cn('relative', getLayoutClasses(), className)}>
      {/* Background Patterns */}
      <DotGridPattern />
      <AnimatedGradient />
      
      {/* Route Loading Bar */}
      <AnimatePresence>
        {routeLoading && (
          <TopLoadingBar progress={routeProgress} />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      {showSidebar && variant !== 'fullwidth' && (
        <Sidebar />
      )}
      
      {/* Main Content Area */}
      <div className={getContentClasses()}>
        {/* Header */}
        {showHeader && variant !== 'fullwidth' && (
          <Header />
        )}
        
        {/* Content */}
        <motion.main
          className={cn(
            'flex-1 overflow-y-auto',
            variant === 'centered' ? 'p-0' : 'p-6 lg:p-8',
            contentClassName
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Page Header */}
          {(title || subtitle || actions) && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {title && (
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">
                      {subtitle}
                    </p>
                  )}
                </div>
                {actions && (
                  <div className="flex items-center gap-2 ml-4">
                    {actions}
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {/* Content */}
          <Suspense fallback={<ContentSkeleton />}>
            {loading ? <ContentSkeleton /> : children}
          </Suspense>
        </motion.main>
      </div>
      
      {/* Mobile Safe Area */}
      <div className="fixed bottom-0 left-0 right-0 h-safe-area-inset-bottom bg-zinc-50 dark:bg-zinc-900 pointer-events-none" />
    </div>
  );
};

// ============================================================================
// LAYOUT VARIANTS
// ============================================================================

export const DefaultLayout: React.FC<Omit<DashboardLayoutProps, 'variant'>> = (props) => (
  <DashboardLayout {...props} variant="default" />
);

export const CompactLayout: React.FC<Omit<DashboardLayoutProps, 'variant'>> = (props) => (
  <DashboardLayout {...props} variant="compact" />
);

export const FullWidthLayout: React.FC<Omit<DashboardLayoutProps, 'variant'>> = (props) => (
  <DashboardLayout {...props} variant="fullwidth" />
);

export const CenteredLayout: React.FC<Omit<DashboardLayoutProps, 'variant'>> = (props) => (
  <DashboardLayout {...props} variant="centered" />
);

// ============================================================================
// PROTECTED LAYOUT WRAPPERS
// ============================================================================

// Memoized role arrays to prevent re-creation on every render
const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];
const OPERATOR_ROLES: UserRole[] = ['TOUR_OPERATOR', 'ADMIN', 'SUPER_ADMIN'];
const AGENT_ROLES: UserRole[] = ['TRAVEL_AGENT', 'ADMIN', 'SUPER_ADMIN'];

export const AdminLayout: React.FC<Omit<DashboardLayoutProps, 'requiredRole'>> = (props) => (
  <DashboardLayout {...props} requiredRole={ADMIN_ROLES} />
);

export const OperatorLayout: React.FC<Omit<DashboardLayoutProps, 'requiredRole'>> = (props) => (
  <DashboardLayout {...props} requiredRole={OPERATOR_ROLES} />
);

export const AgentLayout: React.FC<Omit<DashboardLayoutProps, 'requiredRole'>> = (props) => (
  <DashboardLayout {...props} requiredRole={AGENT_ROLES} />
);

// ============================================================================
// EXPORTS
// ============================================================================

export default DashboardLayout;
export {
  BrandedSpinner,
  TopLoadingBar,
  ContentSkeleton,
  AccessDeniedPage,
  OfflinePage,
  DotGridPattern,
  AnimatedGradient,
};