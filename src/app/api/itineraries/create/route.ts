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

    // Generate customer_id before creating itinerary
    const customerIdResult = await query<{ customer_id: string }>(
      `SELECT generate_itinerary_customer_id() as customer_id`,
      []
    );
    const customerId = customerIdResult.rows[0]?.customer_id;

    if (!customerId) {
      console.error('[Create Itinerary] Failed to generate customer_id');
      return NextResponse.json(
        { error: 'Failed to generate customer ID' },
        { status: 500 }
      );
    }

    // Create new itinerary (allow multiple itineraries per lead)
    // Generate UUID for id column - use UUID type directly
    const insertResult = await query<{ id: string; customer_id: string }>(
      `INSERT INTO itineraries (
        id, lead_id, agent_id, name, customer_id, adults_count, children_count, 
        infants_count, start_date, end_date, status, total_price, currency, query_id
      ) VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::uuid)
      RETURNING id, customer_id`,
      [
        leadId,
        agentId,
        name,
        customerId,
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
      itinerary: { 
        id: createdItinerary.id,
        customer_id: createdItinerary.customer_id,
      },
      created: true,
    });
  } catch (error) {
    console.error('[Create Itinerary] Error creating itinerary:', error);
    console.error('[Create Itinerary] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to create itinerary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

