import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/packages/multi-city?cities=city1,city2
 * Get multi-city packages matching the given cities
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const citiesParam = searchParams.get('cities');
    const cities = citiesParam ? citiesParam.split(',').map(c => c.trim().toLowerCase()) : [];

    // Fetch all published multi-city packages
    const packagesResult = await query<any>(
      `SELECT 
        id, title, destination_region, operator_id, base_price, 
        per_person_price, fixed_price, pricing_mode, currency, 
        total_nights, total_cities, status
       FROM multi_city_packages 
       WHERE status = 'published'
       LIMIT 50`
    );

    if (packagesResult.rows.length === 0) {
      return NextResponse.json({ packages: [] });
    }

    const packageIds = packagesResult.rows.map((p: any) => p.id);

    // Fetch cities for all packages
    // Use unnest with array for better PostgreSQL array handling
    const citiesResult = await query<any>(
      `SELECT package_id, name, nights 
       FROM multi_city_package_cities 
       WHERE package_id::text = ANY($1::text[])`,
      [packageIds]
    );

    // Fetch images for all packages
    const imagesResult = await query<any>(
      `SELECT package_id, public_url, is_cover 
       FROM multi_city_package_images 
       WHERE package_id::text = ANY($1::text[]) AND is_cover = true`,
      [packageIds]
    );

    // Filter packages that match the query cities (if provided)
    let matchingPackages = packagesResult.rows;
    if (cities.length > 0) {
      matchingPackages = packagesResult.rows.filter((pkg: any) => {
        const pkgCities = citiesResult.rows
          .filter((c: any) => c.package_id === pkg.id)
          .map((c: any) => c.name.toLowerCase());
        
        return cities.some(queryCity => 
          pkgCities.some((pkgCity: string) => 
            pkgCity.includes(queryCity) || queryCity.includes(pkgCity)
          )
        );
      });
    }

    // Combine packages with their cities and images
    const packagesWithDetails = matchingPackages.map((pkg: any) => {
      const image = imagesResult.rows.find((img: any) => img.package_id === pkg.id);
      const pkgCities = citiesResult.rows
        .filter((c: any) => c.package_id === pkg.id)
        .map((c: any) => ({
          name: c.name,
          nights: c.nights || 1,
        }));

      return {
        ...pkg,
        featured_image_url: image?.public_url || undefined,
        cities: pkgCities,
      };
    });

    return NextResponse.json({ packages: packagesWithDetails });
  } catch (error) {
    console.error('Error fetching multi-city packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch multi-city packages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

