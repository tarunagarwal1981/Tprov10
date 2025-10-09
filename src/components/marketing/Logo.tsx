'use client';

import React from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/branding';

export interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({
  variant = 'light',
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      iconSize: 20,
      textSize: 16,
      gap: 8,
    },
    md: {
      iconSize: 24,
      textSize: 20,
      gap: 10,
    },
    lg: {
      iconSize: 32,
      textSize: 24,
      gap: 12,
    },
    xl: {
      iconSize: 40,
      textSize: 32,
      gap: 16,
    },
  };

  const config = sizeConfig[size];

  // Color configurations based on variant
  const colorConfig = {
    light: {
      iconGradient: BRAND.gradients.operator.main,
      brandName: '#1F2937',
      tagline: '#6B7280',
      hoverIconGradient: BRAND.gradients.operator.hover,
    },
    dark: {
      iconGradient: BRAND.gradients.operator.main,
      brandName: '#F9FAFB',
      tagline: '#D1D5DB',
      hoverIconGradient: 'linear-gradient(135deg, #FF8C61 0%, #FFC947 100%)',
    },
  };

  const colors = colorConfig[variant];

  // Container styles
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${config.gap}px`,
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
  };

  // Icon styles with gradient
  const iconStyles: React.CSSProperties = {
    width: `${config.iconSize}px`,
    height: `${config.iconSize}px`,
    background: colors.iconGradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    transition: 'all 0.3s ease',
    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
  };

  // Text container styles
  const textContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: 1.2,
  };

  // Brand name styles
  const brandNameStyles: React.CSSProperties = {
    fontSize: `${config.textSize}px`,
    fontWeight: 700,
    color: colors.brandName,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    letterSpacing: '-0.025em',
    transition: 'color 0.3s ease',
  };

  // Tagline styles
  const taglineStyles: React.CSSProperties = {
    fontSize: `${Math.max(config.textSize * 0.7, 12)}px`,
    fontWeight: 400,
    color: colors.tagline,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    letterSpacing: '0.025em',
    marginTop: '2px',
    transition: 'color 0.3s ease',
  };

  // Hover effect styles
  const hoverStyles: React.CSSProperties = {
    transform: 'translateY(-1px)',
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const container = e.currentTarget;
    const iconBox = container.querySelector('.logo-icon-box') as HTMLDivElement | null;
    
    if (iconBox) {
      iconBox.style.background = colors.hoverIconGradient;
      iconBox.style.transform = 'scale(1.05)';
    }
    
    Object.assign(container.style, hoverStyles);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const container = e.currentTarget;
    const iconBox = container.querySelector('.logo-icon-box') as HTMLDivElement | null;
    
    if (iconBox) {
      iconBox.style.background = colors.iconGradient;
      iconBox.style.transform = 'scale(1)';
    }
    
    container.style.transform = 'translateY(0)';
  };

  // Icon box styles (like login page)
  const iconBoxStyles: React.CSSProperties = {
    width: `${config.iconSize * 1.5}px`,
    height: `${config.iconSize * 1.5}px`,
    background: colors.iconGradient,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${config.iconSize}px`,
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };

  return (
    <Link
      href="/"
      style={containerStyles}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`${BRAND.name} - ${BRAND.tagline}`}
    >
      <div style={iconBoxStyles} className="logo-icon-box">
        ✈️
      </div>
      <div style={textContainerStyles}>
        <span style={brandNameStyles} className="brand-name">
          {BRAND.name}
        </span>
        {showTagline && (
          <span style={taglineStyles} className="tagline">
            {BRAND.tagline}
          </span>
        )}
      </div>
    </Link>
  );
};

// Named export
export { Logo };

// Default export
export default Logo;
