'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiAlertCircle } from 'react-icons/fi';
import styles from './AnimatedInput.module.css';

interface AnimatedInputProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  success?: boolean;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Animated Input Component
 * 
 * Enhanced input field with micro-interactions:
 * - Floating label animation
 * - Smooth border color transitions
 * - Icon color changes based on state
 * - Shake animation on error
 * - Success checkmark when valid
 * - Focus and hover states
 */
export default function AnimatedInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  success = false,
  required = false,
  disabled = false,
  icon,
  className = '',
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasShaken, setHasShaken] = useState(false);

  const hasValue = value.length > 0;
  const showFloatingLabel = isFocused || hasValue;

  // Trigger shake animation when error appears
  React.useEffect(() => {
    if (error) {
      setHasShaken(true);
      const timer = setTimeout(() => setHasShaken(false), 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [error]);

  const inputClasses = `
    ${styles.inputWrapper}
    ${isFocused ? styles.focused : ''}
    ${error ? styles.error : ''}
    ${success ? styles.success : ''}
    ${disabled ? styles.disabled : ''}
    ${hasShaken ? styles.shake : ''}
    ${className}
  `.trim();

  return (
    <div className={styles.container}>
      <div className={inputClasses}>
        {/* Icon */}
        {icon && (
          <motion.div
            className={styles.icon}
            animate={{
              color: error ? '#EF4444' : success ? '#10B981' : isFocused ? '#FF6B35' : '#9CA3AF'
            }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.div>
        )}

        {/* Input Field */}
        <div className={styles.inputContainer}>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={showFloatingLabel ? placeholder : label}
            required={required}
            disabled={disabled}
            className={styles.input}
          />

          {/* Floating Label */}
          <motion.label
            className={styles.label}
            initial={false}
            animate={{
              y: showFloatingLabel ? -24 : 0,
              scale: showFloatingLabel ? 0.85 : 1,
              color: error ? '#EF4444' : success ? '#10B981' : isFocused ? '#FF6B35' : '#6B7280'
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {required && <span className={styles.required}>*</span>}
          </motion.label>
        </div>

        {/* Success/Error Icon */}
        <AnimatePresence>
          {(success || error) && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className={styles.statusIcon}
            >
              {success ? (
                <FiCheck className={styles.successIcon} />
              ) : (
                <FiAlertCircle className={styles.errorIcon} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={styles.errorMessage}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}



