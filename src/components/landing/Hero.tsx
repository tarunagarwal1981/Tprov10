'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, ArrowDown, Sparkles, Globe, MapPin, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function Hero() {
  const floatingCards = [
    { icon: Globe, title: 'Global Destinations', description: 'Explore destinations worldwide', color: 'from-blue-500 to-cyan-500' },
    { icon: MapPin, title: 'Local Experiences', description: 'Discover local hidden gems', color: 'from-purple-500 to-pink-500' },
    { icon: Users, title: 'Expert Guides', description: 'Connect with expert guides', color: 'from-green-500 to-emerald-500' },
  ];

  const IconComponent1 = floatingCards[0].icon;
  const IconComponent2 = floatingCards[1].icon;
  const IconComponent3 = floatingCards[2].icon;

  const trustIndicators = [
    'No credit card required',
    'Free 14-day trial',
    '24/7 support',
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pt-20">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Badge variant="secondary" className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50">
                <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
                AI-Powered Travel Platform
              </Badge>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 leading-tight"
            >
              The Future of{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
                Travel Booking
              </span>{' '}
              is Here
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl"
            >
              Empower your travel business with <span className="font-semibold text-slate-900">AI-driven lead generation</span>, seamless package management, and a global network of partners. Join <span className="font-semibold text-blue-600">10,000+</span> travel professionals growing with TravelPro.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/auth/register?role=tour_operator">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  I'm a Tour Operator
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/auth/register?role=travel_agent">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 border-2 border-slate-300 hover:border-blue-600 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  I'm a Travel Agent
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap gap-6 justify-center lg:justify-start"
            >
              {trustIndicators.map((indicator, index) => (
                <motion.div
                  key={indicator}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-2 text-slate-600"
                >
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm font-medium">{indicator}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - Floating Cards Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative hidden lg:block h-[500px]"
          >
            {/* Card 1 - Top Left */}
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [-2, 2, -2]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute top-0 left-0 w-56 h-36"
            >
              <Card className="h-full bg-white/90 backdrop-blur-md shadow-2xl border border-white/50 hover:scale-105 transition-transform cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${floatingCards[0].color} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent1 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-600 font-medium">New Lead</div>
                      <div className="text-sm font-bold text-slate-900 truncate">{floatingCards[0].title}</div>
                      <div className="text-xs text-green-600 font-semibold">Hot Prospect</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card 2 - Middle Right */}
            <motion.div
              animate={{ 
                y: [0, 20, 0],
                rotate: [2, -2, 2]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 0.5
              }}
              className="absolute top-1/2 -translate-y-1/2 right-0 w-56 h-36"
            >
              <Card className="h-full bg-white/90 backdrop-blur-md shadow-2xl border border-white/50 hover:scale-105 transition-transform cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${floatingCards[1].color} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-600 font-medium">Booking</div>
                      <div className="text-sm font-bold text-slate-900">£2,499</div>
                      <div className="text-xs text-purple-600 font-semibold">Confirmed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card 3 - Bottom Center */}
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                rotate: [-1, 1, -1]
              }}
              transition={{ 
                duration: 4.5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-56 h-36"
            >
              <Card className="h-full bg-white/90 backdrop-blur-md shadow-2xl border border-white/50 hover:scale-105 transition-transform cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${floatingCards[2].color} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent3 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-600 font-medium">Commission</div>
                      <div className="text-sm font-bold text-slate-900">+£249</div>
                      <div className="text-xs text-green-600 font-semibold">Earned Today</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl -z-10" />
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2"
      >
        <span className="text-sm text-slate-400 font-medium">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowDown className="w-6 h-6 text-slate-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}