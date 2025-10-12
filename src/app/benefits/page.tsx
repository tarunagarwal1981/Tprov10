import React from 'react';
import { Metadata } from 'next';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import SkipToContent from '@/components/shared/SkipToContent';
import Breadcrumb from '@/components/shared/Breadcrumb';
import BackToTop from '@/components/shared/BackToTop';
import { FiUsers, FiTrendingUp, FiClock, FiDollarSign, FiShield, FiCheckCircle, FiXCircle } from 'react-icons/fi';

export const metadata: Metadata = {
  title: 'Benefits - TravelSelBuy | Why Travel Businesses Choose Us',
  description: 'Discover how TravelSelBuy simplifies operations, increases efficiency, and drives growth for travel professionals worldwide.',
  keywords: 'travel platform benefits, B2B travel advantages, travel business solutions',
};

/**
 * Benefits Page
 * 
 * Showcasing platform benefits:
 * - Workflow simplification
 * - Feature comparison
 * - ROI and efficiency gains
 */
export default function BenefitsPage() {
  const benefits = [
    {
      icon: FiCheckCircle,
      title: 'Save 15+ Hours Per Week',
      description: 'Automate repetitive tasks like quotations, follow-ups, and booking confirmations. Focus on what matters—growing your business.',
      color: 'from-orange-500 to-yellow-500',
    },
    {
      icon: FiUsers,
      title: 'Access 500+ Verified Suppliers',
      description: 'Connect with tour operators worldwide. No middlemen, no markup—just direct connections and better margins.',
      color: 'from-blue-600 to-cyan-500',
    },
    {
      icon: FiTrendingUp,
      title: 'Increase Revenue by 35%',
      description: 'AI-powered lead generation, smart CRM, and marketplace access help you close more deals faster.',
      color: 'from-purple-600 to-pink-500',
    },
    {
      icon: FiClock,
      title: 'Real-Time Updates',
      description: 'Instant availability checks, booking confirmations, and notifications. Stay ahead with real-time information.',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: FiDollarSign,
      title: 'Lower Your Costs by 40%',
      description: 'No expensive CRM subscriptions, no lead generation fees. All-in-one platform at a fraction of traditional costs.',
      color: 'from-orange-600 to-red-500',
    },
    {
      icon: FiShield,
      title: 'Verified & Secure',
      description: 'All suppliers are verified. Secure payments, data protection, and 24/7 support for peace of mind.',
      color: 'from-indigo-600 to-blue-600',
    },
  ];

  const comparisonFeatures = [
    {
      feature: 'Unified CRM System',
      traditional: false,
      travelselbuy: true,
    },
    {
      feature: 'Direct Supplier Access',
      traditional: false,
      travelselbuy: true,
    },
    {
      feature: 'AI Lead Generation',
      traditional: false,
      travelselbuy: true,
    },
    {
      feature: 'Automated Workflows',
      traditional: false,
      travelselbuy: true,
    },
    {
      feature: 'Real-Time Availability',
      traditional: false,
      travelselbuy: true,
    },
    {
      feature: 'Multi-Channel Communication',
      traditional: false,
      travelselbuy: true,
    },
    {
      feature: 'Analytics Dashboard',
      traditional: false,
      travelselbuy: true,
    },
    {
      feature: 'Mobile Access',
      traditional: false,
      travelselbuy: true,
    },
    {
      feature: '24/7 Support',
      traditional: false,
      travelselbuy: true,
    },
    {
      feature: 'No Setup Fees',
      traditional: false,
      travelselbuy: true,
    },
  ];

  const TrueIcon = FiCheckCircle;
  const FalseIcon = FiXCircle;

  return (
    <div data-theme="marketing" className="min-h-screen flex flex-col">
      <SkipToContent />
      <MarketingHeader />
      <Breadcrumb items={[{ label: 'Benefits' }]} />
      
      <main id="main-content" tabIndex={-1} className="flex-grow" role="main">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-orange-50 via-white to-blue-50 py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Why Travel Businesses <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">Love TravelSelBuy</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of travel professionals who&apos;ve transformed their operations, increased efficiency, and accelerated growth.
            </p>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="bg-gradient-to-r from-orange-500 to-yellow-500 py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">15+</div>
                <div className="text-sm md:text-base opacity-90">Hours Saved/Week</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">35%</div>
                <div className="text-sm md:text-base opacity-90">Revenue Increase</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">40%</div>
                <div className="text-sm md:text-base opacity-90">Cost Reduction</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
                <div className="text-sm md:text-base opacity-90">Verified Suppliers</div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Designed to Simplify Your Workflow</h2>
              <p className="text-xl text-gray-600">Everything you need to succeed, all in one platform</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${benefit.color} rounded-xl flex items-center justify-center mb-6`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">The TravelSelBuy Edge</h2>
              <p className="text-xl text-gray-600">See how we compare to traditional methods</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold p-6">
                <div className="text-left">Feature</div>
                <div className="text-center">Traditional Way</div>
                <div className="text-center">TravelSelBuy</div>
              </div>

              {/* Table Rows */}
              {comparisonFeatures.map((item, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-3 p-6 items-center ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-orange-50 transition-colors`}
                >
                  <div className="font-medium text-gray-900">{item.feature}</div>
                  <div className="flex justify-center">
                    {item.traditional ? (
                      <TrueIcon className="w-6 h-6 text-green-500" />
                    ) : (
                      <FalseIcon className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <div className="flex justify-center">
                    {item.travelselbuy ? (
                      <TrueIcon className="w-6 h-6 text-green-500" />
                    ) : (
                      <FalseIcon className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Below Table */}
            <div className="text-center mt-12">
              <a
                href="/auth/register"
                className="inline-block bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold px-8 py-4 rounded-full hover:shadow-lg transition-all hover:-translate-y-1"
              >
                Start Your Free Trial
              </a>
            </div>
          </div>
        </section>

        {/* ROI Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-12 text-white text-center shadow-2xl">
              <h2 className="text-4xl font-bold mb-6">Calculate Your Savings</h2>
              <p className="text-xl mb-8 opacity-90">
                On average, travel businesses save $2,500/month and increase revenue by $5,000/month using TravelSelBuy.
              </p>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 mb-8">
                <div className="text-5xl font-bold mb-2">$7,500</div>
                <div className="text-lg">Average Monthly Benefit</div>
              </div>
              <a
                href="/auth/register"
                className="inline-block bg-white text-blue-600 font-semibold px-8 py-4 rounded-full hover:shadow-lg transition-all hover:scale-105"
              >
                See Your ROI in 30 Days
              </a>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
      <BackToTop />
    </div>
  );
}

