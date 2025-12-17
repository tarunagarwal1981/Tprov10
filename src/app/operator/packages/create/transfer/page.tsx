"use client";

import React, { useState, useEffect } from "react";
import { TransferPackageForm } from "@/components/packages/forms/TransferPackageForm";
import { TransferPackageFormData } from "@/lib/types/transfer-package";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/CognitoAuthContext";
import { formDataToDatabase, createTransferPackage, updateTransferPackage, getTransferPackage, databaseToFormData } from "@/lib/api/transfer-packages";

export default function CreateTransferPackagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const urlPackageId = searchParams.get('id');
  const isViewMode = searchParams.get('view') === 'true';
  
  // Use state to track packageId so it updates after redirect
  const [packageId, setPackageId] = useState<string | null>(urlPackageId);
  const [loading, setLoading] = useState(!!urlPackageId);
  const [initialData, setInitialData] = useState<TransferPackageFormData | undefined>(undefined);
  
  // Update packageId when URL changes
  useEffect(() => {
    if (urlPackageId !== packageId) {
      setPackageId(urlPackageId);
    }
  }, [urlPackageId, packageId]);
  
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
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Transform form data to database format
      const dbData = formDataToDatabase(data, user.id);
      
      // Set status to draft
      dbData.package.status = 'draft';
      
      // Get current packageId from URL (read fresh each time to handle redirects)
      const currentPackageId = searchParams.get('id');
      
      // Check if we're editing an existing package or creating a new one
      if (currentPackageId) {
        // Update existing package
        const { data: packageResult, error: packageError } = await updateTransferPackage(currentPackageId, dbData);
        
        if (packageError) {
          console.error('Package update error:', packageError);
          throw packageError;
        }
        
        console.log('✅ Package updated with all relations:', packageResult);
        toast.success("Transfer package draft updated successfully!");
      } else {
        // Create new package
        const { data: packageResult, error: packageError } = await createTransferPackage(dbData, user.id);
        
        if (packageError) {
          console.error('Package insert error:', packageError);
          throw packageError;
        }
        
        console.log('✅ Package saved with all relations:', packageResult);
        toast.success("Transfer package draft saved successfully!");

        // After first save, redirect to edit mode for this package
        // so subsequent saves update instead of creating new records.
        const newId = packageResult?.id;
        if (newId) {
          // Update state immediately so next save knows we're editing
          setPackageId(newId);
          // Use replace to avoid adding to history
          // Use window.location to ensure a full page reload and proper state update
          window.location.href = `/operator/packages/create/transfer?id=${newId}`;
        }
      }
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.error(error.message || "Failed to save transfer package draft");
    }
  };

  const handlePublish = async (data: TransferPackageFormData) => {
    try {
      console.log("Publishing transfer package:", data);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Transform form data to database format
      const dbData = formDataToDatabase(data, user.id);
      
      // Set status to published
      dbData.package.status = 'published';
      dbData.package.published_at = new Date().toISOString();
      
      let packageResult;
      let packageError;
      
      // Get current packageId from URL (read fresh each time)
      const currentPackageId = searchParams.get('id');
      
      // Check if we're editing an existing package or creating a new one
      if (currentPackageId) {
        // Update existing package
        const result = await updateTransferPackage(currentPackageId, dbData);
        packageResult = result.data;
        packageError = result.error;
        
        if (packageError) {
          console.error('Package update error:', packageError);
          throw packageError;
        }
        
        console.log('✅ Package updated and published with all relations:', {
          package: packageResult,
          images: packageResult?.images?.length || 0,
          vehicles: packageResult?.vehicles?.length || 0,
          vehicleImages: packageResult?.vehicles?.reduce((sum, v) => sum + (v.vehicle_images?.length || 0), 0) || 0,
          hourlyPricing: packageResult?.hourly_pricing?.length || 0,
          pointToPointPricing: packageResult?.point_to_point_pricing?.length || 0,
        });
        
        toast.success("Transfer package updated and published successfully!");
      } else {
        // Create new package
        // This handles:
        // - Main package insertion
        // - Package images upload & insertion
        // - Vehicles insertion
        // - Vehicle images upload & insertion (to transfer-packages/vehicles/)
        // - Stops insertion
        // - Additional services insertion
        // - Hourly pricing options insertion
        // - Point-to-point pricing options insertion
        const result = await createTransferPackage(dbData, user.id);
        packageResult = result.data;
        packageError = result.error;
        
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
      }
      
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
