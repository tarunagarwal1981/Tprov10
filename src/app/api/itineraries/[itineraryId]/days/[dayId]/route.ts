import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PATCH /api/itineraries/[itineraryId]/days/[dayId]
 * Update an itinerary day
 * Body: { cityName?, date?, displayOrder?, timeSlots?, notes? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string; dayId: string }> }
) {
  try {
    const { itineraryId, dayId } = await params;
    const updates = await request.json();

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

    // Handle time_slots with backward compatibility
    if (updates.timeSlots !== undefined) {
      // Try to update with time_slots first, fallback without if column doesn't exist
      try {
        updateFields.push(`time_slots = $${paramIndex}`);
        updateValues.push(JSON.stringify(updates.timeSlots));
        paramIndex++;
      } catch (error) {
        // If time_slots column doesn't exist, skip it
        console.warn('time_slots column not found, skipping update');
      }
    }

    // Handle other fields
    if (updates.cityName !== undefined) {
      updateFields.push(`city_name = $${paramIndex}`);
      updateValues.push(updates.cityName);
      paramIndex++;
    }

    if (updates.date !== undefined) {
      updateFields.push(`date = $${paramIndex}`);
      updateValues.push(updates.date);
      paramIndex++;
    }

    if (updates.displayOrder !== undefined) {
      updateFields.push(`display_order = $${paramIndex}`);
      updateValues.push(updates.displayOrder);
      paramIndex++;
    }

    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`);
      updateValues.push(updates.notes);
      paramIndex++;
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

    const updateQuery = `
      UPDATE itinerary_days 
      SET ${updateFields.join(', ')}
      WHERE itinerary_id::text = $${paramIndex} AND id::text = $${paramIndex + 1}
      RETURNING id, itinerary_id, day_number, date, city_name, display_order, notes, created_at, updated_at
    `;

    const updateResult = await query<any>(updateQuery, updateValues);

    if (!updateResult.rows || updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Day not found or update failed' },
        { status: 404 }
      );
    }

    // Fetch time_slots if column exists (with fallback)
    let day = updateResult.rows[0];
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
    // If error is about time_slots column, retry without it
    if (error?.message?.includes('time_slots') || error?.code === '42703') {
      console.warn('time_slots column not found, retrying update without it');
      // Remove time_slots from updates and retry
      const body = await request.json();
      const { timeSlots, ...otherUpdates } = body;
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

