import { NextRequest, NextResponse } from 'next/server';
import { queryService } from '@/lib/services/queryService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/queries/[leadId]
 * Get query by lead ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const query = await queryService.getQueryByLeadId(leadId);
    
    return NextResponse.json({ query });
  } catch (error) {
    console.error('Error fetching query:', error);
    return NextResponse.json(
      { error: 'Failed to fetch query', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/queries/[leadId]
 * Upsert query
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const body = await request.json();
    const query = await queryService.upsertQuery({
      ...body,
      lead_id: leadId,
    });
    
    return NextResponse.json({ query });
  } catch (error) {
    console.error('Error upserting query:', error);
    return NextResponse.json(
      { error: 'Failed to upsert query', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

