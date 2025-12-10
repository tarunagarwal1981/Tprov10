'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/shared/AuthLayout';
import { useAuth } from '@/context/CognitoAuthContext';

const OTP_LENGTH = 6;
const OTP_RESEND_COOLDOWN = 60; // seconds

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic';

const PhoneOTPPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithPhoneOTP, registerWithPhoneOTP } = useAuth();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const countryCode = searchParams?.get('countryCode') || '';
  const phoneNumber = searchParams?.get('phoneNumber') || '';
  const purpose = (searchParams?.get('purpose') || 'login') as 'login' | 'signup';
  const email = searchParams?.get('email') || '';
  const name = searchParams?.get('name') || '';
  const companyName = searchParams?.get('companyName') || '';
  const role = (searchParams?.get('role') || '').toUpperCase() as 'TRAVEL_AGENT' | 'TOUR_OPERATOR' | '';

  // Redirect if missing required params
  useEffect(() => {
    if (!countryCode || !phoneNumber) {
      router.push('/phone-login');
      return;
    }
  }, [countryCode, phoneNumber, router]);

  // Start resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (value && index === OTP_LENGTH - 1) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === OTP_LENGTH) {
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const newOtp = Array(OTP_LENGTH).fill('');
    pastedData.split('').forEach((char, index) => {
      if (index < OTP_LENGTH) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);
    setError(null);

    // Focus last filled input or first empty
    const lastFilledIndex = Math.min(pastedData.length - 1, OTP_LENGTH - 1);
    inputRefs.current[lastFilledIndex]?.focus();

    // Auto-submit if complete
    if (pastedData.length === OTP_LENGTH) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== OTP_LENGTH) {
      setError('Please enter the complete OTP');
      return;
    }
    if (purpose === 'signup' && !role) {
      setError('Missing role. Please restart signup.');
      return;
    }

    setVerifying(true);
    setLoading(true);
    setError(null);

    try {
      let redirectUrl: string | false;

      if (purpose === 'signup') {
        // Use registerWithPhoneOTP for new users
        redirectUrl = await registerWithPhoneOTP({
          countryCode,
          phoneNumber,
          email,
          name,
          companyName,
          role: role as 'TRAVEL_AGENT' | 'TOUR_OPERATOR',
          otp: code,
        });
      } else {
        // Use loginWithPhoneOTP for existing users
        redirectUrl = await loginWithPhoneOTP(countryCode, phoneNumber, code);
      }

      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      setError(err.message || 'Invalid OTP. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    setError(null);
    setOtp(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();

    try {
      const endpoint = purpose === 'signup' ? '/api/auth/phone/signup' : '/api/auth/phone/request-otp';
      const body: any = {
        countryCode,
        phoneNumber,
      };

      if (purpose === 'signup') {
        body.email = email;
        body.name = name;
        body.companyName = companyName;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend OTP');
      }

      setResendCooldown(OTP_RESEND_COOLDOWN);
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const maskedPhone = phoneNumber.length > 4 
    ? `${phoneNumber.slice(0, 2)}****${phoneNumber.slice(-2)}`
    : phoneNumber;

  return (
    <AuthLayout
      title="Enter Verification Code"
      subtitle={`We've sent a code to ${countryCode} ${maskedPhone}`}
      showTestimonials={false}
      showFeatures={false}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        {/* OTP Input */}
        <div className="space-y-4">
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <motion.input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={loading || verifying}
                className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  digit
                    ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                } ${
                  loading || verifying
                    ? 'cursor-not-allowed opacity-50'
                    : 'focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]'
                }`}
                whileFocus={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resend OTP */}
          <div className="text-center">
            {resendCooldown > 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Resend code in <span className="font-semibold text-[#FF6B35]">{resendCooldown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-sm text-[#FF6B35] hover:text-[#E05A2A] dark:text-[#FF8C61] dark:hover:text-[#FF6B35] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>

        {/* Verify Button (Manual) */}
        <motion.button
          type="button"
          onClick={() => handleVerify()}
          disabled={otp.join('').length !== OTP_LENGTH || loading || verifying}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            otp.join('').length === OTP_LENGTH && !loading && !verifying
              ? 'bg-[#FF6B35] hover:bg-[#E05A2A] text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
          whileHover={
            otp.join('').length === OTP_LENGTH && !loading && !verifying
              ? { scale: 1.02, y: -1 }
              : {}
          }
          whileTap={
            otp.join('').length === OTP_LENGTH && !loading && !verifying
              ? { scale: 0.98 }
              : {}
          }
        >
          {verifying ? (
            <div className="flex items-center justify-center space-x-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
              <span>Verifying...</span>
            </div>
          ) : (
            'Verify'
          )}
        </motion.button>

        {/* Back Link */}
        <div className="text-center">
          <motion.button
            type="button"
            onClick={() => router.push('/phone-login')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF6B35] transition-colors"
            whileHover={{ scale: 1.05 }}
          >
            ← Change phone number
          </motion.button>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

const PhoneOTPPage: React.FC = () => {
  return (
    <Suspense fallback={
      <AuthLayout
        title="Enter Verification Code"
        subtitle="Loading..."
        showTestimonials={false}
        showFeatures={false}
      >
        <div className="flex items-center justify-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full"
          />
        </div>
      </AuthLayout>
    }>
      <PhoneOTPPageContent />
    </Suspense>
  );
};

export default PhoneOTPPage;

