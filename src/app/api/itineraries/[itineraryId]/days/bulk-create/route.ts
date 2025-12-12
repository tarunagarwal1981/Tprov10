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

    // Normalize dates and prepare data
    const normalizedDays = days.map((day: any) => {
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

      return {
        itineraryId,
        dayNumber: day.dayNumber,
        date: normalizedDate,
        cityName: day.cityName || null,
        displayOrder: day.displayOrder || day.dayNumber,
        timeSlots: day.timeSlots ? JSON.stringify(day.timeSlots) : JSON.stringify({
          morning: { time: '', activities: [], transfers: [] },
          afternoon: { time: '', activities: [], transfers: [] },
          evening: { time: '', activities: [], transfers: [] }
        }),
      };
    });

    // Try inserting with time_slots first, fallback to without if column doesn't exist
    let insertResult;
    try {
      // Build query with time_slots
      const values = normalizedDays.map((day: any, index: number) => {
        const baseIndex = index * 6;
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`;
      }).join(', ');

      const paramsArray = normalizedDays.flatMap((day: any) => [
        day.itineraryId,
        day.dayNumber,
        day.date,
        day.cityName,
        day.displayOrder,
        day.timeSlots,
      ]);

      const insertQuery = `
        INSERT INTO itinerary_days (
          itinerary_id, day_number, date, city_name, display_order, time_slots
        ) VALUES ${values}
        RETURNING id, itinerary_id, day_number, date, city_name, display_order
      `;

      insertResult = await query<any>(insertQuery, paramsArray);
    } catch (error: any) {
      // If time_slots column doesn't exist, try without it
      if (error.message?.includes('time_slots') || error.message?.includes('column') || error.message?.includes('does not exist')) {
        console.warn('time_slots column not found, inserting without it');
        
        const values = normalizedDays.map((day: any, index: number) => {
          const baseIndex = index * 5;
          return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5})`;
        }).join(', ');

        const paramsArray = normalizedDays.flatMap((day: any) => [
          day.itineraryId,
          day.dayNumber,
          day.date,
          day.cityName,
          day.displayOrder,
        ]);

        const insertQuery = `
          INSERT INTO itinerary_days (
            itinerary_id, day_number, date, city_name, display_order
          ) VALUES ${values}
          RETURNING id, itinerary_id, day_number, date, city_name, display_order
        `;

        insertResult = await query<any>(insertQuery, paramsArray);
      } else {
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack, itineraryId, daysCount: days?.length });
    
    return NextResponse.json(
      { 
        error: 'Failed to create itinerary days', 
        details: errorMessage,
        // Include more details in development
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}

