"use client";

import React, { useState, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { FaEye, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaClock, FaLayerGroup, FaShieldAlt, FaDollarSign } from "react-icons/fa";
import { ActivityPackageFormData, FormValidation } from "@/lib/types/activity-package";

interface ReviewPublishActivityTabProps {
  validation: FormValidation;
  onPreview: () => void;
}

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
      <CardContent>{children}</CardContent>
    </Card>
  );
};

const SummaryItem: React.FC<{
  label: string;
  value: string | number | React.ReactNode;
  isEmpty?: boolean;
}> = ({ label, value, isEmpty = false }) => {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
      <span
        className={cn(
          "text-sm text-right max-w-xs",
          isEmpty ? "text-gray-400 italic" : "text-gray-900 dark:text-gray-100"
        )}
      >
        {isEmpty ? "Not specified" : value}
      </span>
    </div>
  );
};

export const ReviewPublishActivityTab: React.FC<ReviewPublishActivityTabProps> = ({ validation, onPreview }) => {
  const { watch } = useFormContext<ActivityPackageFormData>();
  const [isPublishing, setIsPublishing] = useState(false);

  const formData = watch();

  const completionPercentage = useMemo(() => {
    const sections = ["basic-info", "activity-details", "pricing", "pricing-options"];
    const completedSections = sections.filter((section) => !validation.errors.some((e) => e.tab === section));
    return Math.round((completedSections.length / sections.length) * 100);
  }, [validation.errors]);

  const isSectionComplete = (sectionName: string) => !validation.errors.some((e) => e.tab === sectionName);
  const hasSectionErrors = (sectionName: string) => validation.errors.some((e) => e.tab === sectionName);

  return (
    <div className="space-y-6 package-scroll-fix">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Review & Publish Activity Package</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Review your activity package before publishing</p>

        <Card className="package-selector-glass package-shadow-fix max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Completion</span>
              <span className="text-sm font-bold">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">{validation.errors.length} issues to resolve</p>
          </CardContent>
        </Card>
      </div>

      {validation.errors.length > 0 && (
        <Card className="package-selector-glass package-shadow-fix border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <FaExclamationTriangle className="h-5 w-5" /> Issues to Resolve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validation.errors.map((error, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <FaExclamationTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">{error.message}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">{error.tab} → {error.field}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <ReviewSection
          title="Basic Information"
          icon={<FaInfoCircle className="h-5 w-5 text-blue-600" />}
          isComplete={isSectionComplete("basic-info")}
          hasErrors={hasSectionErrors("basic-info")}
        >
          <div className="space-y-3">
            <SummaryItem label="Title" value={formData.basicInformation?.title || ""} isEmpty={!formData.basicInformation?.title} />
            <SummaryItem label="Short Description" value={formData.basicInformation?.shortDescription || ""} isEmpty={!formData.basicInformation?.shortDescription} />
            <SummaryItem label="Destination" value={formData.basicInformation?.destination?.name || ""} isEmpty={!formData.basicInformation?.destination?.name} />
          </div>
        </ReviewSection>

        <ReviewSection
          title="Activity Details"
          icon={<FaClock className="h-5 w-5 text-purple-600" />}
          isComplete={isSectionComplete("activity-details")}
          hasErrors={hasSectionErrors("activity-details")}
        >
          <div className="space-y-3">
            <SummaryItem label="Meeting Point" value={formData.activityDetails?.meetingPoint?.name || ""} isEmpty={!formData.activityDetails?.meetingPoint?.name} />
            <SummaryItem label="Time Slots" value={`${formData.activityDetails?.operationalHours?.timeSlots?.length || 0} slots`} isEmpty={(formData.activityDetails?.operationalHours?.timeSlots?.length || 0) === 0} />
          </div>
        </ReviewSection>

        <ReviewSection
          title="Pricing"
          icon={<FaDollarSign className="h-5 w-5 text-green-600" />}
          isComplete={isSectionComplete("pricing")}
          hasErrors={hasSectionErrors("pricing")}
        >
          <div className="space-y-3">
            <SummaryItem label="Base Price" value={`${formData.pricing?.currency || '$'}${(formData.pricing?.basePrice ?? 0).toFixed(2)}`} />
            <SummaryItem label="Price Type" value={formData.pricing?.priceType === 'PERSON' ? 'Per Person' : 'Per Group'} />
          </div>
        </ReviewSection>
        
        <ReviewSection
          title="Pricing Options"
          icon={<FaDollarSign className="h-5 w-5 text-orange-600" />}
          isComplete={isSectionComplete("pricing-options")}
          hasErrors={hasSectionErrors("pricing-options")}
        >
          <div className="space-y-3">
            <SummaryItem 
              label="Ticket Only Options" 
              value={`${formData.pricingOptions?.ticketOnlyOptions?.length || 0} options`}
              isEmpty={(formData.pricingOptions?.ticketOnlyOptions?.length || 0) === 0}
            />
            <SummaryItem 
              label="Ticket with Transfer Options" 
              value={`${formData.pricingOptions?.ticketWithTransferOptions?.length || 0} options`}
              isEmpty={(formData.pricingOptions?.ticketWithTransferOptions?.length || 0) === 0}
            />
          </div>
        </ReviewSection>
      </div>

      <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={onPreview} variant="outline" className="package-button-fix package-animation-fix">
          <FaEye className="h-4 w-4 mr-2" /> Preview Package
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
              <FaClock className="h-4 w-4 mr-2 animate-spin" /> Publishing...
            </>
          ) : (
            <>
              <FaCheckCircle className="h-4 w-4 mr-2" /> Publish Activity Package
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReviewPublishActivityTab;


