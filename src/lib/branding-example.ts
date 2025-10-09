/**
 * Example usage of TravelSelBuy branding constants
 * This file demonstrates how to use the branding system
 */

import { 
  BRAND, 
  getThemeColors, 
  getThemeGradients, 
  formatPhoneNumber,
  getBrandName,
  getThemeCSSVariables,
  type ThemeType 
} from './branding';

// Example 1: Using brand colors in components
export function useBrandColors(theme: ThemeType = 'marketing') {
  const colors = getThemeColors(theme);
  const gradients = getThemeGradients(theme);
  
  return {
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    primaryGradient: ('primary' in gradients ? gradients.primary : gradients.main),
    // ... other colors
  };
}

// Example 2: Creating a styled component with brand colors
export const brandStyles = {
  button: {
    primary: {
      background: BRAND.gradients.marketing.primary,
      color: 'white',
      borderRadius: '8px',
      padding: '12px 24px',
    },
    secondary: {
      background: BRAND.gradients.marketing.secondary,
      color: 'white',
      borderRadius: '8px',
      padding: '12px 24px',
    },
  },
  text: {
    brandName: {
      color: BRAND.colors.marketing.primary,
      fontWeight: 'bold',
      fontSize: '24px',
    },
    tagline: {
      color: BRAND.colors.marketing.secondary,
      fontSize: '16px',
      fontStyle: 'italic',
    },
  },
};

// Example 3: Using in React components
export const BrandInfo = {
  name: BRAND.name,
  tagline: BRAND.tagline,
  description: BRAND.description,
  contactEmail: BRAND.contact.email,
  formattedPhone: formatPhoneNumber(),
  socialLinks: BRAND.social,
  copyright: BRAND.legal.copyright,
};

// Example 4: Theme-specific configurations
export const themeConfigs = {
  marketing: {
    colors: getThemeColors('marketing'),
    gradients: getThemeGradients('marketing'),
    cssVariables: getThemeCSSVariables('marketing'),
  },
  operator: {
    colors: getThemeColors('operator'),
    gradients: getThemeGradients('operator'),
    cssVariables: getThemeCSSVariables('operator'),
  },
  agent: {
    colors: getThemeColors('agent'),
    gradients: getThemeGradients('agent'),
    cssVariables: getThemeCSSVariables('agent'),
  },
};

// Example 5: Using in CSS-in-JS or styled-components
export const createThemeStyles = (theme: ThemeType) => {
  const colors = getThemeColors(theme);
  const gradients = getThemeGradients(theme);
  
  return {
    container: {
      background: colors.primary,
      color: 'white',
    },
    button: {
      background: ('main' in gradients ? gradients.main : gradients.primary),
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      color: 'white',
      cursor: 'pointer',
    },
    card: {
      background: ('card' in gradients ? gradients.card : 'white'),
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
  };
};

// Example 6: SEO metadata
export const seoMetadata = {
  title: `${BRAND.name} - ${BRAND.tagline}`,
  description: BRAND.description,
  keywords: [
    'travel booking',
    'AI powered',
    'travel agency',
    'booking platform',
  ],
  openGraph: {
    title: BRAND.name,
    description: BRAND.description,
    url: BRAND.urls.website,
    siteName: BRAND.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND.name,
    description: BRAND.description,
  },
};

// Example 7: Contact information formatting
export const contactInfo = {
  email: BRAND.contact.email,
  phone: formatPhoneNumber(BRAND.contact.phone),
  address: BRAND.contact.address,
  supportHours: BRAND.contact.supportHours,
  social: {
    twitter: BRAND.social.twitter,
    linkedin: BRAND.social.linkedin,
    facebook: BRAND.social.facebook,
    instagram: BRAND.social.instagram,
  },
};

// Example 8: Legal information
export const legalInfo = {
  companyName: BRAND.legal.companyName,
  copyright: BRAND.legal.copyright,
  registrationNumber: BRAND.legal.registrationNumber,
  links: {
    privacy: BRAND.legal.privacyPolicy,
    terms: BRAND.legal.termsOfService,
    cookies: BRAND.legal.cookiePolicy,
  },
};
