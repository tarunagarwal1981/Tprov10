"use client";

import React from "react";
import { ActivityPackageForm } from "@/components/packages/forms/ActivityPackageForm";
import { ActivityPackageFormData } from "@/lib/types/activity-package";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CreateActivityPackagePage() {
  const router = useRouter();

  const handleSave = async (data: ActivityPackageFormData) => {
    try {
      console.log("Saving activity package draft:", data);
      
      // TODO: Implement Supabase save logic
      // const supabase = createClient();
      // const { error } = await supabase
      //   .from('packages')
      //   .insert({
      //     ...data,
      //     type: 'ACTIVITY_PACKAGE',
      //     status: 'DRAFT',
      //     created_at: new Date().toISOString(),
      //   });
      
      // if (error) throw error;
      
      toast.success("Activity package draft saved successfully!");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save activity package draft");
    }
  };

  const handlePublish = async (data: ActivityPackageFormData) => {
    try {
      console.log("Publishing activity package:", data);
      
      // TODO: Implement Supabase publish logic
      // const supabase = createClient();
      // const { error } = await supabase
      //   .from('packages')
      //   .insert({
      //     ...data,
      //     type: 'ACTIVITY_PACKAGE',
      //     status: 'ACTIVE',
      //     published_at: new Date().toISOString(),
      //   });
      
      // if (error) throw error;
      
      toast.success("Activity package published successfully!");
      router.push("/operator/packages");
    } catch (error) {
      console.error("Publish failed:", error);
      toast.error("Failed to publish activity package");
    }
  };

  const handlePreview = (data: ActivityPackageFormData) => {
    console.log("Previewing activity package:", data);
    // TODO: Open preview modal or navigate to preview page
    toast.info("Preview functionality coming soon!");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ActivityPackageForm
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
