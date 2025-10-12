'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiMenu, FiX, FiChevronDown, FiUsers, FiGlobe, FiArrowRight, FiStar } from 'react-icons/fi';
import { Logo } from './Logo';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './MarketingHeader.module.css';

/**
 * Marketing Header Component
 * 
 * Enhanced professional sticky header for public marketing pages with:
 * - Interactive animated logo
 * - Mega menu dropdown for Solutions
 * - Enhanced CTA buttons with shine effects
 * - Smooth scroll transitions
 * - Mobile menu with staggered animations
 * - Backdrop blur effect
 * - Cross-browser compatibility
 */

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Benefits', href: '/benefits' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const solutionsMenuItems = [
  {
    label: 'For Travel Agents',
    href: '/for-travel-agents',
    icon: FiUsers,
    description: 'Access thousands of tour packages instantly',
  },
  {
    label: 'For Tour Operators',
    href: '/for-tour-operators',
    icon: FiGlobe,
    description: 'Connect with global travel agents',
  },
];

export default function MarketingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const [shinePosition, setShinePosition] = useState(0);
  const pathname = usePathname();
  const solutionsRef = useRef<HTMLDivElement>(null);

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
    setIsSolutionsOpen(false);
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

  // Close solutions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (solutionsRef.current && !solutionsRef.current.contains(event.target as Node)) {
        setIsSolutionsOpen(false);
      }
    };

    if (isSolutionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSolutionsOpen]);

  // Animate shine effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShinePosition((prev) => (prev >= 200 ? -50 : prev + 1));
    }, 20);

    return () => clearInterval(interval);
  }, []);

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
          {/* Logo - Interactive with hover animation */}
          <Link href="/" className={styles.logo}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className={styles.logoWrapper}
            >
              <Logo variant="dark" size="md" showText={false} />
              <span className={styles.logoText}>
                <span className={styles.logoTextTravel}>Travel</span>
                <span className={styles.logoTextSelbuy}>Selbuy</span>
              </span>
            </motion.div>
          </Link>

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

            {/* Solutions Mega Menu */}
            <div
              ref={solutionsRef}
              className={styles.solutionsDropdown}
              onMouseEnter={() => setIsSolutionsOpen(true)}
              onMouseLeave={() => setIsSolutionsOpen(false)}
            >
              <button
                className={`${styles.navItem} ${styles.solutionsButton} ${
                  isSolutionsOpen ? styles.active : ''
                }`}
                aria-expanded={isSolutionsOpen}
                aria-haspopup="true"
              >
                Solutions
                <FiChevronDown
                  className={`${styles.chevron} ${isSolutionsOpen ? styles.rotated : ''}`}
                />
              </button>

              <AnimatePresence>
                {isSolutionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={styles.megaMenu}
                  >
                    {solutionsMenuItems.map((item, index) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={styles.megaMenuItem}
                          onClick={() => setIsSolutionsOpen(false)}
                        >
                          <div className={styles.megaMenuIcon}>
                            <IconComponent />
                          </div>
                          <div className={styles.megaMenuContent}>
                            <div className={styles.megaMenuTitle}>{item.label}</div>
                            <div className={styles.megaMenuDescription}>{item.description}</div>
                          </div>
                          <FiArrowRight className={styles.megaMenuArrow} />
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* CTA Buttons - Desktop */}
          <div className={styles.ctaButtons}>
            <Link href="/login" className={styles.loginButton}>
              Login
            </Link>
            <Link href="/register" className={styles.getStartedButton}>
              <span className={styles.buttonText}>Get Started</span>
              <FiStar className={styles.buttonIcon} />
              <div
                className={styles.shine}
                style={{ left: `${shinePosition}%` }}
              />
            </Link>
          </div>

          {/* Mobile Menu Button - Animated hamburger */}
          <motion.button
            type="button"
            className={styles.mobileMenuButton}
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
            aria-expanded={isMobileMenuOpen}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={isMobileMenuOpen ? 'open' : 'closed'}
              className={styles.hamburger}
            >
              {isMobileMenuOpen ? <FiX /> : <FiMenu />}
            </motion.div>
          </motion.button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={styles.mobileMenuOverlay}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu with Stagger Animation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={styles.mobileMenu}
          >
            <div className={styles.mobileMenuHeader}>
              <div className={styles.mobileLogoWrapper}>
                <Logo variant="dark" size="sm" showText={false} />
                <span className={styles.logoText}>
                  <span className={styles.logoTextTravel}>Travel</span>
                  <span className={styles.logoTextSelbuy}>Selbuy</span>
                </span>
              </div>
              <button
                type="button"
                className={styles.mobileMenuClose}
                onClick={closeMobileMenu}
                aria-label="Close mobile menu"
              >
                <FiX />
              </button>
            </div>

            <motion.div
              className={styles.mobileMenuContent}
              initial="closed"
              animate="open"
              variants={{
                open: {
                  transition: { staggerChildren: 0.07, delayChildren: 0.2 }
                },
                closed: {
                  transition: { staggerChildren: 0.05, staggerDirection: -1 }
                }
              }}
            >
              {navItems.map((item) => (
                <motion.div
                  key={item.href}
                  variants={{
                    open: {
                      y: 0,
                      opacity: 1,
                      transition: {
                        y: { stiffness: 1000, velocity: -100 }
                      }
                    },
                    closed: {
                      y: 50,
                      opacity: 0,
                      transition: {
                        y: { stiffness: 1000 }
                      }
                    }
                  }}
                >
                  <Link
                    href={item.href}
                    className={`${styles.mobileNavItem} ${
                      pathname === item.href ? styles.active : ''
                    }`}
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              {/* Solutions in Mobile Menu */}
              <motion.div
                className={styles.mobileSolutionsSection}
                variants={{
                  open: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      y: { stiffness: 1000, velocity: -100 }
                    }
                  },
                  closed: {
                    y: 50,
                    opacity: 0,
                    transition: {
                      y: { stiffness: 1000 }
                    }
                  }
                }}
              >
                <div className={styles.mobileSolutionsTitle}>Solutions</div>
                {solutionsMenuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={styles.mobileSolutionItem}
                      onClick={closeMobileMenu}
                    >
                      <div className={styles.mobileSolutionIcon}>
                        <IconComponent />
                      </div>
                      <div className={styles.mobileSolutionContent}>
                        <div className={styles.mobileSolutionLabel}>{item.label}</div>
                        <div className={styles.mobileSolutionDescription}>
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </motion.div>

              <motion.div
                className={styles.mobileCtaButtons}
                variants={{
                  open: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      y: { stiffness: 1000, velocity: -100 }
                    }
                  },
                  closed: {
                    y: 50,
                    opacity: 0,
                    transition: {
                      y: { stiffness: 1000 }
                    }
                  }
                }}
              >
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
                  <FiStar className={styles.buttonIcon} />
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
