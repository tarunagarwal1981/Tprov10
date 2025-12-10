import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceService } from '@/lib/services/marketplaceService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/marketplace/purchased?agentId=xxx
 * Get purchased leads for an agent
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    const purchases = await MarketplaceService.getAgentPurchasedLeads(agentId);
    
    return NextResponse.json({ purchases });
  } catch (error) {
    console.error('Error fetching purchased leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchased leads', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

