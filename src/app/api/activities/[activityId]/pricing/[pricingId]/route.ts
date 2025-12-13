import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/activities/[activityId]/pricing/[pricingId]
 * Get a single activity pricing package by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string; pricingId: string }> }
) {
  try {
    const { pricingId } = await params;

    const result = await queryOne<any>(
      `SELECT * FROM activity_pricing_packages WHERE id::text = $1`,
      [pricingId]
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Pricing package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ pricingPackage: result });
  } catch (error) {
    console.error('Error fetching activity pricing package:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing package', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

