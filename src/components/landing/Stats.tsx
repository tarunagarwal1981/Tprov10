'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Globe, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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

  const statsData = [
    {
      icon: Building2,
      value: 500,
      suffix: '+',
      label: 'Tour Operators',
      description: 'Growing network',
      gradient: 'from-blue-500 to-blue-600',
      delay: 0
    },
    {
      icon: Users,
      value: 10000,
      suffix: '+',
      label: 'Travel Agents',
      description: 'Active professionals',
      gradient: 'from-purple-500 to-purple-600',
      delay: 0.1
    },
    {
      icon: Globe,
      value: 50,
      suffix: '+',
      label: 'Countries',
      description: 'Global coverage',
      gradient: 'from-green-500 to-green-600',
      delay: 0.2
    },
    {
      icon: DollarSign,
      value: 2,
      suffix: 'M+',
      label: 'Revenue Generated',
      description: 'For our partners',
      gradient: 'from-orange-500 to-orange-600',
      delay: 0.3
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <Card className="h-full bg-white border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6 lg:p-8 flex flex-col items-center text-center space-y-4">
                  {/* Icon */}
                  <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <stat.icon className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                  </div>

                  {/* Counter */}
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    isInView={isInView}
                    delay={stat.delay}
                  />

                  {/* Label */}
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900">
                      {stat.label}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {stat.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="pt-12 border-t border-slate-200"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            {[
              { value: '98%', label: 'Customer Satisfaction' },
              { value: '24/7', label: 'Support Available' },
              { value: '150K+', label: 'Bookings Processed' },
              { value: '<2min', label: 'Average Response Time' }
            ].map((item, index) => (
              <motion.div 
                key={item.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="space-y-2"
              >
                <p className="text-3xl font-bold text-slate-900">{item.value}</p>
                <p className="text-sm text-slate-600">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
