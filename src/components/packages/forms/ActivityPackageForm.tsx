"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaInfoCircle,
  FaClock,
  FaLayerGroup,
  FaShieldAlt,
  FaQuestionCircle,
  FaDollarSign,
  FaEye,
  FaSave,
  FaRocket,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";
import { Tabs, TabsList, TabsTrigger, TabsContent, AnimatedTabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ActivityPackageFormData,
  ActivityPackageFormProps,
  TabInfo,
  FormValidation,
  AutoSaveState,
  DEFAULT_FORM_DATA,
} from "@/lib/types/activity-package";

// Import tab components
import { BasicInformationTab } from "./tabs/BasicInformationTab";
import { ActivityDetailsTab } from "./tabs/ActivityDetailsTab";
import { PackageVariantsTab } from "./tabs/PackageVariantsTab";
import { PoliciesRestrictionsTab } from "./tabs/PoliciesRestrictionsTab";
import { FAQTab } from "./tabs/FAQTab";
import { PricingTab } from "./tabs/PricingTab";
import ReviewPublishActivityTab from "./tabs/ReviewPublishActivityTab";

// Auto-save hook
const useAutoSave = (
  data: ActivityPackageFormData,
  onSave: (data: ActivityPackageFormData) => Promise<void>,
  interval: number = 30000
) => {
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null,
  });
  const lastPayloadRef = useRef<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isSavingRef = useRef(false);

  // Use a stable snapshot of form data to avoid effect thrash from new object identities
  const serialized = useMemo(() => JSON.stringify(data), [data]);

  useEffect(() => {
    const current = serialized;

    // Only update when the flag actually changes to avoid unnecessary renders
    const nextHasUnsaved = current !== lastPayloadRef.current;
    setState(prev => (prev.hasUnsavedChanges === nextHasUnsaved ? prev : { ...prev, hasUnsavedChanges: nextHasUnsaved }));

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      if (current === lastPayloadRef.current) return;
      isSavingRef.current = true;
      setState(prev => (prev.isSaving ? prev : { ...prev, isSaving: true, error: null }));
      try {
        await onSave(data);
        lastPayloadRef.current = current;
        setState(prev => ({ ...prev, isSaving: false, lastSaved: new Date(), hasUnsavedChanges: false }));
      } catch (error) {
        setState(prev => ({ ...prev, isSaving: false, error: error instanceof Error ? error.message : 'Save failed' }));
      }
      isSavingRef.current = false;
    }, interval);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [serialized, onSave, interval]);

  return state;
};

// Validation hook
const useFormValidation = (data: ActivityPackageFormData): FormValidation => {
  return useMemo(() => {
    const errors: FormValidation['errors'] = [];
    const warnings: FormValidation['warnings'] = [];

    // Basic Information validation
    if (!data.basicInformation.title.trim()) {
      errors.push({
        tab: 'basic-info',
        field: 'title',
        message: 'Package title is required',
        severity: 'error',
      });
    }

    if (!data.basicInformation.shortDescription.trim()) {
      errors.push({
        tab: 'basic-info',
        field: 'shortDescription',
        message: 'Short description is required',
        severity: 'error',
      });
    }

    if (!data.basicInformation.destination.name.trim()) {
      errors.push({
        tab: 'basic-info',
        field: 'destination',
        message: 'Destination is required',
        severity: 'error',
      });
    }

    // Activity Details validation
    if (data.activityDetails.operationalHours.timeSlots.length === 0) {
      errors.push({
        tab: 'activity-details',
        field: 'timeSlots',
        message: 'At least one time slot is required',
        severity: 'error',
      });
    }

    if (!data.activityDetails.meetingPoint.name.trim()) {
      errors.push({
        tab: 'activity-details',
        field: 'meetingPoint',
        message: 'Meeting point is required',
        severity: 'error',
      });
    }

    // Pricing validation
    if (data.pricing.basePrice <= 0) {
      errors.push({
        tab: 'pricing',
        field: 'basePrice',
        message: 'Base price must be greater than 0',
        severity: 'error',
      });
    }

    // Warnings
    if (data.basicInformation.imageGallery.length === 0) {
      warnings.push({
        tab: 'basic-info',
        field: 'imageGallery',
        message: 'Adding images will improve your package visibility',
      });
    }

    if (data.faq.faqs.length === 0) {
      warnings.push({
        tab: 'faq',
        field: 'faqs',
        message: 'Adding FAQs will help customers understand your package better',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [data]);
};

export const ActivityPackageForm: React.FC<ActivityPackageFormProps> = ({
  initialData,
  onSave,
  onPublish,
  onPreview,
  className,
  mode = 'create',
  packageId,
}) => {
  const [activeTab, setActiveTab] = useState('basic-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<ActivityPackageFormData>({
    defaultValues: { ...DEFAULT_FORM_DATA, ...initialData },
    mode: 'onChange',
  });

  const { watch, handleSubmit, formState: { isDirty } } = form;
  const formData = watch();

  const validation = useFormValidation(formData);
  const autoSaveState = useAutoSave(formData, async (data) => {
    if (onSave) {
      await onSave(data);
    }
  });

  // Tab configuration
  const tabs: TabInfo[] = [
    {
      id: 'basic-info',
      label: 'Basic Info',
      icon: <FaInfoCircle className="h-4 w-4" />,
      badge: validation.errors.filter(e => e.tab === 'basic-info').length,
      isComplete: !validation.errors.some(e => e.tab === 'basic-info'),
      hasErrors: validation.errors.some(e => e.tab === 'basic-info'),
    },
    {
      id: 'activity-details',
      label: 'Activity Details',
      icon: <FaClock className="h-4 w-4" />,
      badge: validation.errors.filter(e => e.tab === 'activity-details').length,
      isComplete: !validation.errors.some(e => e.tab === 'activity-details'),
      hasErrors: validation.errors.some(e => e.tab === 'activity-details'),
    },
    {
      id: 'variants',
      label: 'Variants',
      icon: <FaLayerGroup className="h-4 w-4" />,
      badge: validation.errors.filter(e => e.tab === 'variants').length,
      isComplete: !validation.errors.some(e => e.tab === 'variants'),
      hasErrors: validation.errors.some(e => e.tab === 'variants'),
    },
    {
      id: 'policies',
      label: 'Policies',
      icon: <FaShieldAlt className="h-4 w-4" />,
      badge: validation.errors.filter(e => e.tab === 'policies').length,
      isComplete: !validation.errors.some(e => e.tab === 'policies'),
      hasErrors: validation.errors.some(e => e.tab === 'policies'),
    },
    {
      id: 'faq',
      label: 'FAQ',
      icon: <FaQuestionCircle className="h-4 w-4" />,
      badge: validation.errors.filter(e => e.tab === 'faq').length,
      isComplete: !validation.errors.some(e => e.tab === 'faq'),
      hasErrors: validation.errors.some(e => e.tab === 'faq'),
    },
    {
      id: 'pricing',
      label: 'Pricing',
      icon: <FaDollarSign className="h-4 w-4" />,
      badge: validation.errors.filter(e => e.tab === 'pricing').length,
      isComplete: !validation.errors.some(e => e.tab === 'pricing'),
      hasErrors: validation.errors.some(e => e.tab === 'pricing'),
    },
    {
      id: 'review',
      label: 'Review',
      icon: <FaEye className="h-4 w-4" />,
      badge: validation.errors.length,
      isComplete: validation.isValid,
      hasErrors: !validation.isValid,
    },
  ];

  const handleSave = async (data: ActivityPackageFormData) => {
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

  const handlePublish = async (data: ActivityPackageFormData) => {
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
    'basic-info': <BasicInformationTab />,
    'activity-details': <ActivityDetailsTab />,
    'variants': <PackageVariantsTab />,
    'policies': <PoliciesRestrictionsTab />,
    'faq': <FAQTab />,
    'pricing': <PricingTab />,
    'review': <ReviewPublishActivityTab validation={validation} onPreview={handlePreview} />,
  };

  return (
    <FormProvider {...form}>
      <div className={cn("w-full package-text-fix package-scroll-fix", className)}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {mode === 'create' ? 'Create Activity Package' : 'Edit Activity Package'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {mode === 'create' 
                  ? 'Fill out the form below to create your activity package'
                  : 'Update your activity package information'
                }
              </p>
            </div>
            
            {/* Auto-save status */}
            <div className="flex items-center gap-4">
              <AnimatePresence>
                {autoSaveState.isSaving && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 text-sm text-blue-600"
                  >
                    <FaSpinner className="h-4 w-4 animate-spin" />
                    Saving...
                  </motion.div>
                )}
                
                {autoSaveState.lastSaved && !autoSaveState.isSaving && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 text-sm text-green-600"
                  >
                    <FaCheckCircle className="h-4 w-4" />
                    All changes saved
                  </motion.div>
                )}
                
                {autoSaveState.error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 text-sm text-red-600"
                  >
                    <FaExclamationTriangle className="h-4 w-4" />
                    {autoSaveState.error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleSave)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <div className="mb-6">
              <TabsList className="w-full gap-2">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      "flex items-center gap-2 package-button-fix package-animation-fix",
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
                type="submit"
                variant="outline"
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
                "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700",
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

export default ActivityPackageForm;
