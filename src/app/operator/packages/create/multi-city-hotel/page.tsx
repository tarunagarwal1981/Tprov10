"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import MultiCityHotelPackageForm from "@/components/packages/forms/MultiCityHotelPackageForm";
import { MultiCityPackageFormData } from "@/components/packages/forms/MultiCityHotelPackageForm";
import { useAuth } from "@/context/CognitoAuthContext";

export default function MultiCityHotelPackagePage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleSave = async (data: MultiCityPackageFormData) => {
    try {
      console.log("[MultiCityHotel] Save draft:", data);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/operator/packages/multi-city-hotel/create', {
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
      console.log('✅ Multi-city hotel package saved:', result);
      toast.success(result.message || "Multi-city hotel package draft saved successfully!");
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.error(error.message || "Failed to save multi-city hotel package draft");
    }
  };

  const handlePublish = async (data: MultiCityPackageFormData) => {
    try {
      console.log("[MultiCityHotel] Publish:", data);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/operator/packages/multi-city-hotel/create', {
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
      console.log('✅ Multi-city hotel package published:', result);
      toast.success(result.message || "Multi-city hotel package published successfully!");
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/operator/packages");
      }, 1000);
    } catch (error: any) {
      console.error("Publish failed:", error);
      toast.error(error.message || "Failed to publish multi-city hotel package");
    }
  };

  const handlePreview = (data: MultiCityPackageFormData) => {
    console.log("[MultiCityHotel] Preview:", data);
    toast.info("Preview functionality coming soon!");
  };

  return <MultiCityHotelPackageForm onSave={handleSave} onPublish={handlePublish} onPreview={handlePreview} />;
}
