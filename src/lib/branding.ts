/**
 * TravelSelBuy Branding Constants
 * 
 * Centralized location for all brand-related constants, colors, and information.
 * Update this file to change branding across the entire application.
 */

export const BRAND = {
  name: 'TravelSelBuy',
  tagline: 'Your Partner in Growth',
  description: 'AI-Powered Travel Booking Platform for Small Travel Agents',
  
  colors: {
    marketing: {
      primary: '#FF6B35',
      secondary: '#004E89',
      primaryLight: '#FF8C61',
      secondaryLight: '#0066B3',
      primaryDark: '#E05A2A',
      secondaryDark: '#003D6B',
    },
    operator: {
      primary: '#FF6B35',
      accent: '#FFB800',
      secondary: '#004E89',
      primaryLight: '#FF8C61',
      primaryDark: '#E05A2A',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    agent: {
      primary: '#004E89',
      accent: '#00B4D8',
      secondary: '#0077B6',
      primaryLight: '#0066B3',
      primaryDark: '#003D6B',
    },
  },
  
  gradients: {
    marketing: {
      primary: 'linear-gradient(135deg, #FF6B35 0%, #FF4B8C 100%)',
      secondary: 'linear-gradient(135deg, #004E89 0%, #0080C8 100%)',
    },
    operator: {
      main: 'linear-gradient(135deg, #FF6B35 0%, #FFB800 100%)',
      card: 'linear-gradient(135deg, #FFF5F0 0%, #FFFFFF 100%)',
      hover: 'linear-gradient(135deg, #E05A2A 0%, #E5A600 100%)',
    },
    agent: {
      main: 'linear-gradient(135deg, #004E89 0%, #00B4D8 100%)',
      card: 'linear-gradient(135deg, #F0F9FF 0%, #FFFFFF 100%)',
    },
  },
  
  contact: {
    email: 'support@travelselbuy.com',
    phone: '+1-XXX-XXX-XXXX',
    address: '123 Travel Street, City, Country',
    supportHours: 'Monday - Friday, 9:00 AM - 6:00 PM EST',
  },
  
  social: {
    twitter: 'https://twitter.com/travelselbuy',
    linkedin: 'https://linkedin.com/company/travelselbuy',
    facebook: 'https://facebook.com/travelselbuy',
    instagram: 'https://instagram.com/travelselbuy',
    youtube: 'https://youtube.com/@travelselbuy',
  },
  
  legal: {
    companyName: 'TravelSelBuy Inc.',
    registrationNumber: 'XXX-XXX-XXX',
    copyright: `© ${new Date().getFullYear()} TravelSelBuy Inc. All rights reserved.`,
    privacyPolicy: '/privacy-policy',
    termsOfService: '/terms-of-service',
    cookiePolicy: '/cookie-policy',
  },
  
  urls: {
    website: 'https://travelselbuy.com',
    dashboard: 'https://app.travelselbuy.com',
    api: 'https://api.travelselbuy.com',
    docs: 'https://docs.travelselbuy.com',
    blog: 'https://blog.travelselbuy.com',
  },
  
  features: {
    aiPowered: true,
    multiLanguage: true,
    mobileResponsive: true,
    realTimeBooking: true,
    commissionTracking: true,
    customerManagement: true,
  },
  
  targetAudience: {
    primary: 'Small to medium travel agencies',
    secondary: 'Independent travel agents',
    tertiary: 'Tour operators',
  },
} as const;

// TypeScript Types
export type BrandColors = typeof BRAND.colors;
export type MarketingColors = typeof BRAND.colors.marketing;
export type OperatorColors = typeof BRAND.colors.operator;
export type AgentColors = typeof BRAND.colors.agent;

export type BrandGradients = typeof BRAND.gradients;
export type MarketingGradients = typeof BRAND.gradients.marketing;
export type OperatorGradients = typeof BRAND.gradients.operator;
export type AgentGradients = typeof BRAND.gradients.agent;

export type BrandContact = typeof BRAND.contact;
export type BrandSocial = typeof BRAND.social;
export type BrandLegal = typeof BRAND.legal;
export type BrandUrls = typeof BRAND.urls;
export type BrandFeatures = typeof BRAND.features;
export type BrandTargetAudience = typeof BRAND.targetAudience;

export type ThemeType = 'marketing' | 'operator' | 'agent';

// Helper Functions

/**
 * Get theme colors for a specific theme
 */
export function getThemeColors(theme: ThemeType): BrandColors[ThemeType] {
  return BRAND.colors[theme];
}

/**
 * Get theme gradients for a specific theme
 */
export function getThemeGradients(theme: ThemeType): BrandGradients[ThemeType] {
  return BRAND.gradients[theme];
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string = BRAND.contact.phone): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // Return original if formatting doesn't apply
  return phone;
}

/**
 * Get brand name with optional tagline
 */
export function getBrandName(includeTagline: boolean = false): string {
  return includeTagline ? `${BRAND.name} - ${BRAND.tagline}` : BRAND.name;
}

/**
 * Get social media URL by platform
 */
export function getSocialUrl(platform: keyof BrandSocial): string {
  return BRAND.social[platform];
}

/**
 * Get legal URL by type
 */
export function getLegalUrl(type: keyof Pick<BrandLegal, 'privacyPolicy' | 'termsOfService' | 'cookiePolicy'>): string {
  return BRAND.legal[type];
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof BrandFeatures): boolean {
  return BRAND.features[feature];
}

/**
 * Get CSS custom properties for a theme
 */
export function getThemeCSSVariables(theme: ThemeType): Record<string, string> {
  const colors = getThemeColors(theme);
  const gradients = getThemeGradients(theme);
  
  const cssVars: Record<string, string> = {};
  
  // Add color variables
  Object.entries(colors).forEach(([key, value]) => {
    cssVars[`--${theme}-${key}`] = value;
  });
  
  // Add gradient variables
  Object.entries(gradients).forEach(([key, value]) => {
    cssVars[`--${theme}-gradient-${key}`] = value;
  });
  
  return cssVars;
}

/**
 * Get brand metadata for SEO
 */
export function getBrandMetadata() {
  return {
    title: BRAND.name,
    description: BRAND.description,
    keywords: [
      'travel booking',
      'travel agency',
      'AI powered',
      'travel platform',
      'tour operator',
      'travel agent',
      'booking system',
      'travel management',
    ],
    author: BRAND.legal.companyName,
    url: BRAND.urls.website,
  };
}

// Export individual constants for convenience
export const {
  name: BRAND_NAME,
  tagline: BRAND_TAGLINE,
  description: BRAND_DESCRIPTION,
  colors: BRAND_COLORS,
  gradients: BRAND_GRADIENTS,
  contact: BRAND_CONTACT,
  social: BRAND_SOCIAL,
  legal: BRAND_LEGAL,
  urls: BRAND_URLS,
} = BRAND;
