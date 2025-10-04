'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Building2, Users, Globe, DollarSign, Star, Clock, CheckCircle, TrendingUp } from 'lucide-react';

export function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const mainStats = [
    {
      icon: Building2,
      value: 500,
      suffix: '+',
      label: 'Tour Operators',
      color: 'from-blue-500 to-blue-600',
      description: 'Growing network'
    },
    {
      icon: Users,
      value: 10000,
      suffix: '+',
      label: 'Travel Agents',
      color: 'from-purple-500 to-purple-600',
      description: 'Active professionals'
    },
    {
      icon: Globe,
      value: 50,
      suffix: '+',
      label: 'Countries',
      color: 'from-green-500 to-green-600',
      description: 'Global coverage'
    },
    {
      icon: DollarSign,
      value: 2,
      suffix: 'M+',
      label: 'Revenue Generated',
      color: 'from-orange-500 to-orange-600',
      description: 'For our partners'
    },
  ];

  const additionalStats = [
    { icon: Star, value: '98%', label: 'Customer Satisfaction' },
    { icon: Clock, value: '24/7', label: 'Support Available' },
    { icon: CheckCircle, value: '150K+', label: 'Bookings Processed' },
    { icon: TrendingUp, value: '< 2min', label: 'Average Response Time' },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
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
            Trusted by Travel Professionals{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Worldwide
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Join thousands of tour operators and travel agents growing their business with our AI-powered platform
          </p>
        </motion.div>

        {/* Main Stats Grid */}
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {mainStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700">
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-8 w-8 text-white" />
                </div>

                {/* Counter */}
                <div className="mb-2">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    isInView={isInView}
                    delay={index * 0.1}
                  />
                </div>

                {/* Label */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {stat.label}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {additionalStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-white/50 dark:bg-slate-800/50 rounded-xl backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50"
            >
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-xl flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Animated Counter Component
function AnimatedCounter({ value, suffix, isInView, delay }: { 
  value: number; 
  suffix: string; 
  isInView: boolean; 
  delay: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const timer = setTimeout(() => {
      const duration = 2500;
      const increment = value / (duration / 16);
      let current = 0;

      const counter = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(counter);
        } else {
          setCount(Math.floor(current));
        }
      }, 16);

      return () => clearInterval(counter);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [isInView, value, delay]);

  const formatValue = (val: number) => {
    if (val >= 1000) {
      return (val / 1000).toFixed(val >= 10000 ? 0 : 1) + 'K';
    }
    return val.toString();
  };

  return (
    <span className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-slate-100">
      {formatValue(count)}{suffix}
    </span>
  );
}
