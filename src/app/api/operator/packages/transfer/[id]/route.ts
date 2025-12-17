import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/operator/packages/transfer/[id]
 * Get a transfer package with all related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get main package
    const packageResult = await query<any>(
      `SELECT * FROM transfer_packages WHERE id::text = $1`,
      [id]
    );

    if (!packageResult.rows || packageResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Transfer package not found' },
        { status: 404 }
      );
    }

    const packageData = packageResult.rows[0];

    // Get related data in parallel (stops, vehicle images & additional services are not used in RDS schema for transfers)
    const [imagesResult, vehiclesResult, hourlyPricingResult, p2pPricingResult] = await Promise.all([
      query<any>(`SELECT * FROM transfer_package_images WHERE package_id::text = $1 ORDER BY display_order`, [id]),
      query<any>(`SELECT * FROM transfer_package_vehicles WHERE package_id::text = $1 ORDER BY display_order`, [id]),
      query<any>(`SELECT * FROM transfer_hourly_pricing WHERE package_id::text = $1 ORDER BY display_order`, [id]),
      query<any>(`SELECT * FROM transfer_point_to_point_pricing WHERE package_id::text = $1 ORDER BY display_order`, [id]),
    ]);

    const result = {
      ...packageData,
      images: imagesResult.rows || [],
      // Vehicle images, stops & additional services are not yet wired in the RDS schema for transfers.
      vehicles: vehiclesResult.rows || [],
      // Stops & additional services are not yet wired in the RDS schema for transfers.
      stops: [],
      additional_services: [],
      hourly_pricing: hourlyPricingResult.rows || [],
      point_to_point_pricing: p2pPricingResult.rows || [],
    };

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching transfer package:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transfer package', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
