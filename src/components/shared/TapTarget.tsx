'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { addHapticFeedback } from '@/lib/mobile';
import styles from './TapTarget.module.css';

interface TapTargetProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  hapticFeedback?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * TapTarget Component
 * 
 * Ensures minimum 44x44px tap target size for mobile accessibility.
 * Includes touch feedback and optional haptic feedback.
 * 
 * @example
 * <TapTarget onClick={handleClick}>
 *   <FiX />
 * </TapTarget>
 */
export default function TapTarget({
  children,
  onClick,
  href,
  hapticFeedback = false,
  className = '',
  ariaLabel,
}: TapTargetProps) {
  const handleTap = () => {
    if (hapticFeedback) {
      addHapticFeedback();
    }
    if (onClick) {
      onClick();
    }
  };

  const tapTargetClasses = `${styles.tapTarget} ${className}`.trim();

  if (href) {
    return (
      <motion.a
        href={href}
        className={tapTargetClasses}
        onClick={handleTap}
        whileTap={{ scale: 0.95 }}
        aria-label={ariaLabel}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      type="button"
      className={tapTargetClasses}
      onClick={handleTap}
      whileTap={{ scale: 0.95 }}
      aria-label={ariaLabel}
    >
      {children}
    </motion.button>
  );
}




