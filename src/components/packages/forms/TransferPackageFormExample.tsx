"use client";

import React from "react";
import { TransferPackageForm } from "./TransferPackageForm";
import { TransferPackageFormData } from "@/lib/types/transfer-package";

/**
 * Example usage of the TransferPackageForm component
 * This demonstrates how to integrate the form into your application
 */
export const TransferPackageFormExample: React.FC = () => {
  const handleSave = async (data: TransferPackageFormData) => {
    console.log("Saving transfer package draft:", data);
    // Implement your save logic here
    // Example: await saveToSupabase(data, 'DRAFT');
  };

  const handlePublish = async (data: TransferPackageFormData) => {
    console.log("Publishing transfer package:", data);
    // Implement your publish logic here
    // Example: await saveToSupabase(data, 'PUBLISHED');
  };

  const handlePreview = (data: TransferPackageFormData) => {
    console.log("Previewing transfer package:", data);
    // Implement your preview logic here
    // Example: openPreviewModal(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
};

export default TransferPackageFormExample;
