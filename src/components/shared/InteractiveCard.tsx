'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './InteractiveCard.module.css';

interface InteractiveCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  variant?: 'default' | 'glow' | 'lift';
  disabled?: boolean;
}

/**
 * Interactive Card Component
 * 
 * Enhanced card with micro-interactions:
 * - Hover lift effect
 * - Shadow transition
 * - Optional glow border
 * - Click feedback
 */
export default function InteractiveCard({
  children,
  onClick,
  href,
  className = '',
  variant = 'default',
  disabled = false,
}: InteractiveCardProps) {
  const cardClasses = `
    ${styles.card}
    ${styles[variant]}
    ${disabled ? styles.disabled : ''}
    ${className}
  `.trim();

  const cardContent = (
    <motion.div
      className={cardClasses}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { 
        y: -4,
        transition: { duration: 0.2 }
      }}
      whileTap={disabled ? {} : { 
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
    >
      {children}
      {variant === 'glow' && <div className={styles.glowBorder} />}
    </motion.div>
  );

  if (href && !disabled) {
    return (
      <a href={href} className={styles.cardLink}>
        {cardContent}
      </a>
    );
  }

  return cardContent;
}



