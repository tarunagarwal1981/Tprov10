import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/itineraries/[itineraryId]/items
 * Get all items for an itinerary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;

    // Fetch itinerary items
    const result = await query<any>(
      `SELECT * FROM itinerary_items 
       WHERE itinerary_id::text = $1 
       ORDER BY display_order ASC`,
      [itineraryId]
    );

    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error('Error fetching itinerary items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itinerary items', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

