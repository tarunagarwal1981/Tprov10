'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

interface SignupFormProps {
  countryCode: string;
  phoneNumber: string;
  onSubmit: (data: { email: string; name: string; companyName?: string; role: 'TRAVEL_AGENT' | 'TOUR_OPERATOR' }) => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
  recaptchaToken: string | null;
  onRecaptchaChange: (token: string | null) => void;
  recaptchaLoaded?: boolean; // Whether reCAPTCHA script has loaded
}

export const SignupForm: React.FC<SignupFormProps> = ({
  countryCode,
  phoneNumber,
  onSubmit,
  onBack,
  loading,
  error,
  recaptchaToken,
  onRecaptchaChange,
  recaptchaLoaded = false,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<'TRAVEL_AGENT' | 'TOUR_OPERATOR' | ''>('');
  const [formError, setFormError] = useState<string | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaWidgetId = useRef<number | null>(null);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      console.warn('⚠️ reCAPTCHA not configured: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set');
      return;
    }

    // Wait for script to load before trying to render
    if (!recaptchaLoaded) {
      console.log('⏳ Waiting for reCAPTCHA script to load in SignupForm...');
      return;
    }

    const renderRecaptcha = () => {
      if (
        typeof window !== 'undefined' &&
        window.grecaptcha &&
        recaptchaRef.current &&
        !recaptchaWidgetId.current
      ) {
        try {
          console.log('🔄 Attempting to render reCAPTCHA widget in SignupForm...');
          
          // Check if grecaptcha.ready exists (v3) or use directly (v2)
          if (window.grecaptcha.ready) {
            window.grecaptcha.ready(() => {
              if (recaptchaRef.current && !recaptchaWidgetId.current) {
                const widgetId = window.grecaptcha.render(recaptchaRef.current, {
                  sitekey: RECAPTCHA_SITE_KEY,
                  size: 'normal', // 'normal' or 'compact' - normal is less likely to trigger challenges
                  badge: 'bottomright', // Position of reCAPTCHA badge
                  callback: (token: string) => {
                    console.log('✅ reCAPTCHA token received in SignupForm');
                    onRecaptchaChange(token);
                  },
                  'expired-callback': () => {
                    console.log('⚠️ reCAPTCHA token expired in SignupForm');
                    onRecaptchaChange(null);
                  },
                  'error-callback': () => {
                    console.error('❌ reCAPTCHA error in SignupForm');
                    onRecaptchaChange(null);
                  },
                });
                recaptchaWidgetId.current = widgetId;
                console.log('✅ reCAPTCHA widget rendered successfully in SignupForm');
              }
            });
          } else {
            // Direct render for v2
        const widgetId = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          size: 'normal', // 'normal' or 'compact' - normal is less likely to trigger challenges
          badge: 'bottomright', // Position of reCAPTCHA badge
          callback: (token: string) => {
                console.log('✅ reCAPTCHA token received in SignupForm');
            onRecaptchaChange(token);
          },
          'expired-callback': () => {
                console.log('⚠️ reCAPTCHA token expired in SignupForm');
            onRecaptchaChange(null);
          },
          'error-callback': () => {
                console.error('❌ reCAPTCHA error in SignupForm');
            onRecaptchaChange(null);
          },
        });
        recaptchaWidgetId.current = widgetId;
            console.log('✅ reCAPTCHA widget rendered successfully in SignupForm');
          }
      } catch (err) {
          console.error('❌ reCAPTCHA render error in SignupForm:', err);
      }
      }
    };

    // Wait for grecaptcha to be available
    if (typeof window !== 'undefined' && window.grecaptcha) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(renderRecaptcha, 100);
      return () => clearTimeout(timer);
    } else {
      // Poll for grecaptcha if not available yet
      let renderTimer: NodeJS.Timeout | null = null;
      const checkInterval = setInterval(() => {
        if (typeof window !== 'undefined' && window.grecaptcha) {
          clearInterval(checkInterval);
          renderTimer = setTimeout(renderRecaptcha, 100);
        }
      }, 200);

      // Cleanup after 10 seconds if still not loaded
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
      }, 10000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
        if (renderTimer) {
          clearTimeout(renderTimer);
        }
      };
    }
  }, [onRecaptchaChange, recaptchaLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !role) {
      setFormError('Please select a role');
      return;
    }
    setFormError(null);
    onSubmit({ email, name, companyName: companyName || undefined, role });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mobile Number (Read-only) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mobile Number
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={`${countryCode} ${phoneNumber}`}
              disabled
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address <span className="text-red-500">*</span>
          </label>
          <motion.div
            className="relative"
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="abc@gmail.com"
              style={{ paddingLeft: '3.5rem', paddingRight: '3rem' }}
              className={`w-full py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                loading
                  ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700'
              }`}
            />
            <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            {email && (
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

        {/* Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Enter Name <span className="text-red-500">*</span>
          </label>
          <motion.div
            className="relative"
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              placeholder="Ex: Richard Parker"
              style={{ paddingLeft: '3.5rem', paddingRight: '3rem' }}
              className={`w-full py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                loading
                  ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700'
              }`}
            />
            <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            {name && (
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

        {/* Company Name (Optional) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Enter Company Name (Optional)
          </label>
          <motion.div
            className="relative"
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={loading}
              placeholder="TravClan"
              style={{ paddingLeft: '3.5rem', paddingRight: '3rem' }}
              className={`w-full py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                loading
                  ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700'
              }`}
            />
            <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </motion.div>
        </div>

        {/* Role Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Role (required)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setRole('TRAVEL_AGENT');
                setFormError(null);
              }}
              className={`p-3 rounded-xl border ${
                role === 'TRAVEL_AGENT'
                  ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                  : 'border-gray-300 dark:border-gray-600'
              } text-left transition`}
              disabled={loading}
            >
              <div className="font-semibold text-gray-900 dark:text-white">Travel Agent</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Browse packages, create itineraries, manage customers.
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('TOUR_OPERATOR');
                setFormError(null);
              }}
              className={`p-3 rounded-xl border ${
                role === 'TOUR_OPERATOR'
                  ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                  : 'border-gray-300 dark:border-gray-600'
              } text-left transition`}
              disabled={loading}
            >
              <div className="font-semibold text-gray-900 dark:text-white">Tour Operator</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                List packages, manage bookings, view analytics.
              </div>
            </button>
          </div>
          {/* Fallback select for mobile or if buttons don’t render */}
          <div className="md:hidden">
            <select
              value={role}
              onChange={(e) => {
                const val = e.target.value as 'TRAVEL_AGENT' | 'TOUR_OPERATOR' | '';
                setRole(val);
                setFormError(null);
              }}
              disabled={loading}
              required
              className="w-full mt-2 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
            >
              <option value="">Select your role</option>
              <option value="TRAVEL_AGENT">Travel Agent</option>
              <option value="TOUR_OPERATOR">Tour Operator</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Roles can be extended later; choose the best fit now.
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">Role selector loaded (login tab)</p>
        </div>

        {/* reCAPTCHA */}
        {RECAPTCHA_SITE_KEY && (
          <div className="flex justify-center">
            <div ref={recaptchaRef} id="recaptcha-container-signup" />
          </div>
        )}

        {/* Error */}
        {(formError || error) && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{formError || error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4">
          <motion.button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back
          </motion.button>
          <motion.button
            type="submit"
            disabled={!email || !name || !role || loading || (process.env.NODE_ENV === 'production' && !recaptchaToken)}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              email && name && role && !loading && (process.env.NODE_ENV !== 'production' || recaptchaToken)
                ? 'bg-[#FF6B35] hover:bg-[#E05A2A] text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={
              email && name && !loading && (process.env.NODE_ENV !== 'production' || recaptchaToken)
                ? { scale: 1.02, y: -1 }
                : {}
            }
            whileTap={
              email && name && !loading && (process.env.NODE_ENV !== 'production' || recaptchaToken)
                ? { scale: 0.98 }
                : {}
            }
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Creating...</span>
              </div>
            ) : (
              'REQUEST OTP'
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

