"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaArrowLeft, FaRocket, FaBell, FaEnvelope, FaStar } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ComingSoonPageProps {
  packageType: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  gradient: string;
}

export default function ComingSoon({ packageType, description, features, icon, gradient }: ComingSoonPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/operator/packages/create">
              <Button variant="outline" size="sm" className="package-button-fix">
                <FaArrowLeft className="h-4 w-4 mr-2" />
                Back to Package Types
              </Button>
            </Link>
          </div>
        </div>

        {/* Coming Soon Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${gradient} shadow-lg`}>
              {icon}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">{packageType}</h1>

          {/* Badge */}
          <Badge variant="secondary" className="mb-6 bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800 text-lg px-4 py-2">
            <FaRocket className="h-4 w-4 mr-2" />
            Coming Soon
          </Badge>

          {/* Description */}
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">{description}</p>
        </motion.div>

        {/* Features Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mb-8">
          <Card className="package-selector-glass package-shadow-fix">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaStar className="h-5 w-5 text-purple-600" />
                Planned Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-2 h-2 bg-purple-600 rounded-full" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
          <Card className="package-selector-glass package-shadow-fix">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaBell className="h-5 w-5 text-blue-600" />
                Get Notified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">Be the first to know when this package type becomes available!</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="package-button-fix package-animation-fix">
                    <FaEnvelope className="h-4 w-4 mr-2" />
                    Notify Me When Ready
                  </Button>
                  <Link href="/operator/packages/create">
                    <Button variant="outline" className="package-button-fix">Explore Other Package Types</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}



