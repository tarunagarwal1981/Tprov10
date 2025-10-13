'use client';

import React from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/branding';

export interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showText?: boolean;
  className?: string;
  href?: string;
  asLink?: boolean;
}

// SVG Logo Component
const LogoSVG: React.FC<{ width: number; height: number; className?: string; variant?: 'light' | 'dark' }> = ({ 
  width, 
  height,
  className = '',
  variant = 'light'
}) => {
  const scale = width / 400;
  const viewBoxHeight = 100;
  
  return (
    <svg 
      viewBox={`0 0 420 ${viewBoxHeight}`} 
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="orangePurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#F59E0B' }} />
          <stop offset="50%" style={{ stopColor: '#EC4899' }} />
          <stop offset="100%" style={{ stopColor: '#8B5CF6' }} />
        </linearGradient>
      </defs>
      
      {/* Star/Compass Icon */}
      <g transform="translate(35, 50)">
        {/* North */}
        <path d="M 0 -26 L 4 -4 L -4 -4 Z" fill="#F59E0B"/>
        {/* East */}
        <path d="M 26 0 L 4 4 L 4 -4 Z" fill="#F97316"/>
        {/* South */}
        <path d="M 0 26 L 4 4 L -4 4 Z" fill="#EC4899"/>
        {/* West */}
        <path d="M -26 0 L -4 4 L -4 -4 Z" fill="#8B5CF6"/>
        {/* Center */}
        <circle cx="0" cy="0" r="5" fill="white"/>
        <circle cx="0" cy="0" r="3" fill="url(#orangePurple)"/>
      </g>
      
      {/* Wordmark - "Travel" in blue or white based on variant */}
      <text 
        x="75" 
        y="58" 
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
        fontSize="32" 
        fontWeight="600" 
        fill={variant === 'dark' ? '#FFFFFF' : '#004E89'}
      >
        Travel
      </text>
      
      {/* Wordmark - "SelBuy" in orange or yellow based on variant */}
      <text 
        x="161" 
        y="58" 
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
        fontSize="32" 
        fontWeight="600" 
        fill={variant === 'dark' ? '#FFB800' : '#FF6B35'}
      >
        SelBuy
      </text>
    </svg>
  );
};

const Logo: React.FC<LogoProps> = ({
  variant = 'light',
  size = 'md',
  showTagline = false,
  showText = true,
  className = '',
  href = '/',
  asLink = true,
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      width: 180,
      height: 43,
      textSize: 16,
      gap: 8,
    },
    md: {
      width: 250,
      height: 60,
      textSize: 20,
      gap: 10,
    },
    lg: {
      width: 300,
      height: 71,
      textSize: 24,
      gap: 12,
    },
    xl: {
      width: 380,
      height: 90,
      textSize: 32,
      gap: 16,
    },
  };

  const config = sizeConfig[size];

  // Color configurations based on variant
  const colorConfig = {
    light: {
      tagline: '#6B7280',
    },
    dark: {
      tagline: '#D1D5DB',
    },
  };

  const colors = colorConfig[variant];

  // Container styles
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
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

  const logoContent = (
    <div style={containerStyles} className={className}>
      <LogoSVG width={config.width} height={config.height} variant={variant} />
      {showTagline && (
        <span style={taglineStyles} className="tagline">
          {BRAND.tagline}
        </span>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link href={href} aria-label={`${BRAND.name} - ${BRAND.tagline}`}>
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

// Named export
export { Logo, LogoSVG };

// Default export
export default Logo;
