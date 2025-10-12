'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi';
import styles from './Toast.module.css';

export interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

/**
 * Toast Notification Component
 * 
 * Displays temporary notification messages with:
 * - Slide-in from top-right animation
 * - Auto-dismiss after specified duration
 * - Progress bar showing remaining time
 * - Close button
 */
export default function Toast({ id, message, type, duration = 3000, onClose }: ToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 100));
        if (newProgress <= 0) {
          clearInterval(interval);
          onClose(id);
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, id, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheck />;
      case 'error':
        return <FiX />;
      case 'warning':
        return <FiAlertCircle />;
      case 'info':
        return <FiInfo />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, y: -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`${styles.toast} ${styles[type]}`}
    >
      <div className={styles.icon}>{getIcon()}</div>
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className={styles.closeButton}
        aria-label="Close notification"
      >
        <FiX />
      </button>
      <div className={styles.progressBar}>
        <motion.div
          className={styles.progressFill}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}

/**
 * Toast Container Component
 */
export function ToastContainer({ toasts, onClose }: { 
  toasts: ToastProps[];
  onClose: (id: string) => void;
}) {
  return (
    <div className={styles.container}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}



