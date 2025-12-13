import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/packages/[packageId]/details?type=multi_city|multi_city_hotel
 * Get complete package details including pricing, day plans, cities, and hotels
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

    const isHotelPackage = type === 'multi_city_hotel';
    const packageTable = isHotelPackage ? 'multi_city_hotel_packages' : 'multi_city_packages';
    const pricingTable = isHotelPackage ? 'multi_city_hotel_pricing_packages' : 'multi_city_pricing_packages';
    const sicRowsTable = isHotelPackage ? 'multi_city_hotel_pricing_rows' : 'multi_city_pricing_rows';
    const privateRowsTable = isHotelPackage ? 'multi_city_hotel_private_package_rows' : 'multi_city_private_package_rows';
    const dayPlansTable = isHotelPackage ? 'multi_city_hotel_package_day_plans' : 'multi_city_package_day_plans';
    const citiesTable = isHotelPackage ? 'multi_city_hotel_package_cities' : 'multi_city_package_cities';
    const hotelsTable = isHotelPackage ? 'multi_city_hotel_package_city_hotels' : null;
    const imagesTable = isHotelPackage ? 'multi_city_hotel_package_images' : 'multi_city_package_images';

    // Fetch package details
    const packageData = await queryOne<any>(
      `SELECT * FROM ${packageTable} WHERE id::text = $1 LIMIT 1`,
      [packageId]
    );

    if (!packageData) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Fetch pricing packages
    const pricingPackages = await query<any>(
      `SELECT * FROM ${pricingTable} 
       WHERE package_id::text = $1 
       ORDER BY created_at ASC`,
      [packageId]
    );

    const pricingPkg = pricingPackages.rows[0] || null;
    let sicRows: any[] = [];
    let privateRows: any[] = [];

    if (pricingPkg) {
      if (pricingPkg.pricing_type === 'SIC') {
        const sicResult = await query<any>(
          `SELECT * FROM ${sicRowsTable} 
           WHERE pricing_package_id::text = $1 
           ORDER BY display_order ASC`,
          [pricingPkg.id]
        );
        sicRows = sicResult.rows || [];
      } else if (pricingPkg.pricing_type === 'PRIVATE_PACKAGE') {
        const privateResult = await query<any>(
          `SELECT * FROM ${privateRowsTable} 
           WHERE pricing_package_id::text = $1 
           ORDER BY display_order ASC`,
          [pricingPkg.id]
        );
        privateRows = privateResult.rows || [];
      }
    }

    // Fetch day plans (with backward compatibility for time_slots)
    let dayPlans: any[] = [];
    try {
      const dayPlansResult = await query<any>(
        `SELECT id, package_id, city_id, day_number, city_name, title, description, photo_url, has_flights, time_slots
         FROM ${dayPlansTable} 
         WHERE package_id::text = $1 
         ORDER BY day_number ASC`,
        [packageId]
      );
      dayPlans = dayPlansResult.rows || [];
    } catch (error: any) {
      // If time_slots column doesn't exist, fetch without it
      if (error?.message?.includes('time_slots') || error?.code === '42703') {
        const dayPlansResult = await query<any>(
          `SELECT id, package_id, city_id, day_number, city_name, title, description, photo_url, has_flights
           FROM ${dayPlansTable} 
           WHERE package_id::text = $1 
           ORDER BY day_number ASC`,
          [packageId]
        );
        dayPlans = (dayPlansResult.rows || []).map((plan: any) => ({
          ...plan,
          time_slots: {
            morning: { time: '', activities: [], transfers: [] },
            afternoon: { time: '', activities: [], transfers: [] },
            evening: { time: '', activities: [], transfers: [] },
          },
        }));
      } else {
        throw error;
      }
    }

    // If no day plans, fetch cities as fallback
    let cities: any[] = [];
    let hotels: any[] = [];
    let hotelsByCity: Record<string, any[]> = {};

    if (dayPlans.length === 0) {
      const citiesResult = await query<any>(
        `SELECT id, name, nights, display_order 
         FROM ${citiesTable} 
         WHERE package_id::text = $1 
         ORDER BY display_order ASC`,
        [packageId]
      );
      cities = citiesResult.rows || [];

      // Fetch hotels if hotel package
      if (isHotelPackage && hotelsTable && cities.length > 0) {
        const cityIds = cities.map((c: any) => c.id);
        const hotelsResult = await query<any>(
          `SELECT * FROM ${hotelsTable} 
           WHERE city_id::text = ANY($1::text[]) 
           ORDER BY display_order ASC`,
          [cityIds]
        );
        hotels = hotelsResult.rows || [];

        // Group hotels by city
        hotels.forEach((hotel: any) => {
          if (!hotelsByCity[hotel.city_id]) {
            hotelsByCity[hotel.city_id] = [];
          }
          hotelsByCity[hotel.city_id].push(hotel);
        });
      }
    }

    // Fetch package images
    const imagesResult = await query<any>(
      `SELECT * FROM ${imagesTable} 
       WHERE package_id::text = $1 
       ORDER BY is_cover DESC, display_order ASC`,
      [packageId]
    );

    return NextResponse.json({
      package: {
        ...packageData,
        pricing_package: pricingPkg,
        sic_pricing_rows: sicRows,
        private_package_rows: privateRows,
        day_plans: dayPlans,
        cities: cities,
        hotels: hotels,
        hotels_by_city: hotelsByCity,
        images: imagesResult.rows || [],
        image_url: imagesResult.rows.find((img: any) => img.is_cover)?.public_url || null,
      },
    });
  } catch (error) {
    console.error('Error fetching package details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

