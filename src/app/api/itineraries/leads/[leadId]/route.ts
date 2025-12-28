import { NextRequest, NextResponse } from 'next/server';
import { itineraryService } from '@/lib/services/itineraryService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/itineraries/leads/[leadId]
 * Get itineraries for a lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    console.log('[API] ===== GET /api/itineraries/leads/[leadId] START =====');
    const { leadId } = await params;
    console.log('[API] Extracted leadId from params:', leadId);
    console.log('[API] leadId type:', typeof leadId);
    console.log('[API] leadId length:', leadId?.length);
    
    console.log('[API] Calling itineraryService.getLeadItineraries...');
    const itineraries = await itineraryService.getLeadItineraries(leadId);
    console.log('[API] ✅ getLeadItineraries returned:', itineraries.length, 'itineraries');
    
    console.log('[API] /api/itineraries/leads/[leadId] - Returning itineraries:', {
      leadId,
      count: itineraries.length,
    });
    // Log each itinerary's price details explicitly
    itineraries.forEach((it: any, index: number) => {
      console.log(`[API] Itinerary ${index + 1} in response:`, {
        id: it.id,
        name: it.name,
        total_price: it.total_price,
        total_price_type: typeof it.total_price,
        total_price_value: it.total_price ?? 'NULL/UNDEFINED',
      });
      // Also log as a simple string for easy reading
      console.log(`[API] Price for "${it.name}": total_price=${it.total_price} (type: ${typeof it.total_price})`);
    });
    
    const response = { itineraries };
    console.log('[API] Response object:', JSON.stringify(response, null, 2));
    console.log('[API] Response itineraries count:', response.itineraries.length);
    console.log('[API] ===== GET /api/itineraries/leads/[leadId] SUCCESS =====');
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] ❌ Error fetching itineraries:', error);
    console.error('[API] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[API] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('[API] ===== GET /api/itineraries/leads/[leadId] ERROR =====');
    return NextResponse.json(
      { error: 'Failed to fetch itineraries', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

