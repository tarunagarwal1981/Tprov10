'use client';

import React from 'react';
import styles from './SkipToContent.module.css';

/**
 * Skip to Content Link
 * 
 * Provides keyboard users a way to skip navigation and jump to main content.
 * Appears on focus and is hidden visually but accessible to screen readers.
 */
export default function SkipToContent() {
  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkip}
      className={styles.skipLink}
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}



