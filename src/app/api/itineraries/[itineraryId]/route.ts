import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/itineraries/[itineraryId]?agentId=xxx
 * Get itinerary details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    // Fetch itinerary
    const itinerary = await queryOne<any>(
      `SELECT * FROM itineraries 
       WHERE id::text = $1 AND agent_id::text = $2 
       LIMIT 1`,
      [itineraryId, agentId]
    );

    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ itinerary });
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itinerary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/itineraries/[itineraryId]
 * Update an itinerary
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;
    const body = await request.json();

    const {
      totalPrice,
      status,
      notes,
    } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (totalPrice !== undefined) {
      updates.push(`total_price = $${paramIndex++}`);
      values.push(totalPrice);
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
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

    // Add WHERE clause param
    values.push(itineraryId);

    const updateQuery = `
      UPDATE itineraries 
      SET ${updates.join(', ')}
      WHERE id::text = $${paramIndex++}
      RETURNING *
    `;

    const result = await queryOne<any>(updateQuery, values);

    if (!result) {
      return NextResponse.json(
        { error: 'Itinerary not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ itinerary: result, updated: true });
  } catch (error) {
    console.error('Error updating itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to update itinerary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

