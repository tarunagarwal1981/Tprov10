import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceService } from '@/lib/services/marketplaceService';
import type { LeadFilters } from '@/lib/types/marketplace';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/marketplace/leads
 * Get available leads from marketplace
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse filters from query params
    const filters: LeadFilters | undefined = searchParams.has('destination') || 
      searchParams.has('tripType') || 
      searchParams.has('budgetMin') ||
      searchParams.has('budgetMax') ||
      searchParams.has('durationMin') ||
      searchParams.has('durationMax') ||
      searchParams.has('minQualityScore') ? {
      destination: searchParams.get('destination') || undefined,
      tripType: searchParams.get('tripType') as any || undefined,
      budgetMin: searchParams.get('budgetMin') ? Number(searchParams.get('budgetMin')) : undefined,
      budgetMax: searchParams.get('budgetMax') ? Number(searchParams.get('budgetMax')) : undefined,
      durationMin: searchParams.get('durationMin') ? Number(searchParams.get('durationMin')) : undefined,
      durationMax: searchParams.get('durationMax') ? Number(searchParams.get('durationMax')) : undefined,
      minQualityScore: searchParams.get('minQualityScore') ? Number(searchParams.get('minQualityScore')) : undefined,
    } : undefined;

    const leads = await MarketplaceService.getAvailableLeads(filters);
    
    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

