import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/operator/packages/multi-city/create
 * Create a multi-city package with all related data
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

    // Calculate totals
    const totalNights = data.cities?.reduce((sum: number, city: any) => sum + (city.nights || 0), 0) || 0;
    const totalCities = data.cities?.length || 0;
    const totalDays = data.days?.length || 0;

    // Insert main package
    let packageResult;
    try {
      packageResult = await query<{ id: string }>(
        `INSERT INTO multi_city_packages (
          operator_id, title, short_description, destination_region,
          package_validity_date, base_price, currency, deposit_percent,
          balance_due_days, payment_methods, visa_requirements,
          insurance_requirement, health_requirements, terms_and_conditions,
          total_nights, total_days, total_cities, status, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
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
          totalNights,
          totalDays,
          totalCities,
          isDraft ? 'draft' : 'published',
          isDraft ? null : new Date().toISOString(),
        ]
      );
    } catch (packageError: any) {
      console.error('Error inserting main package:', packageError);
      throw new Error(`Failed to insert main package: ${packageError.message || packageError.detail || 'Unknown error'}`);
    }

    if (!packageResult || !packageResult.rows || !packageResult.rows[0]) {
      console.error('Package result is empty:', packageResult);
      throw new Error('Failed to create package - no ID returned from database');
    }

    const packageId = packageResult.rows[0].id;
    const cityIdMap: Record<string, string> = {};

    // Insert cities
    if (data.cities && data.cities.length > 0) {
      for (const [index, city] of data.cities.entries()) {
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
        }
      }
    }

    // Insert pricing configuration
    const pricingType = (data.pricing?.pricingType || 'SIC').toUpperCase();
    let pricingResult;
    try {
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
    } catch (pricingError: any) {
      console.error('Error inserting pricing configuration:', pricingError);
      throw new Error(`Failed to insert pricing configuration: ${pricingError.message || pricingError.detail || 'Unknown error'}`);
    }

    if (!pricingResult || !pricingResult.rows || !pricingResult.rows[0]) {
      console.error('Pricing result is empty:', pricingResult);
      throw new Error('Failed to create pricing configuration - no ID returned');
    }

    const pricingPackageId = pricingResult.rows[0].id;

    // Insert SIC pricing rows
    if (data.pricing?.pricingType === 'SIC' && data.pricing?.pricingRows && pricingPackageId) {
      for (const [index, row] of data.pricing.pricingRows.entries()) {
        await query(
          `INSERT INTO multi_city_pricing_rows (
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

    // Insert private package rows
    if (data.pricing?.pricingType === 'PRIVATE_PACKAGE' && data.pricing?.privatePackageRows && pricingPackageId) {
      for (const [index, row] of data.pricing.privatePackageRows.entries()) {
        await query(
          `INSERT INTO multi_city_private_package_rows (
            pricing_package_id, number_of_adults, number_of_children, car_type,
            vehicle_capacity, total_price, display_order
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

    // Insert day plans
    if (data.days && data.days.length > 0) {
      for (const [dayIndex, day] of data.days.entries()) {
        const dbCityId = day.cityId ? cityIdMap[day.cityId] || null : null;
        const timeSlots = migrateTimeSlots(day.timeSlots);

        await query(
          `INSERT INTO multi_city_package_day_plans (
            package_id, city_id, day_number, city_name, title, description,
            photo_url, has_flights, time_slots
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
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
      }
    }

    // Insert inclusions
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

    // Insert exclusions
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

    // Insert cancellation tiers
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

    return NextResponse.json({
      success: true,
      packageId,
      message: isDraft ? 'Package draft saved successfully' : 'Package published successfully',
    });
  } catch (error) {
    console.error('Error creating multi-city package:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorDetails = error instanceof Error ? {
      message: errorMessage,
      stack: errorStack,
      name: error.name,
    } : { message: 'Unknown error' };
    
    console.error('Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'Failed to create package', 
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { fullError: errorDetails })
      },
      { status: 500 }
    );
  }
}


