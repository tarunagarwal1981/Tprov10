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

    // Fetch itinerary days - explicitly list columns to avoid issues if time_slots doesn't exist
    // Try with time_slots first, fallback to without if column doesn't exist
    let result;
    let hasTimeSlots = true;

    try {
      // First attempt: try selecting with time_slots
      result = await query<any>(
        `SELECT id, itinerary_id, day_number, date, city_name, display_order, notes, 
                created_at, updated_at, time_slots
         FROM itinerary_days 
         WHERE itinerary_id::text = $1 
         ORDER BY day_number ASC`,
        [itineraryId]
      );
    } catch (error: any) {
      // If error is about time_slots column not existing, retry without it
      if (error?.message?.includes('time_slots') || error?.code === '42703') {
        console.warn('time_slots column not found, selecting without it');
        hasTimeSlots = false;
        
        result = await query<any>(
          `SELECT id, itinerary_id, day_number, date, city_name, display_order, notes, 
                  created_at, updated_at
           FROM itinerary_days 
           WHERE itinerary_id::text = $1 
           ORDER BY day_number ASC`,
          [itineraryId]
        );
      } else {
        // Re-throw if it's a different error
        throw error;
      }
    }

    // Ensure time_slots exists for each day (provide default if column doesn't exist or is null)
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
