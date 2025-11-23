import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceService } from '@/lib/services/marketplaceService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/marketplace/featured?limit=10
 * Get featured leads
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 10;

    const leads = await MarketplaceService.getFeaturedLeads(limit);
    
    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Error fetching featured leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured leads', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

