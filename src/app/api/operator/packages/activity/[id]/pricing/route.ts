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

    // Attach vehicles to pricing packages
    const pricingWithVehicles = pricingPackages.map((pkg: any) => ({
      ...pkg,
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

