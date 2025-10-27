"use client";

import React, { useState } from "react";
import { ActivityPackageForm } from "@/components/packages/forms/ActivityPackageForm";
import { ActivityPackageFormData } from "@/lib/types/activity-package";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formDataToDatabase, createActivityPackage, updateActivityPackage } from "@/lib/supabase/activity-packages";

export default function CreateActivityPackagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  
  // Get package ID from URL params for edit mode
  const packageId = searchParams.get('id');
  const isViewMode = searchParams.get('view') === 'true';
  
  // Determine mode based on URL params
  const mode = packageId ? 'edit' : 'create';

  const handleSave = async (data: ActivityPackageFormData) => {
    try {
      console.log("💾 Saving activity package draft:", data);
      setLoading(true);
      
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Transform form data to database format with draft status
      const dbData = formDataToDatabase(data, user.id, 'draft');
      
      let savedPackageId = packageId;
      
      // Check if we're editing an existing package or creating a new one
      if (packageId) {
        // Update existing package
        const { data: packageResult, error: packageError } = await updateActivityPackage(packageId, dbData);
        
        if (packageError) {
          console.error('Package update error:', packageError);
          throw packageError;
        }
        
        console.log('✅ Package updated:', packageResult);
        toast.success("Activity package draft updated successfully!");
      } else {
        // Create new package
        const { data: packageResult, error: packageError } = await createActivityPackage(dbData, user.id);
        
        if (packageError) {
          console.error('Package creation error:', packageError);
          throw packageError;
        }
        
        savedPackageId = packageResult?.id || null;
        console.log('✅ Package saved:', packageResult);
        toast.success("Activity package draft saved successfully!");
      }
      
      // Save pricing packages if they exist
      if (savedPackageId && data.pricingOptions && Array.isArray(data.pricingOptions)) {
        try {
          console.log('💾 Saving pricing options for package:', savedPackageId);
          const { savePricingPackages, convertSimpleToPricingPackage } = await import('@/lib/supabase/activity-pricing-simple');
          // Convert simple pricing options to full format
          const fullPricingPackages = data.pricingOptions.map((opt: any, index: number) => 
            convertSimpleToPricingPackage(opt, index)
          );
          console.log('💾 Converted pricing packages:', fullPricingPackages);
          await savePricingPackages(savedPackageId, fullPricingPackages);
          console.log('✅ Pricing options saved successfully');
        } catch (pricingError) {
          console.error('❌ Error saving pricing packages:', pricingError);
          // Don't fail the entire save if pricing fails
        }
      }
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.error(error.message || "Failed to save activity package draft");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (data: ActivityPackageFormData) => {
    try {
      console.log("🚀 Publishing activity package:", data);
      setLoading(true);
      
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Transform form data to database format with published status
      const dbData = formDataToDatabase(data, user.id, 'published');
      
      let savedPackageId = packageId;
      
      // Check if we're editing an existing package or creating a new one
      if (packageId) {
        // Update existing package
        const { data: packageResult, error: packageError } = await updateActivityPackage(packageId, dbData);
        
        if (packageError) {
          console.error('Package update error:', packageError);
          throw packageError;
        }
        
        console.log('✅ Package updated and published:', packageResult);
        toast.success("Activity package updated and published successfully!");
      } else {
        // Create new package
        const { data: packageResult, error: packageError } = await createActivityPackage(dbData, user.id);
        
        if (packageError) {
          console.error('Package creation error:', packageError);
          throw packageError;
        }
        
        savedPackageId = packageResult?.id || null;
        console.log('✅ Package published:', packageResult);
        toast.success("Activity package published successfully!");
      }
      
      // Save pricing packages if they exist
      if (savedPackageId && data.pricingOptions && Array.isArray(data.pricingOptions)) {
        try {
          console.log('💾 Saving pricing options for package:', savedPackageId);
          const { savePricingPackages, convertSimpleToPricingPackage } = await import('@/lib/supabase/activity-pricing-simple');
          // Convert simple pricing options to full format
          const fullPricingPackages = data.pricingOptions.map((opt: any, index: number) => 
            convertSimpleToPricingPackage(opt, index)
          );
          await savePricingPackages(savedPackageId, fullPricingPackages);
          console.log('✅ Pricing options saved successfully');
        } catch (pricingError) {
          console.error('❌ Error saving pricing packages:', pricingError);
        }
      }
      
      // Redirect after a short delay to ensure toast is visible
      setTimeout(() => {
        router.push("/operator/packages");
      }, 1500);
    } catch (error: any) {
      console.error("Publish failed:", error);
      toast.error(error.message || "Failed to publish activity package");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (data: ActivityPackageFormData) => {
    console.log("Previewing activity package:", data);
    toast.info("Preview functionality coming soon!");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ActivityPackageForm
          onSave={handleSave}
          onPublish={handlePublish}
          onPreview={handlePreview}
          mode={mode}
          packageId={packageId || undefined}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        />
      </div>
    </div>
  );
}
