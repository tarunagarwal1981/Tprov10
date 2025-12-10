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
    const { leadId } = await params;
    const itineraries = await itineraryService.getLeadItineraries(leadId);
    
    return NextResponse.json({ itineraries });
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itineraries', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

