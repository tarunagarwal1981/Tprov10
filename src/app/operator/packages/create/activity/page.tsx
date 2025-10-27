"use client";

import React from "react";
import { ActivityPackageForm } from "@/components/packages/forms/ActivityPackageForm";
import { ActivityPackageFormData } from "@/lib/types/activity-package";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function CreateActivityPackagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get package ID from URL params for edit mode
  const packageId = searchParams.get('id');
  const isViewMode = searchParams.get('view') === 'true';
  
  // Determine mode based on URL params
  const mode = packageId ? 'edit' : 'create';

  const handleSave = async (data: ActivityPackageFormData) => {
    // Note: The actual save logic is handled by useActivityPackage hook
    // This is just for any additional logic needed at the page level
    console.log("Save handler called at page level");
  };

  const handlePublish = async (data: ActivityPackageFormData) => {
    // Note: The actual publish logic is handled by the form's handlePublish
    // This is just for post-publish actions
    try {
      console.log("✅ Package published, redirecting...");
      toast.success("Activity package published successfully!");
      
      // Redirect to packages list after publish
      setTimeout(() => {
        router.push("/operator/packages");
      }, 1500);
    } catch (error) {
      console.error("Publish failed:", error);
      toast.error("Failed to publish activity package");
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
