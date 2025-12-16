import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simple UUID v4 validator (sufficient for distinguishing temp IDs from real DB IDs)
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUUID = (value: any): boolean =>
  typeof value === 'string' && UUID_REGEX.test(value);

/**
 * POST /api/operator/packages/activity/pricing
 * Save pricing packages with vehicles for an activity package
 */
export async function POST(request: NextRequest) {
  try {
    const { packageId, pricingPackages, vehicles } = await request.json();

    console.log('[Pricing API] Received request:', {
      packageId,
      pricingPackagesCount: pricingPackages?.length || 0,
      vehiclesCount: vehicles?.length || 0,
    });

    if (!packageId) {
      return NextResponse.json(
        { error: 'packageId is required' },
        { status: 400 }
      );
    }

    if (!pricingPackages || !Array.isArray(pricingPackages)) {
      return NextResponse.json(
        { error: 'pricingPackages array is required' },
        { status: 400 }
      );
    }

    // Helper to ensure array values are properly formatted for PostgreSQL ARRAY type
    const ensureArray = (value: any): string[] => {
      if (!value) return [];
      if (Array.isArray(value)) {
        // Ensure all items are strings (PostgreSQL TEXT[] array)
        return value.map(item => String(item)).filter(item => item.trim() !== '');
      }
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return parsed.map(item => String(item)).filter(item => item.trim() !== '');
          }
          return [String(parsed)];
        } catch {
          return [value];
        }
      }
      return [String(value)];
    };

    const savedPackageIds: string[] = [];

    // Save pricing packages
    for (const pkg of pricingPackages) {
      const isExistingPackage = isValidUUID(pkg.id);

      console.log('[Pricing API] Processing package:', {
        id: pkg.id,
        isExistingPackage,
        packageName: pkg.packageName,
        includedItems: pkg.includedItems,
        excludedItems: pkg.excludedItems,
        includedItemsType: typeof pkg.includedItems,
        excludedItemsType: typeof pkg.excludedItems,
      });
      
      // Check if this is an update (has a real UUID id) or create
      if (isExistingPackage) {
        // Update existing
        await query(
          `UPDATE activity_pricing_packages SET
            package_name = $1, description = $2, adult_price = $3, child_price = $4,
            child_min_age = $5, child_max_age = $6, infant_price = $7, infant_max_age = $8,
            transfer_included = $9, transfer_type = $10, transfer_price_adult = $11,
            transfer_price_child = $12, transfer_price_infant = $13, pickup_location = $14,
            pickup_instructions = $15, dropoff_location = $16, dropoff_instructions = $17,
            included_items = $18, excluded_items = $19, is_active = $20, is_featured = $21,
            display_order = $22, updated_at = NOW()
          WHERE id = $23`,
          [
            pkg.packageName || '',
            pkg.description || null,
            pkg.adultPrice || 0,
            pkg.childPrice || 0,
            pkg.childMinAge || 0,
            pkg.childMaxAge || 17,
            pkg.infantPrice || null,
            pkg.infantMaxAge || null,
            pkg.transferIncluded || false,
            pkg.transferType || null,
            pkg.transferPriceAdult || null,
            pkg.transferPriceChild || null,
            pkg.transferPriceInfant || null,
            pkg.pickupLocation || null,
            pkg.pickupInstructions || null,
            pkg.dropoffLocation || null,
            pkg.dropoffInstructions || null,
            // included_items and excluded_items are ARRAY type (TEXT[])
            // Ensure they're proper arrays of strings
            ensureArray(pkg.includedItems),
            ensureArray(pkg.excludedItems),
            pkg.isActive !== undefined ? pkg.isActive : true,
            pkg.isFeatured || false,
            pkg.displayOrder || 0,
            pkg.id,
          ]
        );
        savedPackageIds.push(pkg.id);
      } else {
        // Create new
        const result = await query<{ id: string }>(
          `INSERT INTO activity_pricing_packages (
            package_id, package_name, description, adult_price, child_price,
            child_min_age, child_max_age, infant_price, infant_max_age,
            transfer_included, transfer_type, transfer_price_adult,
            transfer_price_child, transfer_price_infant, pickup_location,
            pickup_instructions, dropoff_location, dropoff_instructions,
            included_items, excluded_items, is_active, is_featured, display_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
          RETURNING id`,
          [
            packageId,
            pkg.packageName || '',
            pkg.description || null,
            pkg.adultPrice || 0,
            pkg.childPrice || 0,
            pkg.childMinAge || 0,
            pkg.childMaxAge || 17,
            pkg.infantPrice || null,
            pkg.infantMaxAge || null,
            pkg.transferIncluded || false,
            pkg.transferType || null,
            pkg.transferPriceAdult || null,
            pkg.transferPriceChild || null,
            pkg.transferPriceInfant || null,
            pkg.pickupLocation || null,
            pkg.pickupInstructions || null,
            pkg.dropoffLocation || null,
            pkg.dropoffInstructions || null,
            // included_items and excluded_items are ARRAY type (TEXT[])
            // Ensure they're proper arrays of strings
            ensureArray(pkg.includedItems),
            ensureArray(pkg.excludedItems),
            pkg.isActive !== undefined ? pkg.isActive : true,
            pkg.isFeatured || false,
            pkg.displayOrder || 0,
          ]
        );
        if (result.rows && result.rows[0]) {
          savedPackageIds.push(result.rows[0].id);
        }
      }
    }

    // Save vehicles for private transfer packages
    if (vehicles && vehicles.length > 0) {
      for (const vehicleData of vehicles) {
        const { pricingPackageIndex, vehicles: vehicleList } = vehicleData;
        const pricingPackageId = savedPackageIds[pricingPackageIndex];
        
        if (!pricingPackageId || !vehicleList || vehicleList.length === 0) continue;

        // Delete existing vehicles for this pricing package
        await query(
          'DELETE FROM activity_pricing_package_vehicles WHERE pricing_package_id = $1',
          [pricingPackageId]
        );

        // Insert new vehicles
        for (const vehicle of vehicleList) {
          await query(
            `INSERT INTO activity_pricing_package_vehicles (
              pricing_package_id, vehicle_type, vehicle_name, capacity, price_adjustment, display_order
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              pricingPackageId,
              vehicle.vehicleType || 'SEDAN',
              // vehicle_name: use vehicleType if vehicleName not provided, or use description if vehicleType is "Others"
              (vehicle.vehicleType === 'Others' && vehicle.description) 
                ? vehicle.description 
                : (vehicle.vehicleName || vehicle.vehicleType || 'Sedan'),
              vehicle.maxCapacity || vehicle.capacity || 4, // Support both maxCapacity and capacity
              vehicle.price || vehicle.priceAdjustment || null, // Support both price and priceAdjustment
              vehicle.displayOrder || 0,
            ]
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing packages saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving pricing packages:', error);
    console.error('Error details:', {
      message: error.message,
      detail: error.detail,
      code: error.code,
      hint: error.hint,
      constraint: error.constraint,
      table: error.table,
      column: error.column,
      stack: error.stack,
    });
    return NextResponse.json(
      { 
        error: 'Failed to save pricing packages', 
        details: error.message || 'Unknown error',
        hint: error.hint || error.detail || null,
        code: error.code || null,
      },
      { status: 500 }
    );
  }
}

