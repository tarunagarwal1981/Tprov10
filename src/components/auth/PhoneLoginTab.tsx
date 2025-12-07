'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { SignupForm } from './SignupForm';

// Country codes data (common countries)
const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
];

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

interface PhoneLoginTabProps {
  onError?: (error: string) => void;
}

export const PhoneLoginTab: React.FC<PhoneLoginTabProps> = ({ onError }) => {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'init' | 'signup'>('init');
  const [userData, setUserData] = useState<{
    countryCode: string;
    phoneNumber: string;
  } | null>(null);
  const router = useRouter();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaWidgetId = useRef<number | null>(null);

  // Load reCAPTCHA - wait for script to fully load
  useEffect(() => {
    if (!recaptchaLoaded || !RECAPTCHA_SITE_KEY) return;

    const renderRecaptcha = () => {
      if (
        typeof window !== 'undefined' &&
        window.grecaptcha &&
        recaptchaRef.current &&
        !recaptchaWidgetId.current
      ) {
        try {
          // Check if grecaptcha.ready exists (v3) or use directly (v2)
          if (window.grecaptcha.ready) {
            window.grecaptcha.ready(() => {
              if (recaptchaRef.current && !recaptchaWidgetId.current) {
                const widgetId = window.grecaptcha.render(recaptchaRef.current, {
                  sitekey: RECAPTCHA_SITE_KEY,
                  callback: (token: string) => {
                    setRecaptchaToken(token);
                  },
                  'expired-callback': () => {
                    setRecaptchaToken(null);
                  },
                  'error-callback': () => {
                    setRecaptchaToken(null);
                  },
                });
                recaptchaWidgetId.current = widgetId;
              }
            });
          } else {
            // Direct render for v2
            const widgetId = window.grecaptcha.render(recaptchaRef.current, {
              sitekey: RECAPTCHA_SITE_KEY,
              callback: (token: string) => {
                setRecaptchaToken(token);
              },
              'expired-callback': () => {
                setRecaptchaToken(null);
              },
              'error-callback': () => {
                setRecaptchaToken(null);
              },
            });
            recaptchaWidgetId.current = widgetId;
          }
        } catch (err) {
          console.error('reCAPTCHA render error:', err);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(renderRecaptcha, 100);
    return () => clearTimeout(timer);
  }, [recaptchaLoaded]);

  const handleRecaptchaLoad = () => {
    // Ensure grecaptcha is available
    if (typeof window !== 'undefined' && window.grecaptcha) {
      setRecaptchaLoaded(true);
    } else {
      // Retry after a short delay if not ready
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.grecaptcha) {
          setRecaptchaLoaded(true);
        }
      }, 500);
    }
  };

  const resetRecaptcha = () => {
    if (recaptchaWidgetId.current !== null && window.grecaptcha) {
      window.grecaptcha.reset(recaptchaWidgetId.current);
      setRecaptchaToken(null);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 6 && cleaned.length <= 15;
  };

  const handleNext = async () => {
    setError(null);

    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      const errMsg = 'Please enter a valid phone number';
      setError(errMsg);
      onError?.(errMsg);
      return;
    }

    if (process.env.NODE_ENV === 'production' && !recaptchaToken) {
      const errMsg = 'Please complete the reCAPTCHA verification';
      setError(errMsg);
      onError?.(errMsg);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/phone/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode,
          phoneNumber: phoneNumber.replace(/\D/g, ''),
          recaptchaToken: recaptchaToken || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize');
      }

      const userDataObj = {
        countryCode,
        phoneNumber: phoneNumber.replace(/\D/g, ''),
      };
      setUserData(userDataObj);

      if (data.mode === 'signup') {
        setMode('signup');
      } else {
        await requestOTP(userDataObj);
      }
    } catch (err: any) {
      console.error('Init error:', err);
      const errMsg = err.message || 'Something went wrong. Please try again.';
      setError(errMsg);
      onError?.(errMsg);
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  const requestOTP = async (data: { countryCode: string; phoneNumber: string }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/phone/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: data.countryCode,
          phoneNumber: data.phoneNumber,
          recaptchaToken: recaptchaToken || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send OTP');
      }

      resetRecaptcha();
      router.push(`/phone-otp?countryCode=${encodeURIComponent(data.countryCode)}&phoneNumber=${encodeURIComponent(data.phoneNumber)}&purpose=login`);
    } catch (err: any) {
      console.error('Request OTP error:', err);
      const errMsg = err.message || 'Failed to send OTP. Please try again.';
      setError(errMsg);
      onError?.(errMsg);
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (signupData: { email: string; name: string; companyName?: string }) => {
    if (!userData) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/phone/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: userData.countryCode,
          phoneNumber: userData.phoneNumber,
          email: signupData.email,
          name: signupData.name,
          companyName: signupData.companyName,
          recaptchaToken: recaptchaToken || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create account');
      }

      resetRecaptcha();
      router.push(`/phone-otp?countryCode=${encodeURIComponent(userData.countryCode)}&phoneNumber=${encodeURIComponent(userData.phoneNumber)}&purpose=signup&email=${encodeURIComponent(signupData.email)}&name=${encodeURIComponent(signupData.name)}&companyName=${encodeURIComponent(signupData.companyName || '')}`);
    } catch (err: any) {
      console.error('Signup error:', err);
      const errMsg = err.message || 'Failed to create account. Please try again.';
      setError(errMsg);
      onError?.(errMsg);
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'signup') {
    return (
      <SignupForm
        countryCode={userData?.countryCode || countryCode}
        phoneNumber={userData?.phoneNumber || phoneNumber}
        onSubmit={handleSignupSubmit}
        onBack={() => {
          setMode('init');
          setUserData(null);
          setError(null);
        }}
        loading={loading}
        error={error}
        recaptchaToken={recaptchaToken}
        onRecaptchaChange={setRecaptchaToken}
      />
    );
  }

  return (
    <>
      {RECAPTCHA_SITE_KEY && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=explicit`}
          onLoad={handleRecaptchaLoad}
          onError={() => {
            console.error('Failed to load reCAPTCHA script');
            setError('Failed to load security verification. Please refresh the page.');
          }}
          strategy="lazyOnload"
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        {/* Phone Number Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mobile Number
          </label>
          <div className="flex gap-2">
            {/* Country Code Selector */}
            <motion.div
              className="relative"
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={loading}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700 appearance-none cursor-pointer min-w-[140px]"
              >
                {COUNTRY_CODES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </motion.div>

            {/* Phone Number Input */}
            <motion.div
              className="relative flex-1"
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setPhoneNumber(value);
                }}
                disabled={loading}
                placeholder="Enter your mobile number"
                className={`w-full py-3 px-4 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                  loading
                    ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700'
                }`}
                maxLength={15}
              />
              {phoneNumber && validatePhoneNumber(phoneNumber) && (
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
        </div>

        {/* reCAPTCHA */}
        {RECAPTCHA_SITE_KEY && (
          <div className="flex justify-center">
            <div ref={recaptchaRef} id="recaptcha-container" />
          </div>
        )}

        {/* Error Display */}
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

        {/* Next Button */}
        <motion.button
          type="button"
          onClick={handleNext}
          disabled={!phoneNumber || !validatePhoneNumber(phoneNumber) || loading || (process.env.NODE_ENV === 'production' && !recaptchaToken)}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            phoneNumber && validatePhoneNumber(phoneNumber) && !loading && (process.env.NODE_ENV !== 'production' || recaptchaToken)
              ? 'bg-[#FF6B35] hover:bg-[#E05A2A] text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
          whileHover={
            phoneNumber && validatePhoneNumber(phoneNumber) && !loading && (process.env.NODE_ENV !== 'production' || recaptchaToken)
              ? { scale: 1.02, y: -1 }
              : {}
          }
          whileTap={
            phoneNumber && validatePhoneNumber(phoneNumber) && !loading && (process.env.NODE_ENV !== 'production' || recaptchaToken)
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
              <span>Processing...</span>
            </div>
          ) : (
            'NEXT'
          )}
        </motion.button>
      </motion.div>
    </>
  );
};

// Extend Window interface for reCAPTCHA
declare global {
  interface Window {
    grecaptcha: {
      render: (container: HTMLElement, options: any) => number;
      reset: (widgetId: number) => void;
      ready?: (callback: () => void) => void;
    };
  }
}

