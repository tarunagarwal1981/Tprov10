'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Globe, DollarSign, TrendingUp, Star, Clock, CheckCircle } from 'lucide-react';
import { StatCard, StatCardGrid } from '@/components/ui/stat-card';

// Animated Counter Component
function AnimatedCounter({ 
  value, 
  suffix = '', 
  isInView, 
  delay = 0 
}: { 
  value: number; 
  suffix?: string; 
  isInView: boolean;
  delay?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const duration = 2500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setTimeout(() => {
      const counter = setInterval(() => {
        current += increment;
        step++;
        
        if (step >= steps) {
          setCount(value);
          clearInterval(counter);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(counter);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [isInView, value, delay]);

  return (
    <div className="text-4xl lg:text-5xl font-bold text-slate-900">
      {count.toLocaleString()}{suffix}
    </div>
  );
}

export function Stats() {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const mainStats = [
    {
      icon: <Building2 className="h-6 w-6" />,
      title: 'Tour Operators',
      value: '500+',
      description: 'Growing network',
      trend: { value: 25, label: 'vs last month' },
      variant: 'gradient' as const,
      iconColor: 'text-blue-600'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Travel Agents',
      value: '10,000+',
      description: 'Active professionals',
      trend: { value: 18, label: 'vs last month' },
      variant: 'success' as const,
      iconColor: 'text-green-600'
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Countries',
      value: '50+',
      description: 'Global coverage',
      trend: { value: 12, label: 'vs last month' },
      variant: 'gradient' as const,
      iconColor: 'text-purple-600'
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: 'Revenue Generated',
      value: '£2M+',
      description: 'For our partners',
      trend: { value: 35, label: 'vs last month' },
      variant: 'warning' as const,
      iconColor: 'text-orange-600'
    }
  ];

  const additionalStats = [
    {
      icon: <Star className="h-5 w-5" />,
      title: 'Customer Satisfaction',
      value: '98%',
      description: 'Based on reviews',
      variant: 'success' as const,
      iconColor: 'text-green-600'
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: 'Support Available',
      value: '24/7',
      description: 'Always here to help',
      variant: 'gradient' as const,
      iconColor: 'text-blue-600'
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      title: 'Bookings Processed',
      value: '150K+',
      description: 'Successfully completed',
      variant: 'gradient' as const,
      iconColor: 'text-purple-600'
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: 'Response Time',
      value: '<2min',
      description: 'Average response',
      variant: 'success' as const,
      iconColor: 'text-green-600'
    }
  ];

  return (
    <section ref={ref} className="py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
            Trusted by Travel Professionals{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Worldwide
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Join thousands of tour operators and travel agents growing their business with our platform
          </p>
        </motion.div>

        {/* Main Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <StatCardGrid columns={4} gap="lg">
            {mainStats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <StatCard
                  icon={stat.icon}
                  title={stat.title}
                  value={stat.value}
                  description={stat.description}
                  trend={stat.trend}
                  variant={stat.variant}
                  iconColor={stat.iconColor}
                  size="lg"
                />
              </motion.div>
            ))}
          </StatCardGrid>
        </motion.div>

        {/* Additional Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="pt-12 border-t border-slate-200"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Platform Performance</h3>
            <p className="text-slate-600">Key metrics that matter to your business</p>
          </div>
          
          <StatCardGrid columns={4} gap="default">
            {additionalStats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <StatCard
                  icon={stat.icon}
                  title={stat.title}
                  value={stat.value}
                  description={stat.description}
                  variant={stat.variant}
                  iconColor={stat.iconColor}
                />
              </motion.div>
            ))}
          </StatCardGrid>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Ready to Join Our Growing Community?
            </h3>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Start your free trial today and see why thousands of travel professionals trust TravelPro to grow their business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Free Trial
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all duration-300"
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
