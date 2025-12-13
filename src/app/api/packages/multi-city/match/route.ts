import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/packages/multi-city/match
 * Get multi-city packages with exact matching (sequence + nights)
 * Body: { destinations: [{ city: string, nights: number }] }
 * Returns: { exactMatches: [], similarMatches: { sameCities: [], sameCountries: [] } }
 */
export async function POST(request: NextRequest) {
  try {
    const { destinations } = await request.json();

    if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return NextResponse.json(
        { error: 'destinations array is required' },
        { status: 400 }
      );
    }

    const queryCities = destinations.map((d: any) => d.city.toLowerCase().trim());
    const queryNights = destinations.map((d: any) => d.nights || 1);
    const queryCountries = destinations.map((d: any) => {
      // Extract country if available (e.g., "Bali, Indonesia" -> "Indonesia")
      const parts = d.city.split(',').map((p: string) => p.trim());
      return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : null;
    }).filter(Boolean);

    // Fetch ALL published multi-city packages (no LIMIT)
    const packagesResult = await query<any>(
      `SELECT 
        id, title, destination_region, operator_id, base_price, 
        per_person_price, fixed_price, pricing_mode, currency, 
        total_nights, total_cities, status
       FROM multi_city_packages 
       WHERE status = 'published'`
    );

    if (packagesResult.rows.length === 0) {
      return NextResponse.json({ 
        exactMatches: [],
        similarMatches: { sameCities: [], sameCountries: [] }
      });
    }

    const packageIds = packagesResult.rows.map((p: any) => p.id);

    // Fetch cities for all packages
    const citiesResult = await query<any>(
      `SELECT package_id, name, nights, city_order
       FROM multi_city_package_cities 
       WHERE package_id::text = ANY($1::text[])
       ORDER BY package_id, city_order ASC`,
      [packageIds]
    );

    // Fetch images for all packages
    const imagesResult = await query<any>(
      `SELECT package_id, public_url, is_cover 
       FROM multi_city_package_images 
       WHERE package_id::text = ANY($1::text[]) AND is_cover = true`,
      [packageIds]
    );

    // Group cities by package
    const citiesByPackage: Record<string, Array<{ name: string; nights: number }>> = {};
    citiesResult.rows.forEach((c: any) => {
      if (!citiesByPackage[c.package_id]) {
        citiesByPackage[c.package_id] = [];
      }
      citiesByPackage[c.package_id]!.push({
        name: c.name,
        nights: c.nights || 1,
      });
    });

    // Find exact matches (same cities in same sequence + same nights)
    const exactMatches: any[] = [];
    const sameCitiesDifferentNights: any[] = [];
    const sameCountries: any[] = [];

    packagesResult.rows.forEach((pkg: any) => {
      const pkgCities = citiesByPackage[pkg.id] || [];
      
      if (pkgCities.length === 0) return;

      const pkgCityNames = pkgCities.map((c: any) => c.name.toLowerCase().trim());
      const pkgNights = pkgCities.map((c: any) => c.nights || 1);

      // Check for exact match
      if (
        pkgCityNames.length === queryCities.length &&
        pkgCityNames.every((city: string, idx: number) => city === queryCities[idx]) &&
        pkgNights.every((nights: number, idx: number) => nights === queryNights[idx])
      ) {
        const image = imagesResult.rows.find((img: any) => img.package_id === pkg.id);
        exactMatches.push({
          ...pkg,
          featured_image_url: image?.public_url || undefined,
          cities: pkgCities,
          matchType: 'exact',
        });
        return;
      }

      // Check for same cities but different nights
      if (
        pkgCityNames.length === queryCities.length &&
        pkgCityNames.every((city: string, idx: number) => city === queryCities[idx])
      ) {
        const image = imagesResult.rows.find((img: any) => img.package_id === pkg.id);
        sameCitiesDifferentNights.push({
          ...pkg,
          featured_image_url: image?.public_url || undefined,
          cities: pkgCities,
          matchType: 'sameCities',
        });
        return;
      }

      // Check for same countries
      const pkgCountries = pkgCityNames.map((city: string) => {
        // Try to extract country from city name or use destination_region
        const parts = city.split(',').map((p: string) => p.trim());
        return parts.length > 1 ? parts[parts.length - 1] : null;
      }).filter((country): country is string => Boolean(country));

      if (queryCountries.length > 0 && pkgCountries.some((country: string) => 
        queryCountries.some((qc: string) => qc === country || country.includes(qc) || qc.includes(country))
      )) {
        const image = imagesResult.rows.find((img: any) => img.package_id === pkg.id);
        sameCountries.push({
          ...pkg,
          featured_image_url: image?.public_url || undefined,
          cities: pkgCities,
          matchType: 'sameCountries',
        });
      }
    });

    return NextResponse.json({
      exactMatches,
      similarMatches: {
        sameCities: sameCitiesDifferentNights,
        sameCountries,
      },
    });
  } catch (error) {
    console.error('Error matching multi-city packages:', error);
    return NextResponse.json(
      { error: 'Failed to match packages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
