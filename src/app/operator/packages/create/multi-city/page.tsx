"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import MultiCityPackageForm from "@/components/packages/forms/MultiCityPackageForm";
import { MultiCityPackageFormData } from "@/components/packages/forms/MultiCityPackageForm";
import { useAuth } from "@/context/CognitoAuthContext";

export default function MultiCityPackagePage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleSave = async (data: MultiCityPackageFormData) => {
    try {
      console.log("[MultiCity] Save draft:", data);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/operator/packages/multi-city/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          operatorId: user.id,
          isDraft: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save package');
      }

      const result = await response.json();
      console.log('✅ Multi-city package saved:', result);
      toast.success(result.message || "Multi-city package draft saved successfully!");
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.error(error.message || "Failed to save multi-city package draft");
    }
  };

  const handlePublish = async (data: MultiCityPackageFormData) => {
    try {
      console.log("[MultiCity] Publish started:", data);
      console.log("[MultiCity] Data structure:", {
        cities: data.cities?.length || 0,
        days: data.days?.length || 0,
        pricingType: data.pricing.pricingType,
        pricingRows: data.pricing.pricingRows?.length || 0,
        privatePackageRows: data.pricing.privatePackageRows?.length || 0,
      });
      
      if (!user?.id) {
        console.error("[MultiCity] User not authenticated");
        throw new Error('User not authenticated');
      }
      console.log("[MultiCity] User authenticated:", user.id);

      // Base price: use first pricing row's total price for SIC or PRIVATE_PACKAGE
      const basePrice = (data.pricing.pricingType === 'SIC' && data.pricing.pricingRows.length > 0)
        ? (data.pricing.pricingRows[0]?.totalPrice || 0)
        : (data.pricing.pricingType === 'PRIVATE_PACKAGE' && data.pricing.privatePackageRows.length > 0)
        ? (data.pricing.privatePackageRows[0]?.totalPrice || 0)
        : 0;

      // Transform and insert main package
      const packageData = {
        operator_id: user.id,
        title: data.basic.title,
        short_description: data.basic.shortDescription,
        destination_region: data.basic.destinationRegion || null,
        package_validity_date: data.basic.packageValidityDate || null,
        base_price: basePrice,
        currency: 'USD',
        deposit_percent: data.policies.depositPercent || 0,
        balance_due_days: data.policies.balanceDueDays || 7,
        payment_methods: data.policies.paymentMethods || [],
        visa_requirements: data.policies.visaRequirements || null,
        insurance_requirement: data.policies.insuranceRequirement || 'OPTIONAL',
        health_requirements: data.policies.healthRequirements || null,
        terms_and_conditions: data.policies.terms || null,
        status: 'published' as const,
        published_at: new Date().toISOString(),
      };
      
      console.log("[MultiCity] Publishing package...");
      
      const response = await fetch('/api/operator/packages/multi-city/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          operatorId: user.id,
          isDraft: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish package');
      }

      const result = await response.json();
      console.log('[MultiCity] ✅ Package published successfully!', result);
      toast.success(result.message || "Multi-city package published successfully!");
      
      // Redirect after a short delay
      setTimeout(() => {
        console.log("[MultiCity] Redirecting to packages page...");
        router.push("/operator/packages");
      }, 1000);
    } catch (error: any) {
      console.error("[MultiCity] ❌ Publish failed:", error);
      console.error("[MultiCity] Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        error: error
      });
      toast.error(error.message || "Failed to publish multi-city package");
    }
  };

  const handlePreview = (data: MultiCityPackageFormData) => {
    console.log("[MultiCity] Preview:", data);
    toast.info("Preview functionality coming soon!");
  };

  return <MultiCityPackageForm onSave={handleSave} onPublish={handlePublish} onPreview={handlePreview} />;
}
