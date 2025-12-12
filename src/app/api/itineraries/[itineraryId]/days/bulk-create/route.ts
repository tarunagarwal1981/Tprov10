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

    // Insert all days using a single query with multiple VALUES
    const values = days.map((day: any, index: number) => {
      const baseIndex = index * 6;
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`;
    }).join(', ');

    const paramsArray = days.flatMap((day: any) => {
      // Normalize date to YYYY-MM-DD to satisfy DATE column
      let normalizedDate = day.date;
      if (normalizedDate) {
        if (typeof normalizedDate === 'string') {
          normalizedDate = normalizedDate.split('T')[0];
        } else {
          const asDate = new Date(normalizedDate);
          normalizedDate = isNaN(asDate.getTime()) ? null : asDate.toISOString().split('T')[0];
        }
      }

      return [
        itineraryId,
        day.dayNumber,
        normalizedDate,
        day.cityName || null,
        day.displayOrder || day.dayNumber,
        day.timeSlots ? JSON.stringify(day.timeSlots) : JSON.stringify({
          morning: { time: '', activities: [], transfers: [] },
          afternoon: { time: '', activities: [], transfers: [] },
          evening: { time: '', activities: [], transfers: [] }
        }),
      ];
    });

    const insertQuery = `
      INSERT INTO itinerary_days (
        itinerary_id, day_number, date, city_name, display_order, time_slots
      ) VALUES ${values}
      RETURNING id, itinerary_id, day_number, date, city_name, display_order
    `;

    const insertResult = await query<any>(insertQuery, paramsArray);

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

