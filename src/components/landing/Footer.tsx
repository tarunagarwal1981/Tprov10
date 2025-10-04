'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Plane, Twitter, Linkedin, Facebook, Instagram, Globe, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  const footerLinks = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'For Tour Operators', href: '/tour-operators' },
      { name: 'For Travel Agents', href: '/travel-agents' },
      { name: 'API Documentation', href: '/docs' },
      { name: 'Integrations', href: '/integrations' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press Kit', href: '/press' },
      { name: 'Contact', href: '/contact' },
      { name: 'Partners', href: '/partners' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'GDPR Compliance', href: '/gdpr' },
      { name: 'Security', href: '/security' },
    ]
  };

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/travelpro' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/travelpro' },
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/travelpro' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/travelpro' },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Brand Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:col-span-1"
            >
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2 group mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                    <Plane className="h-6 w-6 text-white" />
                  </div>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  TravelPro
                </span>
              </Link>

              {/* Tagline */}
              <p className="text-slate-400 mb-6 leading-relaxed">
                Empowering travel professionals worldwide with AI-powered tools and global networks.
              </p>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-slate-800 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 rounded-lg flex items-center justify-center transition-all duration-300 group"
                    aria-label={social.name}
                  >
                    <social.icon className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors duration-300" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Product Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-white font-semibold mb-6">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-white transition-colors duration-200 hover:underline"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Company Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-white font-semibold mb-6">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-white transition-colors duration-200 hover:underline"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Legal Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-white font-semibold mb-6">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-white transition-colors duration-200 hover:underline"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
              {/* Copyright */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                viewport={{ once: true }}
                className="text-slate-400 text-sm"
              >
                © 2025 TravelPro. All rights reserved.
              </motion.div>

              {/* Bottom Controls */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                viewport={{ once: true }}
                className="flex items-center space-x-6"
              >
                {/* Language Selector */}
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <select className="bg-transparent text-slate-400 text-sm border-none outline-none cursor-pointer">
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                {/* Theme Toggle */}
                <button className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors duration-200">
                  <Sun className="h-4 w-4" />
                  <span className="text-sm">Light</span>
                </button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Gradient Border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
      </div>
    </footer>
  );
}
