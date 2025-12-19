"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import MultiCityPackageForm, { MultiCityPackageFormData } from "@/components/packages/forms/MultiCityPackageForm";
import { useAuth } from "@/context/CognitoAuthContext";

export default function MultiCityPackagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const urlPackageId = searchParams.get("id");
  const isViewMode = searchParams.get("view") === "true";

  const [currentPackageId, setCurrentPackageId] = useState<string | null>(urlPackageId);
  const [initialData, setInitialData] = useState<MultiCityPackageFormData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(!!urlPackageId);

  // Load existing package when editing or viewing
  useEffect(() => {
    const loadPackage = async () => {
      if (!urlPackageId) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/packages/${urlPackageId}/details?type=multi_city`);
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || "Failed to load package details");
        }
        const { package: pkg } = await response.json();

        if (!pkg) {
          throw new Error("Package not found");
        }

        // Map API shape to form shape
        const mapped: MultiCityPackageFormData = {
          basic: {
            title: pkg.title || "",
            shortDescription: pkg.short_description || "",
            destinationRegion: pkg.destination_region || "",
            packageValidityDate: pkg.package_validity_date || "",
            imageGallery: (pkg.images || []).map((img: any) => img.public_url).filter((u: string | null) => !!u),
          },
          cities: (pkg.cities || []).map((c: any, index: number) => ({
            id: c.id || String(index + 1),
            name: c.name || "",
            country: c.country || "",
            nights: c.nights || 1,
            highlights: c.highlights || [],
            activitiesIncluded: c.activities_included || [],
            expanded: true,
          })),
          connections: [], // not modeled yet
          days: (pkg.day_plans || []).map((d: any) => {
            // Helper function to migrate old format to new format when loading
            const migrateTimeSlotsForLoad = (timeSlots: any) => {
              if (!timeSlots) {
                return {
                  morning: { time: "08:00", title: "", activityDescription: "", transfer: "" },
                  afternoon: { time: "12:30", title: "", activityDescription: "", transfer: "" },
                  evening: { time: "17:00", title: "", activityDescription: "", transfer: "" },
                };
              }
              
              const slots: ('morning' | 'afternoon' | 'evening')[] = ['morning', 'afternoon', 'evening'];
              const defaultTimes: { morning: string; afternoon: string; evening: string } = { morning: '08:00', afternoon: '12:30', evening: '17:00' };
              
              const migrated: any = {};
              slots.forEach(slot => {
                const oldSlot = timeSlots[slot] || {};
                if (oldSlot.activities || oldSlot.transfers) {
                  // Old format - migrate
                  migrated[slot] = {
                    time: oldSlot.time || defaultTimes[slot],
                    title: '',
                    activityDescription: Array.isArray(oldSlot.activities) ? oldSlot.activities.join('. ') : '',
                    transfer: Array.isArray(oldSlot.transfers) ? oldSlot.transfers.join('. ') : '',
                  };
                } else {
                  // New format
                  migrated[slot] = {
                    time: oldSlot.time || defaultTimes[slot],
                    title: oldSlot.title || '',
                    activityDescription: oldSlot.activityDescription || '',
                    transfer: oldSlot.transfer || '',
                  };
                }
              });
              return migrated;
            };

            return {
              cityId: d.city_id || "",
              cityName: d.city_name || "",
              title: d.title || "",
              description: d.description || "",
              photoUrl: d.photo_url || "",
              hasFlights: d.has_flights || false,
              flights: [], // flights not stored for plain multi-city
              timeSlots: migrateTimeSlotsForLoad(d.time_slots),
            };
          }),
          inclusions: (pkg.inclusions || []).map((inc: any) => ({
            id: inc.id,
            // RDS uses category text field
            category: inc.category,
            text: inc.text ?? inc.description,
          })),
          exclusions: (pkg.exclusions || []).map((exc: any) => ({
            id: exc.id,
            text: exc.text ?? exc.description,
          })),
          pricing: {
            pricingType:
              pkg.pricing_package?.pricing_type === "PRIVATE_PACKAGE"
                ? "PRIVATE_PACKAGE"
                : "SIC",
            pricingRows: (pkg.sic_pricing_rows || []).map((row: any) => ({
              id: row.id,
              numberOfAdults: row.number_of_adults,
              numberOfChildren: row.number_of_children,
              totalPrice: Number(row.total_price) || 0,
            })),
            privatePackageRows: (pkg.private_package_rows || []).map((row: any) => ({
              id: row.id,
              numberOfAdults: row.number_of_adults,
              numberOfChildren: row.number_of_children,
              carType: row.car_type,
              vehicleCapacity: row.vehicle_capacity,
              totalPrice: Number(row.total_price) || 0,
            })),
            hasChildAgeRestriction: pkg.pricing_package?.has_child_age_restriction || false,
            childMinAge: pkg.pricing_package?.child_min_age ?? undefined,
            childMaxAge: pkg.pricing_package?.child_max_age ?? undefined,
          },
          policies: {
            cancellation: (pkg.cancellation_tiers || []).map((tier: any) => ({
              id: tier.id,
              daysBefore: tier.days_before,
              refundPercent: tier.refund_percent,
            })),
            depositPercent: pkg.deposit_percent ?? undefined,
            balanceDueDays: pkg.balance_due_days ?? undefined,
            paymentMethods: pkg.payment_methods || [],
            visaRequirements: pkg.visa_requirements || "",
            insuranceRequirement: pkg.insurance_requirement || "OPTIONAL",
            healthRequirements: pkg.health_requirements || "",
            terms: pkg.terms_and_conditions || "",
          },
        };

        setInitialData(mapped);
        setCurrentPackageId(pkg.id);
        toast.success(isViewMode ? "Multi-city package loaded" : "Multi-city package loaded for editing");
      } catch (error: any) {
        console.error("Failed to load multi-city package details:", error);
        toast.error(error.message || "Failed to load package");
        router.push("/operator/packages");
      } finally {
        setLoading(false);
      }
    };

    loadPackage();
  }, [urlPackageId, isViewMode, router]);

  const handleSave = async (data: MultiCityPackageFormData) => {
    try {
      console.log("[MultiCity] Save draft:", data);

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const isEdit = !!currentPackageId;
      const endpoint = isEdit
        ? "/api/operator/packages/multi-city/update"
        : "/api/operator/packages/multi-city/create";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          operatorId: user.id,
          packageId: currentPackageId,
          isDraft: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.details || "Failed to save package");
      }

      const result = await response.json();
      console.log("✅ Multi-city package saved:", result);

      if (!currentPackageId && result.packageId) {
        setCurrentPackageId(result.packageId);
        // Update URL without navigation so future saves update instead of create
        const newUrl = `/operator/packages/create/multi-city?id=${result.packageId}`;
        window.history.replaceState({}, "", newUrl);
      }

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
        throw new Error("User not authenticated");
      }

      const isEdit = !!currentPackageId;
      const endpoint = isEdit
        ? "/api/operator/packages/multi-city/update"
        : "/api/operator/packages/multi-city/create";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          operatorId: user.id,
          packageId: currentPackageId,
          isDraft: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("[MultiCity] API Error Response:", error);
        const errorMessage = error.details || error.error || "Failed to publish package";
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("[MultiCity] ✅ Package published successfully!", result);

      if (!currentPackageId && result.packageId) {
        setCurrentPackageId(result.packageId);
      }

      toast.success(result.message || "Multi-city package published successfully!");

      // Redirect after a short delay
      setTimeout(() => {
        console.log("[MultiCity] Redirecting to packages page...");
        router.push("/operator/packages");
      }, 1000);
    } catch (error: any) {
      console.error("[MultiCity] ❌ Publish failed:", error);
      console.error("[MultiCity] Error details:", error);
      const errorMessage = error.details || error.message || "Failed to publish multi-city package";
      toast.error(errorMessage);
    }
  };

  const handlePreview = (data: MultiCityPackageFormData) => {
    console.log("[MultiCity] Preview:", data);
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
    <MultiCityPackageForm
      initialData={initialData}
      onSave={handleSave}
      onPublish={handlePublish}
      onPreview={handlePreview}
    />
  );
}

