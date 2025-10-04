'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

export function Testimonials() {
  const testimonials = [
    {
      quote: "TravelPro's AI lead generation has transformed our business. We're getting 10x more qualified leads than before, and the booking rate is incredible.",
      author: "Sarah Johnson",
      role: "Tour Operator, Adventure Travel Co.",
      location: "London, UK",
      initials: "SJ",
      rating: 5
    },
    {
      quote: "The itinerary builder is a game-changer. I can create custom trips in minutes instead of hours, and my clients love the professional presentation.",
      author: "Michael Chen",
      role: "Travel Agent, Global Destinations",
      location: "Singapore",
      initials: "MC",
      rating: 5
    },
    {
      quote: "Revenue has doubled since we joined. The commission tracking and automated bookings mean I can focus on what I do best - creating amazing experiences.",
      author: "Priya Sharma",
      role: "Travel Agent, Luxury Escapes",
      location: "Mumbai, India",
      initials: "PS",
      rating: 5
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-slate-900">
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
            Loved by Travel{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Professionals
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            See what tour operators and travel agents say about TravelPro
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 h-full relative overflow-hidden">
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 opacity-10">
                  <Quote className="h-12 w-12 text-slate-400" />
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-slate-700 dark:text-slate-300 leading-relaxed mb-8 text-lg">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {testimonial.initials}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-500">
                      {testimonial.location}
                    </div>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-950/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Join the Community
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Over 10,000 travel professionals trust TravelPro to grow their business
            </p>
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">98%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Satisfaction Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">4.9/5</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">150K+</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Bookings Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">24/7</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Support Available</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
