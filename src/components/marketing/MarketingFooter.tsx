'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaTwitter, FaLinkedin, FaFacebook, FaInstagram } from 'react-icons/fa';
import { FiCheckCircle, FiMail, FiArrowUp, FiExternalLink } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND } from '@/lib/branding';
import styles from './MarketingFooter.module.css';

/**
 * Marketing Footer Component
 * 
 * Enhanced footer for public marketing pages with:
 * - Interactive newsletter signup with validation
 * - Animated social media icons
 * - Hover effects on links
 * - Back to top button
 * - Four-column layout (Company, Products, Resources, Legal)
 * - Payment icons
 * - Responsive design
 */

// Column data
const companyLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Our Story', href: '/our-story' },
  { label: 'Team', href: '/team' },
  { label: 'Careers', href: '/careers' },
  { label: 'Press', href: '/press' },
];

const productLinks = [
  { label: 'For Travel Agents', href: '/for-agents' },
  { label: 'For Tour Operators', href: '/for-operators' },
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Integration', href: '/integration' },
];

const resourceLinks = [
  { label: 'Help Center', href: '/help' },
  { label: 'Documentation', href: '/docs' },
  { label: 'Blog', href: '/blog' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Contact Support', href: '/contact' },
];

const legalLinks = [
  { label: 'Terms of Service', href: BRAND.legal.termsOfService },
  { label: 'Privacy Policy', href: BRAND.legal.privacyPolicy },
  { label: 'Cookie Policy', href: BRAND.legal.cookiePolicy },
  { label: 'Compliance', href: '/compliance' },
];

// Social media data
const socialLinks = [
  { icon: FaTwitter, href: BRAND.social.twitter, label: 'Twitter' },
  { icon: FaLinkedin, href: BRAND.social.linkedin, label: 'LinkedIn' },
  { icon: FaFacebook, href: BRAND.social.facebook, label: 'Facebook' },
  { icon: FaInstagram, href: BRAND.social.instagram, label: 'Instagram' },
];

export default function MarketingFooter() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Show/hide back to top button based on scroll
  React.useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Email validation
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (isSubmitting) return;

    setEmailError('');
    setIsSubmitting(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSubmitted(true);
      setEmail('');
      // Reset after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error) {
      console.error('Newsletter subscription failed:', error);
      setEmailError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={styles.newsletterSection}
        >
          <h2 className={styles.newsletterTitle}>Stay Updated</h2>
          <p className={styles.newsletterDescription}>
            Get the latest updates on travel technology and industry insights
          </p>
          
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.form
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onSubmit={handleNewsletterSubmit}
                className={styles.newsletterForm}
              >
                <div className={styles.inputWrapper}>
                  <FiMail className={styles.inputIcon} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    placeholder="Enter your email address"
                    className={`${styles.newsletterInput} ${emailError ? styles.inputError : ''}`}
                    disabled={isSubmitting}
                  />
                </div>
                <motion.button
                  type="submit"
                  className={styles.newsletterButton}
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        className={styles.spinner}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Subscribing...
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </motion.button>
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.errorMessage}
                  >
                    {emailError}
                  </motion.p>
                )}
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className={styles.successMessage}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <FiCheckCircle className={styles.successIcon} />
                </motion.div>
                <div>
                  <p className={styles.successTitle}>Thank you for subscribing!</p>
                  <p className={styles.successSubtitle}>Check your email for confirmation.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Columns Section - COMMENTED OUT - Will be connected to pages later */}
        {/* 
        <div className={styles.columnsSection}>
          {/* Company Column */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={styles.column}
          >
            <h3 className={styles.columnTitle}>Company</h3>
            <div className={styles.columnLinks}>
              {companyLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                >
                  <Link href={link.href} className={styles.columnLink}>
                    <span className={styles.linkText}>{link.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div> */}

          {/* Products Column */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={styles.column}
          >
            <h3 className={styles.columnTitle}>Products</h3>
            <div className={styles.columnLinks}>
              {productLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                >
                  <Link href={link.href} className={styles.columnLink}>
                    <span className={styles.linkText}>{link.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div> */}

          {/* Resources Column */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={styles.column}
          >
            <h3 className={styles.columnTitle}>Resources</h3>
            <div className={styles.columnLinks}>
              {resourceLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                >
                  <Link href={link.href} className={styles.columnLink}>
                    <span className={styles.linkText}>{link.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div> */}

          {/* Legal Column */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={styles.column}
          >
            <h3 className={styles.columnTitle}>Legal</h3>
            <div className={styles.columnLinks}>
              {legalLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                >
                  <Link href={link.href} className={styles.columnLink}>
                    <span className={styles.linkText}>{link.label}</span>
                    <FiExternalLink className={styles.externalIcon} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div> */}
        {/* </div> */}

        {/* Social Media Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className={styles.socialSection}
        >
          <h3 className={styles.socialTitle}>Follow Us</h3>
          <div className={styles.socialIcons}>
            {socialLinks.map((social, index) => {
              const IconComponent = social.icon;
              return (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialIcon}
                  aria-label={`Follow us on ${social.label}`}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1, type: 'spring', stiffness: 200 }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.1,
                    transition: { type: 'spring', stiffness: 300, damping: 10 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconComponent />
                </motion.a>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.copyright}>
            {BRAND.legal.copyright}
          </div>
          
          <div className={styles.paymentIcons}>
            <div className={styles.paymentIcon}>VISA</div>
            <div className={styles.paymentIcon}>MC</div>
            <div className={styles.paymentIcon}>AMEX</div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className={styles.backToTop}
            aria-label="Back to top"
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiArrowUp />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
}
