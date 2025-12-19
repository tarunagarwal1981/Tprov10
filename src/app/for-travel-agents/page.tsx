'use client';

import React, { useState } from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import SkipToContent from '@/components/shared/SkipToContent';
import Breadcrumb from '@/components/shared/Breadcrumb';
import BackToTop from '@/components/shared/BackToTop';
import { FiSearch, FiMessageSquare, FiFileText, FiBarChart2, FiCheckCircle, FiArrowRight, FiGlobe, FiClock, FiTrendingUp, FiZap, FiSmartphone, FiHeadphones, FiShield } from 'react-icons/fi';
import { MdHandshake, MdOutlineRoute, MdSupportAgent } from 'react-icons/md';
import { BsStars, BsMortarboard } from 'react-icons/bs';
import { motion } from 'framer-motion';

/**
 * For Travel Agents Page
 * 
 * Tailored content for travel agents:
 * - Key tools and features
 * - Interactive tool demonstrations
 * - Benefits checklist
 * - Success stories
 */
export default function ForTravelAgentsPage() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const tools = [
    {
      id: 'search',
      icon: FiSearch,
      title: 'Smart Package Search',
      description: 'Find the perfect package in seconds with AI-powered search across 500+ suppliers.',
      demo: 'Search by destination, budget, dates, or activities. Our AI understands natural language queries.',
      color: 'from-orange-500 to-yellow-500',
    },
    {
      id: 'crm',
      icon: FiMessageSquare,
      title: 'Unified CRM',
      description: 'Manage all customer interactions in one place. Syncs with WhatsApp, email, and social media.',
      demo: 'Track every conversation, set reminders, automate follow-ups, and never miss an opportunity.',
      color: 'from-blue-600 to-cyan-500',
    },
    {
      id: 'quotes',
      icon: FiFileText,
      title: 'Instant Quotations',
      description: 'Generate professional quotes in minutes with our drag-and-drop itinerary builder.',
      demo: 'Select packages, customize itineraries, add your branding, and send—all in under 5 minutes.',
      color: 'from-purple-600 to-pink-500',
    },
    {
      id: 'analytics',
      icon: FiBarChart2,
      title: 'Performance Analytics',
      description: 'Track your metrics, understand customer behavior, and optimize your sales strategy.',
      demo: 'Real-time dashboards showing conversion rates, popular destinations, and revenue trends.',
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'automation',
      icon: FiCheckCircle,
      title: 'Smart Automation',
      description: 'Automate repetitive tasks like follow-ups, booking confirmations, and reminders.',
      demo: 'Set rules once, and let AI handle routine communications while you focus on relationships.',
      color: 'from-indigo-600 to-purple-600',
    },
  ];

  const benefits = [
    {
      text: 'Access 500+ verified tour operators worldwide',
      icon: FiGlobe,
    },
    {
      text: 'No middlemen—negotiate directly with suppliers',
      icon: MdHandshake,
    },
    {
      text: 'Save 15+ hours per week on administrative tasks',
      icon: FiClock,
    },
    {
      text: 'Increase your margins with better commissions',
      icon: FiTrendingUp,
    },
    {
      text: 'Get real-time availability and instant confirmations',
      icon: FiZap,
    },
    {
      text: 'Professional itinerary builder with templates',
      icon: MdOutlineRoute,
    },
    {
      text: 'Multi-channel communication (WhatsApp, Email, SMS)',
      icon: FiMessageSquare,
    },
    {
      text: 'AI-powered lead generation and scoring',
      icon: BsStars,
    },
    {
      text: 'Mobile app for on-the-go management',
      icon: FiSmartphone,
    },
    {
      text: '24/7 customer support',
      icon: FiHeadphones,
    },
    {
      text: 'Free training and onboarding',
      icon: BsMortarboard,
    },
    {
      text: 'No long-term contracts or hidden fees',
      icon: FiShield,
    },
  ];

  const testimonials = [
    {
      quote: "TravelSelBuy has completely transformed how I work. I can now handle 3x more clients with less stress.",
      author: "Priya Sharma",
      role: "Independent Travel Agent, Mumbai",
    },
    {
      quote: "The direct supplier access means I can offer better prices and still make higher commissions. It's a win-win.",
      author: "David Chen",
      role: "Travel Consultant, Singapore",
    },
  ];

  return (
    <div data-theme="marketing" className="min-h-screen flex flex-col">
      <SkipToContent />
      <MarketingHeader />
      <Breadcrumb items={[{ label: 'For Travel Agents' }]} />
      
      <main id="main-content" tabIndex={-1} className="flex-grow" role="main">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-orange-50 via-white to-blue-50 py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              FOR TRAVEL AGENTS
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              More Access. Less Effort. <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">More Growth.</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Everything you need to source packages, manage clients, and close deals faster—all in one intelligent platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/login"
                className="inline-block bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold px-8 py-4 rounded-full hover:shadow-lg transition-all"
              >
                Start Free Trial
              </a>
              <a
                href="#demo"
                className="inline-block bg-white text-gray-900 font-semibold px-8 py-4 rounded-full border-2 border-gray-200 hover:border-orange-500 transition-all"
              >
                Watch Demo
              </a>
            </div>
          </div>
        </section>

        {/* Key Tools Section with Interactive Demo */}
        <section id="demo" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Complete Toolkit</h2>
              <p className="text-xl text-gray-600">Hover over each tool to see it in action</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => {
                const IconComponent = tool.icon;
                const isActive = activeDemo === tool.id;
                
                return (
                  <motion.div
                    key={tool.id}
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    onMouseEnter={() => setActiveDemo(tool.id)}
                    onMouseLeave={() => setActiveDemo(null)}
                    whileHover={{ y: -8 }}
                  >
                    <div className={`w-14 h-14 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center mb-4`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{tool.title}</h3>
                    
                    <motion.div
                      initial={{ height: 'auto' }}
                      animate={{ height: isActive ? 'auto' : 'auto' }}
                    >
                      {isActive ? (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-blue-600 font-medium"
                        >
                          {tool.demo}
                        </motion.p>
                      ) : (
                        <p className="text-gray-600">{tool.description}</p>
                      )}
                    </motion.div>
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
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Agents Choose TravelSelBuy</h2>
              <p className="text-xl text-gray-600">Everything you need to succeed, included</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <motion.div
                    key={index}
                    className="flex items-start gap-3 bg-white p-4 rounded-xl hover:shadow-md transition-shadow"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <IconComponent className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit.text}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Success Stories</h2>
              <p className="text-xl text-gray-600">Real results from real agents</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 shadow-lg"
                >
                  <div className="text-4xl text-orange-500 mb-4">&ldquo;</div>
                  <p className="text-lg text-gray-700 mb-6 italic">{testimonial.quote}</p>
                  <div className="border-t border-orange-200 pt-4">
                    <div className="font-bold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-gradient-to-br from-orange-50 to-yellow-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Ready to Transform Your Business?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join 10,000+ travel agents who&apos;ve already made the switch
            </p>
            <a
              href="/login"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold px-8 py-4 rounded-full hover:shadow-lg transition-all hover:scale-105"
            >
              Get Started Free
              <FiArrowRight className="w-5 h-5" />
            </a>
            <p className="mt-6 text-sm text-gray-500">No credit card required • 14-day free trial • Cancel anytime</p>
          </div>
        </section>
      </main>

      <MarketingFooter />
      <BackToTop />
    </div>
  );
}

