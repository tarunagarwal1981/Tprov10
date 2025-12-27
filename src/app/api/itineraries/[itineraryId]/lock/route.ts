import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/itineraries/[itineraryId]/lock
 * Lock an itinerary to prevent further edits
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

    // Lock itinerary
    await query(
      `UPDATE itineraries 
       SET is_locked = TRUE, locked_at = NOW(), locked_by = $2, updated_at = NOW()
       WHERE id = $1`,
      [itineraryId, userId]
    );

    return NextResponse.json({ success: true, locked: true });
  } catch (error) {
    console.error('Error locking itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to lock itinerary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/itineraries/[itineraryId]/lock
 * Unlock an itinerary (admin/agent only)
 */
export async function DELETE(
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

    if (!itinerary.is_locked) {
      return NextResponse.json({ error: 'Itinerary is not locked' }, { status: 400 });
    }

    // Unlock itinerary
    await query(
      `UPDATE itineraries 
       SET is_locked = FALSE, locked_at = NULL, locked_by = NULL, updated_at = NOW()
       WHERE id = $1`,
      [itineraryId]
    );

    return NextResponse.json({ success: true, unlocked: true });
  } catch (error) {
    console.error('Error unlocking itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to unlock itinerary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

