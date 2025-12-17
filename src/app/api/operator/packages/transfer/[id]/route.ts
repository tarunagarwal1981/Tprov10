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

    // Get related data in parallel
    const [imagesResult, vehiclesResult, stopsResult, servicesResult, hourlyPricingResult, p2pPricingResult] = await Promise.all([
      query<any>(`SELECT * FROM transfer_package_images WHERE package_id::text = $1 ORDER BY display_order`, [id]),
      query<any>(`SELECT * FROM transfer_package_vehicles WHERE package_id::text = $1 ORDER BY display_order`, [id]),
      query<any>(`SELECT * FROM transfer_package_stops WHERE package_id::text = $1 ORDER BY stop_order`, [id]),
      query<any>(`SELECT * FROM transfer_additional_services WHERE package_id::text = $1`, [id]),
      query<any>(`SELECT * FROM transfer_hourly_pricing WHERE package_id::text = $1 ORDER BY display_order`, [id]),
      query<any>(`SELECT * FROM transfer_point_to_point_pricing WHERE package_id::text = $1 ORDER BY display_order`, [id]),
    ]);

    // Fetch vehicle images for all vehicles.
    // We avoid array parameters / ANY() to keep the Lambda query layer simple.
    const vehicleImagesMap: { [key: string]: any[] } = {};
    const vehiclesRaw = vehiclesResult.rows || [];

    for (const vehicle of vehiclesRaw) {
      const vehicleId = vehicle.id;
      if (!vehicleId) continue;

      const imagesForVehicle = await query<any>(
        `SELECT * FROM transfer_vehicle_images WHERE vehicle_id::text = $1 ORDER BY display_order`,
        [vehicleId]
      );

      vehicleImagesMap[vehicleId] = imagesForVehicle.rows || [];
    }

    // Attach vehicle images to vehicles
    const vehiclesWithImages = vehiclesRaw.map((vehicle: any) => ({
      ...vehicle,
      vehicle_images: vehicleImagesMap[vehicle.id] || [],
    }));

    const result = {
      ...packageData,
      images: imagesResult.rows || [],
      vehicles: vehiclesWithImages,
      stops: stopsResult.rows || [],
      additional_services: servicesResult.rows || [],
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
