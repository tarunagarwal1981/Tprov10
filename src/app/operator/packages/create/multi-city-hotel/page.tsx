"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import MultiCityHotelPackageForm from "@/components/packages/forms/MultiCityHotelPackageForm";
import { MultiCityPackageFormData } from "@/components/packages/forms/MultiCityHotelPackageForm";
import { createClient } from "@/lib/supabase/client";

export default function MultiCityHotelPackagePage() {
  const router = useRouter();

  const handleSave = async (data: MultiCityPackageFormData) => {
    try {
      console.log("[MultiCityHotel] Save draft:", data);
      
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Base price is the adult per-person price
      const basePrice = data.pricing.adultPrice || 0;

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
        .from('multi_city_hotel_packages')
        .insert(packageData)
        .select()
        .single();
      
      if (packageError) {
        console.error('Package insert error:', packageError);
        throw packageError;
      }
      
      console.log('✅ Multi-city hotel package saved:', packageResult);
      toast.success("Multi-city hotel package draft saved successfully!");
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.error(error.message || "Failed to save multi-city hotel package draft");
    }
  };

  const handlePublish = async (data: MultiCityPackageFormData) => {
    try {
      console.log("[MultiCityHotel] Publish:", data);
      
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Base price is the adult per-person price
      const basePrice = data.pricing.adultPrice || 0;

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
        .from('multi_city_hotel_packages')
        .insert(packageData)
        .select()
        .single();
      
      if (packageError) {
        console.error('Package insert error:', packageError);
        throw packageError;
      }

      const packageId = packageResult.id;

      // Insert pricing configuration
      const pricingData = {
        package_id: packageId,
        pricing_type: data.pricing.pricingType,
        adult_price: data.pricing.adultPrice,
        child_price: data.pricing.childPrice,
        child_min_age: data.pricing.childMinAge,
        child_max_age: data.pricing.childMaxAge,
        infant_price: data.pricing.infantPrice,
        infant_max_age: data.pricing.infantMaxAge,
      };
      
      const { data: pricingResult, error: pricingError } = await (supabase as any)
        .from('multi_city_hotel_pricing_packages')
        .insert(pricingData)
        .select()
        .single();
      
      if (pricingError) {
        console.error('Pricing insert error:', pricingError);
        throw pricingError;
      }

      // Insert vehicles for GROUP pricing type
      if (data.pricing.pricingType === 'GROUP' && data.pricing.vehicles && data.pricing.vehicles.length > 0) {
        const vehiclesData = data.pricing.vehicles.map((vehicle, index) => ({
          pricing_package_id: pricingResult.id,
          vehicle_type: vehicle.vehicleType,
          max_capacity: vehicle.maxCapacity,
          price: vehicle.price,
          description: vehicle.description || null,
          display_order: index + 1,
        }));
        
        const { error: vehiclesError } = await (supabase as any)
          .from('multi_city_hotel_pricing_vehicles')
          .insert(vehiclesData);
        
        if (vehiclesError) {
          console.error('Vehicles insert error:', vehiclesError);
        }
      }

      // Insert day plans with flights
      if (data.days && data.days.length > 0) {
        for (const [dayIndex, day] of data.days.entries()) {
          const dayPlanData = {
            package_id: packageId,
            city_id: day.cityId || null,
            day_number: dayIndex + 1,
            city_name: day.cityName || null,
            description: day.description || null,
            photo_url: day.photoUrl || null,
            has_flights: day.hasFlights || false,
          };
          
          const { data: dayResult, error: dayError } = await (supabase as any)
            .from('multi_city_hotel_package_day_plans')
            .insert(dayPlanData)
            .select()
            .single();
          
          if (dayError) {
            console.error('Day plan insert error:', dayError);
            continue;
          }

          // Insert flights for this day if any
          if (day.hasFlights && day.flights && day.flights.length > 0) {
            const flightsData = day.flights.map((flight, flightIndex) => ({
              day_plan_id: dayResult.id,
              departure_city: flight.departureCity,
              departure_time: flight.departureTime || null,
              arrival_city: flight.arrivalCity,
              arrival_time: flight.arrivalTime || null,
              airline: flight.airline || null,
              flight_number: flight.flightNumber || null,
              flight_order: flightIndex + 1,
            }));
            
            const { error: flightsError } = await (supabase as any)
              .from('multi_city_hotel_package_day_flights')
              .insert(flightsData);
            
            if (flightsError) {
              console.error('Flights insert error:', flightsError);
            }
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
          .from('multi_city_hotel_package_cities')
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
          .from('multi_city_hotel_package_inclusions')
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
          .from('multi_city_hotel_package_exclusions')
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
          .from('multi_city_hotel_package_addons')
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
          .from('multi_city_hotel_package_cancellation_tiers')
          .insert(cancellationData);
        
        if (cancellationError) {
          console.error('Cancellation insert error:', cancellationError);
        }
      }
      
      console.log('✅ Multi-city hotel package published:', packageResult);
      toast.success("Multi-city hotel package published successfully!");
      
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
