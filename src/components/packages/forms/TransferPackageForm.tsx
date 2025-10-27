"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaInfoCircle,
  FaRoute,
  FaCar,
  FaUserTie,
  FaDollarSign,
  FaCalendarAlt,
  FaEye,
  FaSave,
  FaRocket,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TransferPackageFormData,
  TransferPackageFormProps,
  TabInfo,
  FormValidation,
  AutoSaveState,
  DEFAULT_TRANSFER_FORM_DATA,
} from "@/lib/types/transfer-package";

// Import tab components
import { BasicInformationTab } from "./tabs/BasicInformationTab";
import { TransferDetailsTab } from "./tabs/TransferDetailsTab";
import { VehicleOptionsTab } from "./tabs/VehicleOptionsTab";
import { DriverServiceTab } from "./tabs/DriverServiceTab";
import { PricingPoliciesTab } from "./tabs/PricingPoliciesTab";
import { AvailabilityBookingTab } from "./tabs/AvailabilityBookingTab";
import { ReviewPublishTab } from "./tabs/ReviewPublishTab";

// Auto-save is intentionally DISABLED to prevent creating duplicate packages
// Only "Publish" button should create a new package in the database

// Validation hook
const useFormValidation = (data: TransferPackageFormData): FormValidation => {
  return useMemo(() => {
    const errors: FormValidation['errors'] = [];
    const warnings: FormValidation['warnings'] = [];

    // Basic Information validation - MOVED TO TRANSFER DETAILS
    if (!data.basicInformation.title.trim()) {
      errors.push({
        tab: 'transfer-details',
        field: 'title',
        message: 'Title is required',
        severity: 'error',
      });
    }

    // Description is now optional - no validation needed

    // Destination validation - City and Country required
    if (!data.basicInformation.destination.city?.trim()) {
      errors.push({
        tab: 'transfer-details',
        field: 'destination.city',
        message: 'Destination city is required',
        severity: 'error',
      });
    }
    if (!data.basicInformation.destination.country?.trim()) {
      errors.push({
        tab: 'transfer-details',
        field: 'destination.country',
        message: 'Destination country is required',
        severity: 'error',
      });
    }

    // Transfer Details validation
    if (!data.transferDetails.transferType) {
      errors.push({
        tab: 'transfer-details',
        field: 'transferType',
        message: 'Transfer type is required',
        severity: 'error',
      });
    }

    // Vehicle Options validation - REMOVED (tab removed)
    // if (data.vehicleOptions.vehicles.length === 0) {
    //   errors.push({
    //     tab: 'vehicle-options',
    //     field: 'vehicles',
    //     message: 'At least one vehicle configuration is required',
    //     severity: 'error',
    //   });
    // }

    // Validate that vehicles have base prices - REMOVED (tab removed)
    // const vehiclesWithoutPrice = data.vehicleOptions.vehicles.filter(v => !v.basePrice || v.basePrice <= 0);
    // if (vehiclesWithoutPrice.length > 0) {
    //   errors.push({
    //     tab: 'vehicle-options',
    //     field: 'basePrice',
    //     message: `${vehiclesWithoutPrice.length} vehicle(s) missing base price`,
    //     severity: 'error',
    //   });
    // }

    // Availability validation - COMMENTED OUT (tab removed)
    // if (data.availabilityBooking.availableDays.length === 0) {
    //   errors.push({
    //     tab: 'availability-booking',
    //     field: 'availableDays',
    //     message: 'At least one available day is required',
    //     severity: 'error',
    //   });
    // }

    // Pricing validation - NOT REQUIRED
    // Pricing (hourly and point-to-point) is optional
    // No validation needed for pricing policies, cancellation, etc.

    // Warnings
    if (data.basicInformation.imageGallery.length === 0) {
      warnings.push({
        tab: 'transfer-details',
        field: 'imageGallery',
        message: 'Adding images will improve your transfer package visibility',
      });
    }

    // Pricing warning (optional)
    const hasPricing = (data.pricingPolicies.hourlyPricingOptions || []).length > 0 || 
                       (data.pricingPolicies.pointToPointPricingOptions || []).length > 0;
    if (!hasPricing) {
      warnings.push({
        tab: 'transfer-details',
        field: 'pricing',
        message: 'Adding pricing options will help customers understand your rates',
      });
    }

    // Vehicle warning - REMOVED (tab removed)
    // if (data.vehicleOptions.vehicles.length < 2) {
    //   warnings.push({
    //     tab: 'vehicle-options',
    //     field: 'vehicles',
    //     message: 'Adding multiple vehicle options will give customers more choice',
    //   });
    // }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [data]);
};

export const TransferPackageForm: React.FC<TransferPackageFormProps> = ({
  initialData,
  onSave,
  onPublish,
  onPreview,
  className,
  mode = 'create',
  packageId,
}) => {
  const [activeTab, setActiveTab] = useState('transfer-details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<TransferPackageFormData>({
    defaultValues: { ...DEFAULT_TRANSFER_FORM_DATA, ...initialData },
    mode: 'onChange',
  });

  const { watch, handleSubmit, formState: { isDirty } } = form;
  const formData = watch();

  const validation = useFormValidation(formData);

  // Tab configuration
  const tabs: TabInfo[] = [
    // {
    //   id: 'basic-info',
    //   label: 'Basic Info',
    //   icon: <FaInfoCircle className="h-4 w-4" />,
    //   badge: validation.errors.filter(e => e.tab === 'basic-info').length,
    //   isComplete: !validation.errors.some(e => e.tab === 'basic-info'),
    //   hasErrors: validation.errors.some(e => e.tab === 'basic-info'),
    // },
    {
      id: 'transfer-details',
      label: 'Transfer Details',
      icon: <FaRoute className="h-4 w-4" />,
      badge: validation.errors.filter(e => e.tab === 'transfer-details').length,
      isComplete: !validation.errors.some(e => e.tab === 'transfer-details'),
      hasErrors: validation.errors.some(e => e.tab === 'transfer-details'),
    },
    // {
    //   id: 'vehicle-options',
    //   label: 'Vehicle Options',
    //   icon: <FaCar className="h-4 w-4" />,
    //   badge: validation.errors.filter(e => e.tab === 'vehicle-options').length,
    //   isComplete: !validation.errors.some(e => e.tab === 'vehicle-options'),
    //   hasErrors: validation.errors.some(e => e.tab === 'vehicle-options'),
    // },
    // {
    //   id: 'driver-service',
    //   label: 'Driver & Service',
    //   icon: <FaUserTie className="h-4 w-4" />,
    //   badge: validation.errors.filter(e => e.tab === 'driver-service').length,
    //   isComplete: !validation.errors.some(e => e.tab === 'driver-service'),
    //   hasErrors: validation.errors.some(e => e.tab === 'driver-service'),
    // },
    // Pricing is now in Transfer Details tab, not a separate tab
    // {
    //   id: 'pricing-policies',
    //   label: 'Pricing & Policies',
    //   icon: <FaDollarSign className="h-4 w-4" />,
    //   badge: validation.errors.filter(e => e.tab === 'pricing-policies').length,
    //   isComplete: !validation.errors.some(e => e.tab === 'pricing-policies'),
    //   hasErrors: validation.errors.some(e => e.tab === 'pricing-policies'),
    // },
    // {
    //   id: 'availability-booking',
    //   label: 'Availability',
    //   icon: <FaCalendarAlt className="h-4 w-4" />,
    //   badge: validation.errors.filter(e => e.tab === 'availability-booking').length,
    //   isComplete: !validation.errors.some(e => e.tab === 'availability-booking'),
    //   hasErrors: validation.errors.some(e => e.tab === 'availability-booking'),
    // },
    {
      id: 'review',
      label: 'Review',
      icon: <FaEye className="h-4 w-4" />,
      badge: validation.errors.length,
      isComplete: validation.isValid,
      hasErrors: !validation.isValid,
    },
  ];

  const handleSave = async (data: TransferPackageFormData) => {
    setIsSubmitting(true);
    try {
      if (onSave) {
        await onSave(data);
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (data: TransferPackageFormData) => {
    if (!validation.isValid) {
      setActiveTab('review');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onPublish) {
        await onPublish(data);
      }
    } catch (error) {
      console.error('Publish failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(formData);
    }
    setShowPreview(true);
  };

  const tabContent = {
    // 'basic-info': <BasicInformationTab />,
    'transfer-details': <TransferDetailsTab />,
    // 'vehicle-options': <VehicleOptionsTab />,
    // 'driver-service': <DriverServiceTab />,
    // 'pricing-policies': <PricingPoliciesTab />, // Now in Transfer Details tab
    // 'availability-booking': <AvailabilityBookingTab />,
    'review': <ReviewPublishTab validation={validation} onPreview={handlePreview} />,
  };

  return (
    <FormProvider {...form}>
      <div className={cn("w-full package-text-fix package-scroll-fix", className)}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {mode === 'create' ? 'Create Transfer Package' : 'Edit Transfer Package'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {mode === 'create' 
                  ? 'Fill out the form below to create your transfer service package'
                  : 'Update your transfer package information'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Form - Form submission is DISABLED to prevent auto-save on Enter key */}
        {/* Only the "Publish" button should create/update packages */}
        <form onSubmit={(e) => {
          e.preventDefault(); // Prevent any form submission (including Enter key)
          return false;
        }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <div className="mb-6">
              <TabsList className="w-full gap-2 flex-wrap h-auto justify-start">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      "flex items-center gap-2 package-button-fix package-animation-fix flex-shrink-0",
                      tab.hasErrors && "text-red-600 border-red-200",
                      tab.isComplete && !tab.hasErrors && "text-green-600 border-green-200"
                    )}
                    icon={tab.icon}
                    badge={tab.badge}
                    badgeVariant={tab.hasErrors ? "destructive" : "default"}
                  >
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.icon}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="min-h-[600px]">
              {Object.entries(tabContent).map(([tabId, content]) => (
                <TabsContent key={tabId} value={tabId} className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="package-animation-fix"
                  >
                    {content}
                  </motion.div>
                </TabsContent>
              ))}
            </div>
          </Tabs>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                className="package-button-fix package-animation-fix"
              >
                <FaEye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleSubmit(handleSave)}
                disabled={isSubmitting}
                className="package-button-fix package-animation-fix"
              >
                <FaSave className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Draft'}
              </Button>
            </div>

            <Button
              type="button"
              onClick={handleSubmit(handlePublish)}
              disabled={!validation.isValid || isSubmitting}
              className={cn(
                "package-button-fix package-animation-fix",
                "bg-gradient-to-r from-[#FF6B35] to-[#FF4B8C] hover:from-[#E05A2A] hover:to-[#E04080]",
                "shadow-lg hover:shadow-xl transform hover:scale-105"
              )}
            >
              <FaRocket className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Publishing...' : 'Publish Package'}
            </Button>
          </div>
        </form>

        {/* Validation Summary */}
        {validation.errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <FaExclamationTriangle className="h-4 w-4 text-red-600" />
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                Please fix the following errors:
              </h3>
            </div>
            <ul className="space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-sm text-red-700 dark:text-red-300">
                  • {error.message}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </FormProvider>
  );
};

export default TransferPackageForm;
