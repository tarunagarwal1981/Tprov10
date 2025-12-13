import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * DELETE /api/itineraries/[itineraryId]/items/[itemId]/delete
 * Delete an itinerary item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string; itemId: string }> }
) {
  try {
    const { itineraryId, itemId } = await params;

    const result = await query(
      `DELETE FROM itinerary_items 
       WHERE id::text = $1 AND itinerary_id::text = $2
       RETURNING id`,
      [itemId, itineraryId]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Itinerary item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting itinerary item:', error);
    return NextResponse.json(
      { error: 'Failed to delete itinerary item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

