import React from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import SkipToContent from '@/components/shared/SkipToContent';
import Hero from '@/components/marketing/Hero';
import ProblemSolution from '@/components/marketing/ProblemSolution';
import FeaturesGrid from '@/components/marketing/FeaturesGrid';
import WhoWeHelp from '@/components/marketing/WhoWeHelp';
import Testimonials from '@/components/marketing/Testimonials';
import CTASection from '@/components/marketing/CTASection';
// import HowItWorks from '@/components/marketing/HowItWorks';
// import Stats from '@/components/marketing/Stats';

export const metadata = {
  title: 'TravelSelbuy - B2B Travel Marketplace for Tour Operators & Travel Agents',
  description: 'Connect tour operators with travel agents worldwide. Streamline bookings, manage packages, and grow your travel business with TravelSelbuy.',
  keywords: 'B2B travel, tour operators, travel agents, travel marketplace, booking platform',
  openGraph: {
    title: 'TravelSelbuy - B2B Travel Marketplace',
    description: 'Connect tour operators with travel agents worldwide',
    type: 'website',
  },
};

/**
 * Main Homepage (Root Route)
 * 
 * This is the main entry point for TravelSelBuy marketing site.
 * Includes:
 * - MarketingHeader with navigation
 * - MarketingFooter with newsletter and links
 * - data-theme="marketing" for consistent branding
 * 
 * Page Structure:
 * 1. Hero - Main hero section with CTAs for tour operators and travel agents
 * 2. ProblemSolution - Explains the problem and how TravelSelBuy solves it
 * 3. FeaturesGrid - Grid of key features and benefits
 * 4. WhoWeHelp - Target audience cards with 3D flip animation
 * 5. Testimonials - Customer testimonials carousel with autoplay
 * 6. CTASection - Final call-to-action with gradient background and animations
 * 7. HowItWorks - Step-by-step guide (coming soon)
 * 8. Stats - Statistics and social proof (coming soon)
 */
export default function HomePage() {
  return (
    <div data-theme="marketing" className="min-h-screen flex flex-col">
      <SkipToContent />
      <MarketingHeader />
      <main id="main-content" tabIndex={-1} className="flex-grow" role="main">
        {/* Hero Section */}
        <Hero />
        
        {/* Problem-Solution Section */}
        <ProblemSolution />
        
        {/* Features Grid Section */}
        <FeaturesGrid />
        
        {/* Who We Help Section */}
        <WhoWeHelp />
        
        {/* Testimonials Section */}
        <Testimonials />
        
        {/* Final CTA Section */}
        <CTASection />
        
        {/* Other sections will be added here */}
        {/* <HowItWorks /> */}
        {/* <Stats /> */}
      </main>
      <MarketingFooter />
    </div>
  );
}