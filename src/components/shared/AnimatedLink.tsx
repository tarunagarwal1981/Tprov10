'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './AnimatedLink.module.css';

interface AnimatedLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: 'underline' | 'simple' | 'arrow';
  external?: boolean;
  className?: string;
}

/**
 * Animated Link Component
 * 
 * Enhanced link with micro-interactions:
 * - Animated underline on hover
 * - Smooth color transitions
 * - Optional arrow animation
 * - External link handling
 */
export default function AnimatedLink({
  href,
  children,
  variant = 'underline',
  external = false,
  className = '',
}: AnimatedLinkProps) {
  const linkClasses = `
    ${styles.link}
    ${styles[variant]}
    ${className}
  `.trim();

  const linkProps = external
    ? {
        target: '_blank',
        rel: 'noopener noreferrer',
      }
    : {};

  if (variant === 'arrow') {
    return (
      <Link href={href} {...linkProps} className={linkClasses}>
        <span className={styles.linkText}>{children}</span>
        <motion.span
          className={styles.arrow}
          initial={{ x: 0 }}
          whileHover={{ x: 4 }}
          transition={{ duration: 0.2 }}
        >
          →
        </motion.span>
      </Link>
    );
  }

  return (
    <Link href={href} {...linkProps} className={linkClasses}>
      <span className={styles.linkText}>{children}</span>
    </Link>
  );
}



