import { NextRequest, NextResponse } from 'next/server';
import { queryService } from '@/lib/services/queryService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/queries/by-id/[queryId]
 * Get query by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ queryId: string }> }
) {
  try {
    const { queryId } = await params;
    const query = await queryService.getQueryById(queryId);
    
    return NextResponse.json({ query });
  } catch (error) {
    console.error('Error fetching query:', error);
    return NextResponse.json(
      { error: 'Failed to fetch query', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
