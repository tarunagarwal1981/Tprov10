import { NextRequest, NextResponse } from 'next/server';
import { SmartItineraryFilter } from '@/lib/services/smartItineraryFilter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/itinerary-filter/transfers?from=xxx&to=xxx
 * Get transfers for a route
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    const filterService = new SmartItineraryFilter();
    const transfers = await filterService.getTransfersForRoute(from, to);
    
    return NextResponse.json({ transfers });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transfers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

