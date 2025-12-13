import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/itineraries/[itineraryId]/days/bulk-create
 * Create multiple days for an itinerary
 * Body: { days: Array<{ dayNumber, date, cityName, displayOrder, timeSlots?, notes? }> }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;
    const { days } = await request.json();

    if (!days || !Array.isArray(days) || days.length === 0) {
      return NextResponse.json(
        { error: 'days array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Try to insert with time_slots first, fallback to without if column doesn't exist
    let insertResult;
    let useTimeSlots = true;

    // First attempt: try with time_slots column
    try {
      const values = days.map((day: any, index: number) => {
        const baseIndex = index * 6;
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`;
      }).join(', ');

      const paramsArray = days.flatMap((day: any) => [
        itineraryId,
        day.dayNumber,
        day.date,
        day.cityName || null,
        day.displayOrder || day.dayNumber,
        day.timeSlots ? JSON.stringify(day.timeSlots) : JSON.stringify({
          morning: { time: '', activities: [], transfers: [] },
          afternoon: { time: '', activities: [], transfers: [] },
          evening: { time: '', activities: [], transfers: [] }
        }),
      ]);

      const insertQuery = `
        INSERT INTO itinerary_days (
          itinerary_id, day_number, date, city_name, display_order, time_slots
        ) VALUES ${values}
        RETURNING id, itinerary_id, day_number, date, city_name, display_order
      `;

      insertResult = await query<any>(insertQuery, paramsArray);
    } catch (error: any) {
      // If error is about time_slots column not existing, retry without it
      if (error?.message?.includes('time_slots') || error?.code === '42703') {
        console.warn('time_slots column not found, inserting without it');
        useTimeSlots = false;
        
        const values = days.map((day: any, index: number) => {
          const baseIndex = index * 5;
          return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5})`;
        }).join(', ');

        const paramsArray = days.flatMap((day: any) => [
          itineraryId,
          day.dayNumber,
          day.date,
          day.cityName || null,
          day.displayOrder || day.dayNumber,
        ]);

        const insertQuery = `
          INSERT INTO itinerary_days (
            itinerary_id, day_number, date, city_name, display_order
          ) VALUES ${values}
          RETURNING id, itinerary_id, day_number, date, city_name, display_order
        `;

        insertResult = await query<any>(insertQuery, paramsArray);
      } else {
        // Re-throw if it's a different error
        throw error;
      }
    }

    if (!insertResult.rows || insertResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create itinerary days' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      days: insertResult.rows,
      created: true,
      count: insertResult.rows.length,
    });
  } catch (error) {
    console.error('Error creating itinerary days:', error);
    return NextResponse.json(
      { error: 'Failed to create itinerary days', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

