import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PATCH /api/itineraries/[itineraryId]/days/[dayId]
 * Update an itinerary day
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string; dayId: string }> }
) {
  try {
    const { itineraryId, dayId } = await params;
    const body = await request.json();

    const {
      cityName,
      timeSlots,
      displayOrder,
    } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (cityName !== undefined) {
      updates.push(`city_name = $${paramIndex++}`);
      values.push(cityName);
    }

    if (timeSlots !== undefined) {
      updates.push(`time_slots = $${paramIndex++}`);
      values.push(JSON.stringify(timeSlots));
    }

    if (displayOrder !== undefined) {
      updates.push(`display_order = $${paramIndex++}`);
      values.push(displayOrder);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`);

    // Add WHERE clause params
    values.push(dayId, itineraryId);

    const updateQuery = `
      UPDATE itinerary_days 
      SET ${updates.join(', ')}
      WHERE id::text = $${paramIndex++} AND itinerary_id::text = $${paramIndex++}
      RETURNING *
    `;

    const result = await queryOne<any>(updateQuery, values);

    if (!result) {
      return NextResponse.json(
        { error: 'Itinerary day not found or update failed' },
        { status: 404 }
      );
    }

    // Parse time_slots JSON if it's a string
    if (result.time_slots && typeof result.time_slots === 'string') {
      try {
        result.time_slots = JSON.parse(result.time_slots);
      } catch (e) {
        console.warn('Failed to parse time_slots JSON:', e);
        result.time_slots = {};
      }
    }

    return NextResponse.json({ day: result, updated: true });
  } catch (error) {
    console.error('Error updating itinerary day:', error);
    return NextResponse.json(
      { error: 'Failed to update itinerary day', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

