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
    const body = await request.json();
    const { leadId, agentId } = body;

    console.log('[Purchase API] Request received:', { leadId, agentId });

    if (!leadId || !agentId) {
      console.log('[Purchase API] Missing required fields:', { leadId: !!leadId, agentId: !!agentId });
      return NextResponse.json(
        { error: 'leadId and agentId are required' },
        { status: 400 }
      );
    }

    console.log('[Purchase API] Calling MarketplaceService.purchaseLead...');
    const purchase = await MarketplaceService.purchaseLead(leadId, agentId);
    console.log('[Purchase API] Purchase successful:', { purchaseId: purchase?.id });
    
    return NextResponse.json({ purchase });
  } catch (error) {
    console.error('[Purchase API] Error caught:', {
      error,
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const lowerErrorMessage = errorMessage.toLowerCase();
    
    console.log('[Purchase API] Error message analysis:', {
      originalMessage: errorMessage,
      lowerMessage: lowerErrorMessage,
      includesAlreadyPurchased: lowerErrorMessage.includes('already purchased'),
      includesNotFound: lowerErrorMessage.includes('not found') || lowerErrorMessage.includes('unavailable'),
      includesExpired: lowerErrorMessage.includes('expired'),
    });
    
    // Handle specific business logic errors with appropriate status codes
    if (lowerErrorMessage.includes('already purchased')) {
      console.log('[Purchase API] Returning 409 Conflict');
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 } // Conflict - resource already exists
      );
    }
    
    if (lowerErrorMessage.includes('not found') || lowerErrorMessage.includes('unavailable')) {
      console.log('[Purchase API] Returning 404 Not Found');
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 } // Not Found
      );
    }
    
    if (lowerErrorMessage.includes('expired')) {
      console.log('[Purchase API] Returning 410 Gone');
      return NextResponse.json(
        { error: errorMessage },
        { status: 410 } // Gone - resource no longer available
      );
    }
    
    // Default to 500 for unexpected errors
    console.log('[Purchase API] Returning 500 Internal Server Error');
    return NextResponse.json(
      { error: 'Failed to purchase lead', details: errorMessage },
      { status: 500 }
    );
  }
}

