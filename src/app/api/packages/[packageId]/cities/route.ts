import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/packages/[packageId]/cities?type=multi_city_hotel
 * Get cities for a package
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const packageType = searchParams.get('type') || 'multi_city_hotel';

    if (packageType === 'multi_city_hotel') {
      const result = await query<any>(
        `SELECT id, name, nights, display_order, country
         FROM multi_city_hotel_package_cities 
         WHERE package_id::text = $1 
         ORDER BY display_order ASC`,
        [packageId]
      );

      return NextResponse.json({ cities: result.rows || [] });
    } else if (packageType === 'multi_city') {
      // For multi_city packages, fetch from multi_city_package_cities table
      const result = await query<any>(
        `SELECT id, name, nights, city_order as display_order, country
         FROM multi_city_package_cities 
         WHERE package_id::text = $1 
         ORDER BY city_order ASC`,
        [packageId]
      );

      return NextResponse.json({ cities: result.rows || [] });
    } else {
      return NextResponse.json({ cities: [] });
    }
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

