'use client';

import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FiBriefcase, FiGlobe, FiStar, FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';
import styles from './WhoWeHelp.module.css';

/**
 * Who We Help Section Component
 * 
 * Showcases target audiences with interactive 3D flip cards:
 * - Travel Agents
 * - Tour Operators  
 * - Freelancers
 * 
 * Features:
 * - 3D flip animation on hover
 * - Front: Icon + Title
 * - Back: Description + CTA
 * - Scroll-triggered entrance animations
 * - Staggered left-to-right effect
 */

// Target audiences data
const audiences = [
  {
    id: 'travel-agents',
    icon: FiBriefcase,
    iconColor: 'blue',
    title: 'For Travel Agents',
    description: 'Find new suppliers, customize packages, and close deals faster.',
    features: [
      'Access 500+ suppliers',
      'Custom package builder',
      'Instant booking',
      'Competitive commissions'
    ],
    ctaText: 'Join as Agent',
    ctaLink: '/login',
  },
  {
    id: 'tour-operators',
    icon: FiGlobe,
    iconColor: 'orange',
    title: 'For Tour Operators',
    description: 'List travel experiences, manage inquiries, and grow global visibility.',
    features: [
      'Global marketplace reach',
      'Lead management',
      'Automated inquiries',
      'Analytics dashboard'
    ],
    ctaText: 'Join as Operator',
    ctaLink: '/login',
  },
  {
    id: 'freelancers',
    icon: FiStar,
    iconColor: 'purple',
    title: 'For Freelancers',
    description: 'Access verified inventory, build your brand, and earn more.',
    features: [
      'Verified inventory',
      'Personal branding',
      'Flexible commissions',
      'No setup fees'
    ],
    ctaText: 'Start Freelancing',
    ctaLink: '/login',
  },
];

// 3D Flip Card Component
interface FlipCardProps {
  audience: typeof audiences[0];
  index: number;
}

const FlipCard: React.FC<FlipCardProps> = ({ audience, index }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.2 });
  
  const IconComponent = audience.icon;

  // Get icon container gradient
  const getIconGradient = (color: string) => {
    switch (color) {
      case 'blue':
        return 'linear-gradient(135deg, #004E89 0%, #00B4D8 100%)';
      case 'orange':
        return 'linear-gradient(135deg, #FF6B35 0%, #FFB800 100%)';
      case 'purple':
        return 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)';
      default:
        return 'linear-gradient(135deg, #004E89 0%, #00B4D8 100%)';
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className={styles.cardWrapper}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.2, ease: "easeOut" }}
      onMouseEnter={() => {
        setIsFlipped(true);
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsFlipped(false);
        setIsHovered(false);
      }}
    >
      <motion.div
        className={styles.flipCard}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Glow Border */}
        <motion.div
          className={`${styles.glowBorder} ${styles[`glow${audience.iconColor.charAt(0).toUpperCase() + audience.iconColor.slice(1)}`]}`}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Front Face */}
        <div className={styles.cardFront}>
          <motion.div
            className={styles.iconContainer}
            style={{ background: getIconGradient(audience.iconColor) }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            <IconComponent className={styles.icon} strokeWidth={2} />
          </motion.div>
          
          <h3 className={styles.cardTitle}>{audience.title}</h3>
          
          <motion.div
            className={styles.hoverHint}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span>Hover to learn more</span>
            <FiArrowRight className={styles.hintIcon} />
          </motion.div>
        </div>

        {/* Back Face */}
        <div className={styles.cardBack}>
          <div className={styles.backContent}>
            <h3 className={styles.backTitle}>{audience.title}</h3>
            <p className={styles.backDescription}>{audience.description}</p>
            
            <ul className={styles.featuresList}>
              {audience.features.map((feature, idx) => (
                <motion.li
                  key={idx}
                  className={styles.featureItem}
                  initial={{ opacity: 0, x: -10 }}
                  animate={isFlipped ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                  transition={{ delay: idx * 0.1 + 0.3 }}
                >
                  <span className={styles.featureBullet}>•</span>
                  {feature}
                </motion.li>
              ))}
            </ul>

            <Link
              href={audience.ctaLink}
              className={styles.ctaButton}
            >
              <span>{audience.ctaText}</span>
              <FiArrowRight className={styles.ctaIcon} />
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function WhoWeHelp() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.1 });

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        {/* Section Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={styles.title}>Built for Every Travel Professional</h2>
          <p className={styles.subtitle}>
            Whether you&apos;re an agent, operator, or freelancer, we have the tools you need to succeed
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className={styles.grid}>
          {audiences.map((audience, index) => (
            <FlipCard key={audience.id} audience={audience} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className={styles.bottomCTA}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Link href="/login" className={styles.mainCTA}>
            Join the Network
            <FiArrowRight className={styles.mainCTAIcon} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

