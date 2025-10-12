'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiLoader } from 'react-icons/fi';
import styles from './InteractiveButton.module.css';

interface InteractiveButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  showSuccessState?: boolean;
}

/**
 * Interactive Button Component
 * 
 * Enhanced button with micro-interactions:
 * - Ripple effect on click
 * - Loading spinner state
 * - Success checkmark animation
 * - Hover and active states
 */
export default function InteractiveButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  className = '',
  showSuccessState = false,
}: InteractiveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;

    // Create ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);

    // Handle click with loading state
    if (onClick) {
      const result = onClick(e);
      
      if (result instanceof Promise) {
        setIsLoading(true);
        try {
          await result;
          if (showSuccessState) {
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 2000);
          }
        } catch (error) {
          console.error('Button action failed:', error);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const buttonClasses = `
    ${styles.button}
    ${styles[variant]}
    ${styles[size]}
    ${disabled || isLoading ? styles.disabled : ''}
    ${className}
  `.trim();

  return (
    <motion.button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || isLoading}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
    >
      {/* Ripple Effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className={styles.ripple}
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}

      {/* Button Content */}
      <span className={styles.content}>
        {isLoading ? (
          <>
            <motion.div
              className={styles.spinner}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <FiLoader />
            </motion.div>
            <span>Loading...</span>
          </>
        ) : isSuccess ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className={styles.successIcon}
            >
              <FiCheck />
            </motion.div>
            <span>Success!</span>
          </>
        ) : (
          children
        )}
      </span>
    </motion.button>
  );
}

