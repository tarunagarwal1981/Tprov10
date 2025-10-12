'use client';

import React from 'react';
import styles from './SkeletonLoader.module.css';

interface SkeletonLoaderProps {
  variant?: 'text' | 'title' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

/**
 * Skeleton Loader Component
 * 
 * Animated placeholder for loading states with shimmer effect
 */
export default function SkeletonLoader({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}: SkeletonLoaderProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'title':
        return { width: width || '60%', height: height || '32px' };
      case 'text':
        return { width: width || '100%', height: height || '16px' };
      case 'circular':
        return { 
          width: width || '48px', 
          height: height || '48px',
          borderRadius: '50%'
        };
      case 'rectangular':
        return { width: width || '100%', height: height || '200px' };
      case 'card':
        return { width: width || '100%', height: height || '300px' };
    }
  };

  const skeletonStyles = {
    ...getVariantStyles(),
    ...(typeof width === 'number' ? { width: `${width}px` } : width ? { width } : {}),
    ...(typeof height === 'number' ? { height: `${height}px` } : height ? { height } : {}),
  };

  if (count > 1) {
    return (
      <div className={styles.container}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`${styles.skeleton} ${styles[variant]} ${className}`}
            style={skeletonStyles}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={skeletonStyles}
    />
  );
}

/**
 * Skeleton Card Preset
 */
export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <SkeletonLoader variant="rectangular" height={200} />
      <div className={styles.cardContent}>
        <SkeletonLoader variant="title" />
        <SkeletonLoader variant="text" count={3} />
        <div className={styles.cardActions}>
          <SkeletonLoader width="30%" height={40} />
          <SkeletonLoader width="30%" height={40} />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton List Preset
 */
export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className={styles.list}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className={styles.listItem}>
          <SkeletonLoader variant="circular" width={48} height={48} />
          <div className={styles.listContent}>
            <SkeletonLoader variant="text" width="80%" />
            <SkeletonLoader variant="text" width="60%" />
          </div>
        </div>
      ))}
    </div>
  );
}



