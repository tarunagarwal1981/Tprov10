"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  FaMountain,
  FaUmbrellaBeach,
  FaPaw,
  FaGem,
  FaMoneyBillWave,
  FaChild,
  FaHeart,
  FaGlobeAmericas,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaCalendar,
  FaStar,
  FaDollarSign,
  FaEye,
  FaShoppingCart,
  FaLock,
  FaExclamationCircle,
} from 'react-icons/fa';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MarketplaceLead, TripType, getDaysUntilExpiry } from '@/lib/types/marketplace';

/**
 * Lead Card Component Props
 */
export interface LeadCardProps {
  lead: MarketplaceLead;
  onViewDetails: (leadId: string) => void;
  onPurchase: (leadId: string) => void;
  isPurchased?: boolean;
  className?: string;
}

/**
 * Get icon for trip type
 */
const getTripTypeIcon = (tripType: TripType): React.ReactNode => {
  const iconClass = 'w-5 h-5';
  
  switch (tripType) {
    case TripType.ADVENTURE:
      return <FaMountain className={iconClass} />;
    case TripType.BEACH:
      return <FaUmbrellaBeach className={iconClass} />;
    case TripType.WILDLIFE:
      return <FaPaw className={iconClass} />;
    case TripType.LUXURY:
      return <FaGem className={iconClass} />;
    case TripType.BUDGET:
      return <FaMoneyBillWave className={iconClass} />;
    case TripType.FAMILY:
      return <FaChild className={iconClass} />;
    case TripType.HONEYMOON:
      return <FaHeart className={iconClass} />;
    case TripType.CULTURAL:
    default:
      return <FaGlobeAmericas className={iconClass} />;
  }
};

/**
 * Get color scheme for trip type
 */
const getTripTypeColor = (tripType: TripType): string => {
  switch (tripType) {
    case TripType.ADVENTURE:
      return 'from-orange-500 to-red-600';
    case TripType.BEACH:
      return 'from-cyan-500 to-blue-600';
    case TripType.WILDLIFE:
      return 'from-green-500 to-emerald-600';
    case TripType.LUXURY:
      return 'from-purple-500 to-pink-600';
    case TripType.BUDGET:
      return 'from-yellow-500 to-orange-500';
    case TripType.FAMILY:
      return 'from-blue-400 to-indigo-500';
    case TripType.HONEYMOON:
      return 'from-pink-500 to-rose-600';
    case TripType.CULTURAL:
    default:
      return 'from-blue-500 to-purple-600';
  }
};

/**
 * Get trip type label
 */
const getTripTypeLabel = (tripType: TripType): string => {
  return tripType.charAt(0) + tripType.slice(1).toLowerCase().replace('_', ' ');
};

/**
 * Format budget range
 */
const formatBudget = (min: number, max: number): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  return `${formatter.format(min)} - ${formatter.format(max)}`;
};

/**
 * Format price
 */
const formatPrice = (price: number): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
  return formatter.format(price);
};

/**
 * Lead Card Component
 * Displays a marketplace lead in card format
 */
export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onViewDetails,
  onPurchase,
  isPurchased = false,
  className,
}) => {
  const daysUntilExpiry = getDaysUntilExpiry(lead.expiresAt);
  const isExpiringSoon = daysUntilExpiry <= 1 && daysUntilExpiry > 0;
  const qualityStars = Math.round((lead.leadQualityScore / 100) * 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('flex', className)}
    >
      <Card
        variant="interactive"
        className={cn(
          'flex flex-col relative max-h-[650px] min-h-[550px]',
          'border-2 hover:border-primary/30',
          isExpiringSoon && 'border-orange-400 hover:border-orange-500'
        )}
      >
        {/* Expiring Soon Banner */}
        {isExpiringSoon && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold py-1 px-3 flex items-center justify-center gap-1 z-10">
            <FaExclamationCircle className="w-3 h-3" />
            <span>Expires in {daysUntilExpiry === 0 ? 'less than 1 day' : `${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`}</span>
          </div>
        )}

        {/* Purchased Badge */}
        {isPurchased && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
              Purchased
            </Badge>
          </div>
        )}

        <CardHeader className={cn('pb-3', isExpiringSoon && 'pt-10')}>
          {/* Trip Type Badge */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg',
                'bg-gradient-to-br',
                getTripTypeColor(lead.tripType),
                'text-white shadow-md'
              )}
            >
              {getTripTypeIcon(lead.tripType)}
            </div>
            <Badge variant="secondary" className="text-xs font-medium">
              {getTripTypeLabel(lead.tripType)}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight break-words">
            {lead.title}
          </h3>

          {/* Destination */}
          <div className="flex items-center gap-1.5 text-gray-600 mt-1">
            <FaMapMarkerAlt className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-sm font-medium break-words">{lead.destination}</span>
          </div>
        </CardHeader>

        <CardContent className="flex-1 pb-3 overflow-hidden flex flex-col">
          {/* Quality Score */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 flex-shrink-0">
            <span className="text-xs text-gray-500 font-medium">Quality Score:</span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={cn(
                    'w-3.5 h-3.5',
                    i < qualityStars ? 'text-yellow-400' : 'text-gray-200'
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {lead.leadQualityScore}/100
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3 flex-shrink-0">
            {/* Budget */}
            <div className="flex items-start gap-2">
              <FaDollarSign className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Budget</p>
                <p className="text-sm font-semibold text-gray-900 break-words">
                  {formatBudget(lead.budgetMin, lead.budgetMax)}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-start gap-2">
              <FaClock className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm font-semibold text-gray-900">
                  {lead.durationDays} {lead.durationDays === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>

            {/* Travelers */}
            <div className="flex items-start gap-2">
              <FaUsers className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Travelers</p>
                <p className="text-sm font-semibold text-gray-900">
                  {lead.travelersCount} {lead.travelersCount === 1 ? 'person' : 'people'}
                </p>
              </div>
            </div>

            {/* Travel Dates */}
            {lead.travelDateStart && (
              <div className="flex items-start gap-2">
                <FaCalendar className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Travel Date</p>
                  <p className="text-sm font-semibold text-gray-900 break-words">
                    {new Date(lead.travelDateStart).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Locked Contact Info Section */}
          {!isPurchased && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 backdrop-blur-[2px] bg-white/40 flex items-center justify-center z-10">
                <div className="flex items-center gap-2 text-gray-600">
                  <FaLock className="w-4 h-4" />
                  <span className="text-sm font-medium">Contact info hidden</span>
                </div>
              </div>
              <div className="blur-sm select-none pointer-events-none">
                <p className="text-xs text-gray-500 mb-1">Customer Contact</p>
                <p className="text-sm font-medium text-gray-700">John Doe</p>
                <p className="text-xs text-gray-600">john@example.com</p>
                <p className="text-xs text-gray-600">+1 (555) 123-4567</p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-2 pt-3 border-t border-gray-100 flex-shrink-0 mt-auto">
          {/* Lead Price */}
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 font-medium">Lead Price:</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatPrice(lead.leadPrice)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(lead.id)}
              leftIcon={<FaEye />}
              className="flex-1"
            >
              View Details
            </Button>
            {!isPurchased && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onPurchase(lead.id)}
                leftIcon={<FaShoppingCart />}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Buy Lead
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default LeadCard;

