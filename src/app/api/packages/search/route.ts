import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/packages/search?type=activity|transfer|multi_city|multi_city_hotel|fixed_departure&limit=20
 * Search packages across all types
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const packageType = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const allPackages: any[] = [];

    // Activity Packages
    if (packageType === 'all' || packageType === 'activity') {
      const result = await query<any>(
        `SELECT id, title, destination_country, destination_city, operator_id, base_price, currency, status
         FROM activity_packages
         WHERE status = 'published'
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      );
      allPackages.push(...(result.rows || []).map((p: any) => ({
        ...p,
        package_type: 'activity',
        featured_image_url: null,
      })));
    }

    // Transfer Packages
    if (packageType === 'all' || packageType === 'transfer') {
      const result = await query<any>(
        `SELECT id, title, destination_country, destination_city, operator_id, base_price, currency, status
         FROM transfer_packages
         WHERE status = 'published'
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      );
      allPackages.push(...(result.rows || []).map((p: any) => ({
        ...p,
        package_type: 'transfer',
        featured_image_url: null,
      })));
    }

    // Multi-City Packages
    if (packageType === 'all' || packageType === 'multi_city') {
      const result = await query<any>(
        `SELECT id, title, destination_region, operator_id, base_price, currency, status
         FROM multi_city_packages
         WHERE status = 'published'
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      );
      allPackages.push(...(result.rows || []).map((p: any) => ({
        ...p,
        package_type: 'multi_city',
        destination_country: p.destination_region,
        destination_city: null,
        featured_image_url: null,
      })));
    }

    // Multi-City Hotel Packages
    if (packageType === 'all' || packageType === 'multi_city_hotel') {
      const result = await query<any>(
        `SELECT id, title, destination_region, operator_id, base_price, currency, status
         FROM multi_city_hotel_packages
         WHERE status = 'published'
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      );
      allPackages.push(...(result.rows || []).map((p: any) => ({
        ...p,
        package_type: 'multi_city_hotel',
        destination_country: p.destination_region,
        destination_city: null,
        featured_image_url: null,
      })));
    }

    // Fixed Departure Flight Packages
    if (packageType === 'all' || packageType === 'fixed_departure') {
      const result = await query<any>(
        `SELECT id, title, destination_region, operator_id, base_price, currency, status
         FROM fixed_departure_flight_packages
         WHERE status = 'published'
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      );
      allPackages.push(...(result.rows || []).map((p: any) => ({
        ...p,
        package_type: 'fixed_departure',
        destination_country: p.destination_region,
        destination_city: null,
        featured_image_url: null,
      })));
    }

    return NextResponse.json({ packages: allPackages });
  } catch (error) {
    console.error('Error searching packages:', error);
    return NextResponse.json(
      { error: 'Failed to search packages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
