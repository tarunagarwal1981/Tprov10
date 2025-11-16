"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import MultiCityPackageForm from "@/components/packages/forms/MultiCityPackageForm";
import { MultiCityPackageFormData } from "@/components/packages/forms/MultiCityPackageForm";
import { createClient } from "@/lib/supabase/client";

export default function MultiCityPackagePage() {
  const router = useRouter();

  const handleSave = async (data: MultiCityPackageFormData) => {
    try {
      console.log("[MultiCity] Save draft:", data);
      
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

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
        status: 'draft' as const,
      };
      
      const { data: packageResult, error: packageError } = await supabase
        .from('multi_city_packages')
        .insert(packageData)
        .select()
        .single();
      
      if (packageError) {
        console.error('Package insert error:', packageError);
        throw packageError;
      }
      
      console.log('✅ Multi-city package saved:', packageResult);
      toast.success("Multi-city package draft saved successfully!");
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
      
      const supabase = createClient();
      
      // Get current user
      console.log("[MultiCity] Getting user...");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("[MultiCity] User error:", userError);
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
      
      console.log("[MultiCity] Inserting main package...");
      const { data: packageResult, error: packageError } = await supabase
        .from('multi_city_packages')
        .insert(packageData)
        .select()
        .single();
      
      if (packageError) {
        console.error('[MultiCity] Package insert error:', packageError);
        console.error('[MultiCity] Package data that failed:', packageData);
        throw packageError;
      }

      if (!packageResult || !packageResult.id) {
        console.error('[MultiCity] Package insert returned no result');
        throw new Error('Package insert failed - no result returned');
      }

      const packageId = packageResult.id;
      console.log("[MultiCity] Package created with ID:", packageId);

      // Insert cities FIRST (before day plans) so we can map form city IDs to database city IDs
      console.log("[MultiCity] Inserting cities...");
      let cityIdMap: Record<string, string> = {}; // Maps form city ID -> database city ID
      
      if (data.cities && data.cities.length > 0) {
        console.log("[MultiCity] Cities to insert:", data.cities.length);
        const citiesData = data.cities.map((city, index) => ({
          package_id: packageId,
          name: city.name,
          country: city.country || null,
          nights: city.nights,
          highlights: city.highlights || [],
          activities_included: city.activitiesIncluded || [],
          city_order: index + 1,
        }));
        
        const { data: insertedCities, error: citiesError } = await supabase
          .from('multi_city_package_cities')
          .insert(citiesData)
          .select('id, name');
        
        if (citiesError) {
          console.error('[MultiCity] Cities insert error:', citiesError);
          throw citiesError;
        }

        if (!insertedCities || insertedCities.length === 0) {
          console.error('[MultiCity] Cities insert returned no results');
          throw new Error('Failed to insert cities');
        }

        console.log("[MultiCity] Cities inserted:", insertedCities.length);

        // Create mapping from form city ID to database city ID
        if (insertedCities) {
          data.cities.forEach((formCity, index) => {
            const dbCity = insertedCities[index];
            if (dbCity) {
              cityIdMap[formCity.id] = dbCity.id;
            }
          });
          console.log("[MultiCity] City ID mapping created:", cityIdMap);
        }
      } else {
        console.warn("[MultiCity] No cities to insert!");
      }

      // Insert pricing configuration
      console.log("[MultiCity] Inserting pricing configuration...");
      const pricingData: any = {
        package_id: packageId,
        package_name: data.basic.title, // Use package title as package_name
        pricing_type: data.pricing.pricingType,
        has_child_age_restriction: data.pricing.hasChildAgeRestriction || false,
        child_min_age: data.pricing.hasChildAgeRestriction ? data.pricing.childMinAge : null,
        child_max_age: data.pricing.hasChildAgeRestriction ? data.pricing.childMaxAge : null,
      };
      
      console.log("[MultiCity] Pricing data:", pricingData);
      const { data: pricingResult, error: pricingError } = await (supabase as any)
        .from('multi_city_pricing_packages')
        .insert(pricingData)
        .select()
        .single();
      
      if (pricingError) {
        console.error('[MultiCity] Pricing insert error:', pricingError);
        console.error('[MultiCity] Pricing data that failed:', pricingData);
        throw pricingError;
      }

      if (!pricingResult || !pricingResult.id) {
        console.error('[MultiCity] Pricing insert returned no result');
        throw new Error('Pricing insert failed - no result returned');
      }

      console.log("[MultiCity] Pricing configuration created:", pricingResult.id);

      // Insert pricing rows for SIC pricing type
      if (data.pricing.pricingType === 'SIC' && data.pricing.pricingRows && data.pricing.pricingRows.length > 0) {
        console.log("[MultiCity] Inserting SIC pricing rows:", data.pricing.pricingRows.length);
        const pricingRowsData = data.pricing.pricingRows.map((row, index) => ({
          pricing_package_id: pricingResult.id,
          number_of_adults: row.numberOfAdults,
          number_of_children: row.numberOfChildren,
          total_price: row.totalPrice,
          display_order: index + 1,
        }));
        
        console.log("[MultiCity] SIC pricing rows data:", pricingRowsData);
        const { data: insertedRows, error: pricingRowsError } = await (supabase as any)
          .from('multi_city_pricing_rows')
          .insert(pricingRowsData)
          .select();
        
        if (pricingRowsError) {
          console.error('[MultiCity] Pricing rows insert error:', pricingRowsError);
          console.error('[MultiCity] Pricing rows data that failed:', pricingRowsData);
          throw pricingRowsError; // Throw error instead of silently continuing
        }

        if (!insertedRows || insertedRows.length === 0) {
          console.error('[MultiCity] Pricing rows insert returned no results');
          throw new Error('Failed to insert pricing rows');
        }

        console.log("[MultiCity] SIC pricing rows inserted:", insertedRows.length);
      } else {
        console.warn("[MultiCity] No SIC pricing rows to insert:", {
          pricingType: data.pricing.pricingType,
          hasRows: data.pricing.pricingRows?.length > 0,
          rowsCount: data.pricing.pricingRows?.length || 0
        });
      }

      // Insert private package rows for PRIVATE_PACKAGE pricing type
      if (data.pricing.pricingType === 'PRIVATE_PACKAGE' && data.pricing.privatePackageRows && data.pricing.privatePackageRows.length > 0) {
        console.log("[MultiCity] Inserting Private Package pricing rows:", data.pricing.privatePackageRows.length);
        const privatePackageRowsData = data.pricing.privatePackageRows.map((row, index) => ({
          pricing_package_id: pricingResult.id,
          number_of_adults: row.numberOfAdults,
          number_of_children: row.numberOfChildren,
          car_type: row.carType,
          vehicle_capacity: row.vehicleCapacity,
          total_price: row.totalPrice,
          display_order: index + 1,
        }));
        
        console.log("[MultiCity] Private Package pricing rows data:", privatePackageRowsData);
        const { data: insertedPrivateRows, error: privatePackageRowsError } = await (supabase as any)
          .from('multi_city_private_package_rows')
          .insert(privatePackageRowsData)
          .select();
        
        if (privatePackageRowsError) {
          console.error('[MultiCity] Private package rows insert error:', privatePackageRowsError);
          console.error('[MultiCity] Private package rows data that failed:', privatePackageRowsData);
          throw privatePackageRowsError; // Throw error instead of silently continuing
        }

        if (!insertedPrivateRows || insertedPrivateRows.length === 0) {
          console.error('[MultiCity] Private package rows insert returned no results');
          throw new Error('Failed to insert private package rows');
        }

        console.log("[MultiCity] Private Package pricing rows inserted:", insertedPrivateRows.length);
      } else {
        console.warn("[MultiCity] No Private Package pricing rows to insert:", {
          pricingType: data.pricing.pricingType,
          hasRows: data.pricing.privatePackageRows?.length > 0,
          rowsCount: data.pricing.privatePackageRows?.length || 0
        });
      }

      // Insert day plans AFTER cities (so we can use correct database city IDs)
      console.log("[MultiCity] Inserting day plans...");
      if (data.days && data.days.length > 0) {
        console.log("[MultiCity] Days to insert:", data.days.length);
        for (const [dayIndex, day] of data.days.entries()) {
          // Prepare time slots JSON
          const timeSlots = day.timeSlots || {
            morning: { time: "", activities: [], transfers: [] },
            afternoon: { time: "", activities: [], transfers: [] },
            evening: { time: "", activities: [], transfers: [] },
          };

          // Map form city ID to database city ID
          const dbCityId = day.cityId ? cityIdMap[day.cityId] || null : null;

          const dayPlanData = {
            package_id: packageId,
            city_id: dbCityId, // Use database city ID, not form city ID
            day_number: dayIndex + 1,
            city_name: day.cityName || null,
            title: day.title || null,
            description: day.description || null,
            photo_url: day.photoUrl || null,
            has_flights: false,
            time_slots: timeSlots,
          };
          
          const { data: dayResult, error: dayError } = await (supabase as any)
            .from('multi_city_package_day_plans')
            .insert(dayPlanData)
            .select()
            .single();
          
          if (dayError) {
            console.error('[MultiCity] Day plan insert error for day', dayIndex + 1, ':', dayError);
            console.error('[MultiCity] Day plan data that failed:', dayPlanData);
            continue;
          } else {
            console.log("[MultiCity] Day", dayIndex + 1, "inserted successfully");
          }
        }
        console.log("[MultiCity] All day plans processed");
      } else {
        console.warn("[MultiCity] No days to insert!");
      }

      // Insert inclusions
      if (data.inclusions && data.inclusions.length > 0) {
        const inclusionsData = data.inclusions.map((inc, index) => ({
          package_id: packageId,
          category: inc.category,
          text: inc.text,
          display_order: index + 1,
        }));
        
        const { error: inclusionsError } = await supabase
          .from('multi_city_package_inclusions')
          .insert(inclusionsData);
        
        if (inclusionsError) {
          console.error('Inclusions insert error:', inclusionsError);
        }
      }

      // Insert exclusions
      if (data.exclusions && data.exclusions.length > 0) {
        const exclusionsData = data.exclusions.map((exc, index) => ({
          package_id: packageId,
          text: exc.text,
          display_order: index + 1,
        }));
        
        const { error: exclusionsError } = await supabase
          .from('multi_city_package_exclusions')
          .insert(exclusionsData);
        
        if (exclusionsError) {
          console.error('Exclusions insert error:', exclusionsError);
        }
      }

      // Insert cancellation tiers
      if (data.policies.cancellation && data.policies.cancellation.length > 0) {
        const cancellationData = data.policies.cancellation.map(tier => ({
          package_id: packageId,
          days_before: tier.daysBefore,
          refund_percent: tier.refundPercent,
        }));
        
        const { error: cancellationError } = await supabase
          .from('multi_city_package_cancellation_tiers')
          .insert(cancellationData);
        
        if (cancellationError) {
          console.error('Cancellation insert error:', cancellationError);
        }
      }
      
      console.log('[MultiCity] ✅ Package published successfully!', packageResult);
      toast.success("Multi-city package published successfully!");
      
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
