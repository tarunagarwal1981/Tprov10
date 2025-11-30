"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FixedDepartureFlightPackageForm from "@/components/packages/forms/FixedDepartureFlightPackageForm";
import { MultiCityPackageFormData } from "@/components/packages/forms/FixedDepartureFlightPackageForm";
import { useAuth } from "@/context/CognitoAuthContext";

export default function FixedDepartureFlightPackagePage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleSave = async (data: MultiCityPackageFormData) => {
    try {
      console.log("[FixedDepartureFlight] Save draft:", data);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/operator/packages/fixed-departure-flight/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: user.id,
          isDraft: true,
          ...data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save package');
      }

      const result = await response.json();
      console.log('✅ Fixed departure flight package saved:', result);
      toast.success(result.message || "Fixed departure flight package draft saved successfully!");
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.error(error.message || "Failed to save fixed departure flight package draft");
    }
  };

  const handlePublish = async (data: MultiCityPackageFormData) => {
    try {
      console.log("[FixedDepartureFlight] Publish:", data);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/operator/packages/fixed-departure-flight/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: user.id,
          isDraft: false,
          ...data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish package');
      }

      const result = await response.json();
      console.log('✅ Fixed departure flight package published:', result);
      toast.success(result.message || "Fixed departure flight package published successfully!");
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/operator/packages");
      }, 1000);
    } catch (error: any) {
      console.error("Publish failed:", error);
      toast.error(error.message || "Failed to publish fixed departure flight package");
    }
  };

  const handlePreview = (data: MultiCityPackageFormData) => {
    console.log("[FixedDepartureFlight] Preview:", data);
    toast.info("Preview functionality coming soon!");
  };

  return <FixedDepartureFlightPackageForm onSave={handleSave} onPublish={handlePublish} onPreview={handlePreview} />;
}
