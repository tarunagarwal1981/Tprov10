"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FaBolt,
  FaCar,
  FaMapMarkerAlt,
  FaHotel,
  FaPlane,
  FaMountain,
  FaTree,
  FaShip,
  FaBed,
  FaPlaneDeparture,
  FaMagic,
  FaArrowLeft,
  FaInfoCircle,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Package type definitions
const PACKAGE_TYPES = [
  {
    key: "activity",
    title: "Activity Package",
    description: "Single activities, attractions, and experiences with time slots and variants",
    icon: FaBolt,
    gradient: "from-orange-400 to-pink-500",
    features: ["Multiple variants", "Time slots", "Age restrictions"],
    route: "/operator/packages/create/activity",
    available: true,
  },
  {
    key: "transfer",
    title: "Transfer Package",
    description: "Airport transfers, city transfers, and transportation services",
    icon: FaCar,
    gradient: "from-blue-500 to-cyan-400",
    features: ["Multiple vehicles", "One-way/Round trip", "Real-time tracking"],
    route: "/operator/packages/create/transfer",
    available: true,
  },
  {
    key: "multi_city",
    title: "Multi-City Package",
    description: "Multi-destination tours without accommodation",
    icon: FaMapMarkerAlt,
    gradient: "from-purple-500 to-pink-500",
    features: ["Multiple cities", "Flexible itinerary", "Transport included"],
    route: "/operator/packages/create/multi-city",
    available: true,
  },
  {
    key: "multi_city_hotel",
    title: "Multi-City with Hotel",
    description: "Multi-city tours with accommodation and meals",
    icon: FaHotel,
    gradient: "from-indigo-500 to-blue-500",
    features: ["Hotel categories", "Room types", "Meal plans"],
    route: "/operator/packages/create/multi-city-hotel",
    available: true,
  },
  {
    key: "fixed_departure_flight",
    title: "Fixed Departure with Flight",
    description: "Group tours with fixed dates and flight inclusions",
    icon: FaPlane,
    gradient: "from-blue-500 to-indigo-600",
    features: ["Flight details", "Group discounts", "Departure dates"],
    route: "/operator/packages/create/fixed-departure-flight",
    available: false,
  },
  {
    key: "land",
    title: "Land Package",
    description: "Complete land-based tours with detailed itineraries",
    icon: FaMountain,
    gradient: "from-green-500 to-teal-500",
    features: ["Day-by-day itinerary", "All meals", "Accommodation"],
    route: "/operator/packages/create/land",
    available: false,
  },
  {
    key: "cruise",
    title: "Cruise Package",
    description: "Ocean and river cruises with multiple ports",
    icon: FaShip,
    gradient: "from-cyan-400 to-blue-500",
    features: ["Cabin types", "Shore excursions", "Onboard activities"],
    route: "/operator/packages/create/cruise",
    available: false,
  },
  {
    key: "hotel_only",
    title: "Hotel Only",
    description: "Standalone hotel bookings with various meal plans",
    icon: FaBed,
    gradient: "from-purple-500 to-pink-500",
    features: ["Room types", "Amenities", "Flexible dates"],
    route: "/operator/packages/create/hotel-only",
    available: false,
  },
  {
    key: "flight_only",
    title: "Flight Only",
    description: "Flight bookings with multiple class options",
    icon: FaPlaneDeparture,
    gradient: "from-orange-500 to-red-500",
    features: ["One-way/Round trip", "Class selection", "Multi-city flights"],
    route: "/operator/packages/create/flight-only",
    available: false,
  },
  {
    key: "custom",
    title: "Custom Package",
    description: "Fully customizable packages combining multiple components",
    icon: FaMagic,
    gradient: "from-yellow-400 to-orange-500",
    features: ["Mix & match", "Flexible components", "Tailored pricing"],
    route: "/operator/packages/create/custom",
    available: false,
  },
];

const gridVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95,
  },
  show: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      type: "spring" as const, 
      damping: 25, 
      stiffness: 300,
      duration: 0.6,
    } 
  },
};

const hoverVariants = {
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 400,
    },
  },
};

export default function CreatePackagePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/operator/packages">
              <Button variant="outline" size="sm" className="package-button-fix">
                <FaArrowLeft className="h-4 w-4 mr-2" />
                Back to Packages
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Create New Package
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Choose the type of package you want to create
            </p>
          </div>
        </div>

        {/* Package Types Grid */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {PACKAGE_TYPES.map((type) => (
            <motion.div
              key={type.key}
              variants={cardVariants}
              whileHover="hover"
              className="group"
            >
              {type.available ? (
                <Link href={type.route}>
                  <Card className={cn(
                    "relative h-full cursor-pointer transition-all duration-300",
                    "package-selector-glass package-shadow-fix package-animation-fix",
                    "border-2 border-gray-200/60 dark:border-gray-700/60",
                    "hover:border-gray-300/80 hover:package-shadow-hover-fix",
                    "package-border-radius-fix"
                  )}>
                    {/* Premium Glow Effect */}
                    <div className={cn(
                      "pointer-events-none absolute -inset-1 opacity-0 transition-all duration-500",
                      "group-hover:opacity-20 group-hover:blur-xl package-border-radius-fix",
                      `bg-gradient-to-r ${type.gradient} package-gradient-fix`
                    )} />

                    <CardContent className="relative z-10 p-6 h-full flex flex-col">
                      {/* Icon and Title */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={cn(
                          "h-12 w-12 flex items-center justify-center",
                          "bg-gradient-to-br shadow-lg package-border-radius-fix",
                          `${type.gradient} package-gradient-fix`,
                          "package-animation-fix"
                        )}>
                          <type.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                            {type.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {type.description}
                          </p>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {type.features.map((feature) => (
                          <span 
                            key={feature} 
                            className="text-xs px-3 py-1 rounded-full bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Action Button */}
                      <div className="mt-auto">
                        <Button 
                          className={cn(
                            "w-full gap-2",
                            "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700",
                            "shadow-lg hover:shadow-xl transform hover:scale-105",
                            "package-animation-fix package-button-fix"
                          )}
                        >
                          Create {type.title}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <Card className={cn(
                  "relative h-full opacity-60",
                  "package-selector-glass package-shadow-fix",
                  "border-2 border-gray-200/60 dark:border-gray-700/60",
                  "package-border-radius-fix"
                )}>
                  <CardContent className="p-6 h-full flex flex-col">
                    {/* Icon and Title */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={cn(
                        "h-12 w-12 flex items-center justify-center",
                        "bg-gradient-to-br shadow-lg package-border-radius-fix",
                        `${type.gradient} package-gradient-fix`,
                        "package-animation-fix"
                      )}>
                        <type.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                          {type.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {type.description}
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {type.features.map((feature) => (
                        <span 
                          key={feature} 
                          className="text-xs px-3 py-1 rounded-full bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Coming Soon Badge */}
                    <div className="mt-auto">
                      <Badge 
                        variant="secondary" 
                        className="w-full justify-center bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
                      >
                        <FaInfoCircle className="h-3 w-3 mr-1" />
                        Coming Soon
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card className="package-selector-glass package-shadow-fix">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaInfoCircle className="h-5 w-5 text-blue-600" />
                Package Creation Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Available Package Types
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Currently, you can create Activity and Transfer packages. These are the most commonly used package types for tour operators.
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• <strong>Activity Package:</strong> Single activities with time slots and variants</li>
                    <li>• <strong>Transfer Package:</strong> Transportation services with vehicle options</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Coming Soon
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    We're working on additional package types to give you more flexibility in creating comprehensive travel packages.
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Multi-City Tours</li>
                    <li>• Hotel & Flight Packages</li>
                    <li>• Cruise Packages</li>
                    <li>• Custom Combinations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
