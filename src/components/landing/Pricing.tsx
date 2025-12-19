'use client';

import { motion } from 'framer-motion';
import { 
  FiCheck, 
  FiStar, 
  FiZap, 
  FiAward, 
  FiArrowRight, 
  FiUsers, 
  FiGlobe, 
  FiShield 
} from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export function Pricing() {
  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for new travel agents',
      price: 'Free',
      period: 'forever',
      icon: FiUsers,
      color: 'from-blue-500 to-blue-600',
      popular: false,
      features: [
        'Up to 10 package listings',
        'Basic lead generation',
        'Email support',
        'Standard analytics',
        'Mobile app access',
        'Basic integrations'
      ],
      limitations: [
        'Limited to 50 leads/month',
        'Basic reporting only'
      ],
      cta: 'Get Started Free',
      ctaVariant: 'outline' as const
    },
    {
      name: 'Professional',
      description: 'For growing travel businesses',
      price: '£29',
      period: 'per month',
      icon: FiZap,
      color: 'from-purple-500 to-purple-600',
      popular: true,
      features: [
        'Unlimited package listings',
        'Advanced AI lead generation',
        'Priority support',
        'Advanced analytics & reporting',
        'Mobile app access',
        'All integrations',
        'Commission tracking',
        'Custom branding'
      ],
      limitations: [],
      cta: 'Start Free Trial',
      ctaVariant: 'default' as const
    },
    {
      name: 'Enterprise',
      description: 'For established tour operators',
      price: '£99',
      period: 'per month',
      icon: FiAward,
      color: 'from-orange-500 to-orange-600',
      popular: false,
      features: [
        'Everything in Professional',
        'White-label solution',
        'Dedicated account manager',
        'Custom integrations',
        'Advanced API access',
        'Multi-user accounts',
        'Custom reporting',
        'SLA guarantee'
      ],
      limitations: [],
      cta: 'Contact Sales',
      ctaVariant: 'outline' as const
    }
  ];

  const addOns = [
    {
      name: 'AI Lead Generation Plus',
      description: 'Enhanced AI with voice verification',
      price: '£19/month',
      icon: FiGlobe,
      features: ['Voice agent verification', 'Advanced lead scoring', 'Custom lead sources']
    },
    {
      name: 'Premium Support',
      description: '24/7 phone and chat support',
      price: '£15/month',
      icon: FiShield,
      features: ['24/7 phone support', 'Priority chat', 'Dedicated support agent']
    }
  ];

  const faqs = [
    {
      question: 'Can I change plans anytime?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes, all paid plans come with a 14-day free trial. No credit card required.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.'
    },
    {
      question: 'Do you offer discounts for annual billing?',
      answer: 'Yes, save 20% when you pay annually for Professional and Enterprise plans.'
    }
  ];

  return (
    <section className="py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <Badge variant="secondary" className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50">
            <FiStar className="w-4 h-4 text-blue-600 mr-2" />
            <span className="font-semibold">Simple Pricing</span>
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Perfect Plan
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees, no long-term contracts.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <Card className={`h-full relative overflow-hidden ${
                plan.popular 
                  ? 'border-purple-200 shadow-xl ring-2 ring-purple-100' 
                  : 'border-slate-200 shadow-lg hover:shadow-xl'
              } transition-all duration-300`}>
                <CardHeader className="text-center pb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mx-auto mb-4`}>
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
                  <p className="text-slate-600 mt-2">{plan.description}</p>
                  
                  <div className="mt-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                      <span className="text-slate-600">/{plan.period}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <motion.div
                        key={featureIndex}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 + featureIndex * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <FiCheck className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-sm text-slate-700">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  <Link href={plan.cta === 'Contact Sales' ? '/contact' : '/phone-login'} className="w-full">
                    <Button
                      variant={plan.ctaVariant}
                      size="lg"
                      className={`w-full h-12 font-semibold ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                          : ''
                      }`}
                    >
                      {plan.cta}
                      <FiArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>

                  {plan.limitations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-500 text-center">
                        {plan.limitations.join(' • ')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Add-ons Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Add-ons</h3>
            <p className="text-slate-600">Enhance your plan with these powerful add-ons</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {addOns.map((addon, index) => (
              <motion.div
                key={addon.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full bg-white border-slate-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <addon.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">{addon.name}</h4>
                        <p className="text-sm text-slate-600 mb-3">{addon.description}</p>
                        <div className="space-y-2 mb-4">
                          {addon.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-center gap-2">
                              <FiCheck className="w-3 h-3 text-green-600 flex-shrink-0" />
                              <span className="text-xs text-slate-600">{feature}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{addon.price}</span>
                          <Button variant="outline" size="sm">
                            Add to Plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-16"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Frequently Asked Questions</h3>
            <p className="text-slate-600">Everything you need to know about our pricing</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <Card className="h-full bg-white border-slate-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-3">{faq.question}</h4>
                    <p className="text-sm text-slate-600">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Still Not Sure Which Plan is Right for You?
            </h3>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Our team is here to help you choose the perfect plan for your business needs. Get personalized recommendations and see TravelSelBuy in action.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                Schedule Demo
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-3 border-2 border-slate-300 hover:border-blue-600 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
