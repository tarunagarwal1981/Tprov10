import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/itineraries/[itineraryId]/days/bulk-create
 * Create multiple days for an itinerary
 * Body: { days: Array<{ 
 *   dayNumber, date, cityName, displayOrder, timeSlots?, notes?,
 *   title?, arrivalFlightId?, arrivalTime?, departureFlightId?, departureTime?,
 *   hotelId?, hotelName?, hotelStarRating?, roomType?, mealPlan?,
 *   lunchIncluded?, lunchDetails?, dinnerIncluded?, dinnerDetails?, arrivalDescription?
 * }> }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  let itineraryId: string | undefined;
  let days: any;
  
  try {
    const paramsResult = await params;
    itineraryId = paramsResult.itineraryId;
    const body = await request.json();
    
    // Extract days from request body (body.days or body itself if it's an array)
    days = body.days || body;
    
    console.log('Received request:', { 
      bodyKeys: Object.keys(body), 
      hasDaysProperty: 'days' in body,
      daysIsArray: Array.isArray(days),
      daysLength: Array.isArray(days) ? days.length : 'not an array',
      itineraryId 
    });

    if (!days || !Array.isArray(days) || days.length === 0) {
      console.error('Invalid days array:', { days, body });
      return NextResponse.json(
        { error: 'days array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Build INSERT query with all supported fields
    // Fields: itinerary_id, day_number, date, city_name, display_order, time_slots, notes, title,
    //         arrival_flight_id, arrival_time, departure_flight_id, departure_time,
    //         hotel_id, hotel_name, hotel_star_rating, room_type, meal_plan,
    //         lunch_included, lunch_details, dinner_included, dinner_details, arrival_description
    
    const fieldNames = [
      'itinerary_id', 'day_number', 'date', 'city_name', 'display_order', 
      'time_slots', 'notes', 'title',
      'arrival_flight_id', 'arrival_time', 'departure_flight_id', 'departure_time',
      'hotel_id', 'hotel_name', 'hotel_star_rating', 'room_type', 'meal_plan',
      'lunch_included', 'lunch_details', 'dinner_included', 'dinner_details', 'arrival_description'
    ];
    
    const fieldCount = fieldNames.length;
    const values = days.map((day: any, index: number) => {
      const baseIndex = index * fieldCount;
      const placeholders = fieldNames.map((_, i) => `$${baseIndex + i + 1}`).join(', ');
      return `(${placeholders})`;
    }).join(', ');

    const paramsArray = days.flatMap((day: any) => [
      itineraryId,
      day.dayNumber,
      day.date || null,
      day.cityName || null,
      day.displayOrder || day.dayNumber,
      day.timeSlots ? JSON.stringify(day.timeSlots) : JSON.stringify({
        morning: { time: '', activities: [], transfers: [] },
        afternoon: { time: '', activities: [], transfers: [] },
        evening: { time: '', activities: [], transfers: [] }
      }),
      day.notes || null,
      day.title || null,
      day.arrivalFlightId || null,
      day.arrivalTime || null,
      day.departureFlightId || null,
      day.departureTime || null,
      day.hotelId || null,
      day.hotelName || null,
      day.hotelStarRating || null,
      day.roomType || null,
      day.mealPlan || null,
      day.lunchIncluded || false,
      day.lunchDetails || null,
      day.dinnerIncluded || false,
      day.dinnerDetails || null,
      day.arrivalDescription || null,
    ]);

    // Try with all fields first, fallback to basic fields if enhanced columns don't exist
    let insertResult;
    try {
      const insertQuery = `
        INSERT INTO itinerary_days (
          ${fieldNames.join(', ')}
        ) VALUES ${values}
        RETURNING id, itinerary_id, day_number, date, city_name, display_order, notes, title, time_slots
      `;

      insertResult = await query<any>(insertQuery, paramsArray);
    } catch (error: any) {
      // If enhanced columns don't exist, fallback to basic fields only
      if (error?.message?.includes('column') || error?.code === '42703') {
        console.warn('Enhanced columns not found, using basic fields only');
        
        const basicFields = ['itinerary_id', 'day_number', 'date', 'city_name', 'display_order', 'time_slots'];
        const basicFieldCount = basicFields.length;
        const basicValues = days.map((day: any, index: number) => {
          const baseIndex = index * basicFieldCount;
          const placeholders = basicFields.map((_, i) => `$${baseIndex + i + 1}`).join(', ');
          return `(${placeholders})`;
        }).join(', ');

        const basicParamsArray = days.flatMap((day: any) => [
          itineraryId,
          day.dayNumber,
          day.date || null,
          day.cityName || null,
          day.displayOrder || day.dayNumber,
          day.timeSlots ? JSON.stringify(day.timeSlots) : JSON.stringify({
            morning: { time: '', activities: [], transfers: [] },
            afternoon: { time: '', activities: [], transfers: [] },
            evening: { time: '', activities: [], transfers: [] }
          }),
        ]);

        const basicInsertQuery = `
          INSERT INTO itinerary_days (
            ${basicFields.join(', ')}
          ) VALUES ${basicValues}
          RETURNING id, itinerary_id, day_number, date, city_name, display_order
        `;

        insertResult = await query<any>(basicInsertQuery, basicParamsArray);
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
    console.error('Error details:', { 
      errorMessage, 
      errorStack, 
      itineraryId: itineraryId || 'unknown', 
      daysCount: days?.length || 0 
    });
    
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

