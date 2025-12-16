import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/operator/packages/activity/[id]/pricing
 * Get pricing packages with vehicles for an activity package from RDS
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get pricing packages
    const pricingResult = await query<any>(
      `SELECT * FROM activity_pricing_packages WHERE package_id::text = $1 ORDER BY display_order`,
      [id]
    ).catch(() => ({ rows: [] }));

    const pricingPackages = pricingResult.rows || [];

    // Get vehicles for pricing packages
    const pricingPackageIds = pricingPackages.map((p: any) => p.id);
    let vehiclesResult: any = { rows: [] };
    if (pricingPackageIds.length > 0) {
      vehiclesResult = await query<any>(
        `SELECT * FROM activity_pricing_package_vehicles WHERE pricing_package_id::text = ANY($1::text[]) ORDER BY display_order`,
        [pricingPackageIds]
      ).catch(() => ({ rows: [] }));
    }

    // Group vehicles by pricing_package_id
    const vehiclesMap: { [key: string]: any[] } = {};
    (vehiclesResult.rows || []).forEach((vehicle: any) => {
      if (!vehiclesMap[vehicle.pricing_package_id]) {
        vehiclesMap[vehicle.pricing_package_id] = [];
      }
      vehiclesMap[vehicle.pricing_package_id]!.push(vehicle);
    });

    // Transform database rows (snake_case) to ActivityPricingPackage format (camelCase)
    const pricingWithVehicles = pricingPackages.map((pkg: any) => ({
      id: pkg.id,
      packageId: pkg.package_id,
      packageName: pkg.package_name || '',
      description: pkg.description || undefined,
      adultPrice: Number(pkg.adult_price) || 0,
      childPrice: Number(pkg.child_price) || 0,
      childMinAge: Number(pkg.child_min_age) || 0,
      childMaxAge: Number(pkg.child_max_age) || 0,
      infantPrice: pkg.infant_price !== null ? Number(pkg.infant_price) : undefined,
      infantMaxAge: pkg.infant_max_age || undefined,
      transferIncluded: pkg.transfer_included || false,
      transferType: pkg.transfer_type as 'SHARED' | 'PRIVATE' | undefined,
      transferPriceAdult: pkg.transfer_price_adult !== null ? Number(pkg.transfer_price_adult) : undefined,
      transferPriceChild: pkg.transfer_price_child !== null ? Number(pkg.transfer_price_child) : undefined,
      transferPriceInfant: pkg.transfer_price_infant !== null ? Number(pkg.transfer_price_infant) : undefined,
      pickupLocation: pkg.pickup_location || undefined,
      pickupInstructions: pkg.pickup_instructions || undefined,
      dropoffLocation: pkg.dropoff_location || undefined,
      dropoffInstructions: pkg.dropoff_instructions || undefined,
      includedItems: pkg.included_items || [],
      excludedItems: pkg.excluded_items || undefined,
      isActive: pkg.is_active !== undefined ? pkg.is_active : true,
      isFeatured: pkg.is_featured || false,
      displayOrder: pkg.display_order || 0,
      vehicles: vehiclesMap[pkg.id] || [],
    }));

    return NextResponse.json({ pricingPackages: pricingWithVehicles });
  } catch (error) {
    console.error('Error fetching pricing packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing packages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

