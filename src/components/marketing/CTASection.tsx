'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { FiArrowRight, FiStar, FiUsers, FiBriefcase, FiMessageCircle } from 'react-icons/fi';
import Link from 'next/link';
import styles from './CTASection.module.css';

/**
 * Final CTA Section Component
 * 
 * Compelling call-to-action section with:
 * - Animated gradient background with particles
 * - Gradient text effect on headline
 * - Two interactive CTA buttons
 * - Trust badges with count-up animations
 * - Magnetic hover effects
 * - Shimmer animations
 */

// Trust stats data
const trustStats = [
  {
    icon: FiBriefcase,
    value: 500,
    suffix: '+',
    label: 'Tour Operators',
  },
  {
    icon: FiUsers,
    value: 10000,
    suffix: '+',
    label: 'Travel Agents',
  },
  {
    icon: FiStar,
    value: 4.9,
    suffix: '★',
    label: 'Average Rating',
    isDecimal: true,
  },
];

// Animated particles/stars component
const FloatingParticles = () => {
  // Use deterministic values based on index to avoid hydration mismatches
  const particles = Array.from({ length: 30 }, (_, i) => {
    const seed = i * 0.618033988749895; // Golden ratio for better distribution
    return {
      id: i,
      size: (Math.sin(seed) * 0.5 + 0.5) * 4 + 1, // Convert to 1-5 range
      x: (Math.sin(seed * 1.3) * 0.5 + 0.5) * 100, // Convert to 0-100 range
      y: (Math.cos(seed * 2.1) * 0.5 + 0.5) * 100, // Convert to 0-100 range
      duration: (Math.sin(seed * 3.7) * 0.5 + 0.5) * 15 + 10, // Convert to 10-25 range
      delay: (Math.cos(seed * 4.1) * 0.5 + 0.5) * 5, // Convert to 0-5 range
    };
  });

  return (
    <div className={styles.particlesContainer}>
      {particles.map((particle) => (
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
            y: [0, -40, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Count-up animation hook
const useCountUp = (end: number, duration: number = 2000, shouldStart: boolean = false, isDecimal: boolean = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOutQuad = (t: number) => t * (2 - t);
      const currentCount = easeOutQuad(progress) * end;
      
      setCount(isDecimal ? Math.round(currentCount * 10) / 10 : Math.floor(currentCount));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, shouldStart, isDecimal]);

  return count;
};

// Magnetic Button Component
interface MagneticButtonProps {
  href: string;
  children: React.ReactNode;
  variant: 'primary' | 'secondary';
  icon?: React.ElementType;
}

const MagneticButton: React.FC<MagneticButtonProps> = ({ href, children, variant, icon: Icon }) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { damping: 20, stiffness: 200 });
  const springY = useSpring(mouseY, { damping: 20, stiffness: 200 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.15;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.15;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

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

  return (
    <motion.div style={{ x: springX, y: springY }}>
      <Link
        ref={buttonRef}
        href={href}
        className={`${styles.ctaButton} ${variant === 'primary' ? styles.primaryButton : styles.secondaryButton}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <span className={styles.buttonContent}>
          {children}
          {Icon && <Icon className={styles.buttonIcon} />}
        </span>
        
        {/* Ripple effects */}
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className={styles.ripple}
            style={{ left: ripple.x, top: ripple.y }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        ))}
        
        {/* Sparkle effect */}
        {variant === 'primary' && (
          <motion.div
            className={styles.sparkle}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <FiStar className={styles.sparkleIcon} />
          </motion.div>
        )}
      </Link>
    </motion.div>
  );
};

// Trust Badge Component
interface TrustBadgeProps {
  stat: typeof trustStats[0];
  index: number;
  isVisible: boolean;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ stat, index, isVisible }) => {
  const IconComponent = stat.icon;
  const count = useCountUp(stat.value, 2000, isVisible, stat.isDecimal);
  
  return (
    <motion.div
      className={styles.trustBadge}
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <div className={styles.badgeIcon}>
        <IconComponent className={styles.badgeIconSvg} />
      </div>
      <div className={styles.badgeContent}>
        <div className={styles.badgeValue}>
          {count}
          {stat.suffix}
        </div>
        <div className={styles.badgeLabel}>{stat.label}</div>
      </div>
    </motion.div>
  );
};

export default function CTASection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 });

  // Split headline into words for animation
  const headline = "Your Growth Starts Here.";
  const words = headline.split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
    <section ref={sectionRef} className={styles.section}>
      {/* Animated Background */}
      <div className={styles.gradientBackground} />
      <FloatingParticles />
      
      {/* Shimmer Effect */}
      <motion.div
        className={styles.shimmer}
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 2,
        }}
      />

      <div className={styles.container}>
        {/* Headline with gradient text */}
        <motion.h2
          className={styles.headline}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
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
        </motion.h2>

        {/* Subheadline */}
        <motion.p
          className={styles.subheadline}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          Join thousands of travel professionals transforming the way they do business with TravelSelbuy.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className={styles.buttonsContainer}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <MagneticButton
            href="/auth/register"
            variant="primary"
            icon={FiArrowRight}
          >
            Start Free
          </MagneticButton>
          
          <MagneticButton
            href="/contact"
            variant="secondary"
            icon={FiMessageCircle}
          >
            Talk to Our Team
          </MagneticButton>
        </motion.div>

        {/* Trust Badges */}
        <div className={styles.trustBadges}>
          {trustStats.map((stat, index) => (
            <TrustBadge
              key={index}
              stat={stat}
              index={index}
              isVisible={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}



