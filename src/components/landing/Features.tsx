'use client';

import { motion } from 'framer-motion';
import { Check, Brain, Package, Network, Zap, Shield, BarChart3, Headphones } from 'lucide-react';

export function Features() {
  const mainFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Lead Generation',
      description: 'Never miss an opportunity. Our AI scans social media, qualifies leads automatically, and delivers hot prospects directly to your dashboard.',
      benefits: [
        'Automated lead sourcing from social media',
        'Smart lead scoring and qualification',
        'Voice agent verification system',
        'Real-time lead notifications'
      ],
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Package,
      title: 'Smart Package Management',
      description: 'Create, manage, and distribute travel packages with ease. Connect with operators and agents worldwide.',
      benefits: [
        'Intuitive package creation tools',
        'Multi-city itinerary builder',
        'Dynamic pricing management',
        'Inventory tracking and updates'
      ],
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Network,
      title: 'Global Network',
      description: 'Connect with thousands of tour operators and travel agents across 50+ countries for unlimited opportunities.',
      benefits: [
        'Access to verified operators',
        'Direct agent connections',
        'Commission tracking system',
        'Secure payment processing'
      ],
      color: 'from-green-500 to-green-600'
    }
  ];

  const additionalFeatures = [
    {
      icon: Zap,
      title: 'Automated Workflows',
      description: 'Streamline your operations with intelligent automation'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security for your business and customers'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Data-driven insights to grow your business'
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Round-the-clock assistance when you need it'
    }
  ];

  return (
    <section id="features" className="py-20 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border border-blue-200 dark:border-blue-800 rounded-full px-4 py-2 mb-6">
            <Check className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Platform Features
            </span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Grow Your Business
            </span>
          </h2>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Powerful features designed specifically for tour operators and travel agents
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 h-full">
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  {feature.description}
                </p>

                {/* Benefits List */}
                <ul className="space-y-3">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <motion.li
                      key={benefit}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: (index * 0.2) + (benefitIndex * 0.1) + 0.3, duration: 0.4 }}
                      viewport={{ once: true }}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {benefit}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {additionalFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
              className="group"
            >
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-700 text-center">
                {/* Icon */}
                <div className="w-12 h-12 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>

                {/* Title */}
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
