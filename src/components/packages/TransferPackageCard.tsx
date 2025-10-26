"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiPause, 
  FiPlay,
  FiUsers,
  FiClock,
  FiMapPin,
  FiEdit,
  FiTrash,
  FiCopy,
  FiEye,
  FiMoreVertical
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface TransferPackageCardData {
  id: string;
  title: string;
  short_description?: string | null;
  destination_city?: string | null;
  destination_country?: string | null;
  status: 'draft' | 'published' | 'archived' | 'suspended';
  created_at: string;
  
  // Vehicle data
  vehicles: Array<{
    id: string;
    name: string;
    vehicle_type: string;
    passenger_capacity: number;
    vehicle_images: Array<{
      public_url: string | null;
      alt_text?: string | null;
    }>;
  }>;
  
  // Pricing data
  hourly_pricing: Array<{
    rate_usd: number;
    hours: number;
  }>;
  
  point_to_point_pricing: Array<{
    cost_usd: number;
    from_location: string;
    to_location: string;
  }>;
}

interface TransferPackageCardProps {
  package: TransferPackageCardData;
  onView?: (pkg: TransferPackageCardData) => void;
  onEdit?: (pkg: TransferPackageCardData) => void;
  onDuplicate?: (pkg: TransferPackageCardData) => void;
  onDelete?: (pkg: TransferPackageCardData) => void;
}

export const TransferPackageCard: React.FC<TransferPackageCardProps> = ({
  package: pkg,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  // Collect all vehicle images
  const vehicleImages = pkg.vehicles
    .filter(v => v.vehicle_images && v.vehicle_images.length > 0)
    .flatMap(v => 
      v.vehicle_images
        .filter(img => img.public_url) // Filter out null URLs
        .map(img => ({
          url: img.public_url!,
          alt: img.alt_text || v.name,
          vehicleName: v.name
        }))
    )
    .slice(0, 5); // Limit to 5 images for performance

  // Carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate carousel
  useEffect(() => {
    if (vehicleImages.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % vehicleImages.length);
    }, 4000); // 4 seconds per image

    return () => clearInterval(interval);
  }, [vehicleImages.length, isPaused]);

  // Calculate pricing
  const hourlyPriceRange = React.useMemo(() => {
    if (!pkg.hourly_pricing || pkg.hourly_pricing.length === 0) return null;
    const rates = pkg.hourly_pricing.map(p => p.rate_usd);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    return min === max ? `$${min}/hr` : `$${min} - $${max}/hr`;
  }, [pkg.hourly_pricing]);

  const oneWayPriceRange = React.useMemo(() => {
    if (!pkg.point_to_point_pricing || pkg.point_to_point_pricing.length === 0) return null;
    const costs = pkg.point_to_point_pricing.map(p => p.cost_usd);
    const min = Math.min(...costs);
    const max = Math.max(...costs);
    return min === max ? `$${min}` : `$${min} - $${max}`;
  }, [pkg.point_to_point_pricing]);

  // Get unique vehicle types
  const vehicleTypes = React.useMemo(() => {
    const types = [...new Set(pkg.vehicles.map(v => v.vehicle_type))];
    return types.slice(0, 3); // Show max 3 types
  }, [pkg.vehicles]);

  // Get capacity range
  const capacityRange = React.useMemo(() => {
    if (pkg.vehicles.length === 0) return null;
    const capacities = pkg.vehicles.map(v => v.passenger_capacity);
    const min = Math.min(...capacities);
    const max = Math.max(...capacities);
    return min === max ? `${min}` : `${min}-${max}`;
  }, [pkg.vehicles]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? vehicleImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % vehicleImages.length);
  };

  const togglePause = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPaused(!isPaused);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500 hover:bg-green-600';
      case 'draft':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'archived':
        return 'bg-gray-500 hover:bg-gray-600';
      case 'suspended':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm border-slate-200/60 shadow-lg hover:shadow-xl transition-all overflow-hidden h-full flex flex-col">
        {/* Image Carousel */}
        <div 
          className="relative h-48 w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            {vehicleImages.length > 0 && vehicleImages[currentImageIndex] ? (
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <Image
                  src={vehicleImages[currentImageIndex]!.url}
                  alt={vehicleImages[currentImageIndex]!.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Vehicle name overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-sm font-medium flex items-center gap-2">
                    <FaCar className="h-3 w-3" />
                    {vehicleImages[currentImageIndex]!.vehicleName}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <FaCar className="w-12 h-12 mb-2 opacity-50" />
                <span className="text-sm font-medium">No Images</span>
              </div>
            )}
          </AnimatePresence>

          {/* Carousel Controls */}
          {vehicleImages.length > 1 && (
            <>
              {/* Previous/Next Buttons */}
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
                aria-label="Next image"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>

              {/* Pause/Play Button */}
              <button
                onClick={togglePause}
                className="absolute bottom-2 left-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                aria-label={isPaused ? "Play" : "Pause"}
              >
                {isPaused ? (
                  <FiPlay className="h-3 w-3" />
                ) : (
                  <FiPause className="h-3 w-3" />
                )}
              </button>

              {/* Dot Indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {vehicleImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      idx === currentImageIndex
                        ? "bg-white w-4"
                        : "bg-white/50 hover:bg-white/75"
                    )}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <Badge className={getStatusColor(pkg.status)}>
              {getStatusLabel(pkg.status)}
            </Badge>
          </div>

          {/* Vehicle Count Badge */}
          {pkg.vehicles.length > 0 && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-black/50 text-white hover:bg-black/70">
                <FaCar className="h-3 w-3 mr-1" />
                {pkg.vehicles.length} Vehicle{pkg.vehicles.length > 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>

        {/* Card Content */}
        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 line-clamp-2">
            {pkg.title}
          </h3>

          {/* Destination */}
          {(pkg.destination_city || pkg.destination_country) && (
            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 mb-2">
              <FiMapPin className="h-3 w-3" />
              <span>
                {[pkg.destination_city, pkg.destination_country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {pkg.short_description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
              {pkg.short_description}
            </p>
          )}

          {/* Vehicle Types & Capacity */}
          <div className="flex items-center gap-3 mb-3 text-sm text-slate-600 dark:text-slate-400">
            {vehicleTypes.length > 0 && (
              <div className="flex items-center gap-1">
                <FaCar className="h-4 w-4" />
                <span>
                  {vehicleTypes.join(' • ')}
                  {pkg.vehicles.length > 3 && ` +${pkg.vehicles.length - 3}`}
                </span>
              </div>
            )}
            {capacityRange && (
              <div className="flex items-center gap-1">
                <FiUsers className="h-4 w-4" />
                <span>{capacityRange} passengers</span>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="mb-4 space-y-1 flex-1">
            {hourlyPriceRange && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <FiClock className="h-3 w-3" />
                  Hourly Rentals:
                </span>
                <span className="font-semibold text-[#FF6B35]">{hourlyPriceRange}</span>
              </div>
            )}
            {oneWayPriceRange && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <FiMapPin className="h-3 w-3" />
                  One-Way Transfers:
                </span>
                <span className="font-semibold text-[#FF6B35]">{oneWayPriceRange}</span>
              </div>
            )}
            {!hourlyPriceRange && !oneWayPriceRange && (
              <div className="text-sm text-slate-500 dark:text-slate-400 italic">
                No pricing configured
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView?.(pkg)}
                className="text-xs"
              >
                <FiEye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit?.(pkg)}
                className="text-xs"
              >
                <FiEdit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                  <FiMoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg">
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  onClick={() => onView?.(pkg)}
                >
                  <FiEye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  onClick={() => onEdit?.(pkg)}
                >
                  <FiEdit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  onClick={() => onDuplicate?.(pkg)}
                >
                  <FiCopy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                  onClick={() => onDelete?.(pkg)}
                >
                  <FiTrash className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

