"use client";

import React from "react";
import { ActivityPackageForm } from "./ActivityPackageForm";
import { ActivityPackageFormData } from "@/lib/types/activity-package";

/**
 * Example usage of the ActivityPackageForm component
 * This demonstrates how to integrate the form into your application
 */
export const ActivityPackageFormExample: React.FC = () => {
  const handleSave = async (data: ActivityPackageFormData) => {
    console.log("Saving draft:", data);
    // Implement your save logic here
    // Example: await saveToSupabase(data, 'DRAFT');
  };

  const handlePublish = async (data: ActivityPackageFormData) => {
    console.log("Publishing package:", data);
    // Implement your publish logic here
    // Example: await saveToSupabase(data, 'PUBLISHED');
  };

  const handlePreview = (data: ActivityPackageFormData) => {
    console.log("Previewing package:", data);
    // Implement your preview logic here
    // Example: openPreviewModal(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
};

export default ActivityPackageFormExample;
