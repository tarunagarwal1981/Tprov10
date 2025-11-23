import { NextRequest, NextResponse } from 'next/server';
import { itineraryService } from '@/lib/services/itineraryService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/itineraries/duplicate
 * Duplicate an itinerary
 */
export async function POST(request: NextRequest) {
  try {
    const { itineraryId, newName } = await request.json();

    if (!itineraryId || !newName) {
      return NextResponse.json(
        { error: 'itineraryId and newName are required' },
        { status: 400 }
      );
    }

    const newItinerary = await itineraryService.duplicateItinerary(itineraryId, newName);
    
    return NextResponse.json({ itinerary: newItinerary });
  } catch (error) {
    console.error('Error duplicating itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate itinerary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

