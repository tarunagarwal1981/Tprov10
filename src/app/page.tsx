import React from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import Hero from '@/components/marketing/Hero';
import ProblemSolution from '@/components/marketing/ProblemSolution';
import FeaturesGrid from '@/components/marketing/FeaturesGrid';
// import HowItWorks from '@/components/marketing/HowItWorks';
// import Stats from '@/components/marketing/Stats';
// import Testimonials from '@/components/marketing/Testimonials';
// import CTASection from '@/components/marketing/CTASection';

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
 * 4. HowItWorks - Step-by-step guide (coming soon)
 * 5. Stats - Statistics and social proof (coming soon)
 * 6. Testimonials - Customer testimonials (coming soon)
 * 7. CTASection - Final call-to-action (coming soon)
 */
export default function HomePage() {
  return (
    <div data-theme="marketing" className="min-h-screen flex flex-col">
      <MarketingHeader />
      <main className="flex-grow">
        {/* Hero Section */}
        <Hero />
        
        {/* Problem-Solution Section */}
        <ProblemSolution />
        
        {/* Features Grid Section */}
        <FeaturesGrid />
        
        {/* Other sections will be added here */}
        {/* <HowItWorks /> */}
        {/* <Stats /> */}
        {/* <Testimonials /> */}
        {/* <CTASection /> */}
      </main>
      <MarketingFooter />
    </div>
  );
}