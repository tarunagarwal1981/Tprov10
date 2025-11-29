import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/itineraries/create
 * Create a new itinerary
 * Body: { leadId, agentId, name, adultsCount, childrenCount, infantsCount, startDate, endDate }
 */
export async function POST(request: NextRequest) {
  try {
    const {
      leadId,
      agentId,
      name = 'Itinerary #1',
      adultsCount = 2,
      childrenCount = 0,
      infantsCount = 0,
      startDate = null,
      endDate = null,
    } = await request.json();

    if (!leadId || !agentId) {
      return NextResponse.json(
        { error: 'leadId and agentId are required' },
        { status: 400 }
      );
    }

    // Check if itinerary already exists for this lead
    const existingResult = await query<{ id: string }>(
      `SELECT id FROM itineraries 
       WHERE lead_id::text = $1 AND agent_id::text = $2 
       ORDER BY created_at DESC LIMIT 1`,
      [leadId, agentId]
    );

    if (existingResult.rows && existingResult.rows.length > 0) {
      return NextResponse.json({
        itinerary: { id: existingResult.rows[0].id },
        created: false,
      });
    }

    // Create new itinerary
    const insertResult = await query<{ id: string }>(
      `INSERT INTO itineraries (
        lead_id, agent_id, name, adults_count, children_count, 
        infants_count, start_date, end_date, status, total_price, currency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        leadId,
        agentId,
        name,
        adultsCount,
        childrenCount,
        infantsCount,
        startDate,
        endDate,
        'draft',
        0,
        'USD',
      ]
    );

    if (!insertResult.rows || insertResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create itinerary' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      itinerary: { id: insertResult.rows[0].id },
      created: true,
    });
  } catch (error) {
    console.error('Error creating itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to create itinerary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

