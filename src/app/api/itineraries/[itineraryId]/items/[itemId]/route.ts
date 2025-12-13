import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/itineraries/[itineraryId]/items/[itemId]
 * Get a single itinerary item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string; itemId: string }> }
) {
  try {
    const { itineraryId, itemId } = await params;

    const result = await query<any>(
      `SELECT * FROM itinerary_items 
       WHERE itinerary_id::text = $1 AND id::text = $2
       LIMIT 1`,
      [itineraryId, itemId]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ item: result.rows[0] });
  } catch (error) {
    console.error('Error fetching itinerary item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itinerary item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/itineraries/[itineraryId]/items/[itemId]
 * Update an itinerary item
 * Body: { dayId?, packageTitle?, packageImageUrl?, configuration?, unitPrice?, quantity?, displayOrder?, notes? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string; itemId: string }> }
) {
  try {
    const { itineraryId, itemId } = await params;
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

    if (updates.dayId !== undefined) {
      updateFields.push(`day_id = $${paramIndex}`);
      updateValues.push(updates.dayId);
      paramIndex++;
    }

    if (updates.packageTitle !== undefined) {
      updateFields.push(`package_title = $${paramIndex}`);
      updateValues.push(updates.packageTitle);
      paramIndex++;
    }

    if (updates.packageImageUrl !== undefined) {
      updateFields.push(`package_image_url = $${paramIndex}`);
      updateValues.push(updates.packageImageUrl);
      paramIndex++;
    }

    if (updates.configuration !== undefined) {
      updateFields.push(`configuration = $${paramIndex}`);
      updateValues.push(JSON.stringify(updates.configuration));
      paramIndex++;
    }

    if (updates.unitPrice !== undefined) {
      updateFields.push(`unit_price = $${paramIndex}`);
      updateValues.push(updates.unitPrice);
      paramIndex++;
    }

    if (updates.quantity !== undefined) {
      updateFields.push(`quantity = $${paramIndex}`);
      updateValues.push(updates.quantity);
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

    // Recalculate total_price if unitPrice or quantity changed
    if (updates.unitPrice !== undefined || updates.quantity !== undefined) {
      const unitPrice = updates.unitPrice !== undefined 
        ? updates.unitPrice 
        : await query<{ unit_price: number }>(
            `SELECT unit_price FROM itinerary_items WHERE id::text = $1`,
            [itemId]
          ).then(r => r.rows[0]?.unit_price || 0);
      
      const quantity = updates.quantity !== undefined 
        ? updates.quantity 
        : await query<{ quantity: number }>(
            `SELECT quantity FROM itinerary_items WHERE id::text = $1`,
            [itemId]
          ).then(r => r.rows[0]?.quantity || 1);
      
      updateFields.push(`total_price = $${paramIndex}`);
      updateValues.push(unitPrice * quantity);
      paramIndex++;
    }

    // Add updated_at
    updateFields.push('updated_at = NOW()');
    updateValues.push(itineraryId, itemId);

    const updateQuery = `
      UPDATE itinerary_items 
      SET ${updateFields.join(', ')}
      WHERE itinerary_id::text = $${paramIndex} AND id::text = $${paramIndex + 1}
      RETURNING *
    `;

    const updateResult = await query<any>(updateQuery, updateValues);

    if (!updateResult.rows || updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Item not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ item: updateResult.rows[0] });
  } catch (error) {
    console.error('Error updating itinerary item:', error);
    return NextResponse.json(
      { error: 'Failed to update itinerary item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/itineraries/[itineraryId]/items/[itemId]
 * Delete an itinerary item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string; itemId: string }> }
) {
  try {
    const { itineraryId, itemId } = await params;

    const deleteResult = await query<any>(
      `DELETE FROM itinerary_items 
       WHERE itinerary_id::text = $1 AND id::text = $2
       RETURNING id`,
      [itineraryId, itemId]
    );

    if (!deleteResult.rows || deleteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      deleted: true,
      itemId: deleteResult.rows[0].id,
    });
  } catch (error) {
    console.error('Error deleting itinerary item:', error);
    return NextResponse.json(
      { error: 'Failed to delete itinerary item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

