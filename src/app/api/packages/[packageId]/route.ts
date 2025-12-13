import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/packages/[packageId]?type=multi_city_hotel
 * Get a single package by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const packageType = searchParams.get('type') || 'multi_city_hotel';

    if (packageType === 'multi_city_hotel') {
      const result = await queryOne<any>(
        `SELECT * FROM multi_city_hotel_packages WHERE id::text = $1`,
        [packageId]
      );

      if (!result) {
        return NextResponse.json(
          { error: 'Package not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ package: result });
    } else if (packageType === 'multi_city') {
      const result = await queryOne<any>(
        `SELECT * FROM multi_city_packages WHERE id::text = $1`,
        [packageId]
      );

      if (!result) {
        return NextResponse.json(
          { error: 'Package not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ package: result });
    } else {
      return NextResponse.json(
        { error: 'Unsupported package type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching package:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
