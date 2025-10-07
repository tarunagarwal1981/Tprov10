"use client";

import React, { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaDollarSign,
  FaPlus,
  FaTrash,
  FaEdit,
  FaClock,
  FaMoon,
  FaCalendarAlt,
  FaSuitcase,
  FaMapMarkerAlt,
  FaBaby,
  FaShieldAlt,
  FaFileAlt,
  FaCalculator,
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
  TransferPackageFormData,
  AdditionalCharge,
  CancellationPolicy,
} from "@/lib/types/transfer-package";

// Additional charge types
const CHARGE_TYPES = [
  { value: 'FIXED', label: 'Fixed Amount', icon: '💰' },
  { value: 'PER_HOUR', label: 'Per Hour', icon: '⏰' },
  { value: 'PERCENTAGE', label: 'Percentage', icon: '📊' },
  { value: 'PER_ITEM', label: 'Per Item', icon: '📦' },
];

// Cancellation policy templates
const CANCELLATION_TEMPLATES = [
  {
    type: 'FLEXIBLE' as const,
    name: 'Flexible',
    description: 'Full refund up to 24 hours before transfer',
    refundPercentage: 100,
    cancellationDeadline: 24,
  },
  {
    type: 'MODERATE' as const,
    name: 'Moderate',
    description: '80% refund up to 24 hours before transfer',
    refundPercentage: 80,
    cancellationDeadline: 24,
  },
  {
    type: 'STRICT' as const,
    name: 'Strict',
    description: '50% refund up to 48 hours before transfer',
    refundPercentage: 50,
    cancellationDeadline: 48,
  },
];

// Additional charge card component
const AdditionalChargeCard: React.FC<{
  charge: AdditionalCharge;
  onUpdate: (charge: AdditionalCharge) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
}> = ({ charge, onUpdate, onRemove, isEditing, onEdit, onCancelEdit }) => {
  const [editData, setEditData] = useState(charge);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    onCancelEdit();
  }, [editData, onUpdate, onCancelEdit]);

  const handleCancel = useCallback(() => {
    setEditData(charge);
    onCancelEdit();
  }, [charge, onCancelEdit]);

  const chargeTypeInfo = CHARGE_TYPES.find(t => t.value === charge.type);

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
            <label className="text-sm font-medium">Charge Name</label>
            <Input
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              placeholder="e.g., Waiting Time"
              className="package-text-fix"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Describe when this charge applies"
              rows={3}
              className="package-text-fix"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Charge Type</label>
              <Select
                value={editData.type}
                onValueChange={(value: any) => setEditData({ ...editData, type: value })}
              >
                <SelectTrigger className="package-text-fix">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHARGE_TYPES.map((type) => (
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
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editData.amount}
                onChange={(e) => setEditData({ ...editData, amount: parseFloat(e.target.value) || 0 })}
                className="package-text-fix"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={editData.isActive}
              onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })}
            />
            <label className="text-sm font-medium">Active</label>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" className="package-button-fix">
              Save
            </Button>
            <Button onClick={handleCancel} size="sm" variant="outline" className="package-button-fix">
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
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium">{charge.name}</h4>
            <Badge variant={charge.isActive ? "default" : "secondary"}>
              {charge.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {chargeTypeInfo?.icon} {chargeTypeInfo?.label}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {charge.description}
          </p>
          <div className="flex items-center gap-2">
            <FaDollarSign className="h-3 w-3 text-green-600" />
            <span className="text-sm font-medium">
              ${charge.amount.toFixed(2)}
              {charge.type === 'PER_HOUR' && '/hour'}
              {charge.type === 'PERCENTAGE' && '%'}
              {charge.type === 'PER_ITEM' && '/item'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(charge.id)}
            className="package-button-fix"
          >
            <FaEdit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(charge.id)}
            className="package-button-fix text-red-600 hover:text-red-700"
          >
            <FaTrash className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export const PricingPoliciesTab: React.FC = () => {
  const { control, watch, setValue } = useFormContext<TransferPackageFormData>();
  const [editingCharge, setEditingCharge] = useState<string | null>(null);
  const [newCharge, setNewCharge] = useState<Partial<AdditionalCharge>>({
    name: '',
    description: '',
    type: 'FIXED',
    amount: 0,
    isActive: true,
  });

  const watchedData = watch('pricingPolicies');

  const handleAddCharge = useCallback(() => {
    if (newCharge.name?.trim()) {
      const charge: AdditionalCharge = {
        id: Date.now().toString(),
        name: newCharge.name!,
        description: newCharge.description || '',
        type: newCharge.type || 'FIXED',
        amount: newCharge.amount || 0,
        isActive: newCharge.isActive || true,
      };

      const currentCharges = watchedData.additionalCharges || [];
      setValue('pricingPolicies.additionalCharges', [...currentCharges, charge]);
      
      setNewCharge({
        name: '',
        description: '',
        type: 'FIXED',
        amount: 0,
        isActive: true,
      });
    }
  }, [newCharge, watchedData.additionalCharges, setValue]);

  const handleUpdateCharge = useCallback((updatedCharge: AdditionalCharge) => {
    const currentCharges = watchedData.additionalCharges || [];
    const updatedCharges = currentCharges.map(charge =>
      charge.id === updatedCharge.id ? updatedCharge : charge
    );
    setValue('pricingPolicies.additionalCharges', updatedCharges);
  }, [watchedData.additionalCharges, setValue]);

  const handleRemoveCharge = useCallback((id: string) => {
    const currentCharges = watchedData.additionalCharges || [];
    const updatedCharges = currentCharges.filter(charge => charge.id !== id);
    setValue('pricingPolicies.additionalCharges', updatedCharges);
  }, [watchedData.additionalCharges, setValue]);

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
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Base pricing is configured in the Vehicle Options tab. Each vehicle has its own base price.
            </p>
            
            {watchedData.basePricing && watchedData.basePricing.length > 0 ? (
              <div className="space-y-2">
                {watchedData.basePricing.map((pricing) => (
                  <div key={pricing.vehicleId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="font-medium">Vehicle {pricing.vehicleId}</span>
                    <span className="text-green-600 font-semibold">
                      ${pricing.basePrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaCalculator className="h-8 w-8 mx-auto mb-2" />
                <p>No base pricing configured yet</p>
                <p className="text-sm">Configure vehicles in the Vehicle Options tab</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Charges */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaPlus className="h-5 w-5 text-blue-600" />
            Additional Charges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Predefined Common Charges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaClock className="h-4 w-4 text-orange-600" />
                  <h4 className="font-medium">Waiting Time</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Charge for waiting time beyond the included period
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="package-text-fix"
                  />
                  <span className="text-sm text-gray-500">per hour</span>
                </div>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaMoon className="h-4 w-4 text-indigo-600" />
                  <h4 className="font-medium">Night Surcharge</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Additional charge for transfers during night hours
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      className="package-text-fix"
                    />
                    <span className="text-sm text-gray-500">to</span>
                    <Input
                      type="time"
                      className="package-text-fix"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="package-text-fix"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaCalendarAlt className="h-4 w-4 text-red-600" />
                  <h4 className="font-medium">Holiday Surcharge</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Additional charge for transfers on holidays
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="package-text-fix"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaSuitcase className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium">Extra Luggage</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Charge for additional luggage beyond the included amount
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="package-text-fix"
                  />
                  <span className="text-sm text-gray-500">per item</span>
                </div>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaMapMarkerAlt className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium">Additional Stops</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Charge for additional stops beyond the included stops
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="package-text-fix"
                  />
                  <span className="text-sm text-gray-500">per stop</span>
                </div>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaBaby className="h-4 w-4 text-pink-600" />
                  <h4 className="font-medium">Child Seat</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Charge for child seat rental
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="package-text-fix"
                  />
                  <span className="text-sm text-gray-500">per seat</span>
                </div>
              </div>
            </div>

            {/* Custom Additional Charges */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Custom Additional Charges</h4>
                <Button
                  onClick={handleAddCharge}
                  size="sm"
                  className="package-button-fix"
                >
                  <FaPlus className="h-4 w-4 mr-2" />
                  Add Custom Charge
                </Button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {(watchedData.additionalCharges || []).map((charge) => (
                    <AdditionalChargeCard
                      key={charge.id}
                      charge={charge}
                      onUpdate={handleUpdateCharge}
                      onRemove={handleRemoveCharge}
                      isEditing={editingCharge === charge.id}
                      onEdit={setEditingCharge}
                      onCancelEdit={() => setEditingCharge(null)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaShieldAlt className="h-5 w-5 text-red-600" />
            Cancellation Policy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FormField
              control={control}
              name="pricingPolicies.cancellationPolicy.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="package-text-fix">
                        <SelectValue placeholder="Select cancellation policy" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CANCELLATION_TEMPLATES.map((template) => (
                        <SelectItem key={template.type} value={template.type}>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-gray-500">{template.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value="CUSTOM">Custom Policy</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedData.cancellationPolicy.type === 'CUSTOM' && (
              <FormField
                control={control}
                name="pricingPolicies.cancellationPolicy.customPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Policy</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter your custom cancellation policy"
                        rows={4}
                        className="package-text-fix"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="pricingPolicies.cancellationPolicy.refundPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refund Percentage</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max="100"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="package-text-fix"
                      />
                    </FormControl>
                    <FormDescription>Percentage of refund for cancellations</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="pricingPolicies.cancellationPolicy.cancellationDeadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cancellation Deadline (Hours)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 24)}
                        className="package-text-fix"
                      />
                    </FormControl>
                    <FormDescription>Hours before transfer start time</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No-Show Policy */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle>No-Show Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="pricingPolicies.noShowPolicy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>No-Show Policy</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Policy for when passengers don't show up for their transfer"
                    rows={4}
                    className="package-text-fix"
                  />
                </FormControl>
                <FormDescription>
                  Explain what happens when passengers don't show up for their scheduled transfer
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaFileAlt className="h-5 w-5 text-blue-600" />
            Terms & Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="pricingPolicies.termsAndConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terms & Conditions</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter your terms and conditions for the transfer service"
                    rows={8}
                    className="package-text-fix"
                  />
                </FormControl>
                <FormDescription>
                  Detailed terms and conditions that customers must agree to when booking
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};
