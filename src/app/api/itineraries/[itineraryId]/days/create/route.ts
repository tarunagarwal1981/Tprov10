import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/itineraries/[itineraryId]/days/create
 * Create a new day for an itinerary
 * Body: { dayNumber, displayOrder? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;
    const { dayNumber, displayOrder } = await request.json();

    if (!dayNumber) {
      return NextResponse.json(
        { error: 'dayNumber is required' },
        { status: 400 }
      );
    }

    const finalDisplayOrder = displayOrder || dayNumber;

    // Insert itinerary day
    const insertResult = await query<{
      id: string;
      itinerary_id: string;
      day_number: number;
      display_order: number;
    }>(
      `INSERT INTO itinerary_days (
        itinerary_id, day_number, display_order
      ) VALUES ($1, $2, $3)
      RETURNING id, itinerary_id, day_number, display_order`,
      [itineraryId, dayNumber, finalDisplayOrder]
    );

    if (!insertResult.rows || insertResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create itinerary day' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      day: insertResult.rows[0],
      created: true,
    });
  } catch (error) {
    console.error('Error creating itinerary day:', error);
    return NextResponse.json(
      { error: 'Failed to create itinerary day', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

