"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import FixedDepartureFlightPackageForm, { MultiCityPackageFormData } from "@/components/packages/forms/FixedDepartureFlightPackageForm";
import { useAuth } from "@/context/CognitoAuthContext";

export default function FixedDepartureFlightPackagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const urlPackageId = searchParams.get("id");
  const isViewMode = searchParams.get("view") === "true";

  const [currentPackageId, setCurrentPackageId] = useState<string | null>(urlPackageId);
  const [initialData, setInitialData] = useState<MultiCityPackageFormData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(!!urlPackageId);

  // NOTE: There is no dedicated fixed-departure-flight details API yet.
  // We keep the existing behaviour (blank form on edit) to avoid breaking flows.
  // The ID tracking below still prevents duplicate drafts when saving repeatedly.
  useEffect(() => {
    if (!urlPackageId) {
      setLoading(false);
      return;
    }
    // In future, implement a /details endpoint similar to multi-city and map into initialData.
    setLoading(false);
  }, [urlPackageId]);

  const handleSave = async (data: MultiCityPackageFormData) => {
    try {
      console.log("[FixedDepartureFlight] Save draft:", data);

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const isEdit = !!currentPackageId;
      const endpoint = isEdit
        ? "/api/operator/packages/fixed-departure-flight/update"
        : "/api/operator/packages/fixed-departure-flight/create";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId: user.id,
          packageId: currentPackageId,
          isDraft: true,
          ...data,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.details || "Failed to save package");
      }

      const result = await response.json();

      if (!currentPackageId && result.packageId) {
        setCurrentPackageId(result.packageId);
        const newUrl = `/operator/packages/create/fixed-departure-flight?id=${result.packageId}`;
        window.history.replaceState({}, "", newUrl);
      }

      console.log("✅ Fixed departure flight package saved:", result);
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
        throw new Error("User not authenticated");
      }

      const isEdit = !!currentPackageId;
      const endpoint = isEdit
        ? "/api/operator/packages/fixed-departure-flight/update"
        : "/api/operator/packages/fixed-departure-flight/create";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId: user.id,
          packageId: currentPackageId,
          isDraft: false,
          ...data,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.details || "Failed to publish package");
      }

      const result = await response.json();

      if (!currentPackageId && result.packageId) {
        setCurrentPackageId(result.packageId);
      }

      console.log("✅ Fixed departure flight package published:", result);
      toast.success(result.message || "Fixed departure flight package published successfully!");

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading package...</p>
      </div>
    );
  }

  return (
    <FixedDepartureFlightPackageForm
      initialData={initialData}
      onSave={handleSave}
      onPublish={handlePublish}
      onPreview={handlePreview}
    />
  );
}
