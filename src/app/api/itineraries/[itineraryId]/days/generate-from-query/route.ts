import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/itineraries/[itineraryId]/days/generate-from-query
 * Generate days for an itinerary based on query destinations
 * Body: { queryId?: string, destinations?: Array<{ city: string; nights: number }>, leavingOn?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;
    const body = await request.json();
    
    const { queryId, destinations, leavingOn } = body;

    // Fetch query if queryId provided
    let queryData: any = null;
    if (queryId) {
      const queryResponse = await query<any>(
        `SELECT id, destinations, leaving_on 
         FROM itinerary_queries 
         WHERE id::text = $1`,
        [queryId]
      );
      
      if (queryResponse.rows && queryResponse.rows.length > 0) {
        queryData = queryResponse.rows[0];
      }
    }

    // Use provided destinations or from query
    const finalDestinations = destinations || queryData?.destinations || [];
    const finalLeavingOn = leavingOn || queryData?.leaving_on;

    if (!finalDestinations || !Array.isArray(finalDestinations) || finalDestinations.length === 0) {
      return NextResponse.json(
        { error: 'destinations are required and must not be empty' },
        { status: 400 }
      );
    }

    // Generate days using MultiCityHotelPackageForm logic
    const startDate = finalLeavingOn ? new Date(finalLeavingOn) : new Date();
    const newDays: any[] = [];
    let globalDayNumber = 1;
    const currentDate = new Date(startDate);

    finalDestinations.forEach((destination: any, cityIndex: number) => {
      const cityName = destination.city;
      const nights = destination.nights || 1;
      const isLastCity = cityIndex === finalDestinations.length - 1;
      const isFirstCity = cityIndex === 0;

      // Calculate days to create (same logic as MultiCityHotelPackageForm)
      const daysToCreate = isFirstCity && finalDestinations.length === 1 
        ? nights + 1 
        : isFirstCity 
        ? nights + 1 
        : nights;

      for (let i = 0; i < daysToCreate; i++) {
        const isArrivalDay = isFirstCity && i === 0;
        const isDepartureDay = i === daysToCreate - 1;
        const cityNightNumber = isFirstCity ? (i + 1) : (i + 2);

        let dayTitle = '';
        if (isArrivalDay) {
          dayTitle = `Arrival - ${cityName}`;
        } else if (isDepartureDay && !isLastCity) {
          dayTitle = `Departure ${cityName} / Arrival ${finalDestinations[cityIndex + 1]?.city || ''}`;
        } else if (isDepartureDay && isLastCity) {
          dayTitle = `Departure - ${cityName}`;
        } else {
          dayTitle = `Day ${globalDayNumber} - ${cityName} (Night ${cityNightNumber})`;
        }

        const dayDate = new Date(currentDate);
        dayDate.setDate(currentDate.getDate() + (isFirstCity ? i : i + (cityIndex > 0 ? 1 : 0)));

        newDays.push({
          dayNumber: globalDayNumber,
          date: dayDate.toISOString().split('T')[0] || null,
          cityName: cityName,
          title: dayTitle,
          displayOrder: globalDayNumber,
          timeSlots: {
            morning: { time: '08:00', activities: [], transfers: [] },
            afternoon: { time: '12:30', activities: [], transfers: [] },
            evening: { time: '17:00', activities: [], transfers: [] },
          },
        });

        globalDayNumber++;
      }

      if (!isLastCity) {
        currentDate.setDate(currentDate.getDate() + nights + 1);
      } else {
        currentDate.setDate(currentDate.getDate() + nights);
      }
    });

    // Create days via bulk-create endpoint logic
    if (newDays.length === 0) {
      return NextResponse.json(
        { error: 'No days generated from destinations' },
        { status: 400 }
      );
    }

    // Build INSERT query with all supported fields (excluding title as it doesn't exist in schema)
    const fieldNames = [
      'itinerary_id', 'day_number', 'date', 'city_name', 'display_order', 
      'time_slots', 'notes',
      'arrival_flight_id', 'arrival_time', 'departure_flight_id', 'departure_time',
      'hotel_id', 'hotel_name', 'hotel_star_rating', 'room_type', 'meal_plan',
      'lunch_included', 'lunch_details', 'dinner_included', 'dinner_details', 'arrival_description'
    ];
    
    const fieldCount = fieldNames.length;
    const values = newDays.map((day: any, index: number) => {
      const baseIndex = index * fieldCount;
      const placeholders = fieldNames.map((_, i) => `$${baseIndex + i + 1}`).join(', ');
      return `(${placeholders})`;
    }).join(', ');

    const paramsArray = newDays.flatMap((day: any) => [
      itineraryId,
      day.dayNumber,
      day.date || null,
      day.cityName || null,
      day.displayOrder || day.dayNumber,
      day.timeSlots ? JSON.stringify(day.timeSlots) : JSON.stringify({
        morning: { time: '08:00', activities: [], transfers: [] },
        afternoon: { time: '12:30', activities: [], transfers: [] },
        evening: { time: '17:00', activities: [], transfers: [] }
      }),
      day.notes || null,
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
        RETURNING id, itinerary_id, day_number, date, city_name, display_order, notes, time_slots
      `;

      insertResult = await query<any>(insertQuery, paramsArray);
    } catch (error: any) {
      // If enhanced columns don't exist, fallback to basic fields only
      if (error?.message?.includes('column') || error?.code === '42703') {
        console.warn('Enhanced columns not found, using basic fields only');
        
        const basicFields = ['itinerary_id', 'day_number', 'date', 'city_name', 'display_order', 'time_slots'];
        const basicFieldCount = basicFields.length;
        const basicValues = newDays.map((day: any, index: number) => {
          const baseIndex = index * basicFieldCount;
          const placeholders = basicFields.map((_, i) => `$${baseIndex + i + 1}`).join(', ');
          return `(${placeholders})`;
        }).join(', ');

        const basicParamsArray = newDays.flatMap((day: any) => [
          itineraryId,
          day.dayNumber,
          day.date || null,
          day.cityName || null,
          day.displayOrder || day.dayNumber,
          day.timeSlots ? JSON.stringify(day.timeSlots) : JSON.stringify({
            morning: { time: '08:00', activities: [], transfers: [] },
            afternoon: { time: '12:30', activities: [], transfers: [] },
            evening: { time: '17:00', activities: [], transfers: [] }
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

    // Ensure time_slots exist for each day
    const days = insertResult.rows.map((day: any) => ({
      ...day,
      time_slots: day.time_slots || {
        morning: { time: '08:00', activities: [], transfers: [] },
        afternoon: { time: '12:30', activities: [], transfers: [] },
        evening: { time: '17:00', activities: [], transfers: [] },
      },
    }));

    return NextResponse.json({
      days,
      created: true,
      count: days.length,
    });
  } catch (error) {
    console.error('Error generating days from query:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate days from query', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

