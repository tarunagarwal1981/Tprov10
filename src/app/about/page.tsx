import React from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { BRAND } from '@/lib/branding';

/**
 * About Page
 * 
 * Company information and mission
 */
export default function AboutPage() {
  const values = [
    {
      title: 'Innovation',
      description: 'We leverage cutting-edge AI technology to solve real problems in the travel industry.'
    },
    {
      title: 'Empowerment',
      description: 'We believe in empowering small travel businesses to compete with industry giants.'
    },
    {
      title: 'Transparency',
      description: 'Clear pricing, honest communication, and no hidden fees—ever.'
    },
    {
      title: 'Support',
      description: 'Your success is our success. We\'re here to help you grow every step of the way.'
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
              About {BRAND.name}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {BRAND.tagline}
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Our Mission
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-center">
              {BRAND.description}
            </p>
            <p className="text-lg text-gray-700 leading-relaxed text-center">
              We believe that every travel agent and tour operator deserves access to powerful tools 
              that were once only available to large enterprises. Our platform democratizes access to 
              AI-powered lead generation, intelligent CRM systems, and global marketplace connections—all 
              at an affordable price point.
            </p>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Our Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Our Impact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">500+</div>
                <div className="text-gray-600">Tour Operators</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">10,000+</div>
                <div className="text-gray-600">Travel Agents</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">$2M+</div>
                <div className="text-gray-600">Monthly Bookings</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">50+</div>
                <div className="text-gray-600">Countries</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-orange-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Join Us on This Journey
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Be part of the revolution in travel technology. Start growing your business today.
            </p>
            <button className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-semibold transition-colors">
              Get Started Free
            </button>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

