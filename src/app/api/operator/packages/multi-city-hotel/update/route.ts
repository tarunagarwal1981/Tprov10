import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/operator/packages/multi-city-hotel/update
 * Update an existing multi-city hotel package and all related data
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
      'SELECT operator_id FROM multi_city_hotel_packages WHERE id::text = $1 LIMIT 1',
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
      `UPDATE multi_city_hotel_packages SET
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
      `DELETE FROM multi_city_hotel_package_cancellation_tiers WHERE package_id::text = $1`,
      [packageId]
    );
    await query(
      `DELETE FROM multi_city_hotel_package_exclusions WHERE package_id::text = $1`,
      [packageId]
    );
    await query(
      `DELETE FROM multi_city_hotel_package_inclusions WHERE package_id::text = $1`,
      [packageId]
    );
    await query(
      `DELETE FROM multi_city_hotel_package_day_plans WHERE package_id::text = $1`,
      [packageId]
    );
    await query(
      `DELETE FROM multi_city_hotel_pricing_rows WHERE pricing_package_id IN (
         SELECT id FROM multi_city_hotel_pricing_packages WHERE package_id::text = $1
       )`,
      [packageId]
    );
    await query(
      `DELETE FROM multi_city_hotel_private_package_rows WHERE pricing_package_id IN (
         SELECT id FROM multi_city_hotel_pricing_packages WHERE package_id::text = $1
       )`,
      [packageId]
    );
    await query(
      `DELETE FROM multi_city_hotel_pricing_packages WHERE package_id::text = $1`,
      [packageId]
    );
    await query(
      `DELETE FROM multi_city_hotel_package_city_hotels WHERE city_id IN (
         SELECT id FROM multi_city_hotel_package_cities WHERE package_id::text = $1
       )`,
      [packageId]
    );
    await query(
      `DELETE FROM multi_city_hotel_package_cities WHERE package_id::text = $1`,
      [packageId]
    );

    const cityIdMap: Record<string, string> = {};

    // Re-insert cities and hotels
    if (data.cities && data.cities.length > 0) {
      console.log(`[Update-Hotel] Inserting ${data.cities.length} cities`);
      for (const [index, city] of data.cities.entries()) {
        if (!city.name || !city.nights) {
          console.warn(`[Update-Hotel] Skipping invalid city at index ${index}:`, city);
          continue;
        }
        const cityResult = await query<{ id: string }>(
          `INSERT INTO multi_city_hotel_package_cities (
            package_id, name, country, nights, highlights, activities_included, display_order
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
          cityIdMap[city.id] = insertedCityId;
          console.log(`[Update-Hotel] Mapped city ${city.id} -> ${insertedCityId} (${city.name})`);

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

    // Re-insert pricing configuration
    let pricingPackageId: string | undefined;
    if (data.pricing) {
      console.log(`[Update-Hotel] Inserting pricing package (type: ${data.pricing.pricingType})`);
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

      pricingPackageId = pricingResult.rows?.[0]?.id;
    } else {
      console.warn('[Update-Hotel] No pricing data provided');
    }

    if (pricingPackageId) {
      if (data.pricing?.pricingType === 'SIC' && data.pricing.pricingRows) {
        console.log(`[Update-Hotel] Inserting ${data.pricing.pricingRows.length} SIC pricing rows`);
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
      } else if (data.pricing?.pricingType === 'PRIVATE_PACKAGE' && data.pricing.privatePackageRows) {
        console.log(`[Update-Hotel] Inserting ${data.pricing.privatePackageRows.length} private package pricing rows`);
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
      } else {
        console.warn(`[Update-Hotel] Pricing type ${data.pricing?.pricingType} but no rows provided`);
      }
    } else {
      console.warn('[Update-Hotel] No pricing package ID created');
    }

    // Helper function to migrate old format to new format
    const migrateTimeSlots = (timeSlots: any) => {
      if (!timeSlots) {
        return {
          morning: { time: '08:00', title: '', activityDescription: '', transfer: '' },
          afternoon: { time: '12:30', title: '', activityDescription: '', transfer: '' },
          evening: { time: '17:00', title: '', activityDescription: '', transfer: '' },
        };
      }
      
      const slots: ('morning' | 'afternoon' | 'evening')[] = ['morning', 'afternoon', 'evening'];
      const defaultTimes: { morning: string; afternoon: string; evening: string } = { morning: '08:00', afternoon: '12:30', evening: '17:00' };
      
      const migrated: any = {};
      slots.forEach(slot => {
        const oldSlot = timeSlots[slot] || {};
        // If old format (has activities/transfers arrays)
        if (oldSlot.activities || oldSlot.transfers) {
          migrated[slot] = {
            time: oldSlot.time || defaultTimes[slot],
            title: '',
            activityDescription: Array.isArray(oldSlot.activities) ? oldSlot.activities.join('. ') : '',
            transfer: Array.isArray(oldSlot.transfers) ? oldSlot.transfers.join('. ') : '',
          };
        } else {
          // New format or default
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

    // Re-insert day plans
    if (data.days && data.days.length > 0) {
      console.log(`[Update-Hotel] Inserting ${data.days.length} day plans`);
      console.log(`[Update-Hotel] cityIdMap:`, cityIdMap);
      for (const [dayIndex, day] of data.days.entries()) {
        const cityId = day.cityId ? cityIdMap[day.cityId] || null : null;
        if (day.cityId && !cityId) {
          console.warn(`[Update-Hotel] Day ${dayIndex + 1} has cityId ${day.cityId} but not found in cityIdMap`);
        }
        const timeSlots = migrateTimeSlots(day.timeSlots);

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
        console.log(`[Update-Hotel] Inserted day ${dayIndex + 1} (cityId: ${day.cityId} -> dbCityId: ${cityId})`);
      }
    } else {
      console.warn('[Update-Hotel] No days provided in data.days');
    }

    // Re-insert inclusions
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

    // Re-insert exclusions
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

    // Re-insert cancellation tiers
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
      message: isDraft ? 'Package draft updated successfully' : 'Package updated and published successfully',
    });
  } catch (error: any) {
    console.error('Error updating multi-city hotel package:', error);
    return NextResponse.json(
      { error: 'Failed to update package', details: error.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}

