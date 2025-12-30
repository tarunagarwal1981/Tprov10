import { NextRequest, NextResponse } from 'next/server';
import { ensureLeadFromPurchase } from '@/lib/services/leadService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/leads/ensure
 * Ensure a lead exists in the leads table (create if it doesn't exist from marketplace)
 * Body: { leadId: string, agentId: string }
 * 
 * This endpoint uses the leadService for consistency with the automatic purchase flow.
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

    // Use the reusable leadService function
    const result = await ensureLeadFromPurchase(leadId, agentId);

      return NextResponse.json({ 
      leadId: result.leadId,
      customerId: result.customerId,
      created: result.created,
    });
  } catch (error) {
    console.error('[Leads Ensure] Error ensuring lead exists:', error);
    console.error('[Leads Ensure] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    // Handle specific error cases
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('not found') || errorMessage.includes('not purchased')) {
      return NextResponse.json(
        { 
          error: errorMessage,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to ensure lead exists', 
        details: errorMessage,
        fullError: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error
      },
      { status: 500 }
    );
  }
}

