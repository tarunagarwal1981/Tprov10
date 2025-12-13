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
      errorCode: (error as any)?.code,
      originalError: (error as any)?.originalError,
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    
    // Extract error message - check multiple sources
    let errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.code;
    const originalError = (error as any)?.originalError;
    
    // If there's an originalError, try to get message from there
    if (originalError) {
      if (originalError.message) {
        errorMessage = originalError.message;
      } else if (originalError.error) {
        errorMessage = originalError.error;
      }
    }
    
    const lowerErrorMessage = errorMessage.toLowerCase();
    
    console.log('[Purchase API] Error message analysis:', {
      originalMessage: errorMessage,
      lowerMessage: lowerErrorMessage,
      errorCode: errorCode,
      includesAlreadyPurchased: lowerErrorMessage.includes('already purchased') || errorCode === '23505',
      includesNotFound: lowerErrorMessage.includes('not found') || lowerErrorMessage.includes('unavailable'),
      includesExpired: lowerErrorMessage.includes('expired'),
      includesUniqueConstraint: lowerErrorMessage.includes('unique') || lowerErrorMessage.includes('duplicate'),
    });
    
    // Handle specific business logic errors with appropriate status codes
    // Check for unique constraint violation (PostgreSQL error code 23505)
    if (lowerErrorMessage.includes('already purchased') || 
        errorCode === '23505' ||
        lowerErrorMessage.includes('unique constraint') ||
        lowerErrorMessage.includes('duplicate key')) {
      console.log('[Purchase API] Returning 409 Conflict - already purchased');
      return NextResponse.json(
        { error: 'You have already purchased this lead' },
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
    console.log('[Purchase API] Full error details for debugging:', {
      error,
      errorMessage,
      errorCode,
      originalError,
      errorType: error?.constructor?.name,
    });
    
    // Return the actual error message in development/staging for debugging
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         process.env.NEXT_PUBLIC_ENV === 'development' ||
                         process.env.AMPLIFY_ENV === 'dev';
    
    return NextResponse.json(
      { 
        error: isDevelopment ? errorMessage : 'Failed to purchase lead',
        details: isDevelopment ? {
          message: errorMessage,
          code: errorCode,
          type: error?.constructor?.name,
        } : undefined
      },
      { status: 500 }
    );
  }
}

