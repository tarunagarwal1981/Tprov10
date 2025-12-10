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
    return NextResponse.json(
      { error: 'Failed to purchase lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

