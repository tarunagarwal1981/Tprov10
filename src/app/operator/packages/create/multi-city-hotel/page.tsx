"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import MultiCityHotelPackageForm, { MultiCityPackageFormData } from "@/components/packages/forms/MultiCityHotelPackageForm";
import { useAuth } from "@/context/CognitoAuthContext";

export default function MultiCityHotelPackagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const urlPackageId = searchParams.get("id");
  const isViewMode = searchParams.get("view") === "true";

  const [currentPackageId, setCurrentPackageId] = useState<string | null>(urlPackageId);
  const [initialData, setInitialData] = useState<MultiCityPackageFormData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(!!urlPackageId);

  useEffect(() => {
    const loadPackage = async () => {
      if (!urlPackageId) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/packages/${urlPackageId}/details?type=multi_city_hotel`);
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || "Failed to load package details");
        }
        const { package: pkg } = await response.json();

        if (!pkg) {
          throw new Error("Package not found");
        }

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
            hotels: (pkg.hotels_by_city?.[c.id] || []).map((h: any) => ({
              id: h.id,
              hotelName: h.hotel_name,
              hotelType: h.hotel_type || undefined,
              roomType: h.room_type,
              roomCapacityAdults: h.room_capacity_adults ?? undefined,
              roomCapacityChildren: h.room_capacity_children ?? undefined,
            })),
          })),
          connections: [],
          days: (() => {
            // Create a map from database city_id to form city.id for proper linking
            const cityIdMap: Record<string, string> = {};
            (pkg.cities || []).forEach((c: any) => {
              if (c.id) {
                cityIdMap[c.id] = c.id; // Map database city_id to form city.id (same value)
              }
            });

            return (pkg.day_plans || []).map((d: any) => {
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

              // Map database city_id to form city.id
              const formCityId = d.city_id ? (cityIdMap[d.city_id] || d.city_id) : "";

              return {
                cityId: formCityId,
                cityName: d.city_name || "",
                title: d.title || "",
                description: d.description || "",
                photoUrl: d.photo_url || "",
                hasFlights: d.has_flights || false,
                flights: [],
                timeSlots: migrateTimeSlotsForLoad(d.time_slots),
              };
            });
          })(),
          inclusions: (pkg.inclusions || []).map((inc: any) => ({
            id: inc.id,
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

        console.log("[MultiCityHotel] Loaded package data:", {
          cities: mapped.cities?.length || 0,
          days: mapped.days?.length || 0,
          pricingType: mapped.pricing?.pricingType,
          pricingRows: mapped.pricing?.pricingRows?.length || 0,
        });
        setInitialData(mapped);
        setCurrentPackageId(pkg.id);
        toast.success(isViewMode ? "Multi-city hotel package loaded" : "Multi-city hotel package loaded for editing");
      } catch (error: any) {
        console.error("Failed to load multi-city hotel package details:", error);
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
      console.log("[MultiCityHotel] Save draft:", {
        cities: data.cities?.length || 0,
        days: data.days?.length || 0,
        pricingType: data.pricing?.pricingType,
        pricingRows: data.pricing?.pricingRows?.length || 0,
        privatePackageRows: data.pricing?.privatePackageRows?.length || 0,
      });
      console.log("[MultiCityHotel] Cities data:", data.cities);
      console.log("[MultiCityHotel] Days data:", data.days);
      if (data.days && data.days.length > 0 && data.days[0]) {
        console.log("[MultiCityHotel] First day sample:", {
          title: data.days[0].title,
          description: data.days[0].description,
          timeSlots: data.days[0].timeSlots,
        });
      }
      console.log("[MultiCityHotel] Pricing data:", data.pricing);

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const isEdit = !!currentPackageId;
      const endpoint = isEdit
        ? "/api/operator/packages/multi-city-hotel/update"
        : "/api/operator/packages/multi-city-hotel/create";

      const payload = {
        ...data,
        operatorId: user.id,
        packageId: currentPackageId,
        isDraft: true,
      };

      console.log("[MultiCityHotel] Sending payload to", endpoint, ":", {
        cities: payload.cities?.length || 0,
        days: payload.days?.length || 0,
        pricingType: payload.pricing?.pricingType,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.details || "Failed to save package");
      }

      const result = await response.json();

      if (!currentPackageId && result.packageId) {
        setCurrentPackageId(result.packageId);
        const newUrl = `/operator/packages/create/multi-city-hotel?id=${result.packageId}`;
        window.history.replaceState({}, "", newUrl);
      }

      console.log("✅ Multi-city hotel package saved:", result);
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
        throw new Error("User not authenticated");
      }

      const isEdit = !!currentPackageId;
      const endpoint = isEdit
        ? "/api/operator/packages/multi-city-hotel/update"
        : "/api/operator/packages/multi-city-hotel/create";

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

      console.log("✅ Multi-city hotel package published:", result);
      toast.success(result.message || "Multi-city hotel package published successfully!");

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading package...</p>
      </div>
    );
  }

  return (
    <MultiCityHotelPackageForm
      initialData={initialData}
      onSave={handleSave}
      onPublish={handlePublish}
      onPreview={handlePreview}
    />
  );
}
