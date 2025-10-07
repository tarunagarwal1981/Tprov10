"use client";

import React, { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaDollarSign,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCalendarAlt,
  FaUsers,
  FaPercentage,
  FaToggleOn,
  FaToggleOff,
  FaChartLine,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  ActivityPackageFormData,
  Currency,
  PriceType,
  GroupDiscount,
  SeasonalPricing,
} from "@/lib/types/activity-package";

// Currency options with flags
const CURRENCY_OPTIONS: { value: Currency; label: string; symbol: string; flag: string }[] = [
  { value: 'USD', label: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { value: 'EUR', label: 'Euro', symbol: '€', flag: '🇪🇺' },
  { value: 'GBP', label: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { value: 'CHF', label: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { value: 'CNY', label: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
];

// Group discount card component
const GroupDiscountCard: React.FC<{
  discount: GroupDiscount;
  onUpdate: (discount: GroupDiscount) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
}> = ({ discount, onUpdate, onRemove, isEditing, onEdit, onCancelEdit }) => {
  const [editData, setEditData] = useState(discount);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    onCancelEdit();
  }, [editData, onUpdate, onCancelEdit]);

  const handleCancel = useCallback(() => {
    setEditData(discount);
    onCancelEdit();
  }, [discount, onCancelEdit]);

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Minimum People</label>
              <Input
                type="number"
                min="2"
                value={editData.minPeople}
                onChange={(e) => setEditData({ ...editData, minPeople: parseInt(e.target.value) || 2 })}
                className="package-text-fix"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Discount Percentage</label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={editData.discountPercentage}
                  onChange={(e) => setEditData({ ...editData, discountPercentage: parseInt(e.target.value) || 0 })}
                  className="package-text-fix pr-8"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="e.g., Group discount for 5+ people"
              className="package-text-fix"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSave} className="package-button-fix">
              Save Changes
            </Button>
            <Button onClick={handleCancel} variant="outline" className="package-button-fix">
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FaUsers className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{discount.minPeople}+ people</span>
          </div>
          <div className="flex items-center gap-2">
            <FaPercentage className="h-4 w-4 text-green-600" />
            <span className="font-medium">{discount.discountPercentage}% off</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(discount.id)}
            className="package-button-fix"
          >
            <FaEdit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(discount.id)}
            className="package-button-fix text-red-600 hover:text-red-700"
          >
            <FaTrash className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {discount.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {discount.description}
        </p>
      )}
    </motion.div>
  );
};

// Seasonal pricing card component
const SeasonalPricingCard: React.FC<{
  pricing: SeasonalPricing;
  onUpdate: (pricing: SeasonalPricing) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
}> = ({ pricing, onUpdate, onRemove, isEditing, onEdit, onCancelEdit }) => {
  const [editData, setEditData] = useState(pricing);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    onCancelEdit();
  }, [editData, onUpdate, onCancelEdit]);

  const handleCancel = useCallback(() => {
    setEditData(pricing);
    onCancelEdit();
  }, [pricing, onCancelEdit]);

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Season Name</label>
            <Input
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              placeholder="e.g., Summer Peak, Winter Off-Season"
              className="package-text-fix"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={editData.startDate.toISOString().split('T')[0]}
                onChange={(e) => setEditData({ ...editData, startDate: new Date(e.target.value) })}
                className="package-text-fix"
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={editData.endDate.toISOString().split('T')[0]}
                onChange={(e) => setEditData({ ...editData, endDate: new Date(e.target.value) })}
                className="package-text-fix"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Price Adjustment</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editData.priceAdjustment}
                onChange={(e) => setEditData({ ...editData, priceAdjustment: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="package-text-fix"
              />
              <span className="text-sm text-gray-500">from base price</span>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Optional description for this seasonal pricing"
              className="package-text-fix"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSave} className="package-button-fix">
              Save Changes
            </Button>
            <Button onClick={handleCancel} variant="outline" className="package-button-fix">
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FaCalendarAlt className="h-4 w-4 text-purple-600" />
            <h4 className="font-medium">{pricing.name}</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {pricing.startDate.toLocaleDateString()} - {pricing.endDate.toLocaleDateString()}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm">
              Price: {pricing.priceAdjustment >= 0 ? '+' : ''}
              {pricing.priceAdjustment.toFixed(2)}
            </span>
            {pricing.description && (
              <span className="text-sm text-gray-500">{pricing.description}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(pricing.id)}
            className="package-button-fix"
          >
            <FaEdit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(pricing.id)}
            className="package-button-fix text-red-600 hover:text-red-700"
          >
            <FaTrash className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export const PricingTab: React.FC = () => {
  const { control, watch, setValue } = useFormContext<ActivityPackageFormData>();
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null);
  const [editingPricing, setEditingPricing] = useState<string | null>(null);

  const watchedData = watch('pricing');

  const handleAddGroupDiscount = useCallback((discountData: Partial<GroupDiscount>) => {
    const newDiscount: GroupDiscount = {
      id: Date.now().toString(),
      minPeople: discountData.minPeople || 2,
      discountPercentage: discountData.discountPercentage || 10,
      description: discountData.description || '',
    };

    const currentDiscounts = watchedData.groupDiscounts || [];
    setValue('pricing.groupDiscounts', [...currentDiscounts, newDiscount]);
  }, [watchedData.groupDiscounts, setValue]);

  const handleUpdateGroupDiscount = useCallback((updatedDiscount: GroupDiscount) => {
    const currentDiscounts = watchedData.groupDiscounts || [];
    const updatedDiscounts = currentDiscounts.map(discount =>
      discount.id === updatedDiscount.id ? updatedDiscount : discount
    );
    setValue('pricing.groupDiscounts', updatedDiscounts);
  }, [watchedData.groupDiscounts, setValue]);

  const handleRemoveGroupDiscount = useCallback((id: string) => {
    const currentDiscounts = watchedData.groupDiscounts || [];
    const updatedDiscounts = currentDiscounts.filter(discount => discount.id !== id);
    setValue('pricing.groupDiscounts', updatedDiscounts);
  }, [watchedData.groupDiscounts, setValue]);

  const handleAddSeasonalPricing = useCallback((pricingData: Partial<SeasonalPricing>) => {
    const newPricing: SeasonalPricing = {
      id: Date.now().toString(),
      name: pricingData.name || 'New Season',
      startDate: pricingData.startDate || new Date(),
      endDate: pricingData.endDate || new Date(),
      priceAdjustment: pricingData.priceAdjustment || 0,
      description: pricingData.description || '',
    };

    const currentPricing = watchedData.seasonalPricing || [];
    setValue('pricing.seasonalPricing', [...currentPricing, newPricing]);
  }, [watchedData.seasonalPricing, setValue]);

  const handleUpdateSeasonalPricing = useCallback((updatedPricing: SeasonalPricing) => {
    const currentPricing = watchedData.seasonalPricing || [];
    const updatedPricingList = currentPricing.map(pricing =>
      pricing.id === updatedPricing.id ? updatedPricing : pricing
    );
    setValue('pricing.seasonalPricing', updatedPricingList);
  }, [watchedData.seasonalPricing, setValue]);

  const handleRemoveSeasonalPricing = useCallback((id: string) => {
    const currentPricing = watchedData.seasonalPricing || [];
    const updatedPricing = currentPricing.filter(pricing => pricing.id !== id);
    setValue('pricing.seasonalPricing', updatedPricing);
  }, [watchedData.seasonalPricing, setValue]);

  return (
    <div className="space-y-6 package-scroll-fix">
      {/* Base Pricing */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaDollarSign className="h-5 w-5 text-green-600" />
            Base Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={control}
              name="pricing.basePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Price *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="0.01"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="package-text-fix"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="pricing.currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="package-text-fix">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          <div className="flex items-center gap-2">
                            <span>{currency.flag}</span>
                            <span>{currency.label} ({currency.symbol})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="pricing.priceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Per</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="package-text-fix">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PERSON">Per Person</SelectItem>
                      <SelectItem value="GROUP">Per Group</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Child & Infant Pricing */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle>Child & Infant Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Child Price</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="pricing.childPrice.type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="package-text-fix">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                          <SelectItem value="FIXED">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="pricing.childPrice.value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className="package-text-fix"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            {watchedData.childPrice?.type === 'PERCENTAGE' ? '%' : 
                             CURRENCY_OPTIONS.find(c => c.value === watchedData.currency)?.symbol}
                          </span>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div>
              <FormField
                control={control}
                name="pricing.infantPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Infant Price (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          step="0.01"
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="package-text-fix"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          {CURRENCY_OPTIONS.find(c => c.value === watchedData.currency)?.symbol}
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Leave empty if infants are free
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Group Discounts */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaUsers className="h-5 w-5 text-blue-600" />
            Group Discounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Offer discounts for larger groups
              </p>
              <Button
                onClick={() => handleAddGroupDiscount({})}
                size="sm"
                className="package-button-fix"
              >
                <FaPlus className="h-4 w-4 mr-2" />
                Add Discount
              </Button>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {(watchedData.groupDiscounts || []).map((discount) => (
                  <GroupDiscountCard
                    key={discount.id}
                    discount={discount}
                    onUpdate={handleUpdateGroupDiscount}
                    onRemove={handleRemoveGroupDiscount}
                    isEditing={editingDiscount === discount.id}
                    onEdit={setEditingDiscount}
                    onCancelEdit={() => setEditingDiscount(null)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Pricing */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaCalendarAlt className="h-5 w-5 text-purple-600" />
            Seasonal Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Adjust prices for different seasons or periods
              </p>
              <Button
                onClick={() => handleAddSeasonalPricing({})}
                size="sm"
                className="package-button-fix"
              >
                <FaPlus className="h-4 w-4 mr-2" />
                Add Season
              </Button>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {(watchedData.seasonalPricing || []).map((pricing) => (
                  <SeasonalPricingCard
                    key={pricing.id}
                    pricing={pricing}
                    onUpdate={handleUpdateSeasonalPricing}
                    onRemove={handleRemoveSeasonalPricing}
                    isEditing={editingPricing === pricing.id}
                    onEdit={setEditingPricing}
                    onCancelEdit={() => setEditingPricing(null)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Pricing */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaChartLine className="h-5 w-5 text-orange-600" />
            Dynamic Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FormField
              control={control}
              name="pricing.dynamicPricing.enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Dynamic Pricing</FormLabel>
                    <FormDescription>
                      Automatically adjust prices based on demand and season
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {watchedData.dynamicPricing.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <FormField
                  control={control}
                  name="pricing.dynamicPricing.baseMultiplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Multiplier</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0.1"
                          max="3"
                          step="0.1"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                          className="package-text-fix"
                        />
                      </FormControl>
                      <FormDescription>Base price multiplier</FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="pricing.dynamicPricing.demandMultiplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Demand Multiplier</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0.1"
                          max="3"
                          step="0.1"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                          className="package-text-fix"
                        />
                      </FormControl>
                      <FormDescription>Demand-based adjustment</FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="pricing.dynamicPricing.seasonMultiplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Season Multiplier</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0.1"
                          max="3"
                          step="0.1"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                          className="package-text-fix"
                        />
                      </FormControl>
                      <FormDescription>Seasonal adjustment</FormDescription>
                    </FormItem>
                  )}
                />
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
