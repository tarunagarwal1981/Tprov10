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

      // Transform and insert main package
      const packageData = {
        operator_id: user.id,
        title: data.basic.title,
        short_description: data.basic.shortDescription,
        destination_region: data.basic.destinationRegion || null,
        include_intercity_transport: data.includeIntercityTransport,
        pricing_mode: data.pricing.mode,
        fixed_price: data.pricing.fixedPrice || null,
        per_person_price: data.pricing.perPersonPrice || null,
        group_min: data.pricing.groupMin || null,
        group_max: data.pricing.groupMax || null,
        validity_start: data.pricing.validityStart || null,
        validity_end: data.pricing.validityEnd || null,
        seasonal_notes: data.pricing.seasonalNotes || null,
        deposit_percent: data.policies.depositPercent || 0,
        balance_due_days: data.policies.balanceDueDays || 7,
        payment_methods: data.policies.paymentMethods || [],
        visa_requirements: data.policies.visaRequirements || null,
        insurance_requirement: data.policies.insuranceRequirement || 'OPTIONAL',
        health_requirements: data.policies.healthRequirements || null,
        terms_and_conditions: data.policies.terms || null,
        status: 'draft',
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

      // Calculate base price
      const basePrice = data.pricing.fixedPrice || data.pricing.perPersonPrice || 0;

      // Transform and insert main package
      const packageData = {
        operator_id: user.id,
        title: data.basic.title,
        short_description: data.basic.shortDescription,
        destination_region: data.basic.destinationRegion || null,
        include_intercity_transport: data.includeIntercityTransport,
        pricing_mode: data.pricing.mode,
        fixed_price: data.pricing.fixedPrice || null,
        per_person_price: data.pricing.perPersonPrice || null,
        group_min: data.pricing.groupMin || null,
        group_max: data.pricing.groupMax || null,
        base_price: basePrice,
        currency: 'USD',
        validity_start: data.pricing.validityStart || null,
        validity_end: data.pricing.validityEnd || null,
        seasonal_notes: data.pricing.seasonalNotes || null,
        deposit_percent: data.policies.depositPercent || 0,
        balance_due_days: data.policies.balanceDueDays || 7,
        payment_methods: data.policies.paymentMethods || [],
        visa_requirements: data.policies.visaRequirements || null,
        insurance_requirement: data.policies.insuranceRequirement || 'OPTIONAL',
        health_requirements: data.policies.healthRequirements || null,
        terms_and_conditions: data.policies.terms || null,
        status: 'published',
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

      // Insert addons
      if (data.addOns && data.addOns.length > 0) {
        const addonsData = data.addOns.map((addon, index) => ({
          package_id: packageId,
          name: addon.name,
          description: addon.description || null,
          price: addon.price || 0,
          is_active: true,
          display_order: index + 1,
        }));
        
        const { error: addonsError } = await supabase
          .from('multi_city_package_addons')
          .insert(addonsData);
        
        if (addonsError) {
          console.error('Addons insert error:', addonsError);
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

      // Insert departure dates
      if (data.pricing.departures && data.pricing.departures.length > 0) {
        const departuresData = data.pricing.departures.map(dep => ({
          package_id: packageId,
          departure_date: dep.date,
          available_seats: dep.availableSeats || null,
          price: dep.price || null,
          cutoff_date: dep.cutoffDate || null,
        }));
        
        const { error: departuresError } = await supabase
          .from('multi_city_package_departures')
          .insert(departuresData);
        
        if (departuresError) {
          console.error('Departures insert error:', departuresError);
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
