'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/shared/AuthLayout';
import Script from 'next/script';

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

const PhoneLoginPage: React.FC = () => {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'init' | 'signup' | 'otp'>('init');
  const [userData, setUserData] = useState<{
    countryCode: string;
    phoneNumber: string;
    email?: string;
    name?: string;
    companyName?: string;
  } | null>(null);
  const router = useRouter();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaWidgetId = useRef<number | null>(null);

  // Load reCAPTCHA
  useEffect(() => {
    if (typeof window !== 'undefined' && window.grecaptcha && recaptchaRef.current && !recaptchaWidgetId.current) {
      try {
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
      } catch (err) {
        console.error('reCAPTCHA render error:', err);
      }
    }
  }, [recaptchaLoaded]);

  const handleRecaptchaLoad = () => {
    setRecaptchaLoaded(true);
  };

  const resetRecaptcha = () => {
    if (recaptchaWidgetId.current !== null && window.grecaptcha) {
      window.grecaptcha.reset(recaptchaWidgetId.current);
      setRecaptchaToken(null);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic validation: 6-15 digits
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 6 && cleaned.length <= 15;
  };

  const handleNext = async () => {
    setError(null);

    // Validation
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    // In production, require reCAPTCHA
    if (process.env.NODE_ENV === 'production' && !recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    setLoading(true);

    try {
      // Call init endpoint to check if user exists
      const response = await fetch('/api/auth/phone/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode,
          phoneNumber: phoneNumber.replace(/\D/g, ''), // Remove non-digits
          recaptchaToken: recaptchaToken || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize');
      }

      // Store user data
      const userDataObj = {
        countryCode,
        phoneNumber: phoneNumber.replace(/\D/g, ''),
      };
      setUserData(userDataObj);

      if (data.mode === 'signup') {
        // New user - show signup form
        setMode('signup');
      } else {
        // Existing user - request OTP
        await requestOTP(userDataObj);
      }
    } catch (err: any) {
      console.error('Init error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
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

      // Reset reCAPTCHA
      resetRecaptcha();

      // Navigate to OTP verification page
      router.push(`/phone-otp?countryCode=${encodeURIComponent(data.countryCode)}&phoneNumber=${encodeURIComponent(data.phoneNumber)}&purpose=login`);
    } catch (err: any) {
      console.error('Request OTP error:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (signupData: { email: string; name: string; companyName?: string; role: 'TRAVEL_AGENT' | 'TOUR_OPERATOR' }) => {
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
          role: signupData.role,
          recaptchaToken: recaptchaToken || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create account');
      }

      // Reset reCAPTCHA
      resetRecaptcha();

      // Navigate to OTP verification
      router.push(`/phone-otp?countryCode=${encodeURIComponent(userData.countryCode)}&phoneNumber=${encodeURIComponent(userData.phoneNumber)}&purpose=signup&email=${encodeURIComponent(signupData.email)}&name=${encodeURIComponent(signupData.name)}&companyName=${encodeURIComponent(signupData.companyName || '')}&role=${encodeURIComponent(signupData.role)}`);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
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
          src={`https://www.google.com/recaptcha/api.js?render=explicit&onload=onRecaptchaLoad`}
          onLoad={handleRecaptchaLoad}
          strategy="lazyOnload"
        />
      )}
      <AuthLayout
        title="Log in or Sign Up"
        subtitle="Enter your mobile number to continue"
        showTestimonials={false}
        showFeatures={false}
      >
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

          {/* Alternative Login */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Or{' '}
              <motion.a
                href="/login"
                className="text-[#FF6B35] hover:text-[#E05A2A] dark:text-[#FF8C61] dark:hover:text-[#FF6B35] font-medium"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                login with email
              </motion.a>
            </p>
          </div>

          {/* Support */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Not able to Login? Call us at{' '}
            <a href="tel:+919513392500" className="text-[#FF6B35] hover:underline">
              +919513392500
            </a>
          </div>
        </motion.div>
      </AuthLayout>
    </>
  );
};

// Signup Form Component
interface SignupFormProps {
  countryCode: string;
  phoneNumber: string;
  onSubmit: (data: { email: string; name: string; companyName?: string; role: 'TRAVEL_AGENT' | 'TOUR_OPERATOR' }) => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
  recaptchaToken: string | null;
  onRecaptchaChange: (token: string | null) => void;
}

const SignupForm: React.FC<SignupFormProps> = ({
  countryCode,
  phoneNumber,
  onSubmit,
  onBack,
  loading,
  error,
  recaptchaToken,
  onRecaptchaChange,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  // Require explicit role selection
  const [role, setRole] = useState<'TRAVEL_AGENT' | 'TOUR_OPERATOR' | ''>('');
  const [formError, setFormError] = useState<string | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaWidgetId = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.grecaptcha && recaptchaRef.current && !recaptchaWidgetId.current) {
      try {
        const widgetId = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token: string) => {
            onRecaptchaChange(token);
          },
          'expired-callback': () => {
            onRecaptchaChange(null);
          },
          'error-callback': () => {
            onRecaptchaChange(null);
          },
        });
        recaptchaWidgetId.current = widgetId;
      } catch (err) {
        console.error('reCAPTCHA render error:', err);
      }
    }
  }, []);

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
    <AuthLayout
      title="Sign up"
      subtitle="Create your account"
      showTestimonials={false}
      showFeatures={false}
    >
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
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="abc@gmail.com"
              className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700"
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Enter Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              placeholder="Ex: Richard Parker"
              className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700"
            />
          </div>

          {/* Company Name (Optional) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Enter Company Name (Optional)
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={loading}
              placeholder="TravClan"
              className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 bg-white dark:bg-gray-700"
            />
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Roles can be extended later; choose the best fit now.
            </p>
          </div>

          {/* reCAPTCHA */}
          {RECAPTCHA_SITE_KEY && (
            <div className="flex justify-center">
              <div ref={recaptchaRef} id="recaptcha-container-signup" />
            </div>
          )}

          {/* Error */}
          { (formError || error) && (
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
            >
              {loading ? 'Creating...' : 'REQUEST OTP'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </AuthLayout>
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

export default PhoneLoginPage;

