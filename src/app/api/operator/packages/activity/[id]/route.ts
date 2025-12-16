import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/operator/packages/activity/[id]
 * Get an activity package with all related data from RDS
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get main package
    const packageResult = await query<any>(
      `SELECT * FROM activity_packages WHERE id::text = $1`,
      [id]
    );

    if (!packageResult.rows || packageResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Activity package not found' },
        { status: 404 }
      );
    }

    const packageData = packageResult.rows[0];

    // Get related data in parallel
    const [imagesResult, timeSlotsResult, variantsResult, faqsResult, pricingResult] = await Promise.all([
      query<any>(`SELECT * FROM activity_package_images WHERE package_id::text = $1 ORDER BY display_order`, [id]).catch(() => ({ rows: [] })),
      query<any>(`SELECT * FROM activity_package_time_slots WHERE package_id::text = $1 ORDER BY start_time`, [id]).catch(() => ({ rows: [] })),
      query<any>(`SELECT * FROM activity_package_variants WHERE package_id::text = $1 ORDER BY display_order`, [id]).catch(() => ({ rows: [] })),
      query<any>(`SELECT * FROM activity_package_faqs WHERE package_id::text = $1 ORDER BY display_order`, [id]).catch(() => ({ rows: [] })),
      query<any>(`SELECT * FROM activity_pricing_packages WHERE package_id::text = $1 ORDER BY display_order`, [id]).catch(() => ({ rows: [] })),
    ]);

    // Get vehicles for pricing packages
    const pricingPackageIds = (pricingResult.rows || []).map((p: any) => p.id);
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
    const pricingWithVehicles = (pricingResult.rows || []).map((pkg: any) => ({
      ...pkg,
      vehicles: vehiclesMap[pkg.id] || [],
    }));

    const result = {
      ...packageData,
      images: imagesResult.rows || [],
      time_slots: timeSlotsResult.rows || [],
      variants: variantsResult.rows || [],
      faqs: faqsResult.rows || [],
      pricing_packages: pricingWithVehicles,
    };

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching activity package:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity package', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

