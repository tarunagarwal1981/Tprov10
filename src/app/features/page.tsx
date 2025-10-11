import React from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import FeaturesGrid from '@/components/marketing/FeaturesGrid';

/**
 * Features Page
 * 
 * Detailed overview of TravelSelBuy's features and capabilities
 */
export default function FeaturesPage() {
  return (
    <div data-theme="marketing" className="min-h-screen flex flex-col">
      <MarketingHeader />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-orange-50 to-blue-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful Features for Modern Travel Businesses
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to grow your travel business, powered by AI and built for efficiency
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <FeaturesGrid />

        {/* Additional Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              And Much More...
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: 'Multi-Currency Support',
                  description: 'Accept payments in multiple currencies with automatic conversion'
                },
                {
                  title: 'Advanced Reporting',
                  description: 'Comprehensive analytics and insights for better decision making'
                },
                {
                  title: 'Mobile Responsive',
                  description: 'Fully responsive design works perfectly on all devices'
                },
                {
                  title: 'API Integration',
                  description: 'Connect with your existing tools via our powerful API'
                },
                {
                  title: 'White Label Options',
                  description: 'Customize the platform with your own branding'
                },
                {
                  title: '24/7 Support',
                  description: 'Round-the-clock customer support when you need it'
                },
              ].map((feature, index) => (
                <div key={index} className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}



