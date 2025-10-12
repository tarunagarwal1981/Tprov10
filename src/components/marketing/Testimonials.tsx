'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Testimonials.module.css';

/**
 * Testimonials Section Component
 * 
 * Customer testimonials carousel with:
 * - Embla carousel with autoplay
 * - 5-second auto-advance
 * - Navigation dots and arrows
 * - 5-star ratings
 * - Smooth animations
 * - Keyboard navigation
 * - Swipe support
 */

// Testimonials data
const testimonials = [
  {
    id: 1,
    quote: "TravBuk simplified our operations completely. We can now find verified DMCs in minutes and close deals directly.",
    author: "Neha T.",
    role: "Travel Agent",
    location: "India",
    rating: 5,
    avatar: null,
  },
  {
    id: 2,
    quote: "We've seen 40% more leads since listing our packages on TravBuk. The platform is intuitive and our team loves it.",
    author: "Adrian Travels",
    role: "Tour Operator",
    location: "Thailand",
    rating: 5,
    avatar: null,
  },
  {
    id: 3,
    quote: "The AI-powered CRM has transformed how we manage customer relationships. Our conversion rate increased by 35% in just 3 months.",
    author: "Michael Rodriguez",
    role: "Travel Agency Owner",
    location: "Spain",
    rating: 5,
    avatar: null,
  },
  {
    id: 4,
    quote: "As a freelance travel consultant, TravelSelbuy gave me access to premium inventory I couldn't get before. My income doubled this year.",
    author: "Sarah Chen",
    role: "Freelance Travel Consultant",
    location: "Singapore",
    rating: 5,
    avatar: null,
  },
];

// Star Rating Component
interface StarRatingProps {
  rating: number;
  animate?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, animate = false }) => {
  return (
    <div className={styles.starRating}>
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.div
          key={star}
          initial={animate ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.3,
            delay: animate ? star * 0.1 : 0,
            ease: "easeOut",
          }}
        >
          <Star
            className={styles.star}
            fill={star <= rating ? "#FFB800" : "none"}
            stroke={star <= rating ? "#FFB800" : "#D1D5DB"}
            strokeWidth={2}
          />
        </motion.div>
      ))}
    </div>
  );
};

// Testimonial Card Component
interface TestimonialCardProps {
  testimonial: typeof testimonials[0];
  isActive: boolean;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial, isActive }) => {
  return (
    <motion.div
      className={styles.testimonialCard}
      initial={{ opacity: 0.7, scale: 0.95 }}
      animate={{
        opacity: isActive ? 1 : 0.7,
        scale: isActive ? 1 : 0.95,
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Quote Icon */}
      <motion.div
        className={styles.quoteIcon}
        animate={{
          scale: isActive ? [1, 1.1, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <Quote className={styles.quoteIconSvg} />
      </motion.div>

      {/* Star Rating */}
      <StarRating rating={testimonial.rating} animate={isActive} />

      {/* Quote Text */}
      <blockquote className={styles.quoteText}>
        "{testimonial.quote}"
      </blockquote>

      {/* Author Info */}
      <div className={styles.authorInfo}>
        {testimonial.avatar && (
          <div className={styles.avatar}>
            <img src={testimonial.avatar} alt={testimonial.author} />
          </div>
        )}
        <div className={styles.authorDetails}>
          <div className={styles.authorName}>{testimonial.author}</div>
          <div className={styles.authorMeta}>
            {testimonial.role} • {testimonial.location}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Testimonials() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.2 });

  // Embla Carousel setup with autoplay
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'center',
      skipSnaps: false,
    },
    [
      Autoplay({
        delay: 5000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ]
  );

  // Update selected index when carousel changes
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Navigation functions
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        scrollPrev();
      } else if (e.key === 'ArrowRight') {
        scrollNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollPrev, scrollNext]);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        {/* Section Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={styles.title}>What Our Customers Say</h2>
          <p className={styles.subtitle}>
            Join thousands of travel professionals who trust TravelSelbuy
          </p>
        </motion.div>

        {/* Carousel Container */}
        <motion.div
          className={styles.carouselWrapper}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className={styles.embla} ref={emblaRef}>
            <div className={styles.emblaContainer}>
              {testimonials.map((testimonial, index) => (
                <div key={testimonial.id} className={styles.emblaSlide}>
                  <TestimonialCard
                    testimonial={testimonial}
                    isActive={index === selectedIndex}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <AnimatePresence>
            {isHovered && (
              <>
                <motion.button
                  className={`${styles.navButton} ${styles.navButtonPrev}`}
                  onClick={scrollPrev}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className={styles.navIcon} />
                </motion.button>

                <motion.button
                  className={`${styles.navButton} ${styles.navButtonNext}`}
                  onClick={scrollNext}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Next testimonial"
                >
                  <ChevronRight className={styles.navIcon} />
                </motion.button>
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation Dots */}
        <motion.div
          className={styles.dotsContainer}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === selectedIndex ? styles.dotActive : ''}`}
              onClick={() => scrollTo(index)}
              aria-label={`Go to testimonial ${index + 1}`}
              aria-current={index === selectedIndex}
            >
              <motion.div
                className={styles.dotInner}
                animate={{
                  scale: index === selectedIndex ? 1 : 0.5,
                }}
                transition={{ duration: 0.3 }}
              />
            </button>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className={styles.stats}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className={styles.statItem}>
            <div className={styles.statValue}>4.9/5</div>
            <div className={styles.statLabel}>Average Rating</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statValue}>10,000+</div>
            <div className={styles.statLabel}>Happy Customers</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statValue}>500+</div>
            <div className={styles.statLabel}>5-Star Reviews</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

