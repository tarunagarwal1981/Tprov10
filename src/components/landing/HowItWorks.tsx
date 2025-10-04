'use client';

import { motion } from 'framer-motion';
import { UserPlus, Settings, TrendingUp, ArrowRight } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      number: '1',
      icon: UserPlus,
      title: 'Create Your Account',
      description: 'Sign up in 30 seconds. Choose your role - Tour Operator or Travel Agent. No credit card required.',
      visual: (
        <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-xl flex items-center justify-center border border-blue-200 dark:border-blue-800">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Quick Signup Form</p>
          </div>
        </div>
      )
    },
    {
      number: '2',
      icon: Settings,
      title: 'Set Up Your Profile',
      description: 'Complete your business profile, add your packages (operators) or connect with operators (agents).',
      visual: (
        <div className="w-full h-48 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/50 dark:to-blue-950/50 rounded-xl flex items-center justify-center border border-green-200 dark:border-green-800">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Dashboard Setup</p>
          </div>
        </div>
      )
    },
    {
      number: '3',
      icon: TrendingUp,
      title: 'Start Growing',
      description: 'Receive qualified leads, manage bookings, track commissions, and grow your revenue with our AI-powered tools.',
      visual: (
        <div className="w-full h-48 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-xl flex items-center justify-center border border-purple-200 dark:border-purple-800">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Analytics Dashboard</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Get started in minutes, grow your business in days
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Timeline Connector - Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200 dark:from-blue-800 dark:via-purple-800 dark:to-green-800 -translate-y-1/2 z-0"></div>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className="relative z-10"
              >
                <div className="text-center lg:text-left">
                  {/* Step Number Badge */}
                  <div className="flex justify-center lg:justify-start mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold text-white">{step.number}</span>
                      </div>
                      {/* Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-30 -z-10"></div>
                    </div>
                  </div>

                  {/* Visual */}
                  <motion.div
                    whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
                    className="mb-6"
                  >
                    {step.visual}
                  </motion.div>

                  {/* Content */}
                  <div className="space-y-4">
                    {/* Icon */}
                    <div className="flex justify-center lg:justify-start">
                      <div className="w-12 h-12 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-xl flex items-center justify-center">
                        <step.icon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Arrow Connector - Mobile */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-8 mb-8">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-white rotate-90" />
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
          transition={{ delay: 0.8, duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Join thousands of travel professionals who are already growing their business with TravelPro
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Free Trial
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300"
              >
                Schedule Demo
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
