"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaFilter,
  FaMapMarkerAlt,
  FaTag,
  FaDollarSign,
  FaClock,
  FaStar,
  FaUsers,
  FaUndo,
  FaCheck,
  FaMountain,
  FaUmbrellaBeach,
  FaPaw,
  FaGem,
  FaMoneyBillWave,
  FaChild,
  FaHeart,
  FaGlobeAmericas,
} from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LeadFilters as LeadFiltersType, TripType } from '@/lib/types/marketplace';

/**
 * Lead Filters Component Props
 */
export interface LeadFiltersProps {
  filters: LeadFiltersType;
  onChange: (filters: LeadFiltersType) => void;
  onReset: () => void;
  className?: string;
}

/**
 * Trip type options with icons
 */
const TRIP_TYPE_OPTIONS = [
  { value: TripType.ADVENTURE, label: 'Adventure', icon: FaMountain, color: 'text-orange-600' },
  { value: TripType.BEACH, label: 'Beach', icon: FaUmbrellaBeach, color: 'text-cyan-600' },
  { value: TripType.WILDLIFE, label: 'Wildlife', icon: FaPaw, color: 'text-green-600' },
  { value: TripType.LUXURY, label: 'Luxury', icon: FaGem, color: 'text-purple-600' },
  { value: TripType.BUDGET, label: 'Budget', icon: FaMoneyBillWave, color: 'text-yellow-600' },
  { value: TripType.FAMILY, label: 'Family', icon: FaChild, color: 'text-blue-600' },
  { value: TripType.HONEYMOON, label: 'Honeymoon', icon: FaHeart, color: 'text-pink-600' },
  { value: TripType.CULTURAL, label: 'Cultural', icon: FaGlobeAmericas, color: 'text-indigo-600' },
];

/**
 * Format currency value
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Lead Filters Component
 * Provides comprehensive filtering options for marketplace leads
 */
export const LeadFilters: React.FC<LeadFiltersProps> = ({
  filters,
  onChange,
  onReset,
  className,
}) => {
  // Local state for slider values (for better UX during dragging)
  const [budgetRange, setBudgetRange] = useState<[number, number]>([
    filters.budgetMin ?? 0,
    filters.budgetMax ?? 50000,
  ]);
  const [durationRange, setDurationRange] = useState<[number, number]>([
    filters.durationMin ?? 1,
    filters.durationMax ?? 30,
  ]);
  const [qualityScore, setQualityScore] = useState(filters.minQualityScore ?? 0);

  // Track if filters are active
  const hasActiveFilters =
    filters.destination ||
    filters.tripType ||
    filters.budgetMin !== undefined ||
    filters.budgetMax !== undefined ||
    filters.durationMin !== undefined ||
    filters.durationMax !== undefined ||
    (filters.minQualityScore !== undefined && filters.minQualityScore > 0);

  /**
   * Handle destination change
   */
  const handleDestinationChange = (value: string) => {
    onChange({
      ...filters,
      destination: value || undefined,
    });
  };

  /**
   * Handle trip type toggle
   */
  const handleTripTypeToggle = (tripType: TripType, checked: boolean) => {
    if (checked) {
      onChange({
        ...filters,
        tripType: tripType,
      });
    } else {
      if (filters.tripType === tripType) {
        onChange({
          ...filters,
          tripType: undefined,
        });
      }
    }
  };

  /**
   * Handle budget range change
   */
  const handleBudgetRangeChange = (values: number[]) => {
    if (values.length === 2 && values[0] !== undefined && values[1] !== undefined) {
      setBudgetRange([values[0], values[1]]);
    }
  };

  /**
   * Commit budget range on mouse up
   */
  const commitBudgetRange = () => {
    onChange({
      ...filters,
      budgetMin: budgetRange[0] > 0 ? budgetRange[0] : undefined,
      budgetMax: budgetRange[1] < 50000 ? budgetRange[1] : undefined,
    });
  };

  /**
   * Handle duration range change
   */
  const handleDurationRangeChange = (values: number[]) => {
    if (values.length === 2 && values[0] !== undefined && values[1] !== undefined) {
      setDurationRange([values[0], values[1]]);
    }
  };

  /**
   * Commit duration range
   */
  const commitDurationRange = () => {
    onChange({
      ...filters,
      durationMin: durationRange[0] > 1 ? durationRange[0] : undefined,
      durationMax: durationRange[1] < 30 ? durationRange[1] : undefined,
    });
  };

  /**
   * Handle quality score change
   */
  const handleQualityScoreChange = (values: number[]) => {
    if (values.length > 0 && values[0] !== undefined) {
      setQualityScore(values[0]);
    }
  };

  /**
   * Commit quality score
   */
  const commitQualityScore = () => {
    onChange({
      ...filters,
      minQualityScore: qualityScore > 0 ? qualityScore : undefined,
    });
  };

  /**
   * Handle reset
   */
  const handleReset = () => {
    setBudgetRange([0, 50000]);
    setDurationRange([1, 30]);
    setQualityScore(0);
    onReset();
  };

  return (
    <Card className={cn('border-2', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaFilter className="w-4 h-4 text-primary" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {Object.values(filters).filter((v) => v !== undefined).length} active
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Destination Filter */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FaMapMarkerAlt className="w-4 h-4 text-blue-500" />
            Destination
          </Label>
          <Input
            type="text"
            placeholder="Search destination..."
            value={filters.destination || ''}
            onChange={(e) => handleDestinationChange(e.target.value)}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Trip Type Filter */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FaTag className="w-4 h-4 text-purple-500" />
            Trip Type
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {TRIP_TYPE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = filters.tripType === option.value;

              return (
                <motion.div
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <label
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-lg border-2 cursor-pointer transition-all',
                      isSelected
                        ? 'bg-primary/5 border-primary shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleTripTypeToggle(option.value, checked as boolean)
                      }
                      className="border-gray-300"
                    />
                    <Icon className={cn('w-4 h-4', option.color)} />
                    <span className="text-xs font-medium text-gray-700 flex-1">
                      {option.label}
                    </span>
                  </label>
                </motion.div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Budget Range Filter */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FaDollarSign className="w-4 h-4 text-green-500" />
            Budget Range
          </Label>
          <div className="pt-2 pb-1">
            <Slider
              min={0}
              max={50000}
              step={500}
              value={budgetRange}
              onValueChange={handleBudgetRangeChange}
              onValueCommit={commitBudgetRange}
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-700">
              {formatCurrency(budgetRange[0])}
            </span>
            <span className="text-gray-500">to</span>
            <span className="font-semibold text-gray-700">
              {formatCurrency(budgetRange[1])}
            </span>
          </div>
        </div>

        <Separator />

        {/* Duration Range Filter */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FaClock className="w-4 h-4 text-orange-500" />
            Duration (Days)
          </Label>
          <div className="pt-2 pb-1">
            <Slider
              min={1}
              max={30}
              step={1}
              value={durationRange}
              onValueChange={handleDurationRangeChange}
              onValueCommit={commitDurationRange}
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-700">
              {durationRange[0]} {durationRange[0] === 1 ? 'day' : 'days'}
            </span>
            <span className="text-gray-500">to</span>
            <span className="font-semibold text-gray-700">
              {durationRange[1]} {durationRange[1] === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        <Separator />

        {/* Quality Score Filter */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FaStar className="w-4 h-4 text-yellow-500" />
            Minimum Quality Score
          </Label>
          <div className="pt-2 pb-1">
            <Slider
              min={0}
              max={100}
              step={5}
              value={[qualityScore]}
              onValueChange={handleQualityScoreChange}
              onValueCommit={commitQualityScore}
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-700">{qualityScore}/100</span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={cn(
                    'w-3 h-3',
                    i < Math.round((qualityScore / 100) * 5)
                      ? 'text-yellow-400'
                      : 'text-gray-200'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasActiveFilters}
            leftIcon={<FaUndo />}
            className="flex-1"
          >
            Reset
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              // Trigger a "filter applied" event if needed
              // The filters are already being applied in real-time via onChange
            }}
            leftIcon={<FaCheck />}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadFilters;

