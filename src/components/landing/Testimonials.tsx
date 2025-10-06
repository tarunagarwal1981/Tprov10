'use client';

import { motion } from 'framer-motion';
import { 
  FiStar, 
  FiMessageSquare, 
  FiChevronLeft, 
  FiChevronRight 
} from 'react-icons/fi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export function Testimonials() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Tour Operator',
      company: 'Adventure Tours UK',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=128&h=128&fit=crop&crop=face',
      rating: 5,
      content: 'TravelPro has completely transformed our business. The AI lead generation feature alone has increased our bookings by 300% in just 6 months. The platform is intuitive, and the support team is incredible.',
      results: '300% increase in bookings',
      location: 'London, UK',
      verified: true
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Travel Agent',
      company: 'Global Travel Solutions',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=face',
      rating: 5,
      content: 'As a travel agent, finding reliable tour operators was always a challenge. TravelPro connected me with verified partners worldwide, and my commission income has doubled. The platform is a game-changer.',
      results: 'Doubled commission income',
      location: 'New York, USA',
      verified: true
    },
    {
      id: 3,
      name: 'Emma Rodriguez',
      role: 'Tour Operator',
      company: 'Mediterranean Escapes',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=128&h=128&fit=crop&crop=face',
      rating: 5,
      content: 'The package management system is phenomenal. I can create, manage, and distribute packages effortlessly. The analytics dashboard gives me insights I never had before. Highly recommended!',
      results: '50% time savings',
      location: 'Barcelona, Spain',
      verified: true
    },
    {
      id: 4,
      name: 'David Kim',
      role: 'Travel Agent',
      company: 'Asia Pacific Travel',
      avatar: 'https://images.unsplash.com/photo-1554057009-6f22f4d05f16?w=128&h=128&fit=crop&crop=face',
      rating: 5,
      content: 'The customer support is outstanding. They helped me set up my profile and connected me with the right tour operators for my niche. My client satisfaction scores have never been higher.',
      results: '95% client satisfaction',
      location: 'Seoul, South Korea',
      verified: true
    },
    {
      id: 5,
      name: 'Lisa Thompson',
      role: 'Tour Operator',
      company: 'Wildlife Adventures',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=128&h=128&fit=crop&crop=face',
      rating: 5,
      content: 'TravelPro helped us expand internationally. We now have agents in 15 countries selling our packages. The commission tracking and payment system is seamless. This platform is worth every penny.',
      results: 'Expanded to 15 countries',
      location: 'Cape Town, South Africa',
      verified: true
    }
  ];

  const stats = [
    { value: '98%', label: 'Customer Satisfaction' },
    { value: '4.9/5', label: 'Average Rating' },
    { value: '10K+', label: 'Happy Customers' },
    { value: '50+', label: 'Countries Served' }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 lg:py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <Badge variant="secondary" className="px-4 py-2 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200/50">
            <FiStar className="w-4 h-4 text-green-600 mr-2" />
            <span className="font-semibold">Customer Stories</span>
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
            What Our Customers{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Say
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Real stories from travel professionals who have transformed their business with TravelPro
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Testimonial Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative max-w-4xl mx-auto"
        >
          <Card className="bg-white border-slate-200 shadow-xl">
            <CardContent className="p-8 lg:p-12">
              <div className="flex items-start gap-6">
                {/* Quote Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <FiMessageSquare className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Testimonial Content */}
                <div className="flex-1">
                  <motion.div
                    key={currentTestimonial}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      {[...Array(testimonials[currentTestimonial]?.rating || 5)].map((_, i) => (
                        <FiStar key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    {/* Content */}
                    <blockquote className="text-lg lg:text-xl text-slate-700 leading-relaxed">
                      &ldquo;{testimonials[currentTestimonial]?.content}&rdquo;
                    </blockquote>

                    {/* Results Badge */}
                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                      {testimonials[currentTestimonial]?.results}
                    </Badge>

                    {/* Author Info */}
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={testimonials[currentTestimonial]?.avatar} />
                        <AvatarFallback>
                          {testimonials[currentTestimonial]?.name?.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">
                            {testimonials[currentTestimonial]?.name}
                          </h4>
                          {testimonials[currentTestimonial]?.verified && (
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">
                          {testimonials[currentTestimonial]?.role} at {testimonials[currentTestimonial]?.company}
                        </p>
                        <p className="text-xs text-slate-500">
                          {testimonials[currentTestimonial]?.location}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentTestimonial ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevTestimonial}
                    className="w-10 h-10 p-0"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextTestimonial}
                    className="w-10 h-10 p-0"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Testimonials Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16"
        >
          <h3 className="text-2xl font-bold text-slate-900 text-center mb-8">
            More Success Stories
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full bg-white border-slate-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <FiStar key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <blockquote className="text-sm text-slate-600 mb-4 line-clamp-3">
                      &ldquo;{testimonial.content}&rdquo;
                    </blockquote>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={testimonial.avatar} />
                        <AvatarFallback>
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{testimonial.name}</p>
                        <p className="text-xs text-slate-500">{testimonial.role}</p>
                      </div>
                    </div>
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
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Ready to Write Your Success Story?
            </h3>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Join thousands of travel professionals who have transformed their business with TravelPro. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-3 border-2 border-slate-300 hover:border-blue-600 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                Read More Stories
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}