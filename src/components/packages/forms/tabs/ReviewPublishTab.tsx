"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEye,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaRoute,
  FaCar,
  FaUserTie,
  FaDollarSign,
  FaCalendarAlt,
  FaShieldAlt,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaSuitcase,
  FaLanguage,
  FaHandshake,
  FaPlane,
  FaHome,
  FaPhone,
  FaMapMarkerAlt as FaMapPin,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  TransferPackageFormData,
  FormValidation,
} from "@/lib/types/transfer-package";

interface ReviewPublishTabProps {
  validation: FormValidation;
  onPreview: () => void;
}

// Section component for review
const ReviewSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  isComplete: boolean;
  hasErrors: boolean;
  children: React.ReactNode;
}> = ({ title, icon, isComplete, hasErrors, children }) => {
  return (
    <Card className={cn(
      "package-selector-glass package-shadow-fix",
      hasErrors && "border-red-200 dark:border-red-800",
      isComplete && !hasErrors && "border-green-200 dark:border-green-800"
    )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
          <div className="ml-auto">
            {hasErrors ? (
              <Badge variant="destructive">
                <FaExclamationTriangle className="h-3 w-3 mr-1" />
                Issues
              </Badge>
            ) : isComplete ? (
              <Badge variant="default" className="bg-green-600">
                <FaCheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="secondary">
                <FaInfoCircle className="h-3 w-3 mr-1" />
                Incomplete
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

// Summary item component
const SummaryItem: React.FC<{
  label: string;
  value: string | number | React.ReactNode;
  isEmpty?: boolean;
}> = ({ label, value, isEmpty = false }) => {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {label}
      </span>
      <span className={cn(
        "text-sm text-right max-w-xs",
        isEmpty ? "text-gray-400 italic" : "text-gray-900 dark:text-gray-100"
      )}>
        {isEmpty ? "Not specified" : value}
      </span>
    </div>
  );
};

export const ReviewPublishTab: React.FC<ReviewPublishTabProps> = ({
  validation,
  onPreview,
}) => {
  const { watch } = useFormContext<TransferPackageFormData>();

  const formData = watch();

  // Calculate completion percentage based on actual form sections
  const completionPercentage = useMemo(() => {
    // Only count transfer-details section as that's the only tab now
    const hasErrors = validation.errors.length > 0;
    const hasTitle = formData.basicInformation?.title?.trim();
    const hasVehicles = (formData.transferDetails?.vehicles?.length || 0) > 0;
    const hasPricing = (formData.pricingPolicies?.hourlyPricingOptions?.length || 0) > 0 || 
                       (formData.pricingPolicies?.pointToPointPricingOptions?.length || 0) > 0;

    const requirements = [hasTitle, hasVehicles, !hasErrors];
    const completedCount = requirements.filter(Boolean).length;
    
    return Math.round((completedCount / requirements.length) * 100);
  }, [validation.errors, formData]);

  // Check section completion
  const isSectionComplete = (sectionName: string) => {
    return !validation.errors.some(error => error.tab === sectionName);
  };

  const hasSectionErrors = (sectionName: string) => {
    return validation.errors.some(error => error.tab === sectionName);
  };

  const getSectionErrors = (sectionName: string) => {
    return validation.errors.filter(error => error.tab === sectionName);
  };

  const getSectionWarnings = (sectionName: string) => {
    return validation.warnings.filter(warning => warning.tab === sectionName);
  };

  return (
    <div className="space-y-6 package-scroll-fix">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Review & Publish Transfer Package
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Review your transfer package before publishing
        </p>

        {/* Completion Progress */}
        <Card className="package-selector-glass package-shadow-fix max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Completion</span>
              <span className="text-sm font-bold">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">
              {validation.errors.length} issues to resolve
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Summary */}
      {validation.errors.length > 0 && (
        <Card className="package-selector-glass package-shadow-fix border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <FaExclamationTriangle className="h-5 w-5" />
              Issues to Resolve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validation.errors.map((error, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <FaExclamationTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      {error.message}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {error.tab} → {error.field}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <Card className="package-selector-glass package-shadow-fix border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <FaInfoCircle className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validation.warnings.map((warning, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <FaInfoCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {warning.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Sections */}
      <div className="space-y-6">
        {/* Basic Information - Title & Description Only */}
        <ReviewSection
          title="Basic Information"
          icon={<FaInfoCircle className="h-5 w-5 text-blue-600" />}
          isComplete={isSectionComplete('transfer-details')}
          hasErrors={hasSectionErrors('transfer-details')}
        >
          <div className="space-y-3">
            <SummaryItem
              label="Title"
              value={formData.basicInformation.title || ''}
              isEmpty={!formData.basicInformation.title}
            />
            <SummaryItem
              label="Description"
              value={formData.basicInformation.shortDescription || ''}
              isEmpty={!formData.basicInformation.shortDescription}
            />
          </div>
        </ReviewSection>

        {/* Vehicle Details */}
        <ReviewSection
          title="Vehicle Details"
          icon={<FaCar className="h-5 w-5 text-purple-600" />}
          isComplete={isSectionComplete('transfer-details') && (formData.transferDetails?.vehicles?.length || 0) > 0}
          hasErrors={hasSectionErrors('transfer-details')}
        >
          <div className="space-y-3">
            <SummaryItem
              label="Total Vehicles"
              value={`${formData.transferDetails?.vehicles?.filter(v => v.vehicleName?.trim()).length || 0} vehicle(s)`}
              isEmpty={(formData.transferDetails?.vehicles?.filter(v => v.vehicleName?.trim()).length || 0) === 0}
            />
            {formData.transferDetails?.vehicles?.filter(v => v.vehicleName?.trim()).map((vehicle, idx) => (
              <div key={vehicle.id} className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <SummaryItem
                  label={`Vehicle ${idx + 1}`}
                  value={
                    <div className="space-y-1">
                      <div className="font-medium">{vehicle.vehicleName}</div>
                      <div className="text-xs flex gap-2">
                        {vehicle.vehicleType && (
                          <Badge variant="outline" className="text-xs">
                            {vehicle.vehicleType}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          <FaUsers className="h-3 w-3 mr-1 inline" />
                          {vehicle.maxCapacity} passengers
                        </Badge>
                        {vehicle.vehicleImage && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            ✓ Image
                          </Badge>
                        )}
                      </div>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        </ReviewSection>

        {/* Pricing Options */}
        <ReviewSection
          title="Pricing Options"
          icon={<FaDollarSign className="h-5 w-5 text-green-600" />}
          isComplete={isSectionComplete('transfer-details')}
          hasErrors={hasSectionErrors('transfer-details')}
        >
          <div className="space-y-3">
            <SummaryItem
              label="Hourly Rentals"
              value={`${formData.pricingPolicies.hourlyPricingOptions?.length || 0} option(s)`}
              isEmpty={(formData.pricingPolicies.hourlyPricingOptions?.length || 0) === 0}
            />
            {formData.pricingPolicies.hourlyPricingOptions && formData.pricingPolicies.hourlyPricingOptions.length > 0 && (
              <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-2">
                {formData.pricingPolicies.hourlyPricingOptions.map((option, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {option.vehicleName} - {option.hours}h
                      </span>
                      <span className="font-medium">${option.rateUSD}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <SummaryItem
              label="One Way Transfers"
              value={`${formData.pricingPolicies.pointToPointPricingOptions?.length || 0} route(s)`}
              isEmpty={(formData.pricingPolicies.pointToPointPricingOptions?.length || 0) === 0}
            />
            {formData.pricingPolicies.pointToPointPricingOptions && formData.pricingPolicies.pointToPointPricingOptions.length > 0 && (
              <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-2">
                {formData.pricingPolicies.pointToPointPricingOptions.map((option, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {option.fromLocation} → {option.toLocation}
                      </span>
                      <span className="font-medium">${option.costUSD}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {option.vehicleName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ReviewSection>
      </div>

      {/* Action Buttons - Publish button moved to main form footer */}
      <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={onPreview}
          variant="outline"
          className="package-button-fix package-animation-fix"
        >
          <FaEye className="h-4 w-4 mr-2" />
          Preview Package
        </Button>
        
        <div className="text-center px-6 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            💡 Use the <strong className="text-blue-600 dark:text-blue-400">Publish Package</strong> button at the bottom of the page to publish.
          </p>
        </div>
      </div>
    </div>
  );
};