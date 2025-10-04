'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Testimonials() {
  const testimonials = [
    {
      quote: "TravelPro's AI lead generation has transformed our business. We're getting 10x more qualified leads than before, and the booking rate is incredible.",
      author: "Sarah Johnson",
      role: "Tour Operator",
      company: "Adventure Travel Co.",
      location: "London, UK",
      initials: "SJ",
      rating: 5
    },
    {
      quote: "The itinerary builder is a game-changer. I can create custom trips in minutes instead of hours, and my clients love the professional presentation.",
      author: "Michael Chen",
      role: "Travel Agent",
      company: "Global Destinations",
      location: "Singapore",
      initials: "MC",
      rating: 5
    },
    {
      quote: "Revenue has doubled since we joined. The commission tracking and automated bookings mean I can focus on what I do best - creating amazing experiences.",
      author: "Priya Sharma",
      role: "Travel Agent",
      company: "Luxury Escapes",
      location: "Mumbai, India",
      initials: "PS",
      rating: 5
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
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
            Loved by{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Travel Professionals
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            See what tour operators and travel agents say about TravelPro
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <Card className="bg-white border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 h-full">
                <CardContent className="p-8 flex flex-col space-y-6">
                  {/* Quote Icon */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Quote className="w-6 h-6 text-white" />
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-slate-700 leading-relaxed flex-grow">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900">
                        {testimonial.author}
                      </div>
                      <div className="text-sm text-slate-600">
                        {testimonial.role}, {testimonial.company}
                      </div>
                      <div className="text-xs text-slate-500">
                        {testimonial.location}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-16"
        >
          <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200">
            <CardContent className="p-8 text-center space-y-6">
              <h3 className="text-xl font-semibold text-slate-900">
                Join the Community
              </h3>
              <p className="text-slate-600">
                Over 10,000 travel professionals trust TravelPro to grow their business
              </p>
              
              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">98%</div>
                  <div className="text-sm text-slate-600">Satisfaction Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">4.9/5</div>
                  <div className="text-sm text-slate-600">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">150K+</div>
                  <div className="text-sm text-slate-600">Bookings Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">24/7</div>
                  <div className="text-sm text-slate-600">Support Available</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
