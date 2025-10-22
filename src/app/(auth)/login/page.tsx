'use client';

import React, { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/SupabaseAuthContext';
import AuthLayout from '@/components/shared/AuthLayout';

interface DemoAccount {
  id: string;
  role: string;
  email: string;
  password: string;
  icon: string;
  gradient: string;
  description: string;
}

const demoAccounts: DemoAccount[] = [
  {
    id: 'admin',
    role: 'Admin',
    email: 'admin@test.com',
    password: 'password123',
    icon: '👑',
    gradient: 'from-purple-500 to-purple-700',
    description: 'Full system access'
  },
  {
    id: 'operator',
    role: 'Tour Operator',
    email: 'Operator@gmail.com',
    password: 'Operator123',
    icon: '🚌',
    gradient: 'from-blue-500 to-blue-700',
    description: 'Manage tours & bookings'
  },
  {
    id: 'agent',
    role: 'Travel Agent',
    email: 'agent@test.com',
    password: 'password123',
    icon: '✈️',
    gradient: 'from-green-500 to-green-700',
    description: 'Client management & sales'
  }
];

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const { login, loginWithGoogle, loading, error, isInitialized, getRedirectPath } = useAuth();
  
  // SSR-safe stable IDs for inputs
  const autoId = useId();
  const emailId = `login-email-${autoId}`;
  const passwordId = `login-password-${autoId}`;

  // Debug logging (throttled to first mount only to avoid noisy logs / loops)
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('Login page mounted');
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isInitialized && !loading && getRedirectPath() !== '/login') {
      const redirectUrl = getRedirectPath();
      console.log('🔄 Login page redirect - URL:', redirectUrl);
      router.push(redirectUrl);
    }
  }, [isInitialized, loading, getRedirectPath, router]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      setLoginError(error.message);
    }
  }, [error]);

  // Automatic cache clearing on mount to prevent login issues
  useEffect(() => {
    const clearOldSupabaseStorage = () => {
      try {
        // Check for corrupted or old Supabase session data
        const storageKeys = Object.keys(localStorage);
        const supabaseKeys = storageKeys.filter(key => key.includes('supabase') || key.includes('sb-'));
        
        if (supabaseKeys.length > 0) {
          // Check if any session data is expired or corrupted
          let needsClear = false;
          
          supabaseKeys.forEach(key => {
            try {
              const data = localStorage.getItem(key);
              if (data) {
                const parsed = JSON.parse(data);
                // Check if it's a session token and if it's expired
                if (parsed.expires_at && parsed.expires_at < Date.now() / 1000) {
                  needsClear = true;
                  console.log('🧹 Found expired session data, clearing...');
                }
              }
            } catch (e) {
              // Corrupted data - needs clearing
              needsClear = true;
              console.log('🧹 Found corrupted session data, clearing...');
            }
          });
          
          // Clear expired/corrupted data
          if (needsClear) {
            supabaseKeys.forEach(key => {
              localStorage.removeItem(key);
              console.log('Removed:', key);
            });
            
            // Also clear sessionStorage
            Object.keys(sessionStorage).forEach(key => {
              if (key.includes('supabase') || key.includes('sb-')) {
                sessionStorage.removeItem(key);
              }
            });
            
            console.log('✅ Old session data cleared automatically');
          }
        }
      } catch (error) {
        console.error('Error checking storage:', error);
      }
    };
    
    clearOldSupabaseStorage();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    // Basic validation
    if (!emailValue || !passwordValue) {
      setLoginError('Please fill in all fields');
      return;
    }
    
    try {
      console.log('🔐 Attempting login for:', emailValue);
      const redirectUrl = await login(emailValue, passwordValue, rememberMe);
      
      if (redirectUrl) {
        console.log('🔄 Login success redirect - URL:', redirectUrl);
        router.push(redirectUrl);
      } else {
        console.log('❌ Login failed - no redirect URL returned');
        setLoginError('Login failed. Please check your credentials and try again.');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setLoginError('An unexpected error occurred. Please try again.');
    }
  };

  const handleDemoLogin = async (account: DemoAccount) => {
    setEmailValue(account.email);
    setPasswordValue(account.password);
    
    const redirectUrl = await login(account.email, account.password, false);
    if (redirectUrl) {
      console.log('🔄 Demo login success redirect - URL:', redirectUrl);
      router.push(redirectUrl);
    }
  };

  const handleSocialLogin = async (provider: 'google') => {
    setLoginError(null);
    
    let success = false;
    if (provider === 'google') {
      success = await loginWithGoogle();
    }
    
    if (success) {
      const redirectUrl = getRedirectPath();
      console.log('🔄 Social login success redirect - URL:', redirectUrl);
      router.push(redirectUrl);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue"
      showTestimonials={false}
      showFeatures={false}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        {/* Login Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor={emailId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <motion.div
              className="relative"
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <input
                type="email"
                id={emailId}
                name="email"
                autoComplete="email"
                autoFocus
                disabled={loading === 'authenticating'}
                value={emailValue}
                onChange={(e) => {
                  setEmailValue(e.target.value);
                }}
                style={{ paddingLeft: '3.5rem', paddingRight: '3rem' }}
                className={`w-full py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                  loading === 'authenticating'
                    ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700'
                }`}
                placeholder="Enter your email"
              />
              <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              {emailValue && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-0 bottom-0 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor={passwordId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <motion.div
              className="relative"
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                id={passwordId}
                name="password"
                autoComplete="current-password"
                disabled={loading === 'authenticating'}
                value={passwordValue}
                onChange={(e) => {
                  setPasswordValue(e.target.value);
                }}
                style={{ paddingLeft: '3.5rem', paddingRight: '4rem' }}
                className={`w-full py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                  loading === 'authenticating'
                    ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700'
                }`}
                placeholder="Enter your password"
              />
              <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-0 bottom-0 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors z-10"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
              {passwordValue && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-11 top-0 bottom-0 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <motion.label
              className="flex items-center space-x-2 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Remember me</span>
            </motion.label>
            <motion.a
              href="#"
              className="text-sm text-[#FF6B35] hover:text-[#FF8C61] dark:text-[#FF8C61] dark:hover:text-[#FF6B35] transition-colors"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              Forgot password?
            </motion.a>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {loginError && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <p className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>{loginError}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={!emailValue || !passwordValue || loading === 'authenticating'}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              emailValue && passwordValue && loading !== 'authenticating'
                ? 'bg-[#FF6B35] hover:bg-[#E05A2A] text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
            whileHover={emailValue && passwordValue && loading !== 'authenticating' ? { scale: 1.02, y: -1 } : {}}
            whileTap={emailValue && passwordValue && loading !== 'authenticating' ? { scale: 0.98 } : {}}
          >
            {loading === 'authenticating' ? (
              <div className="flex items-center justify-center space-x-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        {/* Social Login */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <motion.button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={loading === 'authenticating'}
              className="flex items-center justify-center space-x-2 py-3 px-6 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Continue with Google</span>
            </motion.button>
          </div>
        </div>

        {/* Demo Account Quick Access - Commented out for production */}
        {/* 
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Try Demo Account
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Experience the platform with pre-configured accounts
            </p>
          </div>

          <div className="space-y-3">
            {demoAccounts.map((account, index) => (
              <motion.button
                key={account.id}
                onClick={() => handleDemoLogin(account)}
                disabled={loading === 'authenticating'}
                className={`w-full p-4 rounded-xl text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${account.gradient} shadow-lg hover:shadow-xl`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{account.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold">Demo as {account.role}</div>
                      <div className="text-sm opacity-90">{account.description}</div>
                    </div>
                  </div>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="text-lg">→</span>
                  </motion.div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
        */}

        {/* Bottom Links */}
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <motion.a
              href="/register"
              className="text-[#FF6B35] hover:text-[#E05A2A] dark:text-[#FF8C61] dark:hover:text-[#FF6B35] font-medium"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              Sign up
            </motion.a>
          </p>
          
          <div className="flex justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <motion.a
              href="#"
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Privacy Policy
            </motion.a>
            <span>•</span>
            <motion.a
              href="#"
              className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Terms of Service
            </motion.a>
          </div>
        </div>
      </motion.div>
      
    </AuthLayout>
  );
};

export default LoginPage;
