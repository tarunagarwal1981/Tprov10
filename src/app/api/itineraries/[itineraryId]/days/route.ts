import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/itineraries/[itineraryId]/days
 * Get all days for an itinerary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;

    // Fetch itinerary days
    const result = await query<any>(
      `SELECT * FROM itinerary_days 
       WHERE itinerary_id::text = $1 
       ORDER BY day_number ASC`,
      [itineraryId]
    );

    // Ensure time_slots exists for each day
    const days = result.rows.map((day: any) => ({
      ...day,
      time_slots: day.time_slots || {
        morning: { time: '', activities: [], transfers: [] },
        afternoon: { time: '', activities: [], transfers: [] },
        evening: { time: '', activities: [], transfers: [] },
      },
    }));

    return NextResponse.json({ days });
  } catch (error) {
    console.error('Error fetching itinerary days:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itinerary days', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

