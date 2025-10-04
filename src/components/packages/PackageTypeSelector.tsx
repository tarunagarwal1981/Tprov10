'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBolt as Zap, 
  FaCar as Car, 
  FaMapMarkerAlt as MapPin, 
  FaHotel as Hotel, 
  FaPlane as Plane, 
  FaMountain as Mountain, 
  FaShip as Ship, 
  FaBed as BedDouble, 
  FaPlaneDeparture as PlaneTakeoff, 
  FaStar as Sparkles,
  FaCheck as Check,
  FaArrowRight as ArrowRight
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PackageType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  features: string[];
  implemented: boolean;
}

const packageTypes: PackageType[] = [
  {
    id: 'activity',
    name: 'Activity Package',
    description: 'Single activities, attractions, and experiences with time slots and variants',
    icon: Zap,
    gradient: 'from-orange-500 to-pink-500',
    features: ['Multiple variants', 'Time slots', 'Age restrictions'],
    implemented: false
  },
  {
    id: 'transfer',
    name: 'Transfer Package',
    description: 'Airport transfers, city transfers, and transportation services',
    icon: Car,
    gradient: 'from-blue-500 to-cyan-500',
    features: ['Multiple vehicles', 'One-way/Round trip', 'Real-time tracking'],
    implemented: false
  },
  {
    id: 'multi-city',
    name: 'Multi-City Package',
    description: 'Multi-destination tours without accommodation',
    icon: MapPin,
    gradient: 'from-purple-500 to-pink-500',
    features: ['Multiple cities', 'Flexible itinerary', 'Transport included'],
    implemented: false
  },
  {
    id: 'multi-city-hotel',
    name: 'Multi-City with Hotel',
    description: 'Multi-city tours with accommodation and meals',
    icon: Hotel,
    gradient: 'from-indigo-500 to-blue-500',
    features: ['Hotel categories', 'Room types', 'Meal plans'],
    implemented: false
  },
  {
    id: 'fixed-departure-flight',
    name: 'Fixed Departure with Flight',
    description: 'Group tours with fixed dates and flight inclusions',
    icon: Plane,
    gradient: 'from-blue-500 to-indigo-500',
    features: ['Flight details', 'Group discounts', 'Departure dates'],
    implemented: false
  },
  {
    id: 'land',
    name: 'Land Package',
    description: 'Complete land-based tours with detailed itineraries',
    icon: Mountain,
    gradient: 'from-green-500 to-teal-500',
    features: ['Day-by-day itinerary', 'All meals', 'Accommodation'],
    implemented: false
  },
  {
    id: 'cruise',
    name: 'Cruise Package',
    description: 'Ocean and river cruises with multiple ports',
    icon: Ship,
    gradient: 'from-cyan-500 to-blue-500',
    features: ['Cabin types', 'Shore excursions', 'Onboard activities'],
    implemented: false
  },
  {
    id: 'hotel-only',
    name: 'Hotel Only',
    description: 'Standalone hotel bookings with various meal plans',
    icon: BedDouble,
    gradient: 'from-purple-500 to-pink-500',
    features: ['Room types', 'Amenities', 'Flexible dates'],
    implemented: false
  },
  {
    id: 'flight-only',
    name: 'Flight Only',
    description: 'Flight bookings with multiple class options',
    icon: PlaneTakeoff,
    gradient: 'from-orange-500 to-red-500',
    features: ['One-way/Round trip', 'Class selection', 'Multi-city flights'],
    implemented: false
  },
  {
    id: 'custom',
    name: 'Custom Package',
    description: 'Fully customizable packages combining multiple components',
    icon: Sparkles,
    gradient: 'from-yellow-500 to-orange-500',
    features: ['Mix & match', 'Flexible components', 'Tailored pricing'],
    implemented: false
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12
    }
  }
};

const PackageTypeSelector: React.FC = () => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Load selection from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedPackageType');
    if (saved) {
      setSelectedPackage(saved);
    }
  }, []);

  const handlePackageSelect = (packageId: string) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSelectedPackage(packageId);
    
    // Save to localStorage
    localStorage.setItem('selectedPackageType', packageId);
    
    // Reset animation state
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleContinue = () => {
    // Smooth transition to package form
    console.log('Continuing with package:', selectedPackage);
    // Add your navigation logic here
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Package Type
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select the type of package that best fits your travel needs. Each package type offers unique features and customization options.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
      >
        {packageTypes.map((pkg, index) => {
          const IconComponent = pkg.icon;
          const isSelected = selectedPackage === pkg.id;
          
          return (
            <motion.div
              key={pkg.id}
              variants={cardVariants}
              whileHover={{ 
                scale: 1.02, 
                y: -4,
                transition: { duration: 0.2 }
              }}
              whileTap={{ 
                scale: 0.98,
                transition: { duration: 0.1 }
              }}
              className={`
                relative group cursor-pointer rounded-2xl p-6 transition-all duration-300
                ${isSelected 
                  ? 'ring-2 ring-gradient-to-r shadow-xl' 
                  : 'border border-gray-200 shadow-md hover:shadow-xl'
                }
                bg-white hover:bg-gray-50
              `}
              onClick={() => handlePackageSelect(pkg.id)}
              style={{
                background: isSelected 
                  ? `linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))`
                  : undefined
              }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}

              {/* Coming soon badge */}
              {!pkg.implemented && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -left-2 bg-gradient-to-r from-orange-400 to-pink-400 text-white border-0"
                >
                  Coming Soon
                </Badge>
              )}

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center
                  bg-gradient-to-r ${pkg.gradient}
                  shadow-lg group-hover:shadow-xl transition-shadow duration-300
                `}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                  {pkg.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  {pkg.description}
                </p>
                
                {/* Features */}
                <div className="space-y-1">
                  {pkg.features.map((feature, idx) => (
                    <div key={idx} className="text-xs text-gray-500">
                      • {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hover glow effect */}
              <div className={`
                absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                bg-gradient-to-r ${pkg.gradient}
                transition-opacity duration-300 -z-10 blur-xl
              `} />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Continue button */}
      <AnimatePresence>
        {selectedPackage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
            <Button
              onClick={handleContinue}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Continue with {packageTypes.find(p => p.id === selectedPackage)?.name}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PackageTypeSelector;
