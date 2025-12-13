import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/itineraries/[itineraryId]/items/[itemId]
 * Get a single itinerary item by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string; itemId: string }> }
) {
  try {
    const { itineraryId, itemId } = await params;

    // Fetch itinerary item
    const item = await queryOne<any>(
      `SELECT * FROM itinerary_items 
       WHERE id::text = $1 AND itinerary_id::text = $2`,
      [itemId, itineraryId]
    );

    if (!item) {
      return NextResponse.json(
        { error: 'Itinerary item not found' },
        { status: 404 }
      );
    }

    // Parse configuration JSON if it's a string
    if (item.configuration && typeof item.configuration === 'string') {
      try {
        item.configuration = JSON.parse(item.configuration);
      } catch (e) {
        console.warn('Failed to parse configuration JSON:', e);
        item.configuration = {};
      }
    }

    return NextResponse.json({ item });
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
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string; itemId: string }> }
) {
  try {
    const { itineraryId, itemId } = await params;
    const body = await request.json();

    const {
      dayId,
      configuration,
      unitPrice,
      quantity,
      displayOrder,
      notes,
    } = body;

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dayId !== undefined) {
      updates.push(`day_id = $${paramIndex++}`);
      values.push(dayId);
    }

    if (configuration !== undefined) {
      updates.push(`configuration = $${paramIndex++}`);
      values.push(JSON.stringify(configuration));
    }

    if (unitPrice !== undefined) {
      updates.push(`unit_price = $${paramIndex++}`);
      values.push(unitPrice);
    }

    if (quantity !== undefined) {
      updates.push(`quantity = $${paramIndex++}`);
      values.push(quantity);
      // Update total_price if quantity or unitPrice changed
      if (unitPrice !== undefined) {
        updates.push(`total_price = $${paramIndex++}`);
        values.push(unitPrice * quantity);
      } else {
        // Need to get current unit_price
        const currentItem = await queryOne<any>(
          `SELECT unit_price FROM itinerary_items WHERE id::text = $1`,
          [itemId]
        );
        if (currentItem) {
          updates.push(`total_price = $${paramIndex++}`);
          values.push((currentItem.unit_price || 0) * quantity);
        }
      }
    } else if (unitPrice !== undefined) {
      // Quantity not provided, get current quantity
      const currentItem = await queryOne<any>(
        `SELECT quantity FROM itinerary_items WHERE id::text = $1`,
        [itemId]
      );
      if (currentItem) {
        updates.push(`total_price = $${paramIndex++}`);
        values.push(unitPrice * (currentItem.quantity || 1));
      }
    }

    if (displayOrder !== undefined) {
      updates.push(`display_order = $${paramIndex++}`);
      values.push(displayOrder);
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
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
    values.push(itemId, itineraryId);

    const updateQuery = `
      UPDATE itinerary_items 
      SET ${updates.join(', ')}
      WHERE id::text = $${paramIndex++} AND itinerary_id::text = $${paramIndex++}
      RETURNING *
    `;

    const result = await queryOne<any>(updateQuery, values);

    if (!result) {
      return NextResponse.json(
        { error: 'Itinerary item not found or update failed' },
        { status: 404 }
      );
    }

    // Parse configuration JSON if it's a string
    if (result.configuration && typeof result.configuration === 'string') {
      try {
        result.configuration = JSON.parse(result.configuration);
      } catch (e) {
        console.warn('Failed to parse configuration JSON:', e);
        result.configuration = {};
      }
    }

    return NextResponse.json({ item: result, updated: true });
  } catch (error) {
    console.error('Error updating itinerary item:', error);
    return NextResponse.json(
      { error: 'Failed to update itinerary item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


