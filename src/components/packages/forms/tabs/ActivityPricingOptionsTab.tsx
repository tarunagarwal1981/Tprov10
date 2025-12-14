"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTicketAlt,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
  FaCar,
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

// Standard vehicle types
const VEHICLE_TYPES = [
  'Sedan',
  'SUV',
  'Van',
  'Mini Bus',
  'Bus',
  'Luxury Sedan',
  'Luxury SUV',
  'Others'
];

// Vehicle categories
const VEHICLE_CATEGORIES = [
  'Economy',
  'Standard',
  'Premium',
  'Luxury',
  'Group Transport'
];

// Vehicle interface for private transfers
export interface PackageVehicle {
  id: string;
  vehicleType: string; // Standard type or custom when "Others" selected
  maxCapacity: number;
  vehicleCategory: string;
  price: number; // Price for this vehicle option
  description?: string;
}

// Simple pricing option interface
interface SimplePricingOption {
  id: string;
  activityName: string;
  packageType: 'TICKET_ONLY' | 'PRIVATE_TRANSFER' | 'SHARED_TRANSFER';
  adultPrice: number;
  childPrice: number;
  childMinAge: number;
  childMaxAge: number;
  vehicles?: PackageVehicle[]; // Only for PRIVATE_TRANSFER
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
          {/* Tour Option */}
          <div>
            <label className="text-sm font-medium">Tour Option *</label>
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
              onValueChange={(value: SimplePricingOption['packageType']) => {
                const newData = { ...editData, packageType: value };
                // Initialize with one vehicle when PRIVATE_TRANSFER is selected
                if (value === 'PRIVATE_TRANSFER' && (!newData.vehicles || newData.vehicles.length === 0)) {
                  newData.vehicles = [{
                    id: `vehicle-${Date.now()}`,
                    vehicleType: 'Sedan',
                    maxCapacity: 4,
                    vehicleCategory: 'Standard',
                    price: 0,
                    description: '',
                  }];
                }
                setEditData(newData);
              }}
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
                value={editData.adultPrice || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setEditData({ ...editData, adultPrice: isNaN(value) ? 0 : value });
                }}
                placeholder="0.00"
                className="package-text-fix"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Child Price ({currency}) *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editData.childPrice || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setEditData({ ...editData, childPrice: isNaN(value) ? 0 : value });
                }}
                placeholder="0.00"
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
                value={editData.childMinAge || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setEditData({ ...editData, childMinAge: isNaN(value) ? 0 : value });
                }}
                placeholder="Min"
                className="package-text-fix"
              />
              <span className="text-sm">to</span>
              <Input
                type="number"
                min="0"
                value={editData.childMaxAge || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setEditData({ ...editData, childMaxAge: isNaN(value) ? 0 : value });
                }}
                placeholder="Max"
                className="package-text-fix"
              />
              <span className="text-sm text-gray-500">years</span>
            </div>
          </div>

          {/* Vehicles Section - Only for PRIVATE_TRANSFER */}
          {editData.packageType === 'PRIVATE_TRANSFER' && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <FaCar className="h-4 w-4 text-blue-600" />
                <label className="text-sm font-semibold">Vehicles</label>
              </div>

              {/* Vehicle List */}
              {editData.vehicles && editData.vehicles.length > 0 && (
                <div className="space-y-3">
                  {editData.vehicles.map((vehicle, vIndex) => (
                    <div key={vehicle.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Vehicle {vIndex + 1}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditData({
                              ...editData,
                              vehicles: editData.vehicles?.filter((v) => v.id !== vehicle.id),
                            });
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FaTrash className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                        {/* Vehicle Type */}
                        <div>
                          <label className="text-xs font-medium">Vehicle Type *</label>
                          <Select
                            value={vehicle.vehicleType}
                            onValueChange={(value) => {
                              const updatedVehicles = editData.vehicles?.map((v) =>
                                v.id === vehicle.id ? { ...v, vehicleType: value } : v
                              );
                              setEditData({ ...editData, vehicles: updatedVehicles });
                            }}
                          >
                            <SelectTrigger className="package-text-fix">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VEHICLE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Max Capacity */}
                        <div>
                          <label className="text-xs font-medium">Max Capacity *</label>
                          <Input
                            type="number"
                            min="1"
                            value={vehicle.maxCapacity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              const updatedVehicles = editData.vehicles?.map((v) =>
                                v.id === vehicle.id ? { ...v, maxCapacity: value } : v
                              );
                              setEditData({ ...editData, vehicles: updatedVehicles });
                            }}
                            placeholder="e.g., 4"
                            className="package-text-fix"
                          />
                        </div>

                        {/* Vehicle Category */}
                        <div>
                          <label className="text-xs font-medium">Category *</label>
                          <Select
                            value={vehicle.vehicleCategory}
                            onValueChange={(value) => {
                              const updatedVehicles = editData.vehicles?.map((v) =>
                                v.id === vehicle.id ? { ...v, vehicleCategory: value } : v
                              );
                              setEditData({ ...editData, vehicles: updatedVehicles });
                            }}
                          >
                            <SelectTrigger className="package-text-fix">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VEHICLE_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Price */}
                        <div>
                          <label className="text-xs font-medium">Price ({currency}) *</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={vehicle.price || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              const updatedVehicles = editData.vehicles?.map((v) =>
                                v.id === vehicle.id ? { ...v, price: isNaN(value) ? 0 : value } : v
                              );
                              setEditData({ ...editData, vehicles: updatedVehicles });
                            }}
                            placeholder="0.00"
                            className="package-text-fix"
                          />
                        </div>
                      </div>

                      {/* Custom Vehicle Type (if "Others" selected) - Full width row */}
                      {vehicle.vehicleType === 'Others' && (
                        <div className="mt-3">
                          <label className="text-xs font-medium">Custom Vehicle Type *</label>
                          <Input
                            type="text"
                            value={vehicle.description || ''}
                            onChange={(e) => {
                              const updatedVehicles = editData.vehicles?.map((v) =>
                                v.id === vehicle.id ? { ...v, description: e.target.value } : v
                              );
                              setEditData({ ...editData, vehicles: updatedVehicles });
                            }}
                            placeholder="Enter custom vehicle type"
                            className="package-text-fix"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Vehicle Button - Below all vehicles */}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const newVehicle: PackageVehicle = {
                    id: `vehicle-${Date.now()}`,
                    vehicleType: 'Sedan',
                    maxCapacity: 4,
                    vehicleCategory: 'Standard',
                    price: 0,
                    description: '',
                  };
                  setEditData({
                    ...editData,
                    vehicles: [...(editData.vehicles || []), newVehicle],
                  });
                }}
                className="package-button-fix w-full"
              >
                <FaPlus className="h-3 w-3 mr-1" />
                Add Vehicle
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button type="button" onClick={handleSave} className="package-button-fix">
              <FaCheck className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button type="button" onClick={handleCancel} variant="outline" className="package-button-fix">
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
              type="button"
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(option.id);
              }}
              className="package-button-fix"
            >
              <FaEdit className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(option.id);
              }}
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

        {/* Vehicles Summary - Only for PRIVATE_TRANSFER */}
        {option.packageType === 'PRIVATE_TRANSFER' && option.vehicles && option.vehicles.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <FaCar className="h-3 w-3 text-blue-600" />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Available Vehicles ({option.vehicles.length})</p>
            </div>
            <div className="space-y-2">
              {option.vehicles.map((vehicle, idx) => (
                <div key={vehicle.id} className="text-xs p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {vehicle.vehicleType === 'Others' && vehicle.description
                          ? vehicle.description
                          : vehicle.vehicleType}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">({vehicle.vehicleCategory})</span>
                      <span className="text-gray-600 dark:text-gray-400">• Max {vehicle.maxCapacity} pax</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {currency}{(vehicle.price || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Handle both old and new pricing format - wrapped in useMemo to stabilize dependency
  const rawPricingOptions = watch('pricingOptions');
  const pricingOptions: SimplePricingOption[] = useMemo(() => {
    // Convert old format to new format if needed
    if (Array.isArray(rawPricingOptions)) {
      return rawPricingOptions as SimplePricingOption[];
    } else if (rawPricingOptions && typeof rawPricingOptions === 'object') {
      // Old format with ticketOnlyOptions/ticketWithTransferOptions - ignore for now
      return [];
    }
    return [];
  }, [rawPricingOptions]);
  
  const currency = watch('pricing.currency') || 'USD';

  // Initialize with one empty option if no options exist
  useEffect(() => {
    if (!isInitialized && pricingOptions.length === 0) {
      const firstOption: SimplePricingOption = {
        id: Date.now().toString(),
        activityName: '',
        packageType: 'TICKET_ONLY',
        adultPrice: 0,
        childPrice: 0,
        childMinAge: 3,
        childMaxAge: 12,
      };
      setValue('pricingOptions', [firstOption], { shouldDirty: false });
      setEditingId(firstOption.id);
      setIsInitialized(true);
    }
  }, [isInitialized, pricingOptions.length, setValue]);

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

    setValue('pricingOptions', [...pricingOptions, newOption], { shouldDirty: false });
    setEditingId(newOption.id);
  }, [pricingOptions, setValue]);

  const handleUpdateOption = useCallback((updatedOption: SimplePricingOption) => {
    const updated = pricingOptions.map(opt =>
      opt.id === updatedOption.id ? updatedOption : opt
    );
    setValue('pricingOptions', updated, { shouldDirty: false });
  }, [pricingOptions, setValue]);

  const handleRemoveOption = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this pricing option?')) {
      const updated = pricingOptions.filter(opt => opt.id !== id);
      setValue('pricingOptions', updated, { shouldDirty: false });
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
                Add pricing options for your activity. Specify the tour option, package type, pricing, and child age range.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Options - Tabular View */}
      <div className="space-y-6">
        {/* Group options by package type */}
        {(() => {
          const ticketOnly = pricingOptions.filter(opt => opt.packageType === 'TICKET_ONLY');
          const sharedTransfer = pricingOptions.filter(opt => opt.packageType === 'SHARED_TRANSFER');
          const privateTransfer = pricingOptions.filter(opt => opt.packageType === 'PRIVATE_TRANSFER');

          return (
            <>
              {/* Ticket Only Table */}
              {ticketOnly.length > 0 && (
                <Card className="package-selector-glass package-shadow-fix">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FaTicketAlt className="h-4 w-4 text-green-600" />
                      Ticket Only Packages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold">Package Name</th>
                            <th className="text-left p-3 font-semibold">Ticket Price Adult</th>
                            <th className="text-left p-3 font-semibold">Ticket Price Child</th>
                            <th className="text-left p-3 font-semibold">Child Age Range</th>
                            <th className="text-center p-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ticketOnly.map((option) => (
                            <tr key={option.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="p-3">{option.activityName}</td>
                              <td className="p-3">{currency}{option.adultPrice.toFixed(2)}</td>
                              <td className="p-3">{currency}{option.childPrice.toFixed(2)}</td>
                              <td className="p-3">{option.childMinAge}-{option.childMaxAge} years</td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEditingId(option.id);
                                    }}
                                    className="package-button-fix"
                                  >
                                    <FaEdit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleRemoveOption(option.id);
                                    }}
                                    className="package-button-fix text-red-600 hover:text-red-700"
                                  >
                                    <FaTrash className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Shared Transfer Table */}
              {sharedTransfer.length > 0 && (
                <Card className="package-selector-glass package-shadow-fix">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FaCar className="h-4 w-4 text-orange-600" />
                      Shared Transfer Packages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold">Package Name</th>
                            <th className="text-left p-3 font-semibold">Ticket Price Adult</th>
                            <th className="text-left p-3 font-semibold">Ticket Price Child</th>
                            <th className="text-left p-3 font-semibold">Child Age Range</th>
                            <th className="text-center p-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sharedTransfer.map((option) => (
                            <tr key={option.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="p-3">{option.activityName}</td>
                              <td className="p-3">{currency}{option.adultPrice.toFixed(2)}</td>
                              <td className="p-3">{currency}{option.childPrice.toFixed(2)}</td>
                              <td className="p-3">{option.childMinAge}-{option.childMaxAge} years</td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEditingId(option.id);
                                    }}
                                    className="package-button-fix"
                                  >
                                    <FaEdit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleRemoveOption(option.id);
                                    }}
                                    className="package-button-fix text-red-600 hover:text-red-700"
                                  >
                                    <FaTrash className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Private Transfer Table - One row per vehicle */}
              {privateTransfer.length > 0 && (
                <Card className="package-selector-glass package-shadow-fix">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FaCar className="h-4 w-4 text-blue-600" />
                      Private Transfer Packages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold">Package Name</th>
                            <th className="text-left p-3 font-semibold">Vehicle Type</th>
                            <th className="text-left p-3 font-semibold">Capacity</th>
                            <th className="text-left p-3 font-semibold">Vehicle Price</th>
                            <th className="text-left p-3 font-semibold">Ticket Price Adult</th>
                            <th className="text-left p-3 font-semibold">Ticket Price Child</th>
                            <th className="text-left p-3 font-semibold">Child Age</th>
                            <th className="text-center p-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {privateTransfer.map((option) => {
                            const vehicles = option.vehicles || [];
                            if (vehicles.length === 0) {
                              // Show row even if no vehicles
                              return (
                                <tr key={option.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <td className="p-3">{option.activityName}</td>
                                  <td className="p-3 text-gray-400 italic" colSpan={3}>No vehicles added</td>
                                  <td className="p-3">{currency}{option.adultPrice.toFixed(2)}</td>
                                  <td className="p-3">{currency}{option.childPrice.toFixed(2)}</td>
                                  <td className="p-3">{option.childMinAge}-{option.childMaxAge} yrs</td>
                                  <td className="p-3">
                                    <div className="flex items-center justify-center gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEditingId(option.id);
                                    }}
                                        className="package-button-fix"
                                      >
                                        <FaEdit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleRemoveOption(option.id);
                                    }}
                                        className="package-button-fix text-red-600 hover:text-red-700"
                                      >
                                        <FaTrash className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                            
                            // One row per vehicle
                            return vehicles.map((vehicle, vIndex) => (
                              <tr key={`${option.id}-${vehicle.id}`} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="p-3">{option.activityName}</td>
                                <td className="p-3">{vehicle.vehicleType}</td>
                                <td className="p-3">{vehicle.maxCapacity} pax</td>
                                <td className="p-3">{currency}{vehicle.price.toFixed(2)}</td>
                                <td className="p-3">{currency}{option.adultPrice.toFixed(2)}</td>
                                <td className="p-3">{currency}{option.childPrice.toFixed(2)}</td>
                                <td className="p-3">{option.childMinAge}-{option.childMaxAge} yrs</td>
                                <td className="p-3">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEditingId(option.id);
                                    }}
                                      className="package-button-fix"
                                    >
                                      <FaEdit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleRemoveOption(option.id);
                                    }}
                                      className="package-button-fix text-red-600 hover:text-red-700"
                                    >
                                      <FaTrash className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ));
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          );
        })()}

        {/* Render edit form if editing */}
        {editingId && (() => {
          const option = pricingOptions.find(opt => opt.id === editingId);
          if (!option) return null;
          return (
            <SimplePricingCard
              key={option.id}
              option={option}
              onUpdate={handleUpdateOption}
              onRemove={handleRemoveOption}
              isEditing={true}
              onEdit={setEditingId}
              onCancelEdit={() => setEditingId(null)}
              currency={currency}
            />
          );
        })()}

        {/* Add Pricing Option Button - Below all pricing sections */}
        <div className="flex justify-center pt-4">
          <Button
            type="button"
            onClick={handleAddOption}
            variant="outline"
            size="lg"
            className="package-button-fix"
          >
            <FaPlus className="h-4 w-4 mr-2" />
            Add Pricing Option
          </Button>
        </div>
      </div>
    </div>
  );
};

