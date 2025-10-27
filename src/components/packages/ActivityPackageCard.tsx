"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiPause, 
  FiPlay,
  FiClock,
  FiMapPin,
  FiEdit,
  FiTrash,
  FiCopy,
  FiEye,
  FiMoreVertical,
  FiPackage
} from "react-icons/fi";
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

export interface ActivityPackageCardData {
  id: string;
  title: string;
  short_description?: string | null;
  destination_city?: string | null;
  destination_country?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SUSPENDED';
  price: number;
  maxPrice?: number;
  duration_hours?: number;
  duration_minutes?: number;
  image: string;
  images?: Array<{
    public_url: string | null;
    alt_text?: string | null;
  }>;
  created_at: Date;
}

interface ActivityPackageCardProps {
  package: ActivityPackageCardData;
  onView?: (pkg: ActivityPackageCardData) => void;
  onEdit?: (pkg: ActivityPackageCardData) => void;
  onDuplicate?: (pkg: ActivityPackageCardData) => void;
  onDelete?: (pkg: ActivityPackageCardData) => void;
}

export const ActivityPackageCard: React.FC<ActivityPackageCardProps> = ({
  package: pkg,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  // Collect images
  const allImages = React.useMemo(() => {
    const images: Array<{ url: string; alt: string }> = [];
    
    // Add images from images array
    if (pkg.images && pkg.images.length > 0) {
      pkg.images
        .filter(img => img.public_url)
        .forEach(img => {
          images.push({
            url: img.public_url!,
            alt: img.alt_text || pkg.title,
          });
        });
    }
    
    // Fallback to image string
    if (images.length === 0 && pkg.image) {
      images.push({
        url: pkg.image,
        alt: pkg.title,
      });
    }
    
    return images.slice(0, 5); // Limit to 5 images for performance
  }, [pkg.images, pkg.image, pkg.title]);
  
  const packageImages = allImages;

  // Carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate carousel
  useEffect(() => {
    if (packageImages.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % packageImages.length);
    }, 4000); // 4 seconds per image

    return () => clearInterval(interval);
  }, [packageImages.length, isPaused]);

  // Format duration
  const durationText = React.useMemo(() => {
    const hours = pkg.duration_hours || 0;
    const minutes = pkg.duration_minutes || 0;
    
    if (hours === 0 && minutes === 0) return null;
    
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.join(' ');
  }, [pkg.duration_hours, pkg.duration_minutes]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? packageImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % packageImages.length);
  };

  const togglePause = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPaused(!isPaused);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-500 hover:bg-green-600';
      case 'DRAFT':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'ARCHIVED':
        return 'bg-gray-500 hover:bg-gray-600';
      case 'SUSPENDED':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
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
          className="relative h-48 w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            {packageImages.length > 0 && packageImages[currentImageIndex] ? (
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <Image
                  src={packageImages[currentImageIndex]!.url}
                  alt={packageImages[currentImageIndex]!.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </motion.div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <FiPackage className="w-12 h-12 mb-2 opacity-50" />
                <span className="text-sm font-medium">No Images</span>
              </div>
            )}
          </AnimatePresence>

          {/* Carousel Controls */}
          {packageImages.length > 1 && (
            <>
              {/* Previous/Next Buttons */}
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
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
                {packageImages.map((_, idx) => (
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

          {/* Duration */}
          {durationText && (
            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 mb-3">
              <FiClock className="h-4 w-4" />
              <span>{durationText}</span>
            </div>
          )}

          {/* Pricing */}
          <div className="mb-4 space-y-1 flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Price:
              </span>
              <span className="font-semibold text-[#FF6B35] text-lg">
                {pkg.maxPrice && pkg.maxPrice > pkg.price ? (
                  <span>From ${pkg.price.toFixed(2)} - ${pkg.maxPrice.toFixed(2)}</span>
                ) : (
                  <span>${pkg.price.toFixed(2)}</span>
                )}
              </span>
            </div>
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


