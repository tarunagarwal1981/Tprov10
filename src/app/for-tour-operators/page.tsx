'use client';

import React, { useState } from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import SkipToContent from '@/components/shared/SkipToContent';
import Breadcrumb from '@/components/shared/Breadcrumb';
import BackToTop from '@/components/shared/BackToTop';
import { Globe, Users, TrendingUp, MessageSquare, BarChart3, Package, CheckCircle, ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * For Tour Operators Page
 * 
 * Tailored content for tour operators:
 * - Core tools for operators
 * - Benefits showcase
 * - Demo video placeholder
 * - Success metrics
 */
export default function ForTourOperatorsPage() {
  const [showVideoModal, setShowVideoModal] = useState(false);

  const coreTools = [
    {
      icon: Package,
      title: 'Package Management',
      description: 'List and manage unlimited packages. Update availability, pricing, and details in real-time across all channels.',
      stats: 'Save 10+ hours/week',
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Your packages instantly visible to 10,000+ travel agents worldwide. Expand beyond your local market.',
      stats: '150+ countries',
    },
    {
      icon: MessageSquare,
      title: 'Lead Management',
      description: 'Receive and respond to inquiries instantly. Automated notifications ensure you never miss an opportunity.',
      stats: '40% faster response',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track views, inquiries, bookings, and revenue. Understand what's working and optimize your offerings.',
      stats: 'Real-time insights',
    },
  ];

  const benefits = [
    'Connect with 10,000+ travel agents globally',
    'Zero listing fees—only pay when you earn',
    'Automated inquiry management and responses',
    'Real-time availability and pricing updates',
    'Direct communication with potential buyers',
    'Detailed analytics and performance tracking',
    'Professional package presentation',
    'Multi-currency and multi-language support',
    'Secure payment processing',
    'Mobile app for on-the-go management',
    'Dedicated account manager',
    '24/7 technical support',
  ];

  const successMetrics = [
    {
      value: '10,000+',
      label: 'Active Travel Agents',
      description: 'Ready to discover your packages',
    },
    {
      value: '40%',
      label: 'More Leads',
      description: 'Average increase after joining',
    },
    {
      value: '150+',
      label: 'Countries',
      description: 'Global marketplace reach',
    },
    {
      value: '24/7',
      label: 'Visibility',
      description: 'Your packages always discoverable',
    },
  ];

  const testimonials = [
    {
      quote: "Since joining TravelSelbuy, we've seen a 40% increase in inquiries. The platform makes it incredibly easy to manage everything.",
      author: "Sarah Johnson",
      company: "Tropical Adventures Co.",
      location: "Bali, Indonesia",
    },
    {
      quote: "The global reach is phenomenal. We're now working with agents from countries we never thought possible.",
      author: "Marco Rossi",
      company: "Mediterranean Tours",
      location: "Rome, Italy",
    },
  ];

  return (
    <div data-theme="marketing" className="min-h-screen flex flex-col">
      <SkipToContent />
      <MarketingHeader />
      <Breadcrumb items={[{ label: 'For Tour Operators' }]} />
      
      <main id="main-content" tabIndex={-1} className="flex-grow" role="main">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-orange-50 via-white to-blue-50 py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              FOR TOUR OPERATORS
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Connect with Thousands of Global Agents — <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Instantly</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              List your packages once, reach travel agents worldwide. Automate inquiries, close more deals, and scale your business effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register?role=tour_operator"
                className="inline-block bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold px-8 py-4 rounded-full hover:shadow-lg transition-all"
              >
                List Your Packages Free
              </a>
              <button
                onClick={() => setShowVideoModal(true)}
                className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-8 py-4 rounded-full border-2 border-gray-200 hover:border-blue-500 transition-all"
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>
          </div>
        </section>

        {/* Success Metrics */}
        <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-cyan-500">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
              {successMetrics.map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-4xl md:text-5xl font-bold mb-2">{metric.value}</div>
                  <div className="text-lg font-semibold mb-1">{metric.label}</div>
                  <div className="text-sm opacity-80">{metric.description}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Tools Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Succeed</h2>
              <p className="text-xl text-gray-600">Powerful tools designed specifically for tour operators</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {coreTools.map((tool, index) => {
                const IconComponent = tool.icon;
                return (
                  <motion.div
                    key={index}
                    className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{tool.title}</h3>
                        <p className="text-gray-600 mb-3">{tool.description}</p>
                        <div className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                          {tool.stats}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Checklist */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Tour Operators Love TravelSelbuy</h2>
              <p className="text-xl text-gray-600">All the features you need to grow your business</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3 bg-white p-4 rounded-xl hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.03 }}
                >
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Trusted by Leading Operators</h2>
              <p className="text-xl text-gray-600">See what our partners have to say</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 shadow-lg"
                >
                  <div className="text-4xl text-blue-600 mb-4">"</div>
                  <p className="text-lg text-gray-700 mb-6 italic">{testimonial.quote}</p>
                  <div className="border-t border-blue-200 pt-4">
                    <div className="font-bold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.company}</div>
                    <div className="text-sm text-gray-500">{testimonial.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Get Started in 3 Simple Steps</h2>
              <p className="text-xl text-gray-600">You could be receiving inquiries within hours</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Create Your Profile',
                  description: 'Sign up and tell us about your business. Takes less than 10 minutes.',
                },
                {
                  step: '2',
                  title: 'List Your Packages',
                  description: 'Add your tours, activities, and packages. Include photos, pricing, and details.',
                },
                {
                  step: '3',
                  title: 'Start Receiving Inquiries',
                  description: 'Travel agents worldwide can now discover and book your packages directly.',
                },
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 text-white text-2xl font-bold rounded-full flex items-center justify-center mx-auto mb-6">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-cyan-500">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Expand Your Reach?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join 500+ tour operators already growing their business with TravelSelbuy
            </p>
            <a
              href="/auth/register?role=tour_operator"
              className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-8 py-4 rounded-full hover:shadow-lg transition-all hover:scale-105"
            >
              List Your First Package Free
              <ArrowRight className="w-5 h-5" />
            </a>
            <p className="mt-6 text-sm opacity-80">No listing fees • Only pay on successful bookings • Cancel anytime</p>
          </div>
        </section>
      </main>

      {/* Video Modal */}
      {showVideoModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-4xl w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Platform Demo</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-gray-100 rounded-xl aspect-video flex items-center justify-center">
              <div className="text-center">
                <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Video Demo Coming Soon</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <MarketingFooter />
      <BackToTop />
    </div>
  );
}

