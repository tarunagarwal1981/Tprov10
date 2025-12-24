import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/operator/packages/fixed-departure-flight/update
 * Update an existing fixed departure flight package and all related data
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { operatorId, packageId, isDraft = false } = data;

    if (!operatorId || !packageId) {
      return NextResponse.json(
        { error: 'operatorId and packageId are required' },
        { status: 400 }
      );
    }

    const existing = await queryOne<{ operator_id: string }>(
      'SELECT operator_id FROM fixed_departure_flight_packages WHERE id::text = $1 LIMIT 1',
      [packageId]
    );

    if (!existing) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    if (existing.operator_id !== operatorId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this package' },
        { status: 403 }
      );
    }

    // Calculate base price
    const basePrice =
      data.pricing?.pricingType === 'SIC' && data.pricing?.pricingRows?.length > 0
        ? data.pricing.pricingRows[0]?.totalPrice || 0
        : data.pricing?.pricingType === 'PRIVATE_PACKAGE' && data.pricing?.privatePackageRows?.length > 0
        ? data.pricing.privatePackageRows[0]?.totalPrice || 0
        : 0;

    // Update main package
    await query(
      `UPDATE fixed_departure_flight_packages SET
        title = $1,
        short_description = $2,
        destination_region = $3,
        package_validity_date = $4,
        base_price = $5,
        currency = $6,
        deposit_percent = $7,
        balance_due_days = $8,
        payment_methods = $9,
        visa_requirements = $10,
        insurance_requirement = $11,
        health_requirements = $12,
        terms_and_conditions = $13,
        status = $14,
        published_at = $15
       WHERE id::text = $16`,
      [
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
        packageId,
      ]
    );

    // Clear related records
    await query(
      `DELETE FROM fixed_departure_flight_package_cancellation_tiers WHERE package_id::text = $1`,
      [packageId]
    );
    await query(
      `DELETE FROM fixed_departure_flight_package_exclusions WHERE package_id::text = $1`,
      [packageId]
    );
    await query(
      `DELETE FROM fixed_departure_flight_package_inclusions WHERE package_id::text = $1`,
      [packageId]
    );
    await query(
      `DELETE FROM fixed_departure_flight_package_day_flights WHERE day_plan_id IN (
         SELECT id FROM fixed_departure_flight_package_day_plans WHERE package_id::text = $1
       )`,
      [packageId]
    );
    await query(
      `DELETE FROM fixed_departure_flight_package_day_plans WHERE package_id::text = $1`,
      [packageId]
    );
    await query(
      `DELETE FROM fixed_departure_flight_pricing_rows WHERE pricing_package_id IN (
         SELECT id FROM fixed_departure_flight_pricing_packages WHERE package_id::text = $1
       )`,
      [packageId]
    );
    await query(
      `DELETE FROM fixed_departure_flight_private_package_rows WHERE pricing_package_id IN (
         SELECT id FROM fixed_departure_flight_pricing_packages WHERE package_id::text = $1
       )`,
      [packageId]
    );
    await query(
      `DELETE FROM fixed_departure_flight_pricing_packages WHERE package_id::text = $1`,
      [packageId]
    );
    await query(
      `DELETE FROM fixed_departure_flight_package_city_hotels WHERE city_id IN (
         SELECT id FROM fixed_departure_flight_package_cities WHERE package_id::text = $1
       )`,
      [packageId]
    );
    await query(
      `DELETE FROM fixed_departure_flight_package_cities WHERE package_id::text = $1`,
      [packageId]
    );

    const cityIdMap: Record<string, string> = {};

    // Re-insert cities and hotels
    if (data.cities && data.cities.length > 0) {
      for (const [index, city] of data.cities.entries()) {
        const cityResult = await query<{ id: string }>(
          `INSERT INTO fixed_departure_flight_package_cities (
            package_id, name, country, arrival_date, nights, highlights, activities_included, city_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id`,
          [
            packageId,
            city.name,
            city.country || null,
            city.date || null,
            city.nights,
            city.highlights ? JSON.stringify(city.highlights) : null,
            city.activitiesIncluded ? JSON.stringify(city.activitiesIncluded) : null,
            index + 1,
          ]
        );

        if (cityResult.rows && cityResult.rows[0]) {
          const insertedCityId = cityResult.rows[0].id;
          cityIdMap[city.id] = insertedCityId;

          if (city.hotels && city.hotels.length > 0) {
            for (const [hotelIndex, hotel] of city.hotels.entries()) {
              await query(
                `INSERT INTO fixed_departure_flight_package_city_hotels (
                  city_id, hotel_name, hotel_type, room_type, display_order
                ) VALUES ($1, $2, $3, $4, $5)`,
                [
                  insertedCityId,
                  hotel.hotelName,
                  hotel.hotelType || null,
                  hotel.roomType,
                  hotelIndex + 1,
                ]
              );
            }
          }
        }
      }
    }

    // Re-insert pricing configuration
    let pricingPackageId: string | undefined;
    if (data.pricing) {
      const pricingResult = await query<{ id: string }>(
        `INSERT INTO fixed_departure_flight_pricing_packages (
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

      pricingPackageId = pricingResult.rows?.[0]?.id;
    }

    if (pricingPackageId) {
      if (data.pricing?.pricingType === 'SIC' && data.pricing.pricingRows) {
        for (const [index, row] of data.pricing.pricingRows.entries()) {
          await query(
            `INSERT INTO fixed_departure_flight_pricing_rows (
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

      if (data.pricing?.pricingType === 'PRIVATE_PACKAGE' && data.pricing.privatePackageRows) {
        for (const [index, row] of data.pricing.privatePackageRows.entries()) {
          await query(
            `INSERT INTO fixed_departure_flight_private_package_rows (
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

    // Re-insert day plans and flights
    if (data.days && data.days.length > 0) {
      for (const [dayIndex, day] of data.days.entries()) {
        const cityId = day.cityId ? cityIdMap[day.cityId] || null : null;

        const dayPlanResult = await query<{ id: string }>(
          `INSERT INTO fixed_departure_flight_package_day_plans (
            package_id, city_id, day_number, city_name, date, title, description, photo_url, has_flights
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id`,
          [
            packageId,
            cityId,
            dayIndex + 1,
            day.cityName || null,
            day.date || null,
            day.title || null,
            day.description || null,
            day.photoUrl || null,
            day.hasFlights || false,
          ]
        );

        if (day.hasFlights && day.flights && day.flights.length > 0 && dayPlanResult.rows && dayPlanResult.rows[0]) {
          const dayPlanId = dayPlanResult.rows[0].id;
          for (const [flightIndex, flight] of day.flights.entries()) {
            await query(
              `INSERT INTO fixed_departure_flight_package_day_flights (
                day_plan_id, departure_city, departure_time, arrival_city, arrival_time, airline, flight_number, flight_order
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                dayPlanId,
                flight.departureCity,
                flight.departureTime || null,
                flight.arrivalCity,
                flight.arrivalTime || null,
                flight.airline || null,
                flight.flightNumber || null,
                flightIndex + 1,
              ]
            );
          }
        }
      }
    }

    // Re-insert inclusions
    if (data.inclusions && data.inclusions.length > 0) {
      for (const [index, inc] of data.inclusions.entries()) {
        await query(
          `INSERT INTO fixed_departure_flight_package_inclusions (
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

    // Re-insert exclusions
    if (data.exclusions && data.exclusions.length > 0) {
      for (const [index, exc] of data.exclusions.entries()) {
        await query(
          `INSERT INTO fixed_departure_flight_package_exclusions (
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

    // Re-insert cancellation tiers
    if (data.policies?.cancellation && data.policies.cancellation.length > 0) {
      for (const tier of data.policies.cancellation) {
        await query(
          `INSERT INTO fixed_departure_flight_package_cancellation_tiers (
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
      message: isDraft ? 'Package draft updated successfully' : 'Package updated and published successfully',
    });
  } catch (error: any) {
    console.error('Error updating fixed departure flight package:', error);
    return NextResponse.json(
      { error: 'Failed to update package', details: error.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}

