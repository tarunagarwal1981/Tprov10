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
      queryId = null,
    } = await request.json();

    if (!leadId || !agentId) {
      return NextResponse.json(
        { error: 'leadId and agentId are required' },
        { status: 400 }
      );
    }

    // Create new itinerary (allow multiple itineraries per lead)
    const insertResult = await query<{ id: string }>(
      `INSERT INTO itineraries (
        lead_id, agent_id, name, adults_count, children_count, 
        infants_count, start_date, end_date, status, total_price, currency, query_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        queryId,
      ]
    );

    if (!insertResult.rows || insertResult.rows.length === 0 || !insertResult.rows[0]) {
      return NextResponse.json(
        { error: 'Failed to create itinerary' },
        { status: 500 }
      );
    }

    const createdItinerary = insertResult.rows[0];
    return NextResponse.json({
      itinerary: { id: createdItinerary.id },
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

