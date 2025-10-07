"use client";

import React from "react";
import { TransferPackageForm } from "@/components/packages/forms/TransferPackageForm";
import { TransferPackageFormData } from "@/lib/types/transfer-package";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CreateTransferPackagePage() {
  const router = useRouter();

  const handleSave = async (data: TransferPackageFormData) => {
    try {
      console.log("Saving transfer package draft:", data);
      
      // TODO: Implement Supabase save logic
      // const supabase = createClient();
      // const { error } = await supabase
      //   .from('packages')
      //   .insert({
      //     ...data,
      //     type: 'TRANSFER_PACKAGE',
      //     status: 'DRAFT',
      //     created_at: new Date().toISOString(),
      //   });
      
      // if (error) throw error;
      
      toast.success("Transfer package draft saved successfully!");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save transfer package draft");
    }
  };

  const handlePublish = async (data: TransferPackageFormData) => {
    try {
      console.log("Publishing transfer package:", data);
      
      // TODO: Implement Supabase publish logic
      // const supabase = createClient();
      // const { error } = await supabase
      //   .from('packages')
      //   .insert({
      //     ...data,
      //     type: 'TRANSFER_PACKAGE',
      //     status: 'ACTIVE',
      //     published_at: new Date().toISOString(),
      //   });
      
      // if (error) throw error;
      
      toast.success("Transfer package published successfully!");
      router.push("/operator/packages");
    } catch (error) {
      console.error("Publish failed:", error);
      toast.error("Failed to publish transfer package");
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
