'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FiStar, 
  FiUsers, 
  FiTrendingUp, 
  FiCheckCircle, 
  FiGlobe, 
  FiShield 
} from 'react-icons/fi';

export function Hero() {
  const trustIndicators = [
    { icon: FiCheckCircle, text: 'No credit card required' },
    { icon: FiTrendingUp, text: 'Free 14-day trial' },
    { icon: FiShield, text: '24/7 support' },
  ];

  return (
    <section className="relative min-h-[calc(100vh-80px)] flex items-center pt-20 pb-16 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 -left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
        />
        
        {/* Secondary accent orbs */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-full blur-2xl"
        />
      </div>

      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mx-auto lg:mx-0"
            >
              <FiStar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">AI-Powered Travel Platform</span>
            </motion.div>

            {/* Main Headline - FIXED ALIGNMENT */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-slate-900 leading-tight"
            >
              The Future of{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Travel Booking
              </span>{' '}
              is Here
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0"
            >
              Empower your travel business with AI-driven lead generation, seamless package management, and a global network of partners. Join 10,000+ travel professionals growing with TravelPro.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center sm:justify-center lg:justify-start"
            >
              <Link
                href="/auth/register?role=tour_operator"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                I&apos;m a Tour Operator
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              
              <Link
                href="/auth/register?role=travel_agent"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-slate-900 font-semibold text-lg border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                I&apos;m a Travel Agent
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 pt-6"
            >
              {trustIndicators.map((indicator, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  className="flex items-center gap-3 text-slate-600 justify-center lg:justify-start"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <indicator.icon className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium">{indicator.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - Visual Element (hidden on mobile, shown on desktop) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative h-[500px] w-full hidden lg:block"
          >
            {/* Decorative circles */}
            <div className="absolute inset-0">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"
              />
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [360, 180, 0],
                }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"
              />
            </div>

            {/* Stats showcase */}
            <div className="relative grid grid-cols-2 gap-4 p-8">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="absolute bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4"
              >
                <FiUsers className="w-8 h-8 text-blue-600 mb-3" />
                <div className="text-3xl font-bold text-slate-900">10K+</div>
                <div className="text-sm text-slate-600">Active Agents</div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="absolute bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4"
              >
                <FiGlobe className="w-8 h-8 text-purple-600 mb-3" />
                <div className="text-3xl font-bold text-slate-900">50+</div>
                <div className="text-sm text-slate-600">Countries</div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="absolute bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 col-span-2"
              >
                <FiTrendingUp className="w-8 h-8 text-green-600 mb-3" />
                <div className="text-3xl font-bold text-slate-900">$2M+</div>
                <div className="text-sm text-slate-600">Revenue Processed</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-slate-400"
        >
          <span className="text-sm font-medium">Scroll to explore</span>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}