"use client";

import React from "react";
import { TransferPackageForm } from "@/components/packages/forms/TransferPackageForm";
import { TransferPackageFormData } from "@/lib/types/transfer-package";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formDataToDatabase } from "@/lib/supabase/transfer-packages";

export default function CreateTransferPackagePage() {
  const router = useRouter();

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
      
      // Insert main package
      const { data: packageResult, error: packageError } = await supabase
        .from('transfer_packages')
        .insert(dbData.package)
        .select()
        .single();
      
      if (packageError) {
        console.error('Package insert error:', packageError);
        throw packageError;
      }
      
      console.log('✅ Package saved:', packageResult);
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
      
      // Insert main package
      const { data: packageResult, error: packageError } = await supabase
        .from('transfer_packages')
        .insert(dbData.package)
        .select()
        .single();
      
      if (packageError) {
        console.error('Package insert error:', packageError);
        throw packageError;
      }

      const packageId = packageResult.id;

      // Insert vehicles if any
      if (dbData.vehicles && dbData.vehicles.length > 0) {
        const vehiclesWithPackageId = dbData.vehicles.map(v => ({
          ...v,
          package_id: packageId,
        }));
        
        const { error: vehiclesError } = await supabase
          .from('transfer_package_vehicles')
          .insert(vehiclesWithPackageId);
        
        if (vehiclesError) {
          console.error('Vehicles insert error:', vehiclesError);
        }
      }

      // Insert stops if any
      if (dbData.stops && dbData.stops.length > 0) {
        const stopsWithPackageId = dbData.stops.map(s => ({
          ...s,
          package_id: packageId,
        }));
        
        const { error: stopsError } = await supabase
          .from('transfer_package_stops')
          .insert(stopsWithPackageId);
        
        if (stopsError) {
          console.error('Stops insert error:', stopsError);
        }
      }

      // Insert additional services if any
      if (dbData.additional_services && dbData.additional_services.length > 0) {
        const servicesWithPackageId = dbData.additional_services.map(s => ({
          ...s,
          package_id: packageId,
        }));
        
        const { error: servicesError } = await supabase
          .from('transfer_additional_services')
          .insert(servicesWithPackageId);
        
        if (servicesError) {
          console.error('Services insert error:', servicesError);
        }
      }
      
      console.log('✅ Package published:', packageResult);
      toast.success("Transfer package published successfully!");
      
      // Redirect after a short delay to ensure toast is visible
      setTimeout(() => {
        router.push("/operator/packages");
      }, 1000);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TransferPackageForm
          onSave={handleSave}
          onPublish={handlePublish}
          onPreview={handlePreview}
          mode="create"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        />
      </div>
    </div>
  );
}
