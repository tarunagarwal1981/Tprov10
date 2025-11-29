import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PATCH /api/itineraries/[itineraryId]/update
 * Update itinerary fields
 * Body: { status?, name?, adults_count?, children_count?, infants_count?, ... }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;
    const updates = await request.json();

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No update fields provided' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const allowedFields = [
      'status', 'name', 'adults_count', 'children_count', 'infants_count',
      'start_date', 'end_date', 'notes', 'updated_at'
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'updated_at' && !value) {
          updateFields.push(`${key} = NOW()`);
        } else {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(value);
          paramIndex++;
        }
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No valid update fields provided' },
        { status: 400 }
      );
    }

    // Add updated_at if not already included
    if (!updateFields.some(f => f.includes('updated_at'))) {
      updateFields.push('updated_at = NOW()');
    }

    updateValues.push(itineraryId);

    const updateQuery = `
      UPDATE itineraries 
      SET ${updateFields.join(', ')}
      WHERE id::text = $${paramIndex}
      RETURNING *
    `;

    const updateResult = await query<any>(updateQuery, updateValues);

    if (!updateResult.rows || updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Itinerary not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      itinerary: updateResult.rows[0],
      updated: true,
    });
  } catch (error) {
    console.error('Error updating itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to update itinerary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

