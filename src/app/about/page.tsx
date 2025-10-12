import React from 'react';
import { Metadata } from 'next';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import SkipToContent from '@/components/shared/SkipToContent';
import Breadcrumb from '@/components/shared/Breadcrumb';
import BackToTop from '@/components/shared/BackToTop';
import { FiTarget as Target, FiEye as Eye, FiHeart as Heart, FiUsers as Users, FiZap as Zap, FiShield as Shield, FiAward as Award, FiTrendingUp as TrendingUp } from 'react-icons/fi';

export const metadata: Metadata = {
  title: 'About Us - TravelSelBuy | Digitizing Global Travel Trade',
  description: 'Learn about TravelSelBuy\'s mission to connect travel professionals worldwide through innovative B2B travel technology.',
  keywords: 'about TravelSelBuy, travel B2B platform, travel technology, mission, vision',
};

/**
 * About Page
 * 
 * Company information including:
 * - Mission & Vision
 * - Core Values
 * - Company Journey
 * - Team (Coming Soon)
 */
export default function AboutPage() {
  const values = [
    {
      icon: Users,
      title: 'Community First',
      description: 'Building a global network of travel professionals who succeed together.',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Leveraging AI and technology to simplify complex travel operations.',
    },
    {
      icon: Shield,
      title: 'Trust & Security',
      description: 'Verified partners and secure transactions for peace of mind.',
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Commitment to delivering exceptional service and results.',
    },
  ];

  const milestones = [
    { year: '2024', title: 'Founded', description: 'TravelSelBuy was born from a vision to connect travel professionals' },
    { year: '2024', title: 'Launch', description: 'Platform launched with 100+ tour operators and 1,000+ agents' },
    { year: '2024', title: 'Growth', description: 'Expanded to 500+ operators and 10,000+ agents globally' },
    { year: '2025', title: 'Future', description: 'Continuing to innovate and scale worldwide' },
  ];

  return (
    <div data-theme="marketing" className="min-h-screen flex flex-col">
      <SkipToContent />
      <MarketingHeader />
      <Breadcrumb items={[{ label: 'About Us' }]} />
      
      <main id="main-content" tabIndex={-1} className="flex-grow" role="main">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-orange-50 via-white to-blue-50 py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-space-grotesk), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
              Digitizing the Future of <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">Global Travel Trade</span>
            </h1>
            <p 
              className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed tracking-tight"
              style={{ fontFamily: 'var(--font-space-grotesk), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
            >
              TravelSelBuy is the AI-powered B2B Travel Operating System transforming how travel businesses operate. We connect small travel agents and tour operators globally, automating up to 75% of manual tasks to save time, reduce errors, and boost productivity. Our platform empowers travel entrepreneurs to expand profitably, streamline operations, and deliver exceptional service—all through one seamless, AI-driven ecosystem redefining B2B travel commerce.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Mission Card */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border-t-4 border-orange-500 hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  To empower travel professionals worldwide by providing an all-in-one B2B platform that simplifies operations, expands reach, and drives sustainable growth through innovation and collaboration.
                </p>
              </div>

              {/* Vision Card */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border-t-4 border-blue-600 hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center mb-6">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  To become the world&apos;s most trusted B2B travel ecosystem where every travel professional—regardless of size or location—can access opportunities, scale efficiently, and thrive in the digital era.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
              <p className="text-xl text-gray-600">The principles that guide everything we do</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all hover:-translate-y-2"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Journey Timeline */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Journey</h2>
              <p className="text-xl text-gray-600">Building the future of travel, one milestone at a time</p>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-orange-500 to-blue-600" />

              {/* Milestones */}
              {milestones.map((milestone, index) => (
                <div key={index} className={`relative flex items-center mb-12 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12 text-left'}`}>
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="text-3xl font-bold text-orange-500 mb-2">{milestone.year}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full border-4 border-white shadow-lg" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section (Placeholder) */}
        <section className="py-20 px-4 bg-gradient-to-br from-orange-50 to-blue-50">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 mb-8">Coming Soon</p>
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-16 border-2 border-dashed border-gray-300">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">We&apos;re building an amazing team. Check back soon to meet the people behind TravelSelBuy!</p>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
      <BackToTop />
    </div>
  );
}
