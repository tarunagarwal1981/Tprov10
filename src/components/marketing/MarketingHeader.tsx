'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiMenu, FiX } from 'react-icons/fi';
import { Logo } from './Logo';
import styles from './MarketingHeader.module.css';

/**
 * Marketing Header Component
 * 
 * Professional sticky header for public marketing pages with:
 * - TravelSelBuy logo (left)
 * - Navigation menu (center): Features | How It Works | Pricing | About | Contact
 * - CTA buttons (right): Login | Get Started
 * - Mobile-responsive with slide-in menu
 * - Backdrop blur effect
 * - Cross-browser compatibility
 */

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/features' },
  { label: 'How It Works', href: '/how-it-works' },
  // { label: 'Pricing', href: '/pricing' }, // Temporarily hidden - can be re-enabled later
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function MarketingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.headerContainer}>
          {/* Logo */}
          <div className={styles.logo}>
            <Logo variant="dark" size="md" />
          </div>

          {/* Navigation Menu - Desktop */}
          <nav className={styles.nav}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${
                  pathname === item.href ? styles.active : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons - Desktop */}
          <div className={styles.ctaButtons}>
            <Link href="/login" className={styles.loginButton}>
              Login
            </Link>
            <Link href="/register" className={styles.getStartedButton}>
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className={styles.mobileMenuButton}
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.open : ''}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.mobileMenuHeader}>
          <Logo variant="dark" size="sm" />
          <button
            type="button"
            className={styles.mobileMenuClose}
            onClick={closeMobileMenu}
            aria-label="Close mobile menu"
          >
            <FiX />
          </button>
        </div>

        <div className={styles.mobileMenuContent}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.mobileNavItem} ${
                pathname === item.href ? styles.active : ''
              }`}
              onClick={closeMobileMenu}
            >
              {item.label}
            </Link>
          ))}

          <div className={styles.mobileCtaButtons}>
            <Link
              href="/login"
              className={styles.mobileLoginButton}
              onClick={closeMobileMenu}
            >
              Login
            </Link>
            <Link
              href="/register"
              className={styles.mobileGetStartedButton}
              onClick={closeMobileMenu}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
