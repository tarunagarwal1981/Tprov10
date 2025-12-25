import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/diagnostics/total-price
 * Diagnostic endpoint to investigate total_price issue
 * Query params:
 *   - leadId: Lead ID to check (optional, defaults to the one from logs)
 *   - itineraryId: Specific itinerary ID to check (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const leadId = searchParams.get('leadId') || '2b838a35-90ac-49fc-83cb-b3234b941501';
    const itineraryId = searchParams.get('itineraryId') || '998b7096-c42b-40cf-8cdc-2098d55b42ea';

    const results: any = {};

    // 1. Check if items exist for the specific itinerary
    console.log('[Diagnostics] Checking items for itinerary:', itineraryId);
    const itemsResult = await query<{
      count: number;
      total_items_price: number;
    }>(
      `SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(total_price), 0) as total_items_price
      FROM itinerary_items 
      WHERE itinerary_id::text = $1`,
      [itineraryId]
    );
    results.itemsSummary = itemsResult.rows[0];

    // 2. Get all items for this itinerary with details
    const itemDetails = await query<{
      id: string;
      package_title: string;
      total_price: number;
      unit_price: number;
      quantity: number;
    }>(
      `SELECT id, package_title, total_price, unit_price, quantity
       FROM itinerary_items 
       WHERE itinerary_id::text = $1
       ORDER BY created_at ASC`,
      [itineraryId]
    );
    results.items = itemDetails.rows;

    // 3. Check current total_price vs calculated for all lead itineraries
    const itinerariesResult = await query<{
      id: string;
      name: string;
      total_price: number;
      calculated_total: number;
    }>(
      `SELECT 
        i.id,
        i.name,
        i.total_price,
        COALESCE(SUM(ii.total_price), 0) as calculated_total
      FROM itineraries i
      LEFT JOIN itinerary_items ii ON i.id::text = ii.itinerary_id::text
      WHERE i.lead_id::text = $1
      GROUP BY i.id, i.name, i.total_price
      ORDER BY i.created_at DESC`,
      [leadId]
    );
    results.itineraries = itinerariesResult.rows;

    // 4. Check if trigger exists
    const triggerResult = await query<{
      tgname: string;
      tgenabled: string;
    }>(
      `SELECT tgname, tgenabled 
       FROM pg_trigger 
       WHERE tgname = 'recalculate_itinerary_price_on_item_change'`,
      []
    );
    results.trigger = triggerResult.rows.length > 0 ? triggerResult.rows[0] : null;

    // 5. Check if function exists
    const functionResult = await query<{
      proname: string;
    }>(
      `SELECT proname 
       FROM pg_proc 
       WHERE proname = 'recalculate_itinerary_total_price'`,
      []
    );
    results.function = functionResult.rows.length > 0 ? functionResult.rows[0] : null;

    // 6. Calculate summary
    const needsUpdate = results.itineraries.filter((it: any) => 
      Math.abs(it.total_price - it.calculated_total) > 0.01
    );
    results.summary = {
      totalItineraries: results.itineraries.length,
      needsUpdate: needsUpdate.length,
      correct: results.itineraries.length - needsUpdate.length,
    };

    return NextResponse.json({
      success: true,
      leadId,
      itineraryId,
      results,
    });
  } catch (error) {
    console.error('[Diagnostics] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

