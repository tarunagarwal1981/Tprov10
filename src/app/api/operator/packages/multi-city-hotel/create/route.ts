import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/operator/packages/multi-city-hotel/create
 * Create a multi-city hotel package with all related data
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { operatorId, isDraft = false } = data;

    if (!operatorId) {
      return NextResponse.json(
        { error: 'operatorId is required' },
        { status: 400 }
      );
    }

    // Calculate base price
    const basePrice = (data.pricing?.pricingType === 'SIC' && data.pricing?.pricingRows?.length > 0)
      ? (data.pricing.pricingRows[0]?.totalPrice || 0)
      : (data.pricing?.pricingType === 'PRIVATE_PACKAGE' && data.pricing?.privatePackageRows?.length > 0)
      ? (data.pricing.privatePackageRows[0]?.totalPrice || 0)
      : 0;

    // Insert main package
    const packageResult = await query<{ id: string }>(
      `INSERT INTO multi_city_hotel_packages (
        operator_id, title, short_description, destination_region,
        package_validity_date, base_price, currency, deposit_percent,
        balance_due_days, payment_methods, visa_requirements,
        insurance_requirement, health_requirements, terms_and_conditions,
        status, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id`,
      [
        operatorId,
        data.basic?.title || 'Untitled Package',
        data.basic?.shortDescription || '',
        data.basic?.destinationRegion || null,
        data.basic?.packageValidityDate || null,
        basePrice,
        'USD',
        data.policies?.depositPercent || 0,
        data.policies?.balanceDueDays || 7,
        data.policies?.paymentMethods ? JSON.stringify(data.policies.paymentMethods) : null,
        data.policies?.visaRequirements || null,
        data.policies?.insuranceRequirement || 'OPTIONAL',
        data.policies?.healthRequirements || null,
        data.policies?.terms || null,
        isDraft ? 'draft' : 'published',
        isDraft ? null : new Date().toISOString(),
      ]
    );

    if (!packageResult.rows || !packageResult.rows[0]) {
      return NextResponse.json(
        { error: 'Failed to create package' },
        { status: 500 }
      );
    }

    const packageId = packageResult.rows[0].id;
    const cityIdMap: Record<string, string> = {};

    // Insert pricing configuration
    if (data.pricing) {
      const pricingResult = await query<{ id: string }>(
        `INSERT INTO multi_city_hotel_pricing_packages (
          package_id, pricing_type, has_child_age_restriction, child_min_age, child_max_age
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [
          packageId,
          data.pricing.pricingType,
          data.pricing.hasChildAgeRestriction || false,
          data.pricing.hasChildAgeRestriction ? data.pricing.childMinAge : null,
          data.pricing.hasChildAgeRestriction ? data.pricing.childMaxAge : null,
        ]
      );

      if (pricingResult.rows && pricingResult.rows[0]) {
        const pricingPackageId = pricingResult.rows[0].id;

        // Insert pricing rows for SIC pricing type
        if (data.pricing.pricingType === 'SIC' && data.pricing.pricingRows && data.pricing.pricingRows.length > 0) {
          for (const [index, row] of data.pricing.pricingRows.entries()) {
            await query(
              `INSERT INTO multi_city_hotel_pricing_rows (
                pricing_package_id, number_of_adults, number_of_children, total_price, display_order
              ) VALUES ($1, $2, $3, $4, $5)`,
              [
                pricingPackageId,
                row.numberOfAdults,
                row.numberOfChildren,
                row.totalPrice,
                index + 1,
              ]
            );
          }
        }

        // Insert private package rows for PRIVATE_PACKAGE pricing type
        if (data.pricing.pricingType === 'PRIVATE_PACKAGE' && data.pricing.privatePackageRows && data.pricing.privatePackageRows.length > 0) {
          for (const [index, row] of data.pricing.privatePackageRows.entries()) {
            await query(
              `INSERT INTO multi_city_hotel_private_package_rows (
                pricing_package_id, number_of_adults, number_of_children, car_type, vehicle_capacity, total_price, display_order
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                pricingPackageId,
                row.numberOfAdults,
                row.numberOfChildren,
                row.carType,
                row.vehicleCapacity,
                row.totalPrice,
                index + 1,
              ]
            );
          }
        }
      }
    }

    // Insert cities
    if (data.cities && data.cities.length > 0) {
      for (const [index, city] of data.cities.entries()) {
        const cityResult = await query<{ id: string }>(
          `INSERT INTO multi_city_hotel_package_cities (
            package_id, name, country, nights, highlights, activities_included, city_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id`,
          [
            packageId,
            city.name,
            city.country || null,
            city.nights,
            city.highlights ? JSON.stringify(city.highlights) : null,
            city.activitiesIncluded ? JSON.stringify(city.activitiesIncluded) : null,
            index + 1,
          ]
        );

        if (cityResult.rows && cityResult.rows[0]) {
          const insertedCityId = cityResult.rows[0].id;
          cityIdMap[city.id || index] = insertedCityId;

          // Insert hotels for this city
          if (city.hotels && city.hotels.length > 0) {
            for (const [hotelIndex, hotel] of city.hotels.entries()) {
              await query(
                `INSERT INTO multi_city_hotel_package_city_hotels (
                  city_id, hotel_name, hotel_type, room_type, room_capacity_adults, room_capacity_children, display_order
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  insertedCityId,
                  hotel.hotelName,
                  hotel.hotelType || null,
                  hotel.roomType,
                  hotel.roomCapacityAdults !== undefined ? hotel.roomCapacityAdults : null,
                  hotel.roomCapacityChildren !== undefined ? hotel.roomCapacityChildren : null,
                  hotelIndex + 1,
                ]
              );
            }
          }
        }
      }
    }

    // Insert day plans
    if (data.days && data.days.length > 0) {
      for (const [dayIndex, day] of data.days.entries()) {
        const timeSlots = day.timeSlots || {
          morning: { time: "", activities: [], transfers: [] },
          afternoon: { time: "", activities: [], transfers: [] },
          evening: { time: "", activities: [], transfers: [] },
        };

        // Map city ID if provided
        const cityId = day.cityId ? cityIdMap[day.cityId] : null;

        await query(
          `INSERT INTO multi_city_hotel_package_day_plans (
            package_id, city_id, day_number, city_name, title, description, photo_url, has_flights, time_slots
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            packageId,
            cityId,
            dayIndex + 1,
            day.cityName || null,
            day.title || null,
            day.description || null,
            day.photoUrl || null,
            false,
            JSON.stringify(timeSlots),
          ]
        );
      }
    }

    // Insert inclusions
    if (data.inclusions && data.inclusions.length > 0) {
      for (const [index, inc] of data.inclusions.entries()) {
        await query(
          `INSERT INTO multi_city_hotel_package_inclusions (
            package_id, category, text, display_order
          ) VALUES ($1, $2, $3, $4)`,
          [
            packageId,
            inc.category,
            inc.text,
            index + 1,
          ]
        );
      }
    }

    // Insert exclusions
    if (data.exclusions && data.exclusions.length > 0) {
      for (const [index, exc] of data.exclusions.entries()) {
        await query(
          `INSERT INTO multi_city_hotel_package_exclusions (
            package_id, text, display_order
          ) VALUES ($1, $2, $3)`,
          [
            packageId,
            exc.text,
            index + 1,
          ]
        );
      }
    }

    // Insert cancellation tiers
    if (data.policies?.cancellation && data.policies.cancellation.length > 0) {
      for (const tier of data.policies.cancellation) {
        await query(
          `INSERT INTO multi_city_hotel_package_cancellation_tiers (
            package_id, days_before, refund_percent
          ) VALUES ($1, $2, $3)`,
          [
            packageId,
            tier.daysBefore,
            tier.refundPercent,
          ]
        );
      }
    }

    return NextResponse.json({
      success: true,
      packageId,
      message: isDraft ? 'Package draft saved successfully' : 'Package published successfully',
    });
  } catch (error: any) {
    console.error('Error creating multi-city hotel package:', error);
    return NextResponse.json(
      { error: 'Failed to create package', details: error.message },
      { status: 500 }
    );
  }
}

