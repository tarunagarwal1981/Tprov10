'use client';

import React from 'react';
import Link from 'next/link';
import { FiPackage, FiBriefcase, FiUsers, FiDollarSign, FiGlobe } from 'react-icons/fi';
import styles from './Hero.module.css';

/**
 * Hero Section Component
 * 
 * Compelling hero section for TravelSelBuy homepage with:
 * - AI-powered travel booking platform headline
 * - Two prominent CTAs for tour operators and travel agents
 * - Trust indicators with statistics
 * - Gradient background with animated shapes
 * - Desktop-first responsive design
 */

// Trust indicators data
const trustIndicators = [
  {
    icon: FiPackage,
    text: '500+ Tour Operators',
    label: 'Tour Operators'
  },
  {
    icon: FiUsers,
    text: '10,000+ Travel Agents',
    label: 'Travel Agents'
  },
  {
    icon: FiDollarSign,
    text: '$2M+ Monthly Bookings',
    label: 'Monthly Bookings'
  },
  {
    icon: FiGlobe,
    text: '50+ Countries',
    label: 'Countries'
  }
];

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContainer}>
        {/* Headline */}
        <h1 className={styles.headline}>
          AI-Powered Travel Booking Platform for Small Travel Agents
        </h1>
        
        {/* Subheadline */}
        <p className={styles.subheadline}>
          Generate leads, manage customers, and book packages—all in one intelligent platform. 
          Join 500+ tour operators and 10,000+ travel agents growing their business with TravelSelBuy.
        </p>
        
        {/* CTA Buttons */}
        <div className={styles.ctaSection}>
          <Link
            href="/auth/register?role=tour_operator"
            className={`${styles.ctaButton} ${styles.tourOperatorCTA}`}
            aria-label="Register as a Tour Operator"
          >
            <FiPackage className={styles.ctaButtonIcon} aria-hidden="true" />
            <span className={styles.ctaButtonText}>I&apos;m a Tour Operator</span>
          </Link>
          
          <Link
            href="/auth/register?role=travel_agent"
            className={`${styles.ctaButton} ${styles.travelAgentCTA}`}
            aria-label="Register as a Travel Agent"
          >
            <FiBriefcase className={styles.ctaButtonIcon} aria-hidden="true" />
            <span className={styles.ctaButtonText}>I&apos;m a Travel Agent</span>
          </Link>
        </div>
        
        {/* Trust Indicators */}
        <div className={styles.trustSection}>
          {trustIndicators.map((indicator, index) => {
            const IconComponent = indicator.icon;
            return (
              <div
                key={index}
                className={styles.trustIndicator}
                aria-label={indicator.label}
              >
                <IconComponent className={styles.trustIcon} aria-hidden="true" />
                <span className={styles.trustText}>{indicator.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
