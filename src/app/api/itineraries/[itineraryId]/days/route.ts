import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';

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

    const result = await query<any>(
      `SELECT id, day_number, city_name, time_slots, display_order
       FROM itinerary_days 
       WHERE itinerary_id::text = $1 
       ORDER BY day_number ASC`,
      [itineraryId]
    );

    return NextResponse.json({ days: result.rows || [] });
  } catch (error) {
    console.error('Error fetching itinerary days:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itinerary days', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/itineraries/[itineraryId]/days
 * Create a new itinerary day
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;
    const body = await request.json();

    const {
      dayNumber,
      cityName,
      displayOrder,
      timeSlots = {
        morning: { time: '', activities: [], transfers: [] },
        afternoon: { time: '', activities: [], transfers: [] },
        evening: { time: '', activities: [], transfers: [] },
      },
    } = body;

    if (!dayNumber || !cityName) {
      return NextResponse.json(
        { error: 'Missing required fields: dayNumber, cityName' },
        { status: 400 }
      );
    }

    const result = await queryOne<{ id: string }>(
      `INSERT INTO itinerary_days (
        itinerary_id, day_number, city_name, display_order, time_slots
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [
        itineraryId,
        dayNumber,
        cityName,
        displayOrder || dayNumber,
        JSON.stringify(timeSlots),
      ]
    );

    if (!result || !result.id) {
      return NextResponse.json(
        { error: 'Failed to create itinerary day' },
        { status: 500 }
      );
    }

    return NextResponse.json({ day: { id: result.id }, created: true });
  } catch (error) {
    console.error('Error creating itinerary day:', error);
    return NextResponse.json(
      { error: 'Failed to create itinerary day', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
