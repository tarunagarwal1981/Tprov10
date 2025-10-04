'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 mb-8"
        >
          <Sparkles className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">
            Ready to Transform Your Business?
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight"
        >
          Join 10,000+ Travel Professionals{' '}
          <span className="text-yellow-300">Growing</span> with TravelPro
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          viewport={{ once: true }}
          className="text-lg sm:text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Start your free 14-day trial today. No credit card required. Cancel anytime.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/register">
              <Button
                size="lg"
                className="h-16 px-12 bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold text-lg"
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Get Started Free
              </Button>
            </Link>
          </motion.div>

          <div className="flex items-center space-x-2 text-white/80">
            <span className="text-sm">or</span>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/demo">
              <Button
                variant="outline"
                size="lg"
                className="h-16 px-12 border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 font-semibold text-lg"
                leftIcon={<Calendar className="h-5 w-5" />}
              >
                Schedule a Demo
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap justify-center items-center gap-8 text-white/80"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm font-medium">No credit card required</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm font-medium">14-day free trial</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm font-medium">Cancel anytime</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm font-medium">24/7 support</span>
          </div>
        </motion.div>

        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-4 h-4 bg-white/20 rounded-full animate-bounce"></div>
        <div className="absolute top-20 right-20 w-3 h-3 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-20 left-20 w-5 h-5 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-10 right-10 w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }}></div>
      </div>
    </section>
  );
}
