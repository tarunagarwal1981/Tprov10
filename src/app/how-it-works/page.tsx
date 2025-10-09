import React from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { FiUserPlus, FiPackage, FiUsers, FiTrendingUp } from 'react-icons/fi';

/**
 * How It Works Page
 * 
 * Step-by-step guide on how to use TravelSelBuy
 */
export default function HowItWorksPage() {
  const steps = [
    {
      icon: FiUserPlus,
      title: 'Sign Up & Get Started',
      description: 'Create your account as a tour operator or travel agent. Complete your profile and verify your business credentials.',
      details: ['Quick 5-minute setup', 'No credit card required', 'Instant access to platform']
    },
    {
      icon: FiPackage,
      title: 'Browse or List Packages',
      description: 'Tour operators can list their packages. Travel agents can browse thousands of verified packages from operators worldwide.',
      details: ['Real-time availability', 'Competitive pricing', 'Detailed package information']
    },
    {
      icon: FiUsers,
      title: 'Connect & Manage',
      description: 'Use our AI-powered CRM to manage customers, automate communications, and track all your bookings in one place.',
      details: ['Automated follow-ups', 'Customer journey tracking', 'AI communication assistant']
    },
    {
      icon: FiTrendingUp,
      title: 'Grow Your Business',
      description: 'Leverage AI lead generation, analytics, and insights to scale your travel business faster than ever before.',
      details: ['Smart lead scoring', 'Performance analytics', 'Revenue optimization']
    },
  ];

  return (
    <div data-theme="marketing" className="min-h-screen flex flex-col">
      <MarketingHeader />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How TravelSelBuy Works
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started is easy. Follow these simple steps to transform your travel business.
            </p>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="mb-16 last:mb-0">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-lg bg-orange-100 flex items-center justify-center">
                          <IconComponent className="w-8 h-8 text-orange-600" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                          {step.title}
                        </h2>
                      </div>
                      <p className="text-lg text-gray-600 mb-4">
                        {step.description}
                      </p>
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center text-gray-700">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="ml-10 mt-8 mb-8 h-16 w-0.5 bg-gradient-to-b from-orange-300 to-orange-100"></div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-orange-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Join thousands of travel professionals growing their business with TravelSelBuy
            </p>
            <button className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-semibold transition-colors">
              Start Your Free Trial
            </button>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

