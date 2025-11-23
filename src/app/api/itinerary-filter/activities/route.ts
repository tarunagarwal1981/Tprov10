import { NextRequest, NextResponse } from 'next/server';
import { SmartItineraryFilter } from '@/lib/services/smartItineraryFilter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/itinerary-filter/activities?city=xxx&country=xxx
 * Get activities for a city
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city') || '';
    const country = searchParams.get('country') || '';

    const filterService = new SmartItineraryFilter();
    const activities = await filterService.getActivitiesForCity(city, country || undefined);
    
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

