import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/operator/packages/multi-city/update
 * Update an existing multi-city package and all related data
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { operatorId, packageId, isDraft = false } = data;
    
    console.log('[Update] Received data:', {
      hasCities: !!data.cities,
      citiesCount: data.cities?.length || 0,
      hasDays: !!data.days,
      daysCount: data.days?.length || 0,
      pricingType: data.pricing?.pricingType,
      hasPricingRows: !!data.pricing?.pricingRows,
      pricingRowsCount: data.pricing?.pricingRows?.length || 0,
      hasPrivateRows: !!data.pricing?.privatePackageRows,
      privateRowsCount: data.pricing?.privatePackageRows?.length || 0,
    });

    if (!operatorId || !packageId) {
      return NextResponse.json(
        { error: 'operatorId and packageId are required' },
        { status: 400 }
      );
    }

    // Verify ownership (defensive check – RLS should also protect)
    const existing = await queryOne<{ operator_id: string }>(
      'SELECT operator_id FROM multi_city_packages WHERE id::text = $1 LIMIT 1',
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

    // Calculate totals
    const totalNights = data.cities?.reduce((sum: number, city: any) => sum + (city.nights || 0), 0) || 0;
    const totalCities = data.cities?.length || 0;
    const totalDays = data.days?.length || 0;

    // Update main package row
    await query(
      `UPDATE multi_city_packages SET
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
        total_nights = $14,
        total_days = $15,
        total_cities = $16,
        status = $17,
        published_at = $18
       WHERE id::text = $19`,
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
        totalNights,
        totalDays,
        totalCities,
        isDraft ? 'draft' : 'published',
        isDraft ? null : new Date().toISOString(),
        packageId,
      ]
    );

    // Clear existing related data so we can fully re-insert from the form payload
    await query(
      `DELETE FROM multi_city_package_cancellation_tiers WHERE package_id::text = $1`,
      [packageId]
    );
    await query(
      `DELETE FROM multi_city_package_exclusions WHERE package_id::text = $1`,
      [packageId]
    );
    await query(
      `DELETE FROM multi_city_package_inclusions WHERE package_id::text = $1`,
      [packageId]
    );
    await query(
      `DELETE FROM multi_city_package_day_plans WHERE package_id::text = $1`,
      [packageId]
    );
    // Pricing rows depend on pricing packages – remove rows then packages
    await query(
      `DELETE FROM multi_city_pricing_rows WHERE pricing_package_id IN (
         SELECT id FROM multi_city_pricing_packages WHERE package_id::text = $1
       )`,
      [packageId]
    );
    await query(
      `DELETE FROM multi_city_private_package_rows WHERE pricing_package_id IN (
         SELECT id FROM multi_city_pricing_packages WHERE package_id::text = $1
       )`,
      [packageId]
    );
    await query(
      `DELETE FROM multi_city_pricing_packages WHERE package_id::text = $1`,
      [packageId]
    );
    await query(
      `DELETE FROM multi_city_package_cities WHERE package_id::text = $1`,
      [packageId]
    );

    const cityIdMap: Record<string, string> = {};

    // Re-insert cities
    if (data.cities && data.cities.length > 0) {
      console.log(`[Update] Inserting ${data.cities.length} cities`);
      for (const [index, city] of data.cities.entries()) {
        if (!city.name || !city.nights) {
          console.warn(`[Update] Skipping invalid city at index ${index}:`, city);
          continue;
        }
        const cityResult = await query<{ id: string }>(
          `INSERT INTO multi_city_package_cities (
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
          cityIdMap[city.id] = cityResult.rows[0].id;
          console.log(`[Update] Mapped city ${city.id} -> ${cityResult.rows[0].id} (${city.name})`);
        }
      }
    } else {
      console.warn('[Update] No cities provided in data.cities');
    }

    // Re-insert pricing configuration
    const pricingType = (data.pricing?.pricingType || 'SIC').toUpperCase();
    let pricingResult;
    if (data.pricing) {
      console.log(`[Update] Inserting pricing package (type: ${pricingType})`);
      pricingResult = await query<{ id: string }>(
        `INSERT INTO multi_city_pricing_packages (
          package_id, package_name, pricing_type, has_child_age_restriction,
          child_min_age, child_max_age
        ) VALUES ($1, $2, $3::multi_city_pricing_type, $4, $5, $6)
        RETURNING id`,
        [
          packageId,
          data.basic?.title || 'Untitled Package',
          pricingType,
          data.pricing?.hasChildAgeRestriction || false,
          data.pricing?.hasChildAgeRestriction ? data.pricing.childMinAge : null,
          data.pricing?.hasChildAgeRestriction ? data.pricing.childMaxAge : null,
        ]
      );
    } else {
      console.warn('[Update] No pricing data provided');
    }

    const pricingPackageId = pricingResult?.rows?.[0]?.id as string | undefined;

    if (pricingPackageId) {
      console.log(`[Update] Pricing type: ${data.pricing?.pricingType}`);
      console.log(`[Update] Has SIC rows: ${data.pricing?.pricingRows?.length || 0}`);
      console.log(`[Update] Has Private rows: ${data.pricing?.privatePackageRows?.length || 0}`);
      
      if (data.pricing?.pricingType === 'SIC' && data.pricing?.pricingRows) {
        console.log(`[Update] Inserting ${data.pricing.pricingRows.length} SIC pricing rows`);
        for (const [index, row] of data.pricing.pricingRows.entries()) {
          try {
            const result = await query(
              `INSERT INTO multi_city_pricing_rows (
                pricing_package_id, number_of_adults, number_of_children, total_price, display_order
              ) VALUES ($1, $2, $3, $4, $5)
              RETURNING id, number_of_adults, number_of_children, total_price`,
              [
                pricingPackageId,
                row.numberOfAdults,
                row.numberOfChildren,
                row.totalPrice,
                index + 1,
              ]
            );
            console.log(`[Update] ✅ Inserted SIC row ${index + 1}:`, result.rows?.[0]);
          } catch (error: any) {
            console.error(`[Update] ❌ Failed to insert SIC row ${index + 1}:`, error.message);
            throw error;
          }
        }
      } else if (data.pricing?.pricingType === 'PRIVATE_PACKAGE' && data.pricing?.privatePackageRows) {
        console.log(`[Update] Inserting ${data.pricing.privatePackageRows.length} private package pricing rows`);
        for (const [index, row] of data.pricing.privatePackageRows.entries()) {
          try {
            const result = await query(
              `INSERT INTO multi_city_private_package_rows (
                pricing_package_id, number_of_adults, number_of_children, car_type,
                vehicle_capacity, total_price, display_order
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING id, number_of_adults, number_of_children, total_price`,
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
            console.log(`[Update] ✅ Inserted Private row ${index + 1}:`, result.rows?.[0]);
          } catch (error: any) {
            console.error(`[Update] ❌ Failed to insert Private row ${index + 1}:`, error.message);
            throw error;
          }
        }
      } else {
        console.warn(`[Update] Pricing type ${data.pricing?.pricingType} but no matching rows provided`);
        console.warn(`[Update] Available: SIC rows=${data.pricing?.pricingRows?.length || 0}, Private rows=${data.pricing?.privatePackageRows?.length || 0}`);
      }
    } else {
      console.warn('[Update] No pricing package ID created');
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
      console.log(`[Update] Inserting ${data.days.length} day plans`);
      console.log(`[Update] cityIdMap:`, cityIdMap);
      for (const [dayIndex, day] of data.days.entries()) {
        console.log(`[Update] Day ${dayIndex + 1} data:`, {
          cityId: day.cityId,
          cityName: day.cityName,
          title: day.title,
          description: day.description,
          timeSlots: day.timeSlots,
        });
        const dbCityId = day.cityId ? cityIdMap[day.cityId] || null : null;
        if (day.cityId && !dbCityId) {
          console.warn(`[Update] Day ${dayIndex + 1} has cityId ${day.cityId} but not found in cityIdMap`);
        }
        const timeSlots = migrateTimeSlots(day.timeSlots);
        console.log(`[Update] Day ${dayIndex + 1} migrated timeSlots:`, timeSlots);

        try {
          const insertResult = await query(
            `INSERT INTO multi_city_package_day_plans (
              package_id, city_id, day_number, city_name, title, description,
              photo_url, has_flights, time_slots
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, title, description, time_slots`,
            [
              packageId,
              dbCityId,
              dayIndex + 1,
              day.cityName || null,
              day.title || null,
              day.description || null,
              day.photoUrl || null,
              false,
              JSON.stringify(timeSlots),
            ]
          );
          const inserted = insertResult.rows?.[0];
          console.log(`[Update] ✅ Inserted day ${dayIndex + 1}:`, {
            id: inserted?.id,
            title: inserted?.title,
            description: inserted?.description?.substring(0, 50),
            timeSlotsSaved: !!inserted?.time_slots,
          });
        } catch (error: any) {
          console.error(`[Update] ❌ Failed to insert day ${dayIndex + 1}:`, error.message);
          throw error;
        }
      }
    } else {
      console.warn('[Update] No days provided in data.days');
    }

    // Re-insert inclusions
    if (data.inclusions && data.inclusions.length > 0) {
      for (const [index, inc] of data.inclusions.entries()) {
        await query(
          `INSERT INTO multi_city_package_inclusions (
            package_id, category, text, display_order
          ) VALUES ($1, $2, $3, $4)`,
          [packageId, inc.category, inc.text, index + 1]
        );
      }
    }

    // Re-insert exclusions
    if (data.exclusions && data.exclusions.length > 0) {
      for (const [index, exc] of data.exclusions.entries()) {
        await query(
          `INSERT INTO multi_city_package_exclusions (
            package_id, text, display_order
          ) VALUES ($1, $2, $3)`,
          [packageId, exc.text, index + 1]
        );
      }
    }

    // Re-insert cancellation tiers
    if (data.policies?.cancellation && data.policies.cancellation.length > 0) {
      for (const tier of data.policies.cancellation) {
        await query(
          `INSERT INTO multi_city_package_cancellation_tiers (
            package_id, days_before, refund_percent
          ) VALUES ($1, $2, $3)`,
          [packageId, tier.daysBefore, tier.refundPercent]
        );
      }
    }

    // Verify the data was saved correctly
    console.log('[Update] Verifying saved data...');
    try {
      const verifyDayPlans = await query<any>(
        `SELECT id, title, description, time_slots 
         FROM multi_city_package_day_plans 
         WHERE package_id::text = $1 
         ORDER BY day_number ASC 
         LIMIT 5`,
        [packageId]
      );
      console.log('[Update] Verified day plans:', verifyDayPlans.rows?.map((d: any) => ({
        title: d.title,
        hasDescription: !!d.description,
        hasTimeSlots: !!d.time_slots,
        timeSlotsSample: d.time_slots ? Object.keys(d.time_slots) : null,
      })));

      const verifyPricing = await query<any>(
        `SELECT pp.pricing_type, 
                COUNT(DISTINCT pr.id)::int as sic_rows,
                COUNT(DISTINCT ppr.id)::int as private_rows
         FROM multi_city_pricing_packages pp
         LEFT JOIN multi_city_pricing_rows pr ON pr.pricing_package_id = pp.id
         LEFT JOIN multi_city_private_package_rows ppr ON ppr.pricing_package_id = pp.id
         WHERE pp.package_id::text = $1
         GROUP BY pp.pricing_type`,
        [packageId]
      );
      console.log('[Update] Verified pricing:', verifyPricing.rows);
    } catch (verifyError: any) {
      console.warn('[Update] Verification query failed (non-fatal):', verifyError.message);
    }

    return NextResponse.json({
      success: true,
      packageId,
      message: isDraft ? 'Package draft updated successfully' : 'Package updated and published successfully',
    });
  } catch (error: any) {
    console.error('[Update] ❌ Error updating multi-city package:', error);
    console.error('[Update] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to update package', details: error.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}

