'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaTwitter, FaLinkedin, FaFacebook, FaInstagram } from 'react-icons/fa';
import { BRAND } from '@/lib/branding';
import styles from './MarketingFooter.module.css';

/**
 * Marketing Footer Component
 * 
 * Comprehensive footer for public marketing pages with:
 * - Newsletter signup form
 * - Four-column layout (Company, Products, Resources, Legal)
 * - Social media icons
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

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      setEmail('');
    } catch (error) {
      console.error('Newsletter subscription failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Newsletter Section */}
        <div className={styles.newsletterSection}>
          <h2 className={styles.newsletterTitle}>Stay Updated</h2>
          <p className={styles.newsletterDescription}>
            Get the latest updates on travel technology and industry insights
          </p>
          
          {!isSubmitted ? (
            <form onSubmit={handleNewsletterSubmit} className={styles.newsletterForm}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className={styles.newsletterInput}
                required
                disabled={isSubmitting}
              />
              <button
                type="submit"
                className={styles.newsletterButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          ) : (
            <div className={styles.newsletterForm}>
              <p style={{ color: '#10B981', fontWeight: '600' }}>
                ✅ Thank you for subscribing! Check your email for confirmation.
              </p>
            </div>
          )}
        </div>

        {/* Columns Section */}
        <div className={styles.columnsSection}>
          {/* Company Column */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Company</h3>
            <div className={styles.columnLinks}>
              {companyLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.columnLink}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Products Column */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Products</h3>
            <div className={styles.columnLinks}>
              {productLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.columnLink}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Resources Column */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Resources</h3>
            <div className={styles.columnLinks}>
              {resourceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.columnLink}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal Column */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Legal</h3>
            <div className={styles.columnLinks}>
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.columnLink}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Social Media Section */}
        <div className={styles.socialSection}>
          <h3 className={styles.socialTitle}>Follow Us</h3>
          <div className={styles.socialIcons}>
            {socialLinks.map((social) => {
              const IconComponent = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialIcon}
                  aria-label={`Follow us on ${social.label}`}
                >
                  <IconComponent />
                </a>
              );
            })}
          </div>
        </div>

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
    </footer>
  );
}
