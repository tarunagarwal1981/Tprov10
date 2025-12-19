'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiPlay, FiCheckCircle, FiClock, FiShield, FiChevronDown } from 'react-icons/fi';
import styles from './Hero.module.css';

/**
 * Enhanced Hero Section Component
 * 
 * Advanced interactive hero section with:
 * - Animated headline with word-by-word stagger effect
 * - Interactive background with floating particles
 * - CTA buttons with ripple, magnetic hover, and icon animations
 * - Animated scroll indicator
 * - Trust badges with slide-in and shine effects
 * - Parallax and smooth animations
 */

// Microcopy badges data
const trustBadges = [
  {
    icon: FiCheckCircle,
    text: 'No setup fees',
    label: 'No setup fees required'
  },
  {
    icon: FiShield,
    text: 'Verified partners',
    label: 'All partners are verified'
  },
  {
    icon: FiClock,
    text: '24/7 access',
    label: '24/7 platform access'
  }
];

// Animated particles component
const FloatingParticles = () => {
  // Use deterministic values based on index to avoid hydration mismatches
  const particles = Array.from({ length: 20 }, (_, i) => {
    const seed = i * 0.618033988749895; // Golden ratio for better distribution
    return {
      id: i,
      size: (Math.sin(seed) * 0.5 + 0.5) * 6 + 2, // Convert to 2-8 range
      x: (Math.sin(seed * 1.3) * 0.5 + 0.5) * 100, // Convert to 0-100 range
      y: (Math.cos(seed * 2.1) * 0.5 + 0.5) * 100, // Convert to 0-100 range
      duration: (Math.sin(seed * 3.7) * 0.5 + 0.5) * 10 + 10, // Convert to 10-20 range
      delay: (Math.cos(seed * 4.1) * 0.5 + 0.5) * 5, // Convert to 0-5 range
    };
  });

  return (
    <div className={styles.particlesContainer}>
      {particles.map((particle) => {
        const seed = particle.id * 0.618033988749895; // Golden ratio for better distribution
        return (
          <motion.div
            key={particle.id}
            className={styles.particle}
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, (Math.sin(seed * 2.1) * 0.5 + 0.5) * 40 - 20, 0], // Convert to -20 to 20 range
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
};

// Geometric shapes component
const FloatingShapes = () => {
  return (
    <>
      <motion.div
        className={styles.shape}
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '100px',
          height: '100px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 184, 0, 0.1))',
          rotate: 45,
        }}
        animate={{
          y: [0, 30, 0],
          rotate: [45, 65, 45],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className={styles.shape}
        style={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0, 78, 137, 0.1), rgba(0, 102, 179, 0.1))',
        }}
        animate={{
          y: [0, -40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className={styles.shape}
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '20%',
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.1), rgba(255, 107, 53, 0.1))',
        }}
        animate={{
          rotate: [0, 360],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );
};

// CTA Button with advanced interactions
interface CTAButtonProps {
  href: string;
  label: string;
  icon: React.ElementType;
  variant: 'primary' | 'secondary';
  ariaLabel: string;
}

const CTAButton: React.FC<CTAButtonProps> = ({ href, label, icon: Icon, variant, ariaLabel }) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLAnchorElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { x, y, id: Date.now() };
    setRipples([...ripples, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
    }, 600);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePosition({ x: x * 0.1, y: y * 0.1 }); // Reduced magnetic effect
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.div
      animate={{
        x: mousePosition.x,
        y: mousePosition.y,
      }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
    >
      <Link
        ref={buttonRef}
        href={href}
        className={`${styles.ctaButton} ${variant === 'primary' ? styles.primaryCTA : styles.secondaryCTA}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        aria-label={ariaLabel}
      >
        <motion.div
          className={styles.ctaButtonContent}
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={{ x: isHovered ? 2 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className={styles.ctaButtonText}>{label}</span>
          </motion.div>
          <motion.div
            animate={{
              x: isHovered ? 5 : 0,
              scale: isHovered ? 1.2 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <Icon className={styles.ctaButtonIcon} aria-hidden="true" />
          </motion.div>
        </motion.div>
        
        {/* Ripple effects */}
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className={styles.ripple}
            style={{
              left: ripple.x,
              top: ripple.y,
            }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        ))}
      </Link>
    </motion.div>
  );
};

// Scroll indicator component
const ScrollIndicator = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY < 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={styles.scrollIndicator}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <FiChevronDown className={styles.scrollIcon} />
          </motion.div>
          <span className={styles.scrollText}>Scroll to explore</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, 100]);

  // Split headline into words for animation
  const headline = "Transforming How Travel Business Connects";
  const highlightText = "Globally";
  const words = headline.split(" ");
  
  // Logo-style text for TravelSelBuy
  const logoText = "TravelSelBuy";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <section className={styles.hero}>
      {/* Animated Background Elements */}
      <FloatingParticles />
      <FloatingShapes />
      
      <motion.div 
        className={styles.heroContainer}
        style={{ y }}
      >
        {/* Animated Headline */}
        <motion.h1
          className={styles.headline}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {words.map((word, index) => (
            <motion.span
              key={index}
              variants={wordVariants}
              className={styles.word}
            >
              {word}{" "}
            </motion.span>
          ))}
          <motion.span
            variants={wordVariants}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent"
            style={{ display: 'inline-block', marginRight: '0.3rem' }}
          >
            {highlightText}
          </motion.span>
        </motion.h1>
        
        {/* Logo-style TravelSelBuy */}
        <motion.div
          className={styles.logoText}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <span className={styles.logoTravel}>Travel</span>
          <span className={styles.logoSelBuy}>SelBuy</span>
        </motion.div>
        
        {/* Subheadline */}
        <motion.p
          className={styles.subheadline}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          TravelSelbuy is the all-in-one B2B travel platform that connects travel agents, tour operators, and freelancers to source, sell, and scale — all in one powerful ecosystem.
        </motion.p>
        
        {/* CTA Buttons */}
        <motion.div
          className={styles.ctaSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <CTAButton
            href="/phone-login"
            label="Get Started Free"
            icon={FiArrowRight}
            variant="primary"
            ariaLabel="Get Started Free - Register Now"
          />
          <CTAButton
            href="/contact"
            label="Request a Demo"
            icon={FiPlay}
            variant="secondary"
            ariaLabel="Request a Demo - Contact Us"
          />
        </motion.div>
        
        {/* Trust Badges with Animation */}
        <motion.div
          className={styles.trustSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          {trustBadges.map((badge, index) => {
            const IconComponent = badge.icon;
            return (
              <motion.div
                key={index}
                className={styles.trustBadge}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.3 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                aria-label={badge.label}
              >
                <IconComponent className={styles.trustIcon} aria-hidden="true" />
                <span className={styles.trustText}>{badge.text}</span>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <div className={styles.scrollIndicatorContainer}>
        <ScrollIndicator />
      </div>
    </section>
  );
}
