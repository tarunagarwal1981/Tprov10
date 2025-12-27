import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/itineraries/[itineraryId]/confirm
 * Confirm an itinerary and optionally lock it
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { lock = true } = body;

    // Fetch itinerary
    const itinerary = await queryOne<{
      id: string;
      agent_id: string;
      is_locked: boolean;
    }>(
      'SELECT id, agent_id, is_locked FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (!itinerary) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    if (itinerary.agent_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (itinerary.is_locked) {
      return NextResponse.json({ error: 'Itinerary is already locked' }, { status: 400 });
    }

    // Update itinerary: confirm and optionally lock
    const updateFields: string[] = ['confirmed_at = NOW()', 'confirmed_by = $2', 'updated_at = NOW()'];
    const values: any[] = [itineraryId, userId];

    if (lock) {
      updateFields.push('is_locked = TRUE', 'locked_at = NOW()', 'locked_by = $2');
    }

    await query(
      `UPDATE itineraries 
       SET ${updateFields.join(', ')}
       WHERE id = $1`,
      values
    );

    // Update status to 'confirmed'
    await query(
      `UPDATE itineraries 
       SET status = 'confirmed'
       WHERE id = $1`,
      [itineraryId]
    );

    return NextResponse.json({ 
      success: true, 
      confirmed: true,
      locked: lock,
    });
  } catch (error) {
    console.error('Error confirming itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to confirm itinerary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

