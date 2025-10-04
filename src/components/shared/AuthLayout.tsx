'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showTestimonials?: boolean;
  showFeatures?: boolean;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Travel Agency Owner",
    company: "Wanderlust Travel",
    content: "This platform transformed our business. We've increased bookings by 300% and our clients love the seamless experience.",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face"
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    role: "Tour Operator",
    company: "Adventure Seekers",
    content: "The AI-powered lead generation is incredible. We're getting qualified leads every day without any manual effort.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face"
  },
  {
    id: 3,
    name: "Emily Johnson",
    role: "Travel Consultant",
    company: "Elite Travel Co",
    content: "The analytics dashboard gives us insights we never had before. We can now make data-driven decisions.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face"
  }
];

const features = [
  {
    icon: "🤖",
    title: "AI-Powered Lead Generation",
    description: "Automatically identify and convert high-quality prospects"
  },
  {
    icon: "📅",
    title: "Seamless Booking Management",
    description: "Streamline your entire booking process from inquiry to confirmation"
  },
  {
    icon: "🗺️",
    title: "Smart Itinerary Builder",
    description: "Create personalized travel experiences with intelligent recommendations"
  },
  {
    icon: "📊",
    title: "Real-time Analytics",
    description: "Track performance with comprehensive insights and reporting"
  }
];

const FloatingParticle: React.FC<{ delay: number; duration: number; index: number }> = ({ delay, duration, index }) => {
  // Use deterministic values based on index to avoid hydration mismatches
  const seed = index * 0.618033988749895; // Golden ratio for better distribution
  const left = (Math.sin(seed) * 0.5 + 0.5) * 100; // Convert to 0-100 range
  const top = (Math.cos(seed * 1.3) * 0.5 + 0.5) * 100; // Convert to 0-100 range
  const xOffset = (Math.sin(seed * 2.1) * 0.5 + 0.5) * 40 - 20; // Convert to -20 to 20 range
  
  return (
    <motion.div
      className="absolute w-2 h-2 bg-white/20 rounded-full"
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        y: [-20, -100],
        x: [0, xOffset]
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeOut"
      }}
      style={{
        left: `${left}%`,
        top: `${top}%`
      }}
    />
  );
};

const FeatureCard: React.FC<{ feature: typeof features[0]; index: number }> = ({ feature, index }) => (
  <motion.div
    className="group flex items-start space-x-4 p-4 rounded-xl hover:bg-white/10 transition-all duration-300"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ scale: 1.02, y: -2 }}
  >
    <div className="text-2xl">{feature.icon}</div>
    <div>
      <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
      <p className="text-white/80 text-sm">{feature.description}</p>
    </div>
  </motion.div>
);

const TestimonialCard: React.FC<{ testimonial: Testimonial; isActive: boolean }> = ({ testimonial, isActive }) => (
  <motion.div
    className={`p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 ${
      isActive ? 'opacity-100' : 'opacity-0 absolute'
    }`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: isActive ? 1 : 0, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex items-center space-x-3 mb-4">
      <img
        src={testimonial.avatar}
        alt={testimonial.name}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div>
        <h4 className="font-semibold text-white">{testimonial.name}</h4>
        <p className="text-white/70 text-sm">{testimonial.role} at {testimonial.company}</p>
      </div>
    </div>
    <p className="text-white/90 italic">&quot;{testimonial.content}&quot;</p>
  </motion.div>
);

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title = "Welcome Back",
  subtitle = "Sign in to your account to continue",
  showTestimonials = true,
  showFeatures = true
}) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (showTestimonials) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [showTestimonials]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left Side - Marketing Section */}
        <motion.div
          className="flex-1 relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800">
            <div className="absolute inset-0 bg-black/20" />
            {/* Floating Particles */}
            {Array.from({ length: 20 }).map((_, i) => (
              <FloatingParticle
                key={i}
                index={i}
                delay={i * 0.5}
                duration={8 + (i % 4) * 0.5} // Use deterministic duration based on index
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between h-full p-12">
            {/* Logo and Branding */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✈️</span>
                </div>
                <h1 className="text-2xl font-bold text-white">TravelPro</h1>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Empower Your Travel Business
              </h2>
              <p className="text-white/80 text-lg">
                Join thousands of travel professionals who are transforming their business with our AI-powered platform.
              </p>
            </motion.div>

            {/* Features */}
            {showFeatures && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {features.map((feature, index) => (
                  <FeatureCard key={index} feature={feature} index={index} />
                ))}
              </motion.div>
            )}

            {/* Testimonials */}
            {showTestimonials && (
              <motion.div
                className="relative h-48"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <AnimatePresence mode="wait">
                  <TestimonialCard
                    key={currentTestimonial}
                    testimonial={testimonials[currentTestimonial]}
                    isActive={true}
                  />
                </AnimatePresence>
                <div className="flex space-x-2 mt-4">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentTestimonial ? 'bg-white' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Trust Badges */}
            <motion.div
              className="flex items-center space-x-6 text-white/70"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center space-x-2">
                <span className="text-green-400">🔒</span>
                <span className="text-sm">Secure</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">🛡️</span>
                <span className="text-sm">GDPR Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-400">💬</span>
                <span className="text-sm">24/7 Support</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Form Container */}
        <div className="flex-1 flex items-center justify-center p-12">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: isLoaded ? 1 : 0, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              </div>
              {children}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                  <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">Privacy</a>
                  <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">Terms</a>
                  <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">Help</a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          className="p-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">✈️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">TravelPro</h1>
          </div>
          
          {showFeatures && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {features.slice(0, 3).map((feature, index) => (
                <motion.div
                  key={index}
                  className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: isLoaded ? 1 : 0, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{feature.title}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Form Container */}
        <motion.div
          className="flex-1 px-6 pb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {subtitle}
              </p>
            </div>
            {children}
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          className="px-6 pb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <span className="text-green-500">🔒</span>
              <span>Secure</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-blue-500">🛡️</span>
              <span>GDPR</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-purple-500">💬</span>
              <span>24/7</span>
            </div>
          </div>
          <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
            Join 10,000+ travel professionals
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
