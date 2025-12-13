import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/packages/[packageId]/hotels?cityIds=id1,id2,id3
 * Get hotels for cities in a package
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const cityIdsParam = searchParams.get('cityIds');

    if (!cityIdsParam) {
      return NextResponse.json({ hotels: [] });
    }

    const cityIds = cityIdsParam.split(',').filter(id => id.trim());

    if (cityIds.length === 0) {
      return NextResponse.json({ hotels: [] });
    }

    // Create placeholders for the IN clause
    const placeholders = cityIds.map((_, index) => `$${index + 1}`).join(',');

    const result = await query<any>(
      `SELECT * FROM multi_city_hotel_package_city_hotels 
       WHERE city_id::text IN (${placeholders})
       ORDER BY display_order ASC`,
      cityIds
    );

    return NextResponse.json({ hotels: result.rows || [] });
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotels', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

