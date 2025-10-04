'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, ArrowDown, Sparkles, Globe, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  const floatingCards = [
    { icon: Globe, title: 'Global Destinations', color: 'from-blue-500 to-cyan-500' },
    { icon: MapPin, title: 'Local Experiences', color: 'from-purple-500 to-pink-500' },
    { icon: Users, title: 'Expert Guides', color: 'from-green-500 to-emerald-500' },
  ];

  const trustIndicators = [
    'No credit card required',
    'Free 14-day trial',
    '24/7 support',
  ];

  return (
    <section id="home" className="hero-section min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="hero-grid">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="hero-content"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border border-blue-200 dark:border-blue-800 rounded-full px-4 py-2"
            >
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                🚀 AI-Powered Travel Platform
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight"
            >
              The Future of{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
                AI-Powered
              </span>{' '}
              Travel Booking is Here
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl"
            >
              Empower your travel business with AI-driven lead generation, seamless package management, and a global network of partners. Join 10,000+ travel professionals growing with TravelPro.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/register?role=tour_operator">
                <Button
                  size="lg"
                  className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  I'm a Tour Operator
                </Button>
              </Link>
              <Link href="/register?role=travel_agent">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300"
                >
                  I'm a Travel Agent
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.8 }}
              className="flex flex-wrap gap-6"
            >
              {trustIndicators.map((indicator, index) => (
                <motion.div
                  key={indicator}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + index * 0.1, duration: 0.6 }}
                  className="flex items-center space-x-2 text-slate-600 dark:text-slate-400"
                >
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{indicator}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="hero-visual"
          >
            {/* Floating Cards */}
            <div className="floating-cards-container">
              {floatingCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 50, rotate: -10 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ 
                    delay: 0.6 + index * 0.2, 
                    duration: 0.8,
                    type: 'spring',
                    stiffness: 100
                  }}
                  whileHover={{ 
                    y: -10, 
                    rotate: index % 2 === 0 ? -5 : 5,
                    transition: { duration: 0.3 }
                  }}
                  className={`floating-card`}
                >
                  <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-xl flex items-center justify-center mb-4`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {index === 0 && 'Explore destinations worldwide'}
                    {index === 1 && 'Discover local hidden gems'}
                    {index === 2 && 'Connect with expert guides'}
                  </p>
                </motion.div>
              ))}

              {/* Central Glow Effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-2xl animate-pulse"></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center space-y-2 text-slate-500 dark:text-slate-400"
        >
          <span className="text-sm font-medium">Scroll to explore</span>
          <ArrowDown className="h-5 w-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}