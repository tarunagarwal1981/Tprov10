'use client';

import { motion } from 'framer-motion';
import { FiArrowRight, FiStar } from 'react-icons/fi';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function CTA() {
  return (
    <section className="py-20 lg:py-24 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700" />
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Floating Orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Badge variant="secondary" className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white">
              <FiStar className="w-4 h-4 text-white mr-2" />
              Ready to Transform Your Business?
            </Badge>
          </motion.div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Join 10,000+ Travel Professionals
            <br />
            Growing with TravelSelBuy
          </h2>

          {/* Description */}
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
            Start your free 14-day trial today. No credit card required. Cancel anytime.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/login">
              <Button
                size="lg"
                className="w-full sm:w-auto h-16 px-10 bg-white hover:bg-slate-50 text-blue-600 font-semibold shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 text-lg group"
              >
                Get Started Free
                <FiArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-16 px-10 border-2 border-white/30 hover:bg-white/10 text-white font-semibold backdrop-blur-sm transition-all duration-300 text-lg"
              >
                Schedule a Demo
              </Button>
            </Link>
          </div>

          {/* Trust Note */}
          <p className="text-sm text-white/80">
            Join thousands of travel professionals who are already growing their business
          </p>
        </motion.div>
      </div>
    </section>
  );
}