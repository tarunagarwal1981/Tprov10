'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  FiMessageSquare, 
  FiShoppingBag, 
  FiEdit3, 
  FiTrendingUp, 
  FiMessageCircle,
  FiBarChart2,
  FiX,
  FiMaximize2
} from 'react-icons/fi';
import { FaCheck } from 'react-icons/fa';
import styles from './FeaturesGrid.module.css';

/**
 * Enhanced Features Grid Section Component
 * 
 * Advanced interactive features grid with:
 * - Staggered diagonal wave animation
 * - 3D card tilt effect with cursor tracking
 * - Feature expansion modal
 * - Icon gradient animations
 * - Progress indicators
 * - Comparison mode toggle
 * - Shine gradient following cursor
 */

// Features data
const features = [
  {
    icon: FiMessageSquare,
    iconColor: 'orange',
    title: 'Smart CRM',
    description: 'Manage leads, follow-ups, and bookings in one place',
    completeness: 95,
    details: 'Comprehensive customer relationship management with AI-powered automation. Track every interaction, automate follow-ups, and never miss an opportunity.',
    features: [
      'Unified customer dashboard',
      'Automated lead scoring',
      'Smart follow-up reminders',
      'Booking management',
      'Revenue analytics',
      'Integration with all channels',
    ],
    stats: { customers: '10K+', automation: '85%', time_saved: '15hrs/week' }
  },
  {
    icon: FiShoppingBag,
    iconColor: 'blue',
    title: 'B2B Marketplace',
    description: 'Discover verified travel partners and expand globally',
    completeness: 90,
    details: 'Access a global network of verified tour operators. Browse thousands of packages, negotiate directly, and close deals faster.',
    features: [
      '500+ verified operators',
      'Real-time availability',
      'Direct negotiation',
      'Instant booking',
      'Competitive pricing',
      'Multi-destination packages',
    ],
    stats: { operators: '500+', packages: '50K+', countries: '150+' }
  },
  {
    icon: FiEdit3,
    iconColor: 'purple',
    title: 'Itinerary Builder',
    description: 'Design professional quotes and itineraries in minutes',
    completeness: 88,
    details: 'Create stunning, professional itineraries with drag-and-drop simplicity. Impress clients with beautifully designed travel proposals.',
    features: [
      'Drag-and-drop builder',
      'Professional templates',
      'Real-time pricing',
      'PDF export',
      'Custom branding',
      'Multi-language support',
    ],
    stats: { templates: '100+', time_to_create: '5min', client_approval: '92%' }
  },
  {
    icon: FiTrendingUp,
    iconColor: 'green',
    title: 'AI Insights',
    description: 'Track demand trends, performance, and buyer behavior',
    completeness: 92,
    details: 'Get actionable insights powered by AI. Understand market trends, customer behavior, and optimize your business strategy.',
    features: [
      'Demand forecasting',
      'Customer analytics',
      'Performance tracking',
      'Market trends',
      'Revenue optimization',
      'Predictive insights',
    ],
    stats: { accuracy: '94%', insights: '1000+', roi_increase: '35%' }
  },
  {
    icon: FiMessageCircle,
    iconColor: 'teal',
    title: 'Direct Chat',
    description: 'Connect instantly with suppliers and agents',
    completeness: 93,
    details: 'Real-time messaging with suppliers and agents. Negotiate deals, clarify details, and close bookings instantly.',
    features: [
      'Real-time messaging',
      'File sharing',
      'Voice notes',
      'Group chats',
      'Notification system',
      'Chat history',
    ],
    stats: { response_time: '< 2min', messages: '100K+/mo', satisfaction: '4.8/5' }
  },
  {
    icon: FiBarChart2,
    iconColor: 'pink',
    title: 'Analytics Dashboard',
    description: 'Monitor your business performance in real-time',
    completeness: 90,
    details: 'Comprehensive analytics dashboard with real-time metrics. Track bookings, revenue, customer satisfaction, and more.',
    features: [
      'Real-time metrics',
      'Custom reports',
      'Export capabilities',
      'Goal tracking',
      'Team performance',
      'Financial insights',
    ],
    stats: { reports: '50+', export_formats: '5', update_frequency: 'Real-time' }
  },
];

// Helper function to get icon container class
const getIconContainerClass = (color: string): string => {
  const baseClass = styles.iconContainer || '';
  switch (color) {
    case 'orange':
      return `${baseClass} ${styles.iconOrange || ''}`;
    case 'blue':
      return `${baseClass} ${styles.iconBlue || ''}`;
    case 'purple':
      return `${baseClass} ${styles.iconPurple || ''}`;
    case 'green':
      return `${baseClass} ${styles.iconGreen || ''}`;
    case 'teal':
      return `${baseClass} ${styles.iconTeal || ''}`;
    case 'pink':
      return `${baseClass} ${styles.iconPink || ''}`;
    default:
      return baseClass;
  }
};

// 3D Tilt Card Component
interface TiltCardProps {
  children: React.ReactNode;
  index: number;
  onExpand: () => void;
}

const TiltCard: React.FC<TiltCardProps> = ({ children, index, onExpand }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), {
    damping: 20,
    stiffness: 100,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
    damping: 20,
    stiffness: 100,
  });

  const shineX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), {
    damping: 20,
    stiffness: 100,
  });
  const shineY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), {
    damping: 20,
    stiffness: 100,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  // Calculate diagonal stagger delay
  const row = Math.floor(index / 3);
  const col = index % 3;
  const diagonalDelay = (row + col) * 0.1;

  return (
    <motion.div
      ref={cardRef}
      className={styles.card}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: diagonalDelay, ease: "easeOut" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.02, z: 50 }}
    >
      {/* Shine effect */}
      <motion.div
        className={styles.shine}
        style={{
          background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.8) 0%, transparent 50%)`,
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Expand button */}
      <motion.button
        className={styles.expandButton}
        onClick={onExpand}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <FiMaximize2 />
      </motion.button>

      {children}
    </motion.div>
  );
};

// Expanded Feature Modal
interface ExpandedModalProps {
  feature: typeof features[0];
  onClose: () => void;
}

const ExpandedModal: React.FC<ExpandedModalProps> = ({ feature, onClose }) => {
  const IconComponent = feature.icon;

  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modalContent}
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeButton} onClick={onClose}>
          <FiX />
        </button>

        <div className={styles.modalHeader}>
          <div className={getIconContainerClass(feature.iconColor)}>
            <IconComponent className={styles.icon} aria-hidden="true" />
          </div>
          <h3 className={styles.modalTitle}>{feature.title}</h3>
          <p className={styles.modalDescription}>{feature.details}</p>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalSection}>
            <h4 className={styles.modalSectionTitle}>Key Features</h4>
            <ul className={styles.featuresList}>
              {feature.features.map((item, index) => (
                <motion.li
                  key={index}
                  className={styles.featureItem}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <span className={styles.checkIcon}>
                    <FaCheck aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className={styles.modalSection}>
            <h4 className={styles.modalSectionTitle}>Statistics</h4>
            <div className={styles.statsGrid}>
              {Object.entries(feature.stats).map(([key, value], index) => (
                <motion.div
                  key={key}
                  className={styles.statCard}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div className={styles.statValue}>{value}</div>
                  <div className={styles.statLabel}>
                    {key.replace(/_/g, ' ')}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Progress Ring Component
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ 
  progress, 
  size = 50, 
  strokeWidth = 4 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className={styles.progressRing}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B35" />
          <stop offset="100%" stopColor="#FFB800" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default function FeaturesGrid() {
  const [expandedFeature, setExpandedFeature] = useState<typeof features[0] | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
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
          <h2 className={styles.title}>
            Your Complete Travel Business Toolkit
          </h2>
          <p className={styles.subtitle}>
            Everything you need to source, sell, and scale your travel business
          </p>
          
          {/* Comparison Mode Toggle */}
          <motion.button
            className={`${styles.comparisonToggle} ${comparisonMode ? styles.comparisonActive : ''}`}
            onClick={() => setComparisonMode(!comparisonMode)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {comparisonMode ? 'Grid View' : 'Comparison View'}
          </motion.button>
        </motion.div>

        {/* Features Grid */}
        <AnimatePresence mode="wait">
          {!comparisonMode ? (
            <motion.div
              key="grid"
              className={styles.grid}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <TiltCard
                    key={index}
                    index={index}
                    onExpand={() => setExpandedFeature(feature)}
                  >
                    {/* Progress Ring */}
                    <div className={styles.progressContainer}>
                      <ProgressRing progress={feature.completeness} />
                      <span className={styles.progressLabel}>
                        {feature.completeness}% Complete
                      </span>
                    </div>

                    {/* Icon with glow */}
                    <motion.div
                      className={getIconContainerClass(feature.iconColor)}
                      whileHover={{
                        scale: 1.1,
                        filter: "brightness(1.2)",
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        animate={{
                          y: [0, -5, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <IconComponent className={styles.icon} aria-hidden="true" />
                      </motion.div>
                    </motion.div>

                    {/* Title */}
                    <h3 className={styles.cardTitle}>{feature.title}</h3>

                    {/* Description */}
                    <p className={styles.cardDescription}>{feature.description}</p>

                    {/* Features List */}
                    <ul className={styles.featuresList}>
                      {feature.features.slice(0, 4).map((item, itemIndex) => (
                        <motion.li
                          key={itemIndex}
                          className={styles.featureItem}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: itemIndex * 0.05 }}
                        >
                          <span className={styles.checkIcon}>
                            <FaCheck aria-hidden="true" />
                          </span>
                          <span>{item}</span>
                        </motion.li>
                      ))}
                      <li className={styles.featureItem} style={{ fontStyle: 'italic', color: '#9CA3AF' }}>
                        +{feature.features.length - 4} more features
                      </li>
                    </ul>
                  </TiltCard>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="comparison"
              className={styles.comparisonView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className={styles.comparisonTable}>
                <div className={styles.comparisonHeader}>
                  <div className={styles.comparisonCell}>Feature</div>
                  {features.map((feature, index) => (
                    <div key={index} className={styles.comparisonCell}>
                      <div className={getIconContainerClass(feature.iconColor)}>
                        <feature.icon className={styles.icon} aria-hidden="true" />
                      </div>
                      <span>{feature.title}</span>
                    </div>
                  ))}
                </div>
                {/* Show comparison rows */}
                {[0, 1, 2, 3].map((rowIndex) => (
                  <div key={rowIndex} className={styles.comparisonRow}>
                    <div className={styles.comparisonCell}>
                      Feature #{rowIndex + 1}
                    </div>
                    {features.map((feature, featureIndex) => (
                      <div key={featureIndex} className={styles.comparisonCell}>
                        {feature.features[rowIndex] || '-'}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expanded Feature Modal */}
      <AnimatePresence>
        {expandedFeature && (
          <ExpandedModal
            feature={expandedFeature}
            onClose={() => setExpandedFeature(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
