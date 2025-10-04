'use client';

import { motion } from 'framer-motion';
import { 
  FiCpu, 
  FiPackage, 
  FiGlobe, 
  FiZap, 
  FiShield, 
  FiBarChart, 
  FiHeadphones, 
  FiCheck 
} from 'react-icons/fi';
import { Card, CardContent } from '@/components/ui/card';

// Feature Card Component
function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  benefits, 
  gradient,
  delay = 0 
}: {
  icon: any;
  title: string;
  description: string;
  benefits: string[];
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="h-full"
    >
      <Card className="h-full bg-white border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group">
        <CardContent className="p-8 flex flex-col space-y-6">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-slate-900">
            {title}
          </h3>

          {/* Description */}
          <p className="text-slate-600 leading-relaxed">
            {description}
          </p>

          {/* Benefits List */}
          <ul className="space-y-3 flex-grow">
            {benefits.map((benefit, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: delay + 0.1 * index }}
                className="flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiCheck className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-slate-700">{benefit}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function Features() {
  const mainFeatures = [
    {
      icon: FiCpu,
      title: 'AI-Powered Lead Generation',
      description: 'Never miss an opportunity. Our AI scans social media, qualifies leads automatically, and delivers hot prospects directly to your dashboard.',
      benefits: [
        'Automated lead sourcing from social media',
        'Smart lead scoring and qualification',
        'Voice agent verification system',
        'Real-time lead notifications'
      ],
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: FiPackage,
      title: 'Smart Package Management',
      description: 'Create, manage, and distribute travel packages with ease. Connect with operators and agents worldwide.',
      benefits: [
        'Intuitive package creation tools',
        'Multi-city itinerary builder',
        'Dynamic pricing management',
        'Inventory tracking and updates'
      ],
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      icon: FiGlobe,
      title: 'Global Network',
      description: 'Connect with thousands of tour operators and travel agents across 50+ countries for unlimited opportunities.',
      benefits: [
        'Access to verified operators',
        'Direct agent connections',
        'Commission tracking system',
        'Secure payment processing'
      ],
      gradient: 'from-green-500 to-green-600'
    }
  ];

  const additionalFeatures = [
    {
      icon: FiZap,
      title: 'Automated Workflows',
      description: 'Save time with intelligent automation'
    },
    {
      icon: FiShield,
      title: 'Enterprise Security',
      description: 'Bank-level security for your data'
    },
    {
      icon: FiBarChart,
      title: 'Advanced Analytics',
      description: 'Real-time insights and reporting'
    },
    {
      icon: FiHeadphones,
      title: '24/7 Support',
      description: 'Always here to help you succeed'
    }
  ];

  return (
    <section className="py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-sm font-medium text-blue-700 mb-4">
            <FiPackage className="w-4 h-4" />
            <span>Platform Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Grow Your Business
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Powerful features designed specifically for tour operators and travel agents
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {mainFeatures.map((feature, index) => (
            <FeatureCard key={index} {...feature} delay={index * 0.1} />
          ))}
        </div>

        {/* Additional Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full bg-slate-50 border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-all">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-slate-900">{feature.title}</h4>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
