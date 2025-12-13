import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceService } from '@/lib/services/marketplaceService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/marketplace/purchase
 * Purchase a lead
 */
export async function POST(request: NextRequest) {
  try {
    const { leadId, agentId } = await request.json();

    if (!leadId || !agentId) {
      return NextResponse.json(
        { error: 'leadId and agentId are required' },
        { status: 400 }
      );
    }

    const purchase = await MarketplaceService.purchaseLead(leadId, agentId);
    
    return NextResponse.json({ purchase });
  } catch (error) {
    console.error('Error purchasing lead:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle specific business logic errors with appropriate status codes
    if (errorMessage.includes('already purchased')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 } // Conflict - resource already exists
      );
    }
    
    if (errorMessage.includes('not found') || errorMessage.includes('unavailable')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 } // Not Found
      );
    }
    
    if (errorMessage.includes('expired')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 410 } // Gone - resource no longer available
      );
    }
    
    // Default to 500 for unexpected errors
    return NextResponse.json(
      { error: 'Failed to purchase lead', details: errorMessage },
      { status: 500 }
    );
  }
}

