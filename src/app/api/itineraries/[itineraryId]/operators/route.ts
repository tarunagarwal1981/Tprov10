import { NextRequest, NextResponse } from 'next/server';
import { itineraryService } from '@/lib/services/itineraryService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/itineraries/[itineraryId]/operators
 * Get operators info for an itinerary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;
    const operators = await itineraryService.getOperatorsInfo(itineraryId);
    
    return NextResponse.json({ operators });
  } catch (error) {
    console.error('Error fetching operators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operators', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

