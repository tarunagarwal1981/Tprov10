'use client';

import React from 'react';
import {
  FiXCircle,
  FiAlertCircle,
  FiTrendingDown,
  FiCheckCircle,
  FiZap,
  FiTrendingUp,
} from 'react-icons/fi';
import styles from './ProblemSolution.module.css';

/**
 * Problem-Solution Section Component
 * 
 * Two-column layout showcasing:
 * - Left: Challenges travel agents face
 * - Right: How TravelSelBuy solves these challenges
 * 
 * Features:
 * - CSS Grid two-column layout
 * - React Icons with colored circular backgrounds
 * - Desktop-first responsive design
 * - Hover effects for better engagement
 */

// Problems data
const problems = [
  {
    icon: FiXCircle,
    iconColor: 'red',
    title: 'Fragmented Market Access',
    description:
      'Struggling to connect with verified tour operators worldwide, limiting your ability to offer competitive packages to customers.',
  },
  {
    icon: FiAlertCircle,
    iconColor: 'orange',
    title: 'High CRM Costs & Manual Work',
    description:
      'Expensive CRM software with limited features. Repetitive manual tasks in quotations, bookings, and communication cause delays and errors.',
  },
  {
    icon: FiTrendingDown,
    iconColor: 'red',
    title: 'Expensive Lead Generation',
    description:
      'High marketing costs limit outreach, reduce profit margins, and slow overall business growth significantly.',
  },
];

// Solutions data
const solutions = [
  {
    icon: FiCheckCircle,
    iconColor: 'green',
    title: 'Direct Operator Connections',
    description:
      'Access a global marketplace of verified tour operators. Negotiate directly, get better deals, and offer more choices to your customers.',
  },
  {
    icon: FiZap,
    iconColor: 'blue',
    title: 'AI-Powered Automation',
    description:
      'Automated booking workflows, AI-driven communication, and smart CRM features minimize manual work and maximize efficiency.',
  },
  {
    icon: FiTrendingUp,
    iconColor: 'green',
    title: 'Smart Lead Generation',
    description:
      'AI-powered lead generation from social media, voice agent verification, and intelligent lead scoring—all at a fraction of traditional costs.',
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

export default function ProblemSolution() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Problems Column */}
          <div className={styles.column}>
            <h2 className={`${styles.columnTitle} ${styles.problemsTitle}`}>
              Challenges Travel Agents Face
            </h2>
            <div className={styles.itemsList}>
              {problems.map((problem, index) => {
                const IconComponent = problem.icon;
                return (
                  <div
                    key={index}
                    className={`${styles.card} ${styles.problemCard}`}
                  >
                    <div className={getIconContainerClass(problem.iconColor)}>
                      <IconComponent className={styles.icon} aria-hidden="true" />
                    </div>
                    <div className={styles.content}>
                      <h3 className={styles.cardTitle}>{problem.title}</h3>
                      <p className={styles.cardDescription}>
                        {problem.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Solutions Column */}
          <div className={styles.column}>
            <h2 className={`${styles.columnTitle} ${styles.solutionsTitle}`}>
              How TravelSelBuy Solves This
            </h2>
            <div className={styles.itemsList}>
              {solutions.map((solution, index) => {
                const IconComponent = solution.icon;
                return (
                  <div
                    key={index}
                    className={`${styles.card} ${styles.solutionCard}`}
                  >
                    <div className={getIconContainerClass(solution.iconColor)}>
                      <IconComponent className={styles.icon} aria-hidden="true" />
                    </div>
                    <div className={styles.content}>
                      <h3 className={styles.cardTitle}>{solution.title}</h3>
                      <p className={styles.cardDescription}>
                        {solution.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
