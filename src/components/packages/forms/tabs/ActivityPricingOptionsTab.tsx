"use client";

import React, { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTicketAlt,
  FaBus,
  FaPlus,
  FaTrash,
  FaEdit,
  FaChild,
  FaBaby,
  FaCar,
  FaUsers,
  FaStar,
  FaCheck,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  ActivityPackageFormData,
  TicketOnlyPricingOption,
  TicketWithTransferPricingOption,
  VehicleType,
} from "@/lib/types/activity-package";

// Vehicle type options
const VEHICLE_TYPE_OPTIONS: { value: VehicleType; label: string; icon: string }[] = [
  { value: 'SEDAN', label: 'Sedan', icon: '🚗' },
  { value: 'SUV', label: 'SUV', icon: '🚙' },
  { value: 'VAN', label: 'Van', icon: '🚐' },
  { value: 'MINIVAN', label: 'Minivan', icon: '🚐' },
  { value: 'BUS', label: 'Bus', icon: '🚌' },
  { value: 'MINIBUS', label: 'Minibus', icon: '🚌' },
  { value: 'LUXURY', label: 'Luxury', icon: '🚘' },
];

// ============================================================================
// TICKET ONLY PRICING CARD
// ============================================================================

interface TicketOnlyCardProps {
  option: TicketOnlyPricingOption;
  onUpdate: (option: TicketOnlyPricingOption) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  currency: string;
}

const TicketOnlyCard: React.FC<TicketOnlyCardProps> = ({
  option,
  onUpdate,
  onRemove,
  isEditing,
  onEdit,
  onCancelEdit,
  currency,
}) => {
  const [editData, setEditData] = useState(option);
  const [showDetails, setShowDetails] = useState(false);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    onCancelEdit();
  }, [editData, onUpdate, onCancelEdit]);

  const handleCancel = useCallback(() => {
    setEditData(option);
    onCancelEdit();
  }, [option, onCancelEdit]);

  const addIncludedItem = () => {
    setEditData({ ...editData, includedItems: [...editData.includedItems, ''] });
  };

  const updateIncludedItem = (index: number, value: string) => {
    const items = [...editData.includedItems];
    items[index] = value;
    setEditData({ ...editData, includedItems: items });
  };

  const removeIncludedItem = (index: number) => {
    const items = editData.includedItems.filter((_, i) => i !== index);
    setEditData({ ...editData, includedItems: items });
  };

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-6 border-2 border-blue-500 rounded-lg bg-white dark:bg-gray-900"
      >
        <div className="space-y-4">
          {/* Option Name and Description */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium">Option Name *</label>
              <Input
                value={editData.optionName}
                onChange={(e) => setEditData({ ...editData, optionName: e.target.value })}
                placeholder="e.g., Standard Admission"
                className="package-text-fix"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Brief description of this pricing option"
                className="package-text-fix"
                rows={2}
              />
            </div>
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

          {/* Age Ranges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Child Age Range *</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  value={editData.childMinAge}
                  onChange={(e) => setEditData({ ...editData, childMinAge: parseInt(e.target.value) || 0 })}
                  placeholder="Min"
                  className="package-text-fix"
                />
                <span className="flex items-center">to</span>
                <Input
                  type="number"
                  min="0"
                  value={editData.childMaxAge}
                  onChange={(e) => setEditData({ ...editData, childMaxAge: parseInt(e.target.value) || 0 })}
                  placeholder="Max"
                  className="package-text-fix"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Age range for child pricing (e.g., 3-12 years)</p>
            </div>
            <div>
              <label className="text-sm font-medium">Infant Price ({currency})</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editData.infantPrice || 0}
                onChange={(e) => setEditData({ ...editData, infantPrice: parseFloat(e.target.value) || 0 })}
                className="package-text-fix"
              />
              <p className="text-xs text-gray-500 mt-1">Leave at 0 if infants are free</p>
            </div>
          </div>

          {/* Included Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">What&apos;s Included</label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addIncludedItem}
                className="package-button-fix"
              >
                <FaPlus className="h-3 w-3 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {editData.includedItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateIncludedItem(index, e.target.value)}
                    placeholder="e.g., Activity entrance, Safety equipment"
                    className="package-text-fix"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeIncludedItem(index)}
                    className="package-button-fix text-red-600"
                  >
                    <FaTrash className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Status Toggles */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={editData.isActive}
                onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })}
              />
              <label className="text-sm">Active</label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editData.isFeatured}
                onCheckedChange={(checked) => setEditData({ ...editData, isFeatured: checked })}
              />
              <label className="text-sm">Featured</label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSave} className="package-button-fix">
              <FaCheck className="h-4 w-4 mr-2" />
              Save Option
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
              <h4 className="font-semibold">{option.optionName}</h4>
              {option.isFeatured && (
                <Badge variant="default" className="text-xs">
                  <FaStar className="h-2 w-2 mr-1" />
                  Featured
                </Badge>
              )}
              {!option.isActive && (
                <Badge variant="secondary" className="text-xs">Inactive</Badge>
              )}
            </div>
            {option.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
            )}
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">Adult</p>
            <p className="text-lg font-bold text-green-600">{currency}{option.adultPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Child ({option.childMinAge}-{option.childMaxAge} yrs)</p>
            <p className="text-lg font-bold text-blue-600">{currency}{option.childPrice.toFixed(2)}</p>
          </div>
          {option.infantPrice !== undefined && option.infantPrice > 0 && (
            <div>
              <p className="text-xs text-gray-500">Infant (0-{option.infantMaxAge} yrs)</p>
              <p className="text-lg font-bold text-purple-600">{currency}{option.infantPrice.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Included Items Toggle */}
        {option.includedItems.length > 0 && (
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {showDetails ? <FaChevronUp className="h-3 w-3" /> : <FaChevronDown className="h-3 w-3" />}
              {showDetails ? 'Hide' : 'Show'} Included Items ({option.includedItems.length})
            </button>
            <AnimatePresence>
              {showDetails && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400"
                >
                  {option.includedItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <FaCheck className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// TICKET WITH TRANSFER PRICING CARD
// ============================================================================

interface TicketWithTransferCardProps {
  option: TicketWithTransferPricingOption;
  onUpdate: (option: TicketWithTransferPricingOption) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  currency: string;
}

const TicketWithTransferCard: React.FC<TicketWithTransferCardProps> = ({
  option,
  onUpdate,
  onRemove,
  isEditing,
  onEdit,
  onCancelEdit,
  currency,
}) => {
  const [editData, setEditData] = useState(option);
  const [showDetails, setShowDetails] = useState(false);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    onCancelEdit();
  }, [editData, onUpdate, onCancelEdit]);

  const handleCancel = useCallback(() => {
    setEditData(option);
    onCancelEdit();
  }, [option, onCancelEdit]);

  const addVehicleFeature = () => {
    setEditData({ ...editData, vehicleFeatures: [...editData.vehicleFeatures, ''] });
  };

  const updateVehicleFeature = (index: number, value: string) => {
    const features = [...editData.vehicleFeatures];
    features[index] = value;
    setEditData({ ...editData, vehicleFeatures: features });
  };

  const removeVehicleFeature = (index: number) => {
    const features = editData.vehicleFeatures.filter((_, i) => i !== index);
    setEditData({ ...editData, vehicleFeatures: features });
  };

  const addIncludedItem = () => {
    setEditData({ ...editData, includedItems: [...editData.includedItems, ''] });
  };

  const updateIncludedItem = (index: number, value: string) => {
    const items = [...editData.includedItems];
    items[index] = value;
    setEditData({ ...editData, includedItems: items });
  };

  const removeIncludedItem = (index: number) => {
    const items = editData.includedItems.filter((_, i) => i !== index);
    setEditData({ ...editData, includedItems: items });
  };

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-6 border-2 border-purple-500 rounded-lg bg-white dark:bg-gray-900"
      >
        <div className="space-y-4">
          {/* Option Name and Description */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium">Option Name *</label>
              <Input
                value={editData.optionName}
                onChange={(e) => setEditData({ ...editData, optionName: e.target.value })}
                placeholder="e.g., Premium Package with Hotel Transfer"
                className="package-text-fix"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Brief description of this pricing option"
                className="package-text-fix"
                rows={2}
              />
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg space-y-4">
            <h5 className="font-medium flex items-center gap-2">
              <FaBus className="h-4 w-4 text-purple-600" />
              Vehicle Information
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Vehicle Type *</label>
                <Select
                  value={editData.vehicleType}
                  onValueChange={(value: VehicleType) => setEditData({ ...editData, vehicleType: value })}
                >
                  <SelectTrigger className="package-text-fix">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Vehicle Name/Model *</label>
                <Input
                  value={editData.vehicleName}
                  onChange={(e) => setEditData({ ...editData, vehicleName: e.target.value })}
                  placeholder="e.g., Mercedes E-Class"
                  className="package-text-fix"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Capacity *</label>
                <Input
                  type="number"
                  min="1"
                  value={editData.maxCapacity}
                  onChange={(e) => setEditData({ ...editData, maxCapacity: parseInt(e.target.value) || 1 })}
                  className="package-text-fix"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum passengers</p>
              </div>
            </div>

            {/* Vehicle Features */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Vehicle Features</label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addVehicleFeature}
                  className="package-button-fix"
                >
                  <FaPlus className="h-3 w-3 mr-1" />
                  Add Feature
                </Button>
              </div>
              <div className="space-y-2">
                {editData.vehicleFeatures.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateVehicleFeature(index, e.target.value)}
                      placeholder="e.g., Air conditioning, WiFi"
                      className="package-text-fix"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeVehicleFeature(index)}
                      className="package-button-fix text-red-600"
                    >
                      <FaTrash className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
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
              <p className="text-xs text-gray-500 mt-1">Includes ticket + transfer</p>
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
              <p className="text-xs text-gray-500 mt-1">Includes ticket + transfer</p>
            </div>
          </div>

          {/* Age Ranges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Child Age Range *</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  value={editData.childMinAge}
                  onChange={(e) => setEditData({ ...editData, childMinAge: parseInt(e.target.value) || 0 })}
                  placeholder="Min"
                  className="package-text-fix"
                />
                <span className="flex items-center">to</span>
                <Input
                  type="number"
                  min="0"
                  value={editData.childMaxAge}
                  onChange={(e) => setEditData({ ...editData, childMaxAge: parseInt(e.target.value) || 0 })}
                  placeholder="Max"
                  className="package-text-fix"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Infant Price ({currency})</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editData.infantPrice || 0}
                onChange={(e) => setEditData({ ...editData, infantPrice: parseFloat(e.target.value) || 0 })}
                className="package-text-fix"
              />
              <p className="text-xs text-gray-500 mt-1">Leave at 0 if infants are free</p>
            </div>
          </div>

          {/* Transfer Details */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4">
            <h5 className="font-medium flex items-center gap-2">
              <FaCar className="h-4 w-4 text-blue-600" />
              Transfer Details (Optional)
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Pickup Location</label>
                <Input
                  value={editData.pickupLocation || ''}
                  onChange={(e) => setEditData({ ...editData, pickupLocation: e.target.value })}
                  placeholder="e.g., Hotel lobby"
                  className="package-text-fix"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Dropoff Location</label>
                <Input
                  value={editData.dropoffLocation || ''}
                  onChange={(e) => setEditData({ ...editData, dropoffLocation: e.target.value })}
                  placeholder="e.g., Activity location"
                  className="package-text-fix"
                />
              </div>
            </div>
          </div>

          {/* Included Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">What&apos;s Included</label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addIncludedItem}
                className="package-button-fix"
              >
                <FaPlus className="h-3 w-3 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {editData.includedItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateIncludedItem(index, e.target.value)}
                    placeholder="e.g., Activity entrance, Round-trip transfer"
                    className="package-text-fix"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeIncludedItem(index)}
                    className="package-button-fix text-red-600"
                  >
                    <FaTrash className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Status Toggles */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={editData.isActive}
                onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })}
              />
              <label className="text-sm">Active</label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editData.isFeatured}
                onCheckedChange={(checked) => setEditData({ ...editData, isFeatured: checked })}
              />
              <label className="text-sm">Featured</label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSave} className="package-button-fix">
              <FaCheck className="h-4 w-4 mr-2" />
              Save Option
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

  const vehicleIcon = VEHICLE_TYPE_OPTIONS.find(v => v.value === option.vehicleType)?.icon || '🚗';

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
              <FaBus className="h-4 w-4 text-purple-600" />
              <h4 className="font-semibold">{option.optionName}</h4>
              {option.isFeatured && (
                <Badge variant="default" className="text-xs">
                  <FaStar className="h-2 w-2 mr-1" />
                  Featured
                </Badge>
              )}
              {!option.isActive && (
                <Badge variant="secondary" className="text-xs">Inactive</Badge>
              )}
            </div>
            {option.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
            )}
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

        {/* Vehicle Info */}
        <div className="flex items-center gap-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <span className="text-2xl">{vehicleIcon}</span>
          <div>
            <p className="font-medium">{option.vehicleName}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {option.vehicleType} · Max {option.maxCapacity} passengers
            </p>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">Adult</p>
            <p className="text-lg font-bold text-green-600">{currency}{option.adultPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Child ({option.childMinAge}-{option.childMaxAge} yrs)</p>
            <p className="text-lg font-bold text-blue-600">{currency}{option.childPrice.toFixed(2)}</p>
          </div>
          {option.infantPrice !== undefined && option.infantPrice > 0 && (
            <div>
              <p className="text-xs text-gray-500">Infant (0-{option.infantMaxAge} yrs)</p>
              <p className="text-lg font-bold text-purple-600">{currency}{option.infantPrice.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Details Toggle */}
        {(option.vehicleFeatures.length > 0 || option.includedItems.length > 0) && (
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              {showDetails ? <FaChevronUp className="h-3 w-3" /> : <FaChevronDown className="h-3 w-3" />}
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 space-y-2"
                >
                  {option.vehicleFeatures.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Vehicle Features:</p>
                      <div className="flex flex-wrap gap-2">
                        {option.vehicleFeatures.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {option.includedItems.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Included:</p>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {option.includedItems.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <FaCheck className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ActivityPricingOptionsTab: React.FC = () => {
  const { watch, setValue } = useFormContext<ActivityPackageFormData>();
  const [editingTicketOnly, setEditingTicketOnly] = useState<string | null>(null);
  const [editingTicketTransfer, setEditingTicketTransfer] = useState<string | null>(null);

  const pricingOptions = watch('pricingOptions');
  const currency = watch('pricing.currency') || 'USD';

  // Ticket Only handlers
  const handleAddTicketOnly = useCallback(() => {
    const newOption: TicketOnlyPricingOption = {
      id: Date.now().toString(),
      optionName: '',
      description: '',
      adultPrice: 0,
      childPrice: 0,
      childMinAge: 3,
      childMaxAge: 12,
      infantPrice: 0,
      infantMaxAge: 2,
      includedItems: [],
      excludedItems: [],
      isActive: true,
      isFeatured: false,
      displayOrder: (pricingOptions?.ticketOnlyOptions?.length || 0) + 1,
    };

    const currentOptions = pricingOptions?.ticketOnlyOptions || [];
    setValue('pricingOptions.ticketOnlyOptions', [...currentOptions, newOption]);
    setEditingTicketOnly(newOption.id);
  }, [pricingOptions, setValue]);

  const handleUpdateTicketOnly = useCallback((updatedOption: TicketOnlyPricingOption) => {
    const currentOptions = pricingOptions?.ticketOnlyOptions || [];
    const updated = currentOptions.map(opt =>
      opt.id === updatedOption.id ? updatedOption : opt
    );
    setValue('pricingOptions.ticketOnlyOptions', updated);
  }, [pricingOptions, setValue]);

  const handleRemoveTicketOnly = useCallback((id: string) => {
    const currentOptions = pricingOptions?.ticketOnlyOptions || [];
    const updated = currentOptions.filter(opt => opt.id !== id);
    setValue('pricingOptions.ticketOnlyOptions', updated);
  }, [pricingOptions, setValue]);

  // Ticket with Transfer handlers
  const handleAddTicketTransfer = useCallback(() => {
    const newOption: TicketWithTransferPricingOption = {
      id: Date.now().toString(),
      optionName: '',
      description: '',
      vehicleType: 'SEDAN',
      vehicleName: '',
      maxCapacity: 4,
      vehicleFeatures: [],
      adultPrice: 0,
      childPrice: 0,
      childMinAge: 3,
      childMaxAge: 12,
      infantPrice: 0,
      infantMaxAge: 2,
      pickupLocation: '',
      pickupInstructions: '',
      dropoffLocation: '',
      dropoffInstructions: '',
      includedItems: [],
      excludedItems: [],
      isActive: true,
      isFeatured: false,
      displayOrder: (pricingOptions?.ticketWithTransferOptions?.length || 0) + 1,
    };

    const currentOptions = pricingOptions?.ticketWithTransferOptions || [];
    setValue('pricingOptions.ticketWithTransferOptions', [...currentOptions, newOption]);
    setEditingTicketTransfer(newOption.id);
  }, [pricingOptions, setValue]);

  const handleUpdateTicketTransfer = useCallback((updatedOption: TicketWithTransferPricingOption) => {
    const currentOptions = pricingOptions?.ticketWithTransferOptions || [];
    const updated = currentOptions.map(opt =>
      opt.id === updatedOption.id ? updatedOption : opt
    );
    setValue('pricingOptions.ticketWithTransferOptions', updated);
  }, [pricingOptions, setValue]);

  const handleRemoveTicketTransfer = useCallback((id: string) => {
    const currentOptions = pricingOptions?.ticketWithTransferOptions || [];
    const updated = currentOptions.filter(opt => opt.id !== id);
    setValue('pricingOptions.ticketWithTransferOptions', updated);
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
            <div>
              <h3 className="text-lg font-semibold mb-2">Activity Pricing Options</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create multiple pricing options for your activity. You can offer ticket-only pricing or
                include transfer services with different vehicle options.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Only Pricing Section */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FaTicketAlt className="h-5 w-5 text-blue-600" />
              Ticket Only Pricing
            </CardTitle>
            <Button
              onClick={handleAddTicketOnly}
              size="sm"
              className="package-button-fix"
            >
              <FaPlus className="h-4 w-4 mr-2" />
              Add Ticket Option
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Simple ticket pricing with adult and child rates. No transfer included.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence>
              {(pricingOptions?.ticketOnlyOptions || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaTicketAlt className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No ticket-only pricing options yet. Click &quot;Add Ticket Option&quot; to create one.</p>
                </div>
              ) : (
                (pricingOptions?.ticketOnlyOptions || []).map((option) => (
                  <TicketOnlyCard
                    key={option.id}
                    option={option}
                    onUpdate={handleUpdateTicketOnly}
                    onRemove={handleRemoveTicketOnly}
                    isEditing={editingTicketOnly === option.id}
                    onEdit={setEditingTicketOnly}
                    onCancelEdit={() => setEditingTicketOnly(null)}
                    currency={currency}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Ticket with Transfer Pricing Section */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FaBus className="h-5 w-5 text-purple-600" />
              Ticket with Transfer Pricing
            </CardTitle>
            <Button
              onClick={handleAddTicketTransfer}
              size="sm"
              className="package-button-fix"
            >
              <FaPlus className="h-4 w-4 mr-2" />
              Add Transfer Option
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Ticket pricing that includes transfer service. Specify vehicle type, capacity, and features.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence>
              {(pricingOptions?.ticketWithTransferOptions || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaBus className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No ticket-with-transfer pricing options yet. Click &quot;Add Transfer Option&quot; to create one.</p>
                </div>
              ) : (
                (pricingOptions?.ticketWithTransferOptions || []).map((option) => (
                  <TicketWithTransferCard
                    key={option.id}
                    option={option}
                    onUpdate={handleUpdateTicketTransfer}
                    onRemove={handleRemoveTicketTransfer}
                    isEditing={editingTicketTransfer === option.id}
                    onEdit={setEditingTicketTransfer}
                    onCancelEdit={() => setEditingTicketTransfer(null)}
                    currency={currency}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

