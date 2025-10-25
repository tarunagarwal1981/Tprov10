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
  const [isPublishing, setIsPublishing] = useState(false);

  const formData = watch();

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const sections = [
      'basicInformation',
      'transferDetails',
      // 'vehicleOptions', // REMOVED
      // 'driverService', // REMOVED
      'pricingPolicies',
      // 'availabilityBooking', // REMOVED
    ];

    const completedSections = sections.filter(section => {
      const sectionErrors = validation.errors.filter(error => error.tab === section);
      return sectionErrors.length === 0;
    });

    return Math.round((completedSections.length / sections.length) * 100);
  }, [validation.errors]);

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
        {/* Basic Information */}
        <ReviewSection
          title="Basic Information"
          icon={<FaInfoCircle className="h-5 w-5 text-blue-600" />}
          isComplete={isSectionComplete('basic-info')}
          hasErrors={hasSectionErrors('basic-info')}
        >
          <div className="space-y-3">
            <SummaryItem
              label="Title"
              value={formData.basicInformation.title || ''}
              isEmpty={!formData.basicInformation.title}
            />
            <SummaryItem
              label="Short Description"
              value={formData.basicInformation.shortDescription || ''}
              isEmpty={!formData.basicInformation.shortDescription}
            />
            <SummaryItem
              label="Destination"
              value={formData.basicInformation.destination.name || ''}
              isEmpty={!formData.basicInformation.destination.name}
            />
            <SummaryItem
              label="Duration"
              value={`${formData.basicInformation.duration.hours}h ${formData.basicInformation.duration.minutes}m`}
            />
            <SummaryItem
              label="Languages"
              value={
                <div className="flex flex-wrap gap-1">
                  {formData.basicInformation.languagesSupported.map((lang) => (
                    <Badge key={lang} variant="outline" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                </div>
              }
              isEmpty={formData.basicInformation.languagesSupported.length === 0}
            />
            <SummaryItem
              label="Tags"
              value={
                <div className="flex flex-wrap gap-1">
                  {formData.basicInformation.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              }
              isEmpty={formData.basicInformation.tags.length === 0}
            />
            <SummaryItem
              label="Images"
              value={`${formData.basicInformation.imageGallery.length} images`}
              isEmpty={formData.basicInformation.imageGallery.length === 0}
            />
          </div>
        </ReviewSection>

        {/* Transfer Details */}
        <ReviewSection
          title="Transfer Details"
          icon={<FaRoute className="h-5 w-5 text-purple-600" />}
          isComplete={isSectionComplete('transfer-details')}
          hasErrors={hasSectionErrors('transfer-details')}
        >
          <div className="space-y-3">
            <SummaryItem
              label="Transfer Type"
              value={formData.transferDetails.transferType?.replace('_', ' ').toLowerCase() || ''}
              isEmpty={!formData.transferDetails.transferType}
            />
            <SummaryItem
              label="Distance"
              value={`${formData.transferDetails.routeInfo.totalDistance} ${formData.transferDetails.routeInfo.distanceUnit}`}
            />
            <SummaryItem
              label="Estimated Duration"
              value={`${formData.transferDetails.routeInfo.estimatedDuration.hours}h ${formData.transferDetails.routeInfo.estimatedDuration.minutes}m`}
            />
            {formData.transferDetails.transferType === 'MULTI_STOP' && (
              <SummaryItem
                label="Stops"
                value={`${formData.transferDetails.multiStopDetails?.stops?.length || 0} stops`}
                isEmpty={(formData.transferDetails.multiStopDetails?.stops?.length || 0) === 0}
              />
            )}
          </div>
        </ReviewSection>

        {/* Vehicle Options - REMOVED */}
        {/* Driver & Service - REMOVED */}

        {/* Pricing & Policies */}
        <ReviewSection
          title="Pricing & Policies"
          icon={<FaDollarSign className="h-5 w-5 text-green-600" />}
          isComplete={isSectionComplete('pricing-policies')}
          hasErrors={hasSectionErrors('pricing-policies')}
        >
          <div className="space-y-3">
            {/* Base Pricing - REMOVED */}
            <SummaryItem
              label="Hourly Pricing Options"
              value={`${formData.pricingPolicies.hourlyPricingOptions?.length || 0} options`}
              isEmpty={(formData.pricingPolicies.hourlyPricingOptions?.length || 0) === 0}
            />
            <SummaryItem
              label="Point-to-Point Options"
              value={`${formData.pricingPolicies.pointToPointPricingOptions?.length || 0} routes`}
              isEmpty={(formData.pricingPolicies.pointToPointPricingOptions?.length || 0) === 0}
            />
            <SummaryItem
              label="Additional Charges"
              value={`${formData.pricingPolicies.additionalCharges.length} charges`}
              isEmpty={formData.pricingPolicies.additionalCharges.length === 0}
            />
            <SummaryItem
              label="Cancellation Policy"
              value={formData.pricingPolicies.cancellationPolicy.type}
            />
            <SummaryItem
              label="Refund Percentage"
              value={`${formData.pricingPolicies.cancellationPolicy.refundPercentage}%`}
            />
            <SummaryItem
              label="Cancellation Deadline"
              value={`${formData.pricingPolicies.cancellationPolicy.cancellationDeadline} hours`}
            />
            <SummaryItem
              label="No-Show Policy"
              value={formData.pricingPolicies.noShowPolicy ? "Configured" : "Not configured"}
              isEmpty={!formData.pricingPolicies.noShowPolicy}
            />
            <SummaryItem
              label="Terms & Conditions"
              value={formData.pricingPolicies.termsAndConditions ? "Configured" : "Not configured"}
              isEmpty={!formData.pricingPolicies.termsAndConditions}
            />
          </div>
        </ReviewSection>

        {/* Availability & Booking - REMOVED */}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={onPreview}
          variant="outline"
          className="package-button-fix package-animation-fix"
        >
          <FaEye className="h-4 w-4 mr-2" />
          Preview Package
        </Button>

        <Button
          disabled={!validation.isValid || isPublishing}
          className={cn(
            "package-button-fix package-animation-fix",
            "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700",
            "shadow-lg hover:shadow-xl transform hover:scale-105"
          )}
        >
          {isPublishing ? (
            <>
              <FaClock className="h-4 w-4 mr-2 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <FaCheckCircle className="h-4 w-4 mr-2" />
              Publish Transfer Package
            </>
          )}
        </Button>
      </div>
    </div>
  );
};