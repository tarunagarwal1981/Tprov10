import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/operator/packages/activity/pricing/[id]/vehicles
 * Get vehicles for a specific pricing package
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get vehicles for this pricing package
    const vehiclesResult = await query<any>(
      `SELECT * FROM activity_pricing_package_vehicles 
       WHERE pricing_package_id::text = $1 
       ORDER BY display_order`,
      [id]
    ).catch(() => ({ rows: [] }));

    // Transform database rows (snake_case) to camelCase format
    const vehicles = (vehiclesResult.rows || []).map((v: any) => ({
      id: v.id,
      vehicleType: v.vehicle_type || 'SEDAN',
      vehicleName: v.vehicle_name || v.vehicle_type || 'Sedan',
      maxCapacity: v.capacity || v.max_capacity || 4,
      vehicleCategory: v.vehicle_category || 'Standard',
      price: v.price_adjustment || v.price || 0,
      description: v.description || undefined,
      displayOrder: v.display_order || 0,
    }));

    return NextResponse.json({ vehicles });
  } catch (error: any) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
