"use client";

import React, { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTicketAlt,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ActivityPackageFormData,
} from "@/lib/types/activity-package";

// Package type options
const PACKAGE_TYPE_OPTIONS = [
  { value: 'TICKET_ONLY', label: 'Ticket Only' },
  { value: 'PRIVATE_TRANSFER', label: 'Private Transfer' },
  { value: 'SHARED_TRANSFER', label: 'Shared Transfer' },
];

// Simple pricing option interface
interface SimplePricingOption {
  id: string;
  activityName: string;
  packageType: 'TICKET_ONLY' | 'PRIVATE_TRANSFER' | 'SHARED_TRANSFER';
  adultPrice: number;
  childPrice: number;
  childMinAge: number;
  childMaxAge: number;
}

// ============================================================================
// SIMPLE PRICING CARD
// ============================================================================

interface SimplePricingCardProps {
  option: SimplePricingOption;
  onUpdate: (option: SimplePricingOption) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  currency: string;
}

const SimplePricingCard: React.FC<SimplePricingCardProps> = ({
  option,
  onUpdate,
  onRemove,
  isEditing,
  onEdit,
  onCancelEdit,
  currency,
}) => {
  const [editData, setEditData] = useState(option);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    onCancelEdit();
  }, [editData, onUpdate, onCancelEdit]);

  const handleCancel = useCallback(() => {
    setEditData(option);
    onCancelEdit();
  }, [option, onCancelEdit]);

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-6 border-2 border-blue-500 rounded-lg bg-white dark:bg-gray-900"
      >
        <div className="space-y-4">
          {/* Activity Name */}
          <div>
            <label className="text-sm font-medium">Activity Name *</label>
            <Input
              value={editData.activityName}
              onChange={(e) => setEditData({ ...editData, activityName: e.target.value })}
              placeholder="e.g., Desert Safari Adventure"
              className="package-text-fix"
            />
          </div>

          {/* Package Type */}
          <div>
            <label className="text-sm font-medium">Package Type *</label>
            <Select
              value={editData.packageType}
              onValueChange={(value: SimplePricingOption['packageType']) => 
                setEditData({ ...editData, packageType: value })
              }
            >
              <SelectTrigger className="package-text-fix">
                <SelectValue placeholder="Select package type" />
              </SelectTrigger>
              <SelectContent>
                {PACKAGE_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Adult Price ({currency}) *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editData.adultPrice}
                onChange={(e) => setEditData({ ...editData, adultPrice: parseFloat(e.target.value) || 0 })}
                className="package-text-fix"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Child Price ({currency}) *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editData.childPrice}
                onChange={(e) => setEditData({ ...editData, childPrice: parseFloat(e.target.value) || 0 })}
                className="package-text-fix"
              />
            </div>
          </div>

          {/* Child Age Range */}
          <div>
            <label className="text-sm font-medium">Child Age Range *</label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min="0"
                value={editData.childMinAge}
                onChange={(e) => setEditData({ ...editData, childMinAge: parseInt(e.target.value) || 0 })}
                placeholder="Min"
                className="package-text-fix"
              />
              <span className="text-sm">to</span>
              <Input
                type="number"
                min="0"
                value={editData.childMaxAge}
                onChange={(e) => setEditData({ ...editData, childMaxAge: parseInt(e.target.value) || 0 })}
                placeholder="Max"
                className="package-text-fix"
              />
              <span className="text-sm text-gray-500">years</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSave} className="package-button-fix">
              <FaCheck className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={handleCancel} variant="outline" className="package-button-fix">
              <FaTimes className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  const packageTypeLabel = PACKAGE_TYPE_OPTIONS.find(t => t.value === option.packageType)?.label || option.packageType;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 hover:shadow-md transition-shadow"
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FaTicketAlt className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold">{option.activityName}</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{packageTypeLabel}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(option.id)}
              className="package-button-fix"
            >
              <FaEdit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(option.id)}
              className="package-button-fix text-red-600 hover:text-red-700"
            >
              <FaTrash className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">Adult</p>
            <p className="text-lg font-bold text-green-600">{currency}{option.adultPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Child ({option.childMinAge}-{option.childMaxAge} yrs)</p>
            <p className="text-lg font-bold text-blue-600">{currency}{option.childPrice.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ActivityPricingOptionsTab: React.FC = () => {
  const { watch, setValue } = useFormContext<ActivityPackageFormData>();
  const [editingId, setEditingId] = useState<string | null>(null);

  const pricingOptions = (watch('pricingOptions') || []) as SimplePricingOption[];
  const currency = watch('pricing.currency') || 'USD';

  const handleAddOption = useCallback(() => {
    const newOption: SimplePricingOption = {
      id: Date.now().toString(),
      activityName: '',
      packageType: 'TICKET_ONLY',
      adultPrice: 0,
      childPrice: 0,
      childMinAge: 3,
      childMaxAge: 12,
    };

    setValue('pricingOptions', [...pricingOptions, newOption], { shouldDirty: true });
    setEditingId(newOption.id);
  }, [pricingOptions, setValue]);

  const handleUpdateOption = useCallback((updatedOption: SimplePricingOption) => {
    const updated = pricingOptions.map(opt =>
      opt.id === updatedOption.id ? updatedOption : opt
    );
    setValue('pricingOptions', updated, { shouldDirty: true });
  }, [pricingOptions, setValue]);

  const handleRemoveOption = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this pricing option?')) {
      const updated = pricingOptions.filter(opt => opt.id !== id);
      setValue('pricingOptions', updated, { shouldDirty: true });
    }
  }, [pricingOptions, setValue]);

  return (
    <div className="space-y-6 package-scroll-fix">
      {/* Header Info */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FaTicketAlt className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Activity Pricing</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add pricing options for your activity. Specify the activity name, package type, pricing, and child age range.
              </p>
            </div>
            <Button
              onClick={handleAddOption}
              size="sm"
              className="package-button-fix"
            >
              <FaPlus className="h-4 w-4 mr-2" />
              Add Pricing Option
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Options List */}
      <div className="space-y-4">
        <AnimatePresence>
          {pricingOptions.length === 0 ? (
            <Card className="package-selector-glass package-shadow-fix">
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">
                  <FaTicketAlt className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="mb-4">No pricing options yet. Click &quot;Add Pricing Option&quot; to create one.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pricingOptions.map((option) => (
              <SimplePricingCard
                key={option.id}
                option={option}
                onUpdate={handleUpdateOption}
                onRemove={handleRemoveOption}
                isEditing={editingId === option.id}
                onEdit={setEditingId}
                onCancelEdit={() => setEditingId(null)}
                currency={currency}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

