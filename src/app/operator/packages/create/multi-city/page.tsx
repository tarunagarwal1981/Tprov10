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
      console.log("[MultiCity] Publish:", data);
      
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
        status: 'published' as const,
        published_at: new Date().toISOString(),
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

      const packageId = packageResult.id;

      // Insert pricing configuration
      const pricingData: any = {
        package_id: packageId,
        pricing_type: data.pricing.pricingType,
        has_child_age_restriction: data.pricing.hasChildAgeRestriction || false,
        child_min_age: data.pricing.hasChildAgeRestriction ? data.pricing.childMinAge : null,
        child_max_age: data.pricing.hasChildAgeRestriction ? data.pricing.childMaxAge : null,
      };
      
      const { data: pricingResult, error: pricingError } = await (supabase as any)
        .from('multi_city_pricing_packages')
        .insert(pricingData)
        .select()
        .single();
      
      if (pricingError) {
        console.error('Pricing insert error:', pricingError);
        throw pricingError;
      }

      // Insert pricing rows for SIC pricing type
      if (data.pricing.pricingType === 'SIC' && data.pricing.pricingRows && data.pricing.pricingRows.length > 0) {
        const pricingRowsData = data.pricing.pricingRows.map((row, index) => ({
          pricing_package_id: pricingResult.id,
          number_of_adults: row.numberOfAdults,
          number_of_children: row.numberOfChildren,
          total_price: row.totalPrice,
          display_order: index + 1,
        }));
        
        const { error: pricingRowsError } = await (supabase as any)
          .from('multi_city_pricing_rows')
          .insert(pricingRowsData);
        
        if (pricingRowsError) {
          console.error('Pricing rows insert error:', pricingRowsError);
        }
      }

      // Insert private package rows for PRIVATE_PACKAGE pricing type
      if (data.pricing.pricingType === 'PRIVATE_PACKAGE' && data.pricing.privatePackageRows && data.pricing.privatePackageRows.length > 0) {
        const privatePackageRowsData = data.pricing.privatePackageRows.map((row, index) => ({
          pricing_package_id: pricingResult.id,
          number_of_adults: row.numberOfAdults,
          number_of_children: row.numberOfChildren,
          car_type: row.carType,
          vehicle_capacity: row.vehicleCapacity,
          total_price: row.totalPrice,
          display_order: index + 1,
        }));
        
        const { error: privatePackageRowsError } = await (supabase as any)
          .from('multi_city_private_package_rows')
          .insert(privatePackageRowsData);
        
        if (privatePackageRowsError) {
          console.error('Private package rows insert error:', privatePackageRowsError);
        }
      }

      // Insert day plans
      if (data.days && data.days.length > 0) {
        for (const [dayIndex, day] of data.days.entries()) {
          // Prepare time slots JSON
          const timeSlots = day.timeSlots || {
            morning: { time: "", activities: [], transfers: [] },
            afternoon: { time: "", activities: [], transfers: [] },
            evening: { time: "", activities: [], transfers: [] },
          };

          const dayPlanData = {
            package_id: packageId,
            city_id: day.cityId || null,
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
            console.error('Day plan insert error:', dayError);
            continue;
          }
        }
      }

      // Insert cities
      if (data.cities && data.cities.length > 0) {
        const citiesData = data.cities.map((city, index) => ({
          package_id: packageId,
          name: city.name,
          country: city.country || null,
          nights: city.nights,
          highlights: city.highlights || [],
          activities_included: city.activitiesIncluded || [],
          city_order: index + 1,
        }));
        
        const { error: citiesError } = await supabase
          .from('multi_city_package_cities')
          .insert(citiesData);
        
        if (citiesError) {
          console.error('Cities insert error:', citiesError);
        }
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
      
      console.log('✅ Multi-city package published:', packageResult);
      toast.success("Multi-city package published successfully!");
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/operator/packages");
      }, 1000);
    } catch (error: any) {
      console.error("Publish failed:", error);
      toast.error(error.message || "Failed to publish multi-city package");
    }
  };

  const handlePreview = (data: MultiCityPackageFormData) => {
    console.log("[MultiCity] Preview:", data);
    toast.info("Preview functionality coming soon!");
  };

  return <MultiCityPackageForm onSave={handleSave} onPublish={handlePublish} onPreview={handlePreview} />;
}
