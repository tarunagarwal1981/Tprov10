import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceService } from '@/lib/services/marketplaceService';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';
import { queryOne } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/marketplace/purchased?agentId=xxx
 * Get purchased leads for an agent (filtered by sub-agent assignment if sub-agent)
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

    // Get user role to determine filtering
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    let userRole: string | undefined;
    if (userId) {
      const user = await queryOne<{ role: string }>(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );
      userRole = user?.role;
    }

    const purchases = await MarketplaceService.getAgentPurchasedLeads(agentId, userRole);
    
    return NextResponse.json({ purchases });
  } catch (error) {
    console.error('Error fetching purchased leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchased leads', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

