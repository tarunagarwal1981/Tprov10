'use client';

import React from 'react';
import { FiCpu, FiShoppingCart, FiUsers } from 'react-icons/fi';
import { FaCheck } from 'react-icons/fa';
import styles from './FeaturesGrid.module.css';

/**
 * Features Grid Section Component
 * 
 * Showcases TravelSelBuy's main features in a three-column grid:
 * 1. AI Lead Generation - Automated customer acquisition
 * 2. Smart Marketplace - Global package access
 * 3. Intelligent CRM - AI-driven relationship management
 * 
 * Features:
 * - Three-column grid (responsive)
 * - Gradient icon backgrounds
 * - Feature lists with checkmarks
 * - Hover effects and animations
 * - Desktop-first responsive design
 */

// Features data
const features = [
  {
    icon: FiCpu,
    iconColor: 'orange',
    title: 'AI-Powered Lead Generation',
    description: 'Let AI find and qualify customers for you automatically.',
    features: [
      'Social media lead sourcing',
      'Voice agent verification',
      'Intelligent lead scoring',
      'Automated follow-ups',
      'WhatsApp integration',
      '24/7 lead nurturing',
    ],
  },
  {
    icon: FiShoppingCart,
    iconColor: 'blue',
    title: 'Global Package Marketplace',
    description: 'Access thousands of tour packages from verified operators worldwide.',
    features: [
      'Direct operator connections',
      'Real-time availability',
      'Instant booking confirmation',
      'Competitive pricing',
      'Package customization',
      'Multi-destination support',
    ],
  },
  {
    icon: FiUsers,
    iconColor: 'purple',
    title: 'AI-Driven CRM System',
    description: 'Manage customer relationships with intelligent automation.',
    features: [
      'Customer journey tracking',
      'AI communication assistant',
      'Automated proposals',
      'Revenue analytics',
      'Performance insights',
      'Integration with WhatsApp',
    ],
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
    default:
      return baseClass;
  }
};

export default function FeaturesGrid() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            Powerful Features for Modern Travel Businesses
          </h2>
          <p className={styles.subtitle}>
            Everything you need to grow your travel business, powered by AI
          </p>
        </div>

        {/* Features Grid */}
        <div className={styles.grid}>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className={styles.card}>
                {/* Icon */}
                <div className={getIconContainerClass(feature.iconColor)}>
                  <IconComponent className={styles.icon} aria-hidden="true" />
                </div>

                {/* Title */}
                <h3 className={styles.cardTitle}>{feature.title}</h3>

                {/* Description */}
                <p className={styles.cardDescription}>{feature.description}</p>

                {/* Features List */}
                <ul className={styles.featuresList}>
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className={styles.featureItem}>
                      <span className={styles.checkIcon}>
                        <FaCheck aria-hidden="true" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
