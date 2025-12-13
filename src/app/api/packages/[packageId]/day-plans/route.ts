import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/packages/[packageId]/day-plans?type=multi_city_hotel
 * Get day plans for a package
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
        `SELECT id, package_id, city_id, day_number, city_name, title, description, photo_url, has_flights, time_slots
         FROM multi_city_hotel_package_day_plans 
         WHERE package_id::text = $1 
         ORDER BY day_number ASC`,
        [packageId]
      );

      return NextResponse.json({ dayPlans: result.rows || [] });
    } else {
      return NextResponse.json({ dayPlans: [] });
    }
  } catch (error) {
    console.error('Error fetching day plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch day plans', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

