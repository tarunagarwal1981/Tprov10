import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/packages/[packageId]?type=multi_city|multi_city_hotel
 * Get package details by ID and type
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (!type || (type !== 'multi_city' && type !== 'multi_city_hotel')) {
      return NextResponse.json(
        { error: 'type parameter is required and must be "multi_city" or "multi_city_hotel"' },
        { status: 400 }
      );
    }

    const tableName = type === 'multi_city' 
      ? 'multi_city_packages' 
      : 'multi_city_hotel_packages';

    // Fetch package details - use base_price for multi_city, adult_price for multi_city_hotel
    const priceField = type === 'multi_city' ? 'base_price' : 'adult_price';
    const packageData = await queryOne<any>(
      `SELECT id, title, operator_id, ${priceField} as base_price, currency 
       FROM ${tableName} 
       WHERE id::text = $1 LIMIT 1`,
      [packageId]
    );

    if (!packageData) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Fetch package image
    const imageTable = type === 'multi_city'
      ? 'multi_city_package_images'
      : 'multi_city_hotel_package_images';

    const imageData = await queryOne<{ public_url: string }>(
      `SELECT public_url 
       FROM ${imageTable} 
       WHERE package_id::text = $1 AND is_cover = true 
       LIMIT 1`,
      [packageId]
    );

    return NextResponse.json({
      package: {
        ...packageData,
        image_url: imageData?.public_url || null,
      },
    });
  } catch (error) {
    console.error('Error fetching package:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

