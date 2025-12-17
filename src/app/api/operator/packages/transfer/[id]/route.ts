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
    const [imagesResult, vehiclesResult, hourlyPricingResult, p2pPricingResult] = await Promise.all([
      query<any>(`SELECT * FROM transfer_package_images WHERE package_id::text = $1 ORDER BY display_order`, [id]),
      query<any>(`SELECT * FROM transfer_package_vehicles WHERE package_id::text = $1 ORDER BY display_order`, [id]),
      query<any>(`SELECT * FROM transfer_hourly_pricing WHERE package_id::text = $1 ORDER BY display_order`, [id]),
      query<any>(`SELECT * FROM transfer_point_to_point_pricing WHERE package_id::text = $1 ORDER BY display_order`, [id]),
    ]);

    // Get vehicle IDs to fetch their images
    const vehicleIds = (vehiclesResult.rows || []).map((v: any) => v.id);
    let vehicleImagesResult: any = { rows: [] };
    
    if (vehicleIds.length > 0) {
      try {
        vehicleImagesResult = await query<any>(
          `SELECT * FROM transfer_vehicle_images WHERE vehicle_id = ANY($1) ORDER BY display_order`,
          [vehicleIds]
        );
      } catch (error: any) {
        // Table might not exist yet, just log and continue without vehicle images
        if (error.message && error.message.includes('does not exist')) {
          console.warn('transfer_vehicle_images table does not exist yet, skipping vehicle images');
        } else {
          throw error; // Re-throw if it's a different error
        }
      }
    }

    // Group vehicle images by vehicle_id
    const vehicleImagesMap: { [key: string]: any[] } = {};
    (vehicleImagesResult.rows || []).forEach((img: any) => {
      const vehicleId = img.vehicle_id;
      if (!vehicleImagesMap[vehicleId]) {
        vehicleImagesMap[vehicleId] = [];
      }
      vehicleImagesMap[vehicleId].push(img);
    });

    // Attach vehicle images to vehicles
    const vehiclesWithImages = (vehiclesResult.rows || []).map((vehicle: any) => ({
      ...vehicle,
      vehicle_images: vehicleImagesMap[vehicle.id] || [],
    }));

    const result = {
      ...packageData,
      images: imagesResult.rows || [],
      vehicles: vehiclesWithImages,
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
