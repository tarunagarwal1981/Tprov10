import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceService } from '@/lib/services/marketplaceService';
import type { LeadFilters } from '@/lib/types/marketplace';
import { query } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

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

/**
 * POST /api/marketplace/leads
 * Create a new marketplace lead
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      destination,
      trip_type,
      budget_min,
      budget_max,
      duration_days,
      travelers_count,
      travel_date_start,
      travel_date_end,
      special_requirements,
      customer_name,
      customer_email,
      customer_phone,
      detailed_requirements,
      lead_quality_score,
      lead_price,
      status,
      expires_at,
      posted_at,
    } = body;

    // Validate required fields
    if (!title || !destination || !customer_name || !customer_email || !lead_price) {
      return NextResponse.json(
        { error: 'Missing required fields: title, destination, customer_name, customer_email, lead_price' },
        { status: 400 }
      );
    }

    // Insert into lead_marketplace table
    const result = await query<{ id: string }>(
      `INSERT INTO lead_marketplace (
        title, destination, trip_type, budget_min, budget_max, duration_days,
        travelers_count, travel_date_start, travel_date_end, special_requirements,
        customer_name, customer_email, customer_phone, detailed_requirements,
        lead_quality_score, lead_price, status, expires_at, posted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id`,
      [
        title,
        destination,
        trip_type || null,
        budget_min || null,
        budget_max || null,
        duration_days || null,
        travelers_count || null,
        travel_date_start || null,
        travel_date_end || null,
        special_requirements || null,
        customer_name,
        customer_email,
        customer_phone || null,
        detailed_requirements || null,
        lead_quality_score || null,
        lead_price,
        status || 'AVAILABLE',
        expires_at || null,
        posted_at || new Date().toISOString(),
      ]
    );

    if (!result.rows || result.rows.length === 0 || !result.rows[0]) {
      return NextResponse.json(
        { error: 'Failed to create marketplace lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({ lead: { id: result.rows[0].id } }, { status: 201 });
  } catch (error) {
    console.error('Error creating marketplace lead:', error);
    return NextResponse.json(
      { error: 'Failed to create marketplace lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

