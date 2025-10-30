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

      // Calculate base price from pricing packages
      let basePrice = 0;
      if (data.pricing.pricingType === 'STANDARD' && data.pricing.standardPackages.length > 0) {
        basePrice = data.pricing.standardPackages[0]?.adultPrice || 0;
      } else if (data.pricing.pricingType === 'GROUP' && data.pricing.groupPackages.length > 0) {
        const firstPackage = data.pricing.groupPackages[0];
        if (firstPackage && firstPackage.groups.length > 0) {
          basePrice = firstPackage.groups[0]?.price || 0;
        }
      }

      // Transform and insert main package
      const packageData = {
        operator_id: user.id,
        title: data.basic.title,
        short_description: data.basic.shortDescription,
        destination_region: data.basic.destinationRegion || null,
        package_validity_date: data.basic.packageValidityDate || null,
        include_intercity_transport: data.includeIntercityTransport,
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

      // Calculate base price from pricing packages
      let basePrice = 0;
      if (data.pricing.pricingType === 'STANDARD' && data.pricing.standardPackages.length > 0) {
        basePrice = data.pricing.standardPackages[0]?.adultPrice || 0;
      } else if (data.pricing.pricingType === 'GROUP' && data.pricing.groupPackages.length > 0) {
        const firstPackage = data.pricing.groupPackages[0];
        if (firstPackage && firstPackage.groups.length > 0) {
          basePrice = firstPackage.groups[0]?.price || 0;
        }
      }

      // Transform and insert main package
      const packageData = {
        operator_id: user.id,
        title: data.basic.title,
        short_description: data.basic.shortDescription,
        destination_region: data.basic.destinationRegion || null,
        package_validity_date: data.basic.packageValidityDate || null,
        include_intercity_transport: data.includeIntercityTransport,
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

      // Insert pricing packages
      if (data.pricing.pricingType === 'STANDARD' && data.pricing.standardPackages.length > 0) {
        const pricingPackagesData = data.pricing.standardPackages.map((pkg, index) => ({
          package_id: packageId,
          pricing_type: 'STANDARD' as const,
          package_name: pkg.packageName,
          description: pkg.description || null,
          adult_price: pkg.adultPrice,
          child_price: pkg.childPrice,
          child_min_age: pkg.childMinAge,
          child_max_age: pkg.childMaxAge,
          infant_price: pkg.infantPrice,
          infant_max_age: pkg.infantMaxAge,
          included_items: pkg.includedItems || [],
          excluded_items: pkg.excludedItems || [],
          is_active: true,
          is_featured: pkg.isFeatured,
          display_order: index + 1,
        }));
        
        const { error: pricingError } = await supabase
          .from('multi_city_pricing_packages')
          .insert(pricingPackagesData);
        
        if (pricingError) {
          console.error('Pricing packages insert error:', pricingError);
        }
      } else if (data.pricing.pricingType === 'GROUP' && data.pricing.groupPackages.length > 0) {
        // Insert group pricing packages
        for (const [pkgIndex, pkg] of data.pricing.groupPackages.entries()) {
          const pricingPackageData = {
            package_id: packageId,
            pricing_type: 'GROUP' as const,
            package_name: pkg.packageName,
            description: pkg.description || null,
            included_items: pkg.includedItems || [],
            excluded_items: pkg.excludedItems || [],
            is_active: true,
            is_featured: pkg.isFeatured,
            display_order: pkgIndex + 1,
          };
          
          const { data: pricingResult, error: pricingError } = await supabase
            .from('multi_city_pricing_packages')
            .insert(pricingPackageData)
            .select()
            .single();
          
          if (pricingError) {
            console.error('Group pricing package insert error:', pricingError);
            continue;
          }

          // Insert group tiers for this package
          if (pkg.groups && pkg.groups.length > 0) {
            const groupTiersData = pkg.groups.map((tier, tierIndex) => ({
              pricing_package_id: pricingResult.id,
              group_name: tier.groupName,
              min_capacity: tier.minCapacity,
              max_capacity: tier.maxCapacity,
              price: tier.price,
              vehicle_type: tier.vehicleType || null,
              accommodation_notes: tier.accommodationNotes || null,
              description: tier.description || null,
              display_order: tierIndex + 1,
            }));
            
            const { error: tiersError } = await supabase
              .from('multi_city_pricing_groups')
              .insert(groupTiersData);
            
            if (tiersError) {
              console.error('Group tiers insert error:', tiersError);
            }
          }
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
          
          const { data: dayResult, error: dayError } = await supabase
            .from('multi_city_package_day_plans')
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
            
            const { error: flightsError } = await supabase
              .from('multi_city_package_day_flights')
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
