"use client";

import React, { useState, useEffect } from "react";
import { TransferPackageForm } from "@/components/packages/forms/TransferPackageForm";
import { TransferPackageFormData } from "@/lib/types/transfer-package";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formDataToDatabase, createTransferPackage, getTransferPackage, databaseToFormData } from "@/lib/supabase/transfer-packages";
import { TransferPackageInsert } from "@/lib/supabase/types";

export default function CreateTransferPackagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('id');
  const isViewMode = searchParams.get('view') === 'true';
  
  const [loading, setLoading] = useState(!!packageId);
  const [initialData, setInitialData] = useState<TransferPackageFormData | undefined>(undefined);
  
  // Load existing package if ID is provided
  useEffect(() => {
    if (!packageId) return;
    
    const loadPackage = async () => {
      try {
        console.log('📦 Loading transfer package:', packageId);
        const { data, error } = await getTransferPackage(packageId);
        
        if (error) {
          console.error('Error loading package:', error);
          toast.error('Failed to load package');
          router.push('/operator/packages');
          return;
        }
        
        if (data) {
          console.log('✅ Package loaded:', data);
          const formData = databaseToFormData(data);
          console.log('✅ Form data converted:', formData);
          setInitialData(formData);
          toast.success(isViewMode ? 'Package loaded for viewing' : 'Package loaded for editing');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load package');
      } finally {
        setLoading(false);
      }
    };
    
    loadPackage();
  }, [packageId, isViewMode, router]);

  const handleSave = async (data: TransferPackageFormData) => {
    try {
      console.log("Saving transfer package draft:", data);
      
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Transform form data to database format
      const dbData = formDataToDatabase(data, user.id);
      
      // Set status to draft
      dbData.package.status = 'draft';
      
      // Use the comprehensive service function to create package with all relations
      const { data: packageResult, error: packageError } = await createTransferPackage(dbData, user.id);
      
      if (packageError) {
        console.error('Package insert error:', packageError);
        throw packageError;
      }
      
      console.log('✅ Package saved with all relations:', packageResult);
      toast.success("Transfer package draft saved successfully!");
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.error(error.message || "Failed to save transfer package draft");
    }
  };

  const handlePublish = async (data: TransferPackageFormData) => {
    try {
      console.log("Publishing transfer package:", data);
      
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Transform form data to database format
      const dbData = formDataToDatabase(data, user.id);
      
      // Set status to published
      dbData.package.status = 'published';
      dbData.package.published_at = new Date().toISOString();
      
      // Use the comprehensive service function to create package with all relations
      // This handles:
      // - Main package insertion
      // - Package images upload & insertion
      // - Vehicles insertion
      // - Vehicle images upload & insertion (to transfer-packages/vehicles/)
      // - Stops insertion
      // - Additional services insertion
      // - Hourly pricing options insertion
      // - Point-to-point pricing options insertion
      const { data: packageResult, error: packageError } = await createTransferPackage(dbData, user.id);
      
      if (packageError) {
        console.error('Package creation error:', packageError);
        throw packageError;
      }
      
      console.log('✅ Package published with all relations:', {
        package: packageResult,
        images: packageResult?.images?.length || 0,
        vehicles: packageResult?.vehicles?.length || 0,
        vehicleImages: packageResult?.vehicles?.reduce((sum, v) => sum + (v.vehicle_images?.length || 0), 0) || 0,
        hourlyPricing: packageResult?.hourly_pricing?.length || 0,
        pointToPointPricing: packageResult?.point_to_point_pricing?.length || 0,
      });
      
      toast.success("Transfer package published successfully! All data, images, and pricing saved.");
      
      // Redirect after a short delay to ensure toast is visible
      setTimeout(() => {
        router.push("/operator/packages");
      }, 1500);
    } catch (error: any) {
      console.error("Publish failed:", error);
      toast.error(error.message || "Failed to publish transfer package");
    }
  };

  const handlePreview = (data: TransferPackageFormData) => {
    console.log("Previewing transfer package:", data);
    // TODO: Open preview modal or navigate to preview page
    toast.info("Preview functionality coming soon!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading package...</p>
        </div>
      </div>
    );
  }

  // Mode: create for new, edit for existing (view mode will disable fields in future)
  const mode = packageId ? 'edit' : 'create';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!packageId || initialData ? (
          <TransferPackageForm
            onSave={handleSave}
            onPublish={handlePublish}
            onPreview={handlePreview}
            mode={mode}
            initialData={initialData}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Package not found or failed to load.
            </p>
            <button
              onClick={() => router.push('/operator/packages')}
              className="mt-4 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#E05A2A]"
            >
              Back to Packages
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
