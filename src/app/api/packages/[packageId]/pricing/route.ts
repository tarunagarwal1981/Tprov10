import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/packages/[packageId]/pricing?type=multi_city_hotel
 * Get pricing packages for a package
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
      // Fetch pricing packages
      const pricingResult = await query<any>(
        `SELECT * FROM multi_city_hotel_pricing_packages 
         WHERE package_id::text = $1 
         ORDER BY created_at ASC`,
        [packageId]
      );

      const pricingPackages = pricingResult.rows || [];
      const pricingPkg = pricingPackages[0] || null;

      let sicRows: any[] = [];
      let privateRows: any[] = [];

      if (pricingPkg) {
        if (pricingPkg.pricing_type === 'SIC') {
          const sicResult = await query<any>(
            `SELECT * FROM multi_city_hotel_pricing_rows 
             WHERE pricing_package_id::text = $1 
             ORDER BY display_order ASC`,
            [pricingPkg.id]
          );
          sicRows = sicResult.rows || [];
        } else if (pricingPkg.pricing_type === 'PRIVATE_PACKAGE') {
          const privateResult = await query<any>(
            `SELECT * FROM multi_city_hotel_private_package_rows 
             WHERE pricing_package_id::text = $1 
             ORDER BY display_order ASC`,
            [pricingPkg.id]
          );
          privateRows = privateResult.rows || [];
        }
      }

      return NextResponse.json({
        pricingPackage: pricingPkg,
        sicRows,
        privateRows,
      });
    } else {
      // For other package types, return empty for now
      return NextResponse.json({
        pricingPackage: null,
        sicRows: [],
        privateRows: [],
      });
    }
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


