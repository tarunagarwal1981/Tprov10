import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/operator/packages?operatorId=xxx
 * Get all packages (activity, transfer, multi-city) for an operator
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const operatorId = searchParams.get('operatorId');

    if (!operatorId) {
      return NextResponse.json(
        { error: 'operatorId is required' },
        { status: 400 }
      );
    }

    // Fetch activity packages with images
    const activityPackagesResult = await query<any>(
      `SELECT 
        ap.id, ap.title, ap.short_description, ap.status, ap.base_price, ap.currency,
        ap.destination_city, ap.destination_country, ap.created_at, ap.published_at,
        ap.duration_hours, ap.duration_minutes
       FROM activity_packages ap
       WHERE ap.operator_id::text = $1
       ORDER BY ap.created_at DESC`,
      [operatorId]
    );

    const activityPackageIds = activityPackagesResult.rows?.map((p: any) => p.id) || [];
    
    // Fetch images for activity packages
    let activityImages: any[] = [];
    if (activityPackageIds.length > 0) {
      const imagesResult = await query<any>(
        `SELECT package_id, id, public_url, is_cover
         FROM activity_package_images
         WHERE package_id::text = ANY($1::text[])`,
        [activityPackageIds]
      );
      activityImages = imagesResult.rows || [];
    }

    // Fetch pricing for activity packages
    let activityPricing: any[] = [];
    if (activityPackageIds.length > 0) {
      const pricingResult = await query<any>(
        `SELECT package_id, adult_price
         FROM activity_pricing_packages
         WHERE package_id::text = ANY($1::text[])`,
        [activityPackageIds]
      );
      activityPricing = pricingResult.rows || [];
    }

    // Fetch transfer packages
    const transferPackagesResult = await query<any>(
      `SELECT 
        tp.id, tp.title, tp.short_description, tp.status, tp.base_price, tp.currency,
        tp.destination_city, tp.destination_country, tp.created_at, tp.published_at
       FROM transfer_packages tp
       WHERE tp.operator_id::text = $1
       ORDER BY tp.created_at DESC`,
      [operatorId]
    );

    const transferPackageIds = transferPackagesResult.rows?.map((p: any) => p.id) || [];
    
    // Fetch images for transfer packages
    let transferImages: any[] = [];
    if (transferPackageIds.length > 0) {
      const imagesResult = await query<any>(
        `SELECT package_id, id, public_url, is_cover
         FROM transfer_package_images
         WHERE package_id::text = ANY($1::text[])`,
        [transferPackageIds]
      );
      transferImages = imagesResult.rows || [];
    }

    // Fetch multi-city packages with images
    const multiCityPackagesResult = await query<any>(
      `SELECT 
        mcp.id, mcp.title, mcp.short_description, mcp.status, mcp.base_price, mcp.currency,
        mcp.destination_region, mcp.total_cities, mcp.total_nights, mcp.created_at, mcp.published_at
       FROM multi_city_packages mcp
       WHERE mcp.operator_id::text = $1
       ORDER BY mcp.created_at DESC`,
      [operatorId]
    );

    const multiCityPackageIds = multiCityPackagesResult.rows?.map((p: any) => p.id) || [];
    
    // Fetch images for multi-city packages
    let multiCityImages: any[] = [];
    if (multiCityPackageIds.length > 0) {
      const imagesResult = await query<any>(
        `SELECT package_id, id, public_url, is_cover
         FROM multi_city_package_images
         WHERE package_id::text = ANY($1::text[])`,
        [multiCityPackageIds]
      );
      multiCityImages = imagesResult.rows || [];
    }

    // Combine activity packages with images and pricing
    const activityPackages = (activityPackagesResult.rows || []).map((pkg: any) => {
      const pkgImages = activityImages.filter((img: any) => img.package_id === pkg.id);
      const pkgPricing = activityPricing.filter((p: any) => p.package_id === pkg.id);
      
      const coverImage = pkgImages.find((img: any) => img.is_cover);
      const imageUrl = coverImage?.public_url || pkgImages[0]?.public_url || '';

      let minPrice = pkg.base_price || 0;
      let maxPrice = pkg.base_price || 0;
      
      if (pkgPricing.length > 0) {
        const prices = pkgPricing.map((p: any) => p.adult_price).filter((p: number) => p > 0);
        if (prices.length > 0) {
          minPrice = Math.min(...prices);
          maxPrice = Math.max(...prices);
        }
      }

      return {
        ...pkg,
        imageUrl,
        images: pkgImages,
        minPrice,
        maxPrice,
      };
    });

    // Combine transfer packages with images
    const transferPackages = (transferPackagesResult.rows || []).map((pkg: any) => {
      const pkgImages = transferImages.filter((img: any) => img.package_id === pkg.id);
      const coverImage = pkgImages.find((img: any) => img.is_cover);
      const imageUrl = coverImage?.public_url || pkgImages[0]?.public_url || '';

      return {
        ...pkg,
        imageUrl,
        images: pkgImages,
      };
    });

    // Combine multi-city packages with images
    const multiCityPackages = (multiCityPackagesResult.rows || []).map((pkg: any) => {
      const pkgImages = multiCityImages.filter((img: any) => img.package_id === pkg.id);
      const coverImage = pkgImages.find((img: any) => img.is_cover);
      const imageUrl = coverImage?.public_url || pkgImages[0]?.public_url || '';

      return {
        ...pkg,
        imageUrl,
        images: pkgImages,
      };
    });

    return NextResponse.json({
      activityPackages,
      transferPackages,
      multiCityPackages,
    });
  } catch (error) {
    console.error('Error fetching operator packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

