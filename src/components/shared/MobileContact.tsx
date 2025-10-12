'use client';

import React from 'react';
import { FiPhone, FiMail } from 'react-icons/fi';
import { createCallLink, createEmailLink } from '@/lib/mobile';
import styles from './MobileContact.module.css';

interface CallLinkProps {
  phone: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

/**
 * CallLink Component
 * 
 * Creates a click-to-call link optimized for mobile devices.
 * 
 * @example
 * <CallLink phone="+1-234-567-8900">
 *   Call Us
 * </CallLink>
 */
export function CallLink({ 
  phone, 
  children, 
  showIcon = true,
  className = '' 
}: CallLinkProps) {
  return (
    <a 
      href={createCallLink(phone)} 
      className={`${styles.callLink} ${className}`}
      aria-label={`Call ${phone}`}
    >
      {showIcon && <FiPhone className={styles.icon} />}
      <span>{children || phone}</span>
    </a>
  );
}

interface EmailLinkProps {
  email: string;
  subject?: string;
  body?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

/**
 * EmailLink Component
 * 
 * Creates a tap-to-email link optimized for mobile devices.
 * 
 * @example
 * <EmailLink 
 *   email="support@travelselbuy.com"
 *   subject="Contact Request"
 * >
 *   Email Us
 * </EmailLink>
 */
export function EmailLink({ 
  email, 
  subject, 
  body, 
  children, 
  showIcon = true,
  className = '' 
}: EmailLinkProps) {
  return (
    <a 
      href={createEmailLink(email, subject, body)} 
      className={`${styles.emailLink} ${className}`}
      aria-label={`Email ${email}`}
    >
      {showIcon && <FiMail className={styles.icon} />}
      <span>{children || email}</span>
    </a>
  );
}

interface ContactCardProps {
  phone?: string;
  email?: string;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * ContactCard Component
 * 
 * Displays contact information with mobile-optimized call and email links.
 * 
 * @example
 * <ContactCard
 *   phone="+1-234-567-8900"
 *   email="support@travelselbuy.com"
 *   title="Get in Touch"
 *   description="We're here to help 24/7"
 * />
 */
export function ContactCard({ 
  phone, 
  email, 
  title, 
  description,
  className = '' 
}: ContactCardProps) {
  return (
    <div className={`${styles.contactCard} ${className}`}>
      {title && <h3 className={styles.title}>{title}</h3>}
      {description && <p className={styles.description}>{description}</p>}
      
      <div className={styles.contactLinks}>
        {phone && (
          <CallLink phone={phone} className={styles.contactButton}>
            Call Now
          </CallLink>
        )}
        {email && (
          <EmailLink email={email} className={styles.contactButton}>
            Send Email
          </EmailLink>
        )}
      </div>
    </div>
  );
}




