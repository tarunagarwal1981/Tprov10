"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FixedDepartureFlightPackageForm from "@/components/packages/forms/FixedDepartureFlightPackageForm";
import { MultiCityPackageFormData } from "@/components/packages/forms/FixedDepartureFlightPackageForm";
import { createClient } from "@/lib/supabase/client";

export default function FixedDepartureFlightPackagePage() {
  const router = useRouter();

  const handleSave = async (data: MultiCityPackageFormData) => {
    try {
      console.log("[FixedDepartureFlight] Save draft:", data);
      
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
      
      const { data: packageResult, error: packageError } = await (supabase as any)
        .from('fixed_departure_flight_packages')
        .insert(packageData)
        .select()
        .single();
      
      if (packageError) {
        console.error('Package insert error:', packageError);
        throw packageError;
      }
      
      console.log('✅ Fixed departure flight package saved:', packageResult);
      toast.success("Fixed departure flight package draft saved successfully!");
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.error(error.message || "Failed to save fixed departure flight package draft");
    }
  };

  const handlePublish = async (data: MultiCityPackageFormData) => {
    try {
      console.log("[FixedDepartureFlight] Publish:", data);
      
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
      
      const { data: packageResult, error: packageError } = await (supabase as any)
        .from('fixed_departure_flight_packages')
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
        .from('fixed_departure_flight_pricing_packages')
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
          .from('fixed_departure_flight_pricing_rows')
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
          .from('fixed_departure_flight_private_package_rows')
          .insert(privatePackageRowsData);
        
        if (privatePackageRowsError) {
          console.error('Private package rows insert error:', privatePackageRowsError);
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
            date: day.date || null,
            title: day.title || null,
            description: day.description || null,
            photo_url: day.photoUrl || null,
            has_flights: day.hasFlights || false,
          };
          
          const { data: dayResult, error: dayError } = await (supabase as any)
            .from('fixed_departure_flight_package_day_plans')
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
              .from('fixed_departure_flight_package_day_flights')
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
          arrival_date: city.date || null,
          nights: city.nights,
          highlights: city.highlights || [],
          activities_included: city.activitiesIncluded || [],
          city_order: index + 1,
        }));
        
        const { data: insertedCities, error: citiesError } = await (supabase as any)
          .from('fixed_departure_flight_package_cities')
          .insert(citiesData)
          .select();
        
        if (citiesError) {
          console.error('Cities insert error:', citiesError);
        } else if (insertedCities) {
          // Insert hotels for each city
          for (let i = 0; i < data.cities.length; i++) {
            const city = data.cities[i];
            const insertedCity = insertedCities[i];
            
            if (city && insertedCity && city.hotels && city.hotels.length > 0) {
              const hotelsData = city.hotels.map((hotel, hotelIndex) => ({
                city_id: insertedCity.id,
                hotel_name: hotel.hotelName,
                hotel_type: hotel.hotelType || null,
                room_type: hotel.roomType,
                display_order: hotelIndex + 1,
              }));
              
              const { error: hotelsError } = await (supabase as any)
                .from('fixed_departure_flight_package_city_hotels')
                .insert(hotelsData);
              
              if (hotelsError) {
                console.error('Hotels insert error:', hotelsError);
              }
            }
          }
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
        
        const { error: inclusionsError } = await (supabase as any)
          .from('fixed_departure_flight_package_inclusions')
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
        
        const { error: exclusionsError } = await (supabase as any)
          .from('fixed_departure_flight_package_exclusions')
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
        
        const { error: cancellationError } = await (supabase as any)
          .from('fixed_departure_flight_package_cancellation_tiers')
          .insert(cancellationData);
        
        if (cancellationError) {
          console.error('Cancellation insert error:', cancellationError);
        }
      }
      
      console.log('✅ Fixed departure flight package published:', packageResult);
      toast.success("Fixed departure flight package published successfully!");
      
      // Redirect after a short delay
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

  return <FixedDepartureFlightPackageForm onSave={handleSave} onPublish={handlePublish} onPreview={handlePreview} />;
}
