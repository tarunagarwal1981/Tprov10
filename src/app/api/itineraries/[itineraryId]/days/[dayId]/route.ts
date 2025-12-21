import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PATCH /api/itineraries/[itineraryId]/days/[dayId]
 * Update an itinerary day
 * Body: { 
 *   cityName?, date?, displayOrder?, timeSlots?, notes?, title?,
 *   arrivalFlightId?, arrivalTime?, departureFlightId?, departureTime?,
 *   hotelId?, hotelName?, hotelStarRating?, roomType?, mealPlan?,
 *   lunchIncluded?, lunchDetails?, dinnerIncluded?, dinnerDetails?, arrivalDescription?
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string; dayId: string }> }
) {
  const { itineraryId, dayId } = await params;
  let updates: any = null;
  
  // Parse request body first (can only be read once)
  try {
    updates = await request.json();
  } catch (parseError) {
    console.error('[Update Day] JSON parse error:', parseError);
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  try {

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No update fields provided' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    // Handle all fields with backward compatibility
    const fieldMappings: Record<string, string> = {
      cityName: 'city_name',
      date: 'date',
      displayOrder: 'display_order',
      timeSlots: 'time_slots',
      notes: 'notes',
      title: 'title',
      arrivalFlightId: 'arrival_flight_id',
      arrivalTime: 'arrival_time',
      departureFlightId: 'departure_flight_id',
      departureTime: 'departure_time',
      hotelId: 'hotel_id',
      hotelName: 'hotel_name',
      hotelStarRating: 'hotel_star_rating',
      roomType: 'room_type',
      mealPlan: 'meal_plan',
      lunchIncluded: 'lunch_included',
      lunchDetails: 'lunch_details',
      dinnerIncluded: 'dinner_included',
      dinnerDetails: 'dinner_details',
      arrivalDescription: 'arrival_description',
    };

    // Process each field
    for (const [key, dbColumn] of Object.entries(fieldMappings)) {
      if (updates[key] !== undefined) {
        if (key === 'timeSlots') {
          // time_slots needs JSON stringification and casting to JSONB
          updateFields.push(`${dbColumn} = $${paramIndex}::jsonb`);
          // Ensure it's a valid JSON object
          const timeSlotsValue = typeof updates[key] === 'string' 
            ? updates[key] 
            : JSON.stringify(updates[key]);
          updateValues.push(timeSlotsValue);
        } else {
          updateFields.push(`${dbColumn} = $${paramIndex}`);
          updateValues.push(updates[key]);
        }
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No valid update fields provided' },
        { status: 400 }
      );
    }

    // Add updated_at
    updateFields.push('updated_at = NOW()');
    updateValues.push(itineraryId, dayId);

    // Try to return all enhanced fields, fallback to basic if they don't exist
    const returnFields = [
      'id', 'itinerary_id', 'day_number', 'date', 'city_name', 'display_order', 
      'notes', 'title', 'time_slots',
      'arrival_flight_id', 'arrival_time', 'departure_flight_id', 'departure_time',
      'hotel_id', 'hotel_name', 'hotel_star_rating', 'room_type', 'meal_plan',
      'lunch_included', 'lunch_details', 'dinner_included', 'dinner_details', 
      'arrival_description', 'created_at', 'updated_at'
    ].join(', ');

    const updateQuery = `
      UPDATE itinerary_days 
      SET ${updateFields.join(', ')}
      WHERE itinerary_id::text = $${paramIndex} AND id::text = $${paramIndex + 1}
      RETURNING ${returnFields}
    `;

    const updateResult = await query<any>(updateQuery, updateValues);

    if (!updateResult.rows || updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Day not found or update failed' },
        { status: 404 }
      );
    }

    // Fetch time_slots if column exists (with fallback)
    const day = updateResult.rows[0];
    try {
      const timeSlotsResult = await query<any>(
        `SELECT time_slots FROM itinerary_days WHERE id::text = $1`,
        [dayId]
      );
      if (timeSlotsResult.rows[0]?.time_slots) {
        day.time_slots = timeSlotsResult.rows[0].time_slots;
      } else {
        day.time_slots = {
          morning: { time: '', activities: [], transfers: [] },
          afternoon: { time: '', activities: [], transfers: [] },
          evening: { time: '', activities: [], transfers: [] },
        };
      }
    } catch (error) {
      // Column doesn't exist, provide default
      day.time_slots = {
        morning: { time: '', activities: [], transfers: [] },
        afternoon: { time: '', activities: [], transfers: [] },
        evening: { time: '', activities: [], transfers: [] },
      };
    }

    return NextResponse.json({ day });
  } catch (error: any) {
    console.error('[Update Day] Error:', error);
    console.error('[Update Day] Error message:', error?.message);
    console.error('[Update Day] Error code:', error?.code);
    
    // If error is about time_slots column, retry without it
    if (updates && (error?.message?.includes('time_slots') || error?.code === '42703' || error?.message?.includes('column') || error?.message?.includes('does not exist'))) {
      console.warn('[Update Day] time_slots column not found, retrying update without it');
      // Remove time_slots from updates and retry (updates already parsed above)
      const { timeSlots, ...otherUpdates } = updates;
      if (Object.keys(otherUpdates).length > 0) {
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramIndex = 1;

        if (otherUpdates.cityName !== undefined) {
          updateFields.push(`city_name = $${paramIndex}`);
          updateValues.push(otherUpdates.cityName);
          paramIndex++;
        }
        if (otherUpdates.date !== undefined) {
          updateFields.push(`date = $${paramIndex}`);
          updateValues.push(otherUpdates.date);
          paramIndex++;
        }
        if (otherUpdates.displayOrder !== undefined) {
          updateFields.push(`display_order = $${paramIndex}`);
          updateValues.push(otherUpdates.displayOrder);
          paramIndex++;
        }
        if (otherUpdates.notes !== undefined) {
          updateFields.push(`notes = $${paramIndex}`);
          updateValues.push(otherUpdates.notes);
          paramIndex++;
        }

        if (updateFields.length > 0) {
          updateFields.push('updated_at = NOW()');
          updateValues.push(itineraryId, dayId);

          const updateQuery = `
            UPDATE itinerary_days 
            SET ${updateFields.join(', ')}
            WHERE itinerary_id::text = $${paramIndex} AND id::text = $${paramIndex + 1}
            RETURNING id, itinerary_id, day_number, date, city_name, display_order, notes, created_at, updated_at
          `;

          const updateResult = await query<any>(updateQuery, updateValues);
          if (updateResult.rows && updateResult.rows.length > 0) {
            const day = updateResult.rows[0];
            day.time_slots = {
              morning: { time: '', activities: [], transfers: [] },
              afternoon: { time: '', activities: [], transfers: [] },
              evening: { time: '', activities: [], transfers: [] },
            };
            return NextResponse.json({ day });
          }
        }
      }
    }

    console.error('Error updating itinerary day:', error);
    return NextResponse.json(
      { error: 'Failed to update itinerary day', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/itineraries/[itineraryId]/days/[dayId]
 * Delete an itinerary day
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string; dayId: string }> }
) {
  try {
    const { itineraryId, dayId } = await params;

    const deleteResult = await query<any>(
      `DELETE FROM itinerary_days 
       WHERE itinerary_id::text = $1 AND id::text = $2
       RETURNING id`,
      [itineraryId, dayId]
    );

    if (!deleteResult.rows || deleteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Day not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      deleted: true,
      dayId: deleteResult.rows[0].id,
    });
  } catch (error) {
    console.error('Error deleting itinerary day:', error);
    return NextResponse.json(
      { error: 'Failed to delete itinerary day', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

