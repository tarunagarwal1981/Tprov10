'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/CognitoAuthContext';
import AuthLayout from '@/components/shared/AuthLayout';
import { PhoneLoginTab } from '@/components/auth/PhoneLoginTab';
import { EmailPasswordTab } from '@/components/auth/EmailPasswordTab';

type TabType = 'phone' | 'email';

const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('phone');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isInitialized, loading, getRedirectPath } = useAuth();

  // Debug logging
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

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <AuthLayout
      title="Login/Register"
      subtitle="Sign in to your account or create a new one"
      showTestimonials={false}
      showFeatures={false}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => {
              setActiveTab('phone');
              setError(null);
            }}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 relative ${
              activeTab === 'phone'
                ? 'text-[#FF6B35] dark:text-[#FF8C61]'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Phone Number
            {activeTab === 'phone' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35]"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('email');
              setError(null);
            }}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 relative ${
              activeTab === 'email'
                ? 'text-[#FF6B35] dark:text-[#FF8C61]'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Email & Password
            {activeTab === 'email' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35]"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'phone' ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <PhoneLoginTab onError={handleError} />
            </motion.div>
          ) : (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <EmailPasswordTab onError={handleError} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Error Display (if needed) */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-2">
                <span>⚠️</span>
                <span>{error}</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Links */}
        <div className="text-center space-y-4">
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
