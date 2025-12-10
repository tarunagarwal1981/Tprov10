'use client';

import React, { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/CognitoAuthContext';

interface EmailPasswordTabProps {
  onError?: (error: string) => void;
}

export const EmailPasswordTab: React.FC<EmailPasswordTabProps> = ({ onError }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const { login, loading, error, isInitialized, getRedirectPath } = useAuth();
  
  // SSR-safe stable IDs for inputs
  const autoId = useId();
  const emailId = `login-email-${autoId}`;
  const passwordId = `login-password-${autoId}`;

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      setLoginError(error.message);
      onError?.(error.message);
    }
  }, [error, onError]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    if (!emailValue || !passwordValue) {
      const errMsg = 'Please fill in all fields';
      setLoginError(errMsg);
      onError?.(errMsg);
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
        const errMsg = 'Login failed. Please check your credentials and try again.';
        setLoginError(errMsg);
        onError?.(errMsg);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      const errMsg = 'An unexpected error occurred. Please try again.';
      setLoginError(errMsg);
      onError?.(errMsg);
    }
  };

  return (
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
    </motion.div>
  );
};

