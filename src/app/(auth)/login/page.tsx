'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/SupabaseAuthContext';
import AuthLayout from '@/components/shared/AuthLayout';

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

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
    email: 'operator@test.com',
    password: 'password123',
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
  const router = useRouter();
  const { login, loginWithGoogle, loginWithGithub, loading, error, isInitialized, getRedirectPath } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    trigger
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  // Redirect if already authenticated
  useEffect(() => {
    if (isInitialized && !loading && getRedirectPath() !== '/login') {
      router.push(getRedirectPath());
    }
  }, [isInitialized, loading, getRedirectPath, router]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      setLoginError(error.message);
    }
  }, [error]);

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null);
    
    const success = await login(data.email, data.password, data.rememberMe);
    
    if (success) {
      // Redirect will happen automatically via useEffect
      router.push(getRedirectPath());
    }
  };

  const handleDemoLogin = async (account: DemoAccount) => {
    setValue('email', account.email);
    setValue('password', account.password);
    await trigger();
    
    const success = await login(account.email, account.password, false);
    
    if (success) {
      router.push(getRedirectPath());
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setLoginError(null);
    
    let success = false;
    if (provider === 'google') {
      success = await loginWithGoogle();
    } else if (provider === 'github') {
      success = await loginWithGithub();
    }
    
    if (success) {
      router.push(getRedirectPath());
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue"
      showTestimonials={true}
      showFeatures={true}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <motion.div
              className="relative"
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <input
                {...register('email')}
                type="email"
                id="email"
                autoComplete="email"
                autoFocus
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.email
                    ? 'border-red-500 focus:ring-red-500/20 bg-red-50 dark:bg-red-900/20'
                    : emailValue && !errors.email
                    ? 'border-green-500 focus:ring-green-500/20 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500/20 bg-white dark:bg-gray-700'
                }`}
                placeholder="Enter your email"
              />
              {emailValue && !errors.email && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <span className="text-green-500 text-lg">✓</span>
                </motion.div>
              )}
            </motion.div>
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-500 text-sm flex items-center space-x-1"
                >
                  <span>⚠️</span>
                  <span>{errors.email.message}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <motion.div
              className="relative"
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 pr-12 ${
                  errors.password
                    ? 'border-red-500 focus:ring-red-500/20 bg-red-50 dark:bg-red-900/20'
                    : passwordValue && !errors.password
                    ? 'border-green-500 focus:ring-green-500/20 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500/20 bg-white dark:bg-gray-700'
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
              {passwordValue && !errors.password && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-10 top-1/2 transform -translate-y-1/2"
                >
                  <span className="text-green-500 text-lg">✓</span>
                </motion.div>
              )}
            </motion.div>
            <AnimatePresence>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-500 text-sm flex items-center space-x-1"
                >
                  <span>⚠️</span>
                  <span>{errors.password.message}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <motion.label
              className="flex items-center space-x-2 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <input
                {...register('rememberMe')}
                type="checkbox"
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Remember me</span>
            </motion.label>
            <motion.a
              href="#"
              className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
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
            disabled={!isValid || loading === 'authenticating'}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              isValid && loading !== 'authenticating'
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
            whileHover={isValid && loading !== 'authenticating' ? { scale: 1.02, y: -1 } : {}}
            whileTap={isValid && loading !== 'authenticating' ? { scale: 0.98 } : {}}
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

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={loading === 'authenticating'}
              className="flex items-center justify-center space-x-2 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-lg">🔍</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Google</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => handleSocialLogin('github')}
              disabled={loading === 'authenticating'}
              className="flex items-center justify-center space-x-2 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-lg">🐙</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub</span>
            </motion.button>
          </div>
        </div>

        {/* Demo Account Quick Access */}
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

        {/* Bottom Links */}
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <motion.a
              href="/register"
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
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
