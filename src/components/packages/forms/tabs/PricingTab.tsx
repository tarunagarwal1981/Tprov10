"use client";

import React, { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaDollarSign,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
  FaCar,
  FaCheck,
  FaStar,
  FaEye,
  FaEyeSlash,
  FaGripVertical,
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
} from "@/lib/types/activity-package";
import {
  ActivityPricingPackage,
  createDefaultPricingPackage,
  validatePricingPackage,
  calculatePackagePrice,
} from "@/lib/types/activity-pricing-simple";

// ============================================================================
// PRICING PACKAGE CARD COMPONENT
// ============================================================================

interface PricingPackageCardProps {
  pkg: ActivityPricingPackage;
  index: number;
  onUpdate: (pkg: ActivityPricingPackage) => void;
  onDelete: () => void;
  currency: string;
}

const PricingPackageCard: React.FC<PricingPackageCardProps> = ({
  pkg,
  index,
  onUpdate,
  onDelete,
  currency,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ActivityPricingPackage>(pkg);
  const [newIncludedItem, setNewIncludedItem] = useState('');

  const handleSave = useCallback(() => {
    const validation = validatePricingPackage(editData);
    if (!validation.isValid) {
      alert('Please fix the following errors:\n' + validation.errors.join('\n'));
      return;
    }
    onUpdate(editData);
    setIsEditing(false);
  }, [editData, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditData(pkg);
    setIsEditing(false);
  }, [pkg]);

  const handleAddIncludedItem = useCallback(() => {
    if (newIncludedItem.trim()) {
      setEditData({
        ...editData,
        includedItems: [...editData.includedItems, newIncludedItem.trim()],
      });
      setNewIncludedItem('');
    }
  }, [editData, newIncludedItem]);

  const handleRemoveIncludedItem = useCallback((itemIndex: number) => {
    setEditData({
      ...editData,
      includedItems: editData.includedItems.filter((_, i) => i !== itemIndex),
    });
  }, [editData]);

  const totalAdultPrice = calculatePackagePrice(pkg, 'adult');
  const totalChildPrice = calculatePackagePrice(pkg, 'child');
  const totalInfantPrice = calculatePackagePrice(pkg, 'infant');

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/10"
      >
        <div className="space-y-4">
          {/* Package Name & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Package Name *</label>
              <Input
                value={editData.packageName}
                onChange={(e) => setEditData({ ...editData, packageName: e.target.value })}
                placeholder="e.g., Basic Experience, Premium VIP"
                className="package-text-fix"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Short description"
                className="package-text-fix"
              />
            </div>
          </div>

          {/* Ticket Pricing */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Ticket Pricing *</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium">Adult Price</label>
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
                <label className="text-xs font-medium">Child Price</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editData.childPrice}
                  onChange={(e) => setEditData({ ...editData, childPrice: parseFloat(e.target.value) || 0 })}
                  className="package-text-fix"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Child Age: Min</label>
                <Input
                  type="number"
                  min="0"
                  value={editData.childMinAge}
                  onChange={(e) => setEditData({ ...editData, childMinAge: parseInt(e.target.value) || 0 })}
                  className="package-text-fix"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Max</label>
                <Input
                  type="number"
                  min="0"
                  value={editData.childMaxAge}
                  onChange={(e) => setEditData({ ...editData, childMaxAge: parseInt(e.target.value) || 0 })}
                  className="package-text-fix"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs font-medium">Infant Price (Optional)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editData.infantPrice || 0}
                  onChange={(e) => setEditData({ ...editData, infantPrice: parseFloat(e.target.value) || 0 })}
                  className="package-text-fix"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Infant Max Age</label>
                <Input
                  type="number"
                  min="0"
                  value={editData.infantMaxAge || 2}
                  onChange={(e) => setEditData({ ...editData, infantMaxAge: parseInt(e.target.value) || 2 })}
                  className="package-text-fix"
                />
              </div>
            </div>
          </div>

          {/* Transfer Section */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Switch
                checked={editData.transferIncluded}
                onCheckedChange={(checked) => setEditData({ ...editData, transferIncluded: checked })}
              />
              <label className="text-sm font-semibold">Include Transfer Service</label>
            </div>

            {editData.transferIncluded && (
              <div className="space-y-3 pl-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">Transfer Type *</label>
                    <Select
                      value={editData.transferType || ''}
                      onValueChange={(value) => setEditData({ ...editData, transferType: value as 'SHARED' | 'PRIVATE' })}
                    >
                      <SelectTrigger className="package-text-fix">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SHARED">Shared Shuttle</SelectItem>
                        <SelectItem value="PRIVATE">Private Car</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold mb-2">Transfer Pricing (Per Person, Additional Cost)</h5>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium">Adult</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editData.transferPriceAdult || 0}
                        onChange={(e) => setEditData({ ...editData, transferPriceAdult: parseFloat(e.target.value) || 0 })}
                        className="package-text-fix"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Child</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editData.transferPriceChild || 0}
                        onChange={(e) => setEditData({ ...editData, transferPriceChild: parseFloat(e.target.value) || 0 })}
                        className="package-text-fix"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Infant</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editData.transferPriceInfant || 0}
                        onChange={(e) => setEditData({ ...editData, transferPriceInfant: parseFloat(e.target.value) || 0 })}
                        className="package-text-fix"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">Pickup Location</label>
                    <Input
                      value={editData.pickupLocation || ''}
                      onChange={(e) => setEditData({ ...editData, pickupLocation: e.target.value })}
                      placeholder="e.g., Hotel lobby"
                      className="package-text-fix"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Dropoff Location</label>
                    <Input
                      value={editData.dropoffLocation || ''}
                      onChange={(e) => setEditData({ ...editData, dropoffLocation: e.target.value })}
                      placeholder="e.g., Activity venue"
                      className="package-text-fix"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* What's Included */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">What's Included</h4>
            <div className="flex gap-2 mb-2">
              <Input
                value={newIncludedItem}
                onChange={(e) => setNewIncludedItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddIncludedItem()}
                placeholder="Add item..."
                className="package-text-fix"
              />
              <Button onClick={handleAddIncludedItem} size="sm" className="package-button-fix">
                <FaPlus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {editData.includedItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <FaCheck className="h-3 w-3 text-green-600" />
                  <span className="flex-1">{item}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveIncludedItem(i)}
                    className="h-6 w-6 p-0"
                  >
                    <FaTimes className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} size="sm" className="package-button-fix">
              <FaSave className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button onClick={handleCancel} size="sm" variant="outline" className="package-button-fix">
              <FaTimes className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // View Mode
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "border rounded-lg p-4 bg-white dark:bg-gray-900",
        !pkg.isActive && "opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{pkg.packageName}</h3>
            {pkg.isFeatured && (
              <Badge className="bg-yellow-500 text-white">
                <FaStar className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            {!pkg.isActive && (
              <Badge variant="outline" className="text-gray-500">
                <FaEyeSlash className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
          </div>
          {pkg.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{pkg.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onUpdate({ ...pkg, isFeatured: !pkg.isFeatured })}
            className="h-8 w-8 p-0"
            title="Toggle Featured"
          >
            <FaStar className={cn("h-3 w-3", pkg.isFeatured ? "text-yellow-500" : "text-gray-400")} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onUpdate({ ...pkg, isActive: !pkg.isActive })}
            className="h-8 w-8 p-0"
            title="Toggle Active"
          >
            {pkg.isActive ? (
              <FaEye className="h-3 w-3 text-green-600" />
            ) : (
              <FaEyeSlash className="h-3 w-3 text-gray-400" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0"
          >
            <FaEdit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <FaTrash className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Pricing Display */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
          <div className="text-xs text-gray-600 dark:text-gray-400">Adult</div>
          <div className="text-lg font-bold text-blue-600">{currency}{totalAdultPrice.toFixed(2)}</div>
        </div>
        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
          <div className="text-xs text-gray-600 dark:text-gray-400">Child ({pkg.childMinAge}-{pkg.childMaxAge})</div>
          <div className="text-lg font-bold text-green-600">{currency}{totalChildPrice.toFixed(2)}</div>
        </div>
        <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
          <div className="text-xs text-gray-600 dark:text-gray-400">Infant (0-{pkg.infantMaxAge})</div>
          <div className="text-lg font-bold text-purple-600">{currency}{totalInfantPrice.toFixed(2)}</div>
        </div>
      </div>

      {/* Transfer Badge */}
      {pkg.transferIncluded && (
        <div className="mb-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <FaCar className="h-3 w-3 mr-1" />
            {pkg.transferType === 'SHARED' ? 'Shared Shuttle' : 'Private Car'} Included
          </Badge>
        </div>
      )}

      {/* Included Items */}
      {pkg.includedItems.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">What's Included:</h4>
          <div className="space-y-1">
            {pkg.includedItems.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FaCheck className="h-3 w-3 text-green-600 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
            {pkg.includedItems.length > 3 && (
              <div className="text-xs text-gray-500">+{pkg.includedItems.length - 3} more items</div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// MAIN PRICING TAB COMPONENT
// ============================================================================

export const PricingTab: React.FC = () => {
  const { control, watch, setValue } = useFormContext<ActivityPackageFormData>();
  const [pricingPackages, setPricingPackages] = useState<ActivityPricingPackage[]>([]);

  const currency = watch('pricing.currency') || 'USD';

  // Initialize from form data
  React.useEffect(() => {
    const packages = watch('pricingOptions') as any;
    if (packages && Array.isArray(packages)) {
      setPricingPackages(packages);
    }
  }, [watch]);

  // Update form when packages change
  React.useEffect(() => {
    setValue('pricingOptions', pricingPackages as any, { shouldDirty: true });
  }, [pricingPackages, setValue]);

  const handleAddPackage = useCallback(() => {
    const newPkg = createDefaultPricingPackage();
    newPkg.displayOrder = pricingPackages.length;
    setPricingPackages([...pricingPackages, newPkg]);
  }, [pricingPackages]);

  const handleUpdatePackage = useCallback((index: number, updated: ActivityPricingPackage) => {
    const newPackages = [...pricingPackages];
    newPackages[index] = updated;
    setPricingPackages(newPackages);
  }, [pricingPackages]);

  const handleDeletePackage = useCallback((index: number) => {
    if (confirm('Are you sure you want to delete this pricing package?')) {
      setPricingPackages(pricingPackages.filter((_, i) => i !== index));
    }
  }, [pricingPackages]);

  return (
    <div className="space-y-4 package-scroll-fix">
      {/* Header */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FaDollarSign className="h-5 w-5 text-green-600" />
              Pricing Packages
            </CardTitle>
            <Button onClick={handleAddPackage} className="package-button-fix">
              <FaPlus className="h-4 w-4 mr-2" />
              Add Package
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create flexible pricing packages with optional transfers. Each package is a complete template
            (e.g., "Basic Experience", "Premium VIP") with customizable pricing and included items.
          </p>
        </CardContent>
      </Card>

      {/* Currency Selection */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm">Currency</CardTitle>
        </CardHeader>
        <CardContent className="pb-3 px-4">
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
                    <SelectItem value="USD">🇺🇸 USD - US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">🇪🇺 EUR - Euro (€)</SelectItem>
                    <SelectItem value="GBP">🇬🇧 GBP - British Pound (£)</SelectItem>
                    <SelectItem value="JPY">🇯🇵 JPY - Japanese Yen (¥)</SelectItem>
                    <SelectItem value="AUD">🇦🇺 AUD - Australian Dollar (A$)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Pricing Packages List */}
      <div className="space-y-4">
        <AnimatePresence>
          {pricingPackages.map((pkg, index) => (
            <PricingPackageCard
              key={pkg.id}
              pkg={pkg}
              index={index}
              onUpdate={(updated) => handleUpdatePackage(index, updated)}
              onDelete={() => handleDeletePackage(index)}
              currency={currency}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {pricingPackages.length === 0 && (
        <Card className="package-selector-glass package-shadow-fix">
          <CardContent className="py-12 text-center">
            <FaDollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pricing Packages Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first pricing package to get started
            </p>
            <Button onClick={handleAddPackage} className="package-button-fix">
              <FaPlus className="h-4 w-4 mr-2" />
              Add First Package
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
