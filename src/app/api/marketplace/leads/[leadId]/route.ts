import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceService } from '@/lib/services/marketplaceService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/marketplace/leads/[leadId]
 * Get lead details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    const lead = await MarketplaceService.getLeadDetails(leadId, agentId);
    
    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Error fetching lead details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

