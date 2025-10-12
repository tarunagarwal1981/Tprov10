'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import {
  FiMessageSquare,
  FiGlobe,
  FiSliders,
  FiMessageCircle,
  FiShoppingBag,
  FiLayout,
  FiUsers,
  FiDollarSign,
  FiClock,
  FiArrowRight,
} from 'react-icons/fi';
import styles from './ProblemSolution.module.css';

/**
 * Enhanced Problem-Solution Section Component
 * 
 * Interactive two-column layout with:
 * - Scroll-triggered animations using Intersection Observer
 * - Advanced card hover effects with lift and glow
 * - Icon animations (pulse, rotate, scale)
 * - Before/After comparison toggle
 * - Count-up numbers for statistics
 * - Staggered entrance animations
 */

// Problems data
const problems = [
  {
    icon: FiMessageSquare,
    iconColor: 'red',
    title: 'Disconnected Communication',
    solution: 'Instant Chat & Lead Sync',
    description:
      'Fragmented communication across multiple platforms leads to lost leads, delayed responses, and missed opportunities.',
    stat: { value: 40, label: '% leads lost', suffix: '%' }
  },
  {
    icon: FiGlobe,
    iconColor: 'orange',
    title: 'Limited Reach',
    solution: 'Global Marketplace Access',
    description:
      'Difficulty accessing verified tour operators worldwide limits package variety and competitive pricing.',
    stat: { value: 85, label: '% agents struggle', suffix: '%' }
  },
  {
    icon: FiSliders,
    iconColor: 'red',
    title: 'Complex Management',
    solution: 'One Dashboard for Everything',
    description:
      'Multiple tools and systems create confusion, inefficiency, and increase operational costs significantly.',
    stat: { value: 15, label: 'hrs/week wasted', suffix: 'h' }
  },
];

// Solutions data (Key Highlights)
const solutions = [
  {
    icon: FiMessageCircle,
    iconColor: 'green',
    title: 'Smart CRM with AI Chat',
    description:
      'Manage leads, customers, and bookings in one place. AI-powered chat synchronizes with WhatsApp, Facebook, and Instagram for seamless communication.',
    stat: { value: 60, label: '% faster response', suffix: '%' }
  },
  {
    icon: FiShoppingBag,
    iconColor: 'blue',
    title: 'B2B Marketplace',
    description:
      'Connect directly with verified tour operators globally. Browse, negotiate, and book packages from a curated network of trusted partners.',
    stat: { value: 500, label: '+ operators', suffix: '+' }
  },
  {
    icon: FiLayout,
    iconColor: 'green',
    title: 'All-in-One Dashboard',
    description:
      'Unified platform for package management, booking tracking, customer communication, and business analytics—all in one intelligent interface.',
    stat: { value: 70, label: '% time saved', suffix: '%' }
  },
];

// Helper function to get icon container class
const getIconContainerClass = (color: string): string => {
  const baseClass = styles.iconContainer || '';
  switch (color) {
    case 'red':
      return `${baseClass} ${styles.iconContainerRed || ''}`;
    case 'orange':
      return `${baseClass} ${styles.iconContainerOrange || ''}`;
    case 'green':
      return `${baseClass} ${styles.iconContainerGreen || ''}`;
    case 'blue':
      return `${baseClass} ${styles.iconContainerBlue || ''}`;
    default:
      return baseClass;
  }
};

// Count-up animation hook
const useCountUp = (end: number, duration: number = 2000, shouldStart: boolean = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth count
      const easeOutQuad = (t: number) => t * (2 - t);
      const currentCount = Math.floor(easeOutQuad(progress) * end);
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, shouldStart]);

  return count;
};

// Animated Card Component
interface CardProps {
  item: typeof problems[0] | typeof solutions[0];
  index: number;
  type: 'problem' | 'solution';
  showTransformation: boolean;
}

const AnimatedCard: React.FC<CardProps> = ({ item, index, type, showTransformation }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.3 });
  const IconComponent = item.icon;

  // Count-up animation
  const currentCount = useCountUp(item.stat.value, 2000, isInView);

  // Animation variants for card entrance
  const cardVariants = {
    hidden: {
      opacity: 0,
      x: type === 'problem' ? -50 : 50,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
  };

  const isProblem = type === 'problem';
  const displayTitle = showTransformation && isProblem && 'solution' in item 
    ? item.solution 
    : item.title;

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={`${styles.card} ${isProblem ? styles.problemCard : styles.solutionCard}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{
        y: -8,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
    >
      {/* Glow effect on hover */}
      <motion.div
        className={styles.cardGlow}
        animate={{
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Icon with animations */}
      <motion.div
        className={getIconContainerClass(item.iconColor)}
        animate={{
          rotate: isHovered ? 360 : 0,
          scale: isHovered ? 1.15 : 1,
        }}
        transition={{
          rotate: { duration: 0.6, ease: "easeInOut" },
          scale: { duration: 0.3, ease: "easeOut" },
        }}
      >
        <motion.div
          animate={{
            scale: isInView && !isHovered ? [1, 1.2, 1] : 1,
          }}
          transition={{
            duration: 1.5,
            repeat: isInView && !isHovered ? 2 : 0,
            ease: "easeInOut",
          }}
        >
          <IconComponent className={styles.icon} aria-hidden="true" />
        </motion.div>
      </motion.div>

      <div className={styles.content}>
        <motion.h3
          className={styles.cardTitle}
          animate={{
            color: showTransformation && isProblem ? '#10B981' : undefined,
          }}
          transition={{ duration: 0.5 }}
        >
          {displayTitle}
        </motion.h3>
        <p className={styles.cardDescription}>{item.description}</p>
        
        {/* Stat counter */}
        <motion.div
          className={styles.statCounter}
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
        >
          <span className={styles.statValue}>
            {item.stat.suffix === '+' ? '' : ''}
            {currentCount}
            {item.stat.suffix}
          </span>
          <span className={styles.statLabel}>{item.stat.label}</span>
        </motion.div>
      </div>

      {/* Transformation arrow for problems */}
      {showTransformation && isProblem && 'solution' in item && (
        <motion.div
          className={styles.transformArrow}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <FiArrowRight />
        </motion.div>
      )}
    </motion.div>
  );
};

export default function ProblemSolution() {
  const [showTransformation, setShowTransformation] = useState(false);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.2 });

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        {/* Toggle Button */}
        <div className={styles.toggleContainer}>
          <motion.button
            className={`${styles.toggleButton} ${showTransformation ? styles.toggleActive : ''}`}
            onClick={() => setShowTransformation(!showTransformation)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiArrowRight className={styles.toggleIcon} />
            {showTransformation ? 'Show Problems' : 'Show Transformation'}
          </motion.button>
        </div>

        <div className={styles.grid}>
          {/* Problems Column */}
          <motion.div
            className={styles.column}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.h2
              className={`${styles.columnTitle} ${styles.problemsTitle}`}
              animate={{
                color: showTransformation ? '#10B981' : '#DC2626',
              }}
              transition={{ duration: 0.5 }}
            >
              {showTransformation ? 'Transformed to Solutions' : 'The Traditional Way'}
            </motion.h2>
            <div className={styles.itemsList}>
              {problems.map((problem, index) => (
                <AnimatedCard
                    key={index}
                  item={problem}
                  index={index}
                  type="problem"
                  showTransformation={showTransformation}
                />
              ))}
                    </div>
          </motion.div>

          {/* Solutions Column */}
          <motion.div
            className={styles.column}
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className={`${styles.columnTitle} ${styles.solutionsTitle}`}>
              The TravelSelBuy Way
            </h2>
            <div className={styles.itemsList}>
              {solutions.map((solution, index) => (
                <AnimatedCard
                    key={index}
                  item={solution}
                  index={index}
                  type="solution"
                  showTransformation={false}
                />
              ))}
                    </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
