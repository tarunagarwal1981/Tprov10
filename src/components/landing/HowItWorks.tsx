'use client';

import { motion } from 'framer-motion';
import { 
  FiUserPlus, 
  FiSettings, 
  FiTrendingUp, 
  FiArrowRight 
} from 'react-icons/fi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: FiUserPlus,
      title: 'Create Your Account',
      description: 'Sign up in 30 seconds. Choose your role - Tour Operator or Travel Agent. No credit card required.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      number: 2,
      icon: FiSettings,
      title: 'Set Up Your Profile',
      description: 'Complete your business profile, add your packages (operators) or connect with operators (agents).',
      color: 'from-purple-500 to-purple-600'
    },
    {
      number: 3,
      icon: FiTrendingUp,
      title: 'Start Growing',
      description: 'Receive qualified leads, manage bookings, track commissions, and grow your revenue with our AI-powered tools.',
      color: 'from-green-500 to-green-600'
    }
  ];

  return (
    <section className="py-20 lg:py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
            How It{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Get started in minutes, grow your business in days
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <Card className="bg-white border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 h-full group hover:-translate-y-2">
                  <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                    {/* Step Number */}
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg relative z-10`}>
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} bg-opacity-10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <step.icon className="w-10 h-10 text-slate-700" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-slate-900">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Arrow - Mobile */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center mt-6 mb-6">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                      <FiArrowRight className="w-5 h-5 text-white rotate-90" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center mt-16"
        >
          <Card className="bg-white border-slate-200 shadow-lg max-w-2xl mx-auto">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-2xl font-bold text-slate-900">
                Ready to Get Started?
              </h3>
              <p className="text-slate-600">
                Join thousands of travel professionals who are already growing their business with TravelSelBuy
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    Start Free Trial
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-3 border-2 border-slate-300 hover:border-blue-600 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  Schedule Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
