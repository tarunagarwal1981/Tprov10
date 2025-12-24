/**
 * @deprecated This tab is not used in the Activity Package form.
 * The Policies tab is commented out in ActivityPackageForm.tsx.
 * Policy fields are set to defaults in the database.
 * 
 * If you need to re-enable policies:
 * 1. Uncomment the import in ActivityPackageForm.tsx
 * 2. Uncomment the tab configuration
 * 3. Remove @deprecated markers from PoliciesRestrictions types
 * 4. Update formDataToDatabase() to use form data instead of defaults
 */

"use client";

import React, { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaShieldAlt,
  FaEdit,
  FaUsers,
  FaWheelchair,
  FaPlus,
  FaTrash,
  FaCheck,
  FaExclamationTriangle,
  FaUmbrella,
  FaHeartbeat,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  ActivityPackageFormData,
  AccessibilityFacility,
  HealthSafetyRequirement,
} from "@/lib/types/activity-package";

// Accessibility facilities
const ACCESSIBILITY_FACILITIES: { value: AccessibilityFacility; label: string; icon: string }[] = [
  { value: 'RESTROOMS', label: 'Accessible Restrooms', icon: '🚻' },
  { value: 'PARKING', label: 'Accessible Parking', icon: '🅿️' },
  { value: 'ELEVATOR', label: 'Elevator Access', icon: '🛗' },
  { value: 'RAMP', label: 'Ramp Access', icon: '♿' },
  { value: 'SIGN_LANGUAGE', label: 'Sign Language', icon: '👋' },
  { value: 'BRAILLE', label: 'Braille Materials', icon: '🔤' },
  { value: 'AUDIO_GUIDE', label: 'Audio Guide', icon: '🎧' },
];

// Cancellation policy templates
const CANCELLATION_TEMPLATES = [
  {
    type: 'FLEXIBLE' as const,
    name: 'Flexible',
    description: 'Full refund up to 24 hours before activity',
    refundPercentage: 100,
    cancellationDeadline: 24,
  },
  {
    type: 'MODERATE' as const,
    name: 'Moderate',
    description: '80% refund up to 24 hours before activity',
    refundPercentage: 80,
    cancellationDeadline: 24,
  },
  {
    type: 'STRICT' as const,
    name: 'Strict',
    description: '50% refund up to 48 hours before activity',
    refundPercentage: 50,
    cancellationDeadline: 48,
  },
];

// Health & Safety requirement component
const HealthSafetyRequirementCard: React.FC<{
  requirement: HealthSafetyRequirement;
  onUpdate: (requirement: HealthSafetyRequirement) => void;
  onRemove: (id: string) => void;
}> = ({ requirement, onUpdate, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(requirement);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    setIsEditing(false);
  }, [editData, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditData(requirement);
    setIsEditing(false);
  }, [requirement]);

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
            <label className="text-sm font-medium">Requirement</label>
            <Input
              value={editData.requirement}
              onChange={(e) => setEditData({ ...editData, requirement: e.target.value })}
              placeholder="e.g., COVID-19 vaccination proof"
              className="package-text-fix"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Detailed description of the requirement"
              rows={3}
              className="package-text-fix"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`required-${editData.id}`}
              checked={editData.isRequired}
              onCheckedChange={(checked) => setEditData({ ...editData, isRequired: !!checked })}
            />
            <label htmlFor={`required-${editData.id}`} className="text-sm font-medium">
              Required for participation
            </label>
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
            <h4 className="font-medium">{requirement.requirement}</h4>
            <Badge variant={requirement.isRequired ? "default" : "secondary"}>
              {requirement.isRequired ? "Required" : "Optional"}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {requirement.description}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="package-button-fix"
          >
            <FaEdit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(requirement.id)}
            className="package-button-fix text-red-600 hover:text-red-700"
          >
            <FaTrash className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export const PoliciesRestrictionsTab: React.FC = () => {
  const { control, watch, setValue } = useFormContext<ActivityPackageFormData>();
  const [newRequirement, setNewRequirement] = useState<Partial<HealthSafetyRequirement>>({
    requirement: '',
    description: '',
    isRequired: true,
  });

  const watchedData = watch('policiesRestrictions');

  const handleAddRequirement = useCallback(() => {
    if (newRequirement.requirement?.trim()) {
      const requirement: HealthSafetyRequirement = {
        id: Date.now().toString(),
        requirement: newRequirement.requirement!,
        description: newRequirement.description || '',
        isRequired: newRequirement.isRequired || false,
      };

      const currentRequirements = watchedData?.healthSafety?.requirements || [];
      setValue('policiesRestrictions.healthSafety.requirements', [...currentRequirements, requirement]);
      
      setNewRequirement({
        requirement: '',
        description: '',
        isRequired: true,
      });
    }
  }, [newRequirement, watchedData?.healthSafety?.requirements, setValue]);

  const handleUpdateRequirement = useCallback((updatedRequirement: HealthSafetyRequirement) => {
    const currentRequirements = watchedData?.healthSafety?.requirements || [];
    const updatedRequirements = currentRequirements.map(req =>
      req.id === updatedRequirement.id ? updatedRequirement : req
    );
    setValue('policiesRestrictions.healthSafety.requirements', updatedRequirements);
  }, [watchedData?.healthSafety?.requirements, setValue]);

  const handleRemoveRequirement = useCallback((id: string) => {
    const currentRequirements = watchedData?.healthSafety?.requirements || [];
    const updatedRequirements = currentRequirements.filter(req => req.id !== id);
    setValue('policiesRestrictions.healthSafety.requirements', updatedRequirements);
  }, [watchedData?.healthSafety?.requirements, setValue]);

  return (
    <div className="space-y-6 package-scroll-fix">
      {/* Age Restrictions */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaUsers className="h-5 w-5 text-blue-600" />
            Age Restrictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FormField
                control={control}
                name="policiesRestrictions.ageRestrictions.minimumAge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Age *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max="18"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="package-text-fix"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="policiesRestrictions.ageRestrictions.maximumAge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Age (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="package-text-fix"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={control}
                name="policiesRestrictions.ageRestrictions.childPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Child Policy</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Policy for children (e.g., must be accompanied by adult)"
                        rows={3}
                        className="package-text-fix"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="policiesRestrictions.ageRestrictions.infantPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Infant Policy</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Policy for infants (e.g., free for under 2 years)"
                        rows={3}
                        className="package-text-fix"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="mt-4">
            <FormField
              control={control}
              name="policiesRestrictions.ageRestrictions.ageVerificationRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Age Verification Required</FormLabel>
                    <FormDescription>
                      Require ID verification for age-restricted activities
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
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaWheelchair className="h-5 w-5 text-green-600" />
            Accessibility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FormField
              control={control}
              name="policiesRestrictions.accessibility.wheelchairAccessible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Wheelchair Accessible</FormLabel>
                    <FormDescription>
                      Activity is accessible for wheelchair users
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

            <div>
              <FormField
                control={control}
                name="policiesRestrictions.accessibility.facilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Facilities</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {ACCESSIBILITY_FACILITIES.map((facility) => (
                        <div key={facility.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={facility.value}
                            checked={field.value?.includes(facility.value)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, facility.value]);
                              } else {
                                field.onChange(current.filter((f: AccessibilityFacility) => f !== facility.value));
                              }
                            }}
                          />
                          <label
                            htmlFor={facility.value}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                          >
                            <span>{facility.icon}</span>
                            {facility.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="policiesRestrictions.accessibility.specialAssistance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Assistance</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Information about special assistance available"
                      rows={3}
                      className="package-text-fix"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              name="policiesRestrictions.cancellationPolicy.type"
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

            {watchedData?.cancellationPolicy?.type === 'CUSTOM' && (
              <FormField
                control={control}
                name="policiesRestrictions.cancellationPolicy.customPolicy"
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
                name="policiesRestrictions.cancellationPolicy.refundPercentage"
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
                name="policiesRestrictions.cancellationPolicy.cancellationDeadline"
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
                    <FormDescription>Hours before activity start time</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Policy */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaUmbrella className="h-5 w-5 text-blue-600" />
            Weather Policy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="policiesRestrictions.weatherPolicy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weather Policy</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Policy for weather-related cancellations or modifications"
                    rows={4}
                    className="package-text-fix"
                  />
                </FormControl>
                <FormDescription>
                  Explain how weather conditions affect your activity
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Health & Safety */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaHeartbeat className="h-5 w-5 text-red-600" />
            Health & Safety
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add New Requirement */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              <h4 className="font-medium mb-4">Add Health & Safety Requirement</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Requirement</label>
                  <Input
                    value={newRequirement.requirement}
                    onChange={(e) => setNewRequirement({ ...newRequirement, requirement: e.target.value })}
                    placeholder="e.g., COVID-19 vaccination proof"
                    className="package-text-fix"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newRequirement.description}
                    onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                    placeholder="Detailed description of the requirement"
                    rows={3}
                    className="package-text-fix"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="new-required"
                    checked={newRequirement.isRequired}
                    onCheckedChange={(checked) => setNewRequirement({ ...newRequirement, isRequired: !!checked })}
                  />
                  <label htmlFor="new-required" className="text-sm font-medium">
                    Required for participation
                  </label>
                </div>
                
                <Button
                  onClick={handleAddRequirement}
                  disabled={!newRequirement.requirement?.trim()}
                  className="package-button-fix"
                >
                  <FaPlus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>
            </div>

            {/* Requirements List */}
            <div>
              <h4 className="font-medium mb-4">Health & Safety Requirements</h4>
              <div className="space-y-3">
                <AnimatePresence>
                  {(watchedData?.healthSafety?.requirements || []).map((requirement) => (
                    <HealthSafetyRequirementCard
                      key={requirement.id}
                      requirement={requirement}
                      onUpdate={handleUpdateRequirement}
                      onRemove={handleRemoveRequirement}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <FormField
              control={control}
              name="policiesRestrictions.healthSafety.additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Health & Safety Information</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Any additional health and safety information"
                      rows={4}
                      className="package-text-fix"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
