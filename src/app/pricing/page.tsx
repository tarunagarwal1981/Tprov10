import React from 'react';
import MarketingHeader from '@/components/marketing/MarketingHeader';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { FaCheck } from 'react-icons/fa';
import Link from 'next/link';

/**
 * Pricing Page
 * 
 * Pricing plans for tour operators and travel agents
 */
export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      role: 'Travel Agent',
      price: '29',
      period: 'month',
      description: 'Perfect for individual travel agents getting started',
      features: [
        'Access to 500+ tour packages',
        'Basic CRM features',
        'Email support',
        'Up to 10 bookings/month',
        'Mobile app access',
        'Basic analytics',
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Professional',
      role: 'Travel Agent',
      price: '79',
      period: 'month',
      description: 'For established agents scaling their business',
      features: [
        'Access to 2000+ tour packages',
        'Full CRM with AI assistance',
        'Priority support',
        'Unlimited bookings',
        'AI lead generation (100 leads/mo)',
        'Advanced analytics',
        'WhatsApp integration',
        'Custom branding',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Tour Operator',
      role: 'Tour Operator',
      price: '199',
      period: 'month',
      description: 'For tour operators managing packages',
      features: [
        'List unlimited packages',
        'Connect with 10,000+ agents',
        'Dedicated account manager',
        'Real-time booking management',
        'Commission tracking',
        'Advanced analytics dashboard',
        'API access',
        'White-label options',
        'Priority listing',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div data-theme="marketing" className="min-h-screen flex flex-col">
      <MarketingHeader />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-orange-50 to-blue-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">Transparent Pricing</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Choose the plan that&apos;s right for your business. All plans include a 14-day free trial.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`rounded-2xl p-8 ${
                    plan.popular
                      ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-2xl transform scale-105'
                      : 'bg-white border-2 border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="text-center mb-4">
                      <span className="bg-white text-orange-600 px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm mb-4 ${plan.popular ? 'text-orange-100' : 'text-gray-500'}`}>
                      {plan.role}
                    </p>
                    <div className="mb-4">
                      <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                        ${plan.price}
                      </span>
                      <span className={`text-lg ${plan.popular ? 'text-orange-100' : 'text-gray-500'}`}>
                        /{plan.period}
                      </span>
                    </div>
                    <p className={`text-sm ${plan.popular ? 'text-orange-100' : 'text-gray-600'}`}>
                      {plan.description}
                    </p>
                  </div>
                  <Link href={plan.cta === 'Contact Sales' ? '/contact' : '/phone-login'}>
                    <button
                      className={`w-full py-3 px-6 rounded-lg font-semibold mb-6 transition-colors ${
                        plan.popular
                          ? 'bg-white text-orange-600 hover:bg-gray-100'
                          : 'bg-orange-600 text-white hover:bg-orange-700'
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </Link>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <FaCheck className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                          plan.popular ? 'text-white' : 'text-green-500'
                        }`} />
                        <span className={`text-sm ${plan.popular ? 'text-white' : 'text-gray-700'}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: 'Can I switch plans later?',
                  a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.'
                },
                {
                  q: 'Is there a free trial?',
                  a: 'Yes! All plans come with a 14-day free trial. No credit card required to start.'
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards, debit cards, and bank transfers for annual plans.'
                },
                {
                  q: 'Can I cancel anytime?',
                  a: 'Yes, you can cancel your subscription at any time. No questions asked.'
                },
              ].map((faq, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}



