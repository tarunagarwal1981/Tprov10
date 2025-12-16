import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';
import { getPresignedDownloadUrl } from '@/lib/aws/s3-upload';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/operator/packages?operatorId=xxx
 * Get all packages (activity, transfer, multi-city, multi-city-hotel, fixed-departure-flight) for an operator
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
    
    // Fetch images for activity packages (optional - table may not exist yet)
    let activityImages: any[] = [];
    if (activityPackageIds.length > 0) {
      try {
        const imagesResult = await query<any>(
          `SELECT package_id, id, public_url, storage_path, is_cover
           FROM activity_package_images
           WHERE package_id::text = ANY($1::text[])`,
          [activityPackageIds]
        );
        // Generate presigned URLs for S3 images
        console.log('🖼️ [Packages API] Processing activity images:', {
          imageCount: imagesResult.rows?.length || 0,
          images: (imagesResult.rows || []).map((img: any) => ({
            id: img.id,
            file_name: img.file_name,
            has_storage_path: !!img.storage_path,
            has_public_url: !!img.public_url,
            storage_path_preview: img.storage_path?.substring(0, 60),
            public_url_preview: img.public_url?.substring(0, 60),
          }))
        });

        activityImages = await Promise.all(
          (imagesResult.rows || []).map(async (img: any) => {
            // Skip images with base64 data URLs in storage_path (corrupted data)
            const isBase64Data = img.storage_path && img.storage_path.startsWith('data:');
            if (isBase64Data) {
              console.warn('⚠️ [Packages API] Skipping image with base64 in storage_path (corrupted data):', {
                id: img.id,
                file_name: img.file_name,
                storage_path_preview: img.storage_path?.substring(0, 60),
                has_public_url: !!img.public_url,
              });
              // If it has a public_url, use that; otherwise skip this image
              if (img.public_url && !img.public_url.startsWith('data:')) {
                return { ...img, public_url: img.public_url };
              }
              // Return null to filter out later
              return null;
            }
            
            const hasS3Path = img.storage_path && img.storage_path.startsWith('activity-packages-images/');
            const isDirectS3Url = img.public_url && img.public_url.includes('.s3.') && img.public_url.includes('amazonaws.com');
            const isAlreadyPresigned = img.public_url && (img.public_url.includes('cloudfront') || img.public_url.includes('?X-Amz'));
            
            console.log('🔍 [Packages API] Image analysis:', {
              file_name: img.file_name,
              hasS3Path,
              isDirectS3Url,
              isAlreadyPresigned,
              has_public_url: !!img.public_url,
              storage_path_preview: img.storage_path?.substring(0, 60),
            });
            
            // Generate presigned URL if: has S3 path AND (no public_url OR direct S3 URL OR not already presigned)
            if (hasS3Path && (!img.public_url || isDirectS3Url || !isAlreadyPresigned)) {
              console.log('📤 [Packages API] Generating presigned URL for:', img.storage_path?.substring(0, 60));
              try {
                const presignedUrl = await getPresignedDownloadUrl(img.storage_path, 3600);
                console.log('✅ [Packages API] Presigned URL generated:', {
                  file_name: img.file_name,
                  url_preview: presignedUrl.substring(0, 100) + '...',
                });
                return { ...img, public_url: presignedUrl };
              } catch (error: any) {
                console.error('❌ [Packages API] Failed to generate presigned URL:', {
                  file_name: img.file_name,
                  storage_path: img.storage_path,
                  error: error.message,
                });
                return { ...img, public_url: img.public_url || img.storage_path };
              }
            } else {
              console.log('⏭️ [Packages API] Skipping presigned URL:', {
                file_name: img.file_name,
                reason: !hasS3Path ? 'No S3 path' : isAlreadyPresigned ? 'Already presigned' : 'Other',
              });
            }
            return img;
          })
        );
        
        // Filter out null images (corrupted base64 data)
        activityImages = activityImages.filter((img: any) => img !== null);

        console.log('🎯 [Packages API] Final activity images:', {
          imageCount: activityImages.length,
          images: activityImages.map((img: any) => ({
            file_name: img.file_name,
            public_url_preview: img.public_url?.substring(0, 100) + '...',
            is_presigned: img.public_url?.includes('?X-Amz'),
          }))
        });
      } catch (error: any) {
        // Table may not exist yet - that's okay, just skip images
        if (error.message?.includes('does not exist') || error.code === '42P01' || error.message?.includes('activity_package_images')) {
          console.warn('activity_package_images table not found, skipping image data');
          activityImages = [];
        } else {
          console.warn('Error fetching activity images (non-fatal):', error.message);
          activityImages = [];
        }
      }
    }

    // Fetch pricing for activity packages (optional - table may not exist yet)
    let activityPricing: any[] = [];
    if (activityPackageIds.length > 0) {
      try {
        // Use proper array syntax for PostgreSQL - convert array to comma-separated string for ANY()
        const pricingResult = await query<any>(
          `SELECT package_id, adult_price
           FROM activity_pricing_packages
           WHERE package_id::text = ANY($1::text[])`,
          [activityPackageIds]
        );
        activityPricing = pricingResult.rows || [];
      } catch (error: any) {
        // Table may not exist yet - that's okay, just skip pricing
        // Check if it's a "relation does not exist" error (PostgreSQL error code 42P01)
        if (error.message?.includes('does not exist') || error.code === '42P01' || error.message?.includes('activity_pricing_packages')) {
          console.warn('activity_pricing_packages table not found, skipping pricing data');
          activityPricing = [];
        } else {
          // For other errors, log but still continue
          console.warn('Error fetching pricing packages (non-fatal):', error.message);
          activityPricing = [];
        }
      }
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
    
    // Fetch images for transfer packages (optional - table may not exist yet)
    let transferImages: any[] = [];
    if (transferPackageIds.length > 0) {
      try {
        const imagesResult = await query<any>(
          `SELECT package_id, id, public_url, is_cover
           FROM transfer_package_images
           WHERE package_id::text = ANY($1::text[])`,
          [transferPackageIds]
        );
        transferImages = imagesResult.rows || [];
      } catch (error: any) {
        // Table may not exist yet - that's okay, just skip images
        if (error.message?.includes('does not exist') || error.code === '42P01' || error.message?.includes('transfer_package_images')) {
          console.warn('transfer_package_images table not found, skipping image data');
          transferImages = [];
        } else {
          console.warn('Error fetching transfer images (non-fatal):', error.message);
          transferImages = [];
        }
      }
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
    
    // Fetch images for multi-city packages (optional - table may not exist yet)
    let multiCityImages: any[] = [];
    if (multiCityPackageIds.length > 0) {
      try {
        const imagesResult = await query<any>(
          `SELECT package_id, id, public_url, is_cover
           FROM multi_city_package_images
           WHERE package_id::text = ANY($1::text[])`,
          [multiCityPackageIds]
        );
        multiCityImages = imagesResult.rows || [];
      } catch (error: any) {
        // Table may not exist yet - that's okay, just skip images
        if (error.message?.includes('does not exist') || error.code === '42P01' || error.message?.includes('multi_city_package_images')) {
          console.warn('multi_city_package_images table not found, skipping image data');
          multiCityImages = [];
        } else {
          console.warn('Error fetching multi-city images (non-fatal):', error.message);
          multiCityImages = [];
        }
      }
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

    // Fetch multi-city hotel packages
    const multiCityHotelPackagesResult = await query<any>(
      `SELECT 
        mchp.id, mchp.title, mchp.short_description, mchp.status, mchp.base_price, mchp.currency,
        mchp.destination_region, mchp.total_cities, mchp.total_nights, mchp.created_at, mchp.published_at
       FROM multi_city_hotel_packages mchp
       WHERE mchp.operator_id::text = $1
       ORDER BY mchp.created_at DESC`,
      [operatorId]
    );

    const multiCityHotelPackageIds = multiCityHotelPackagesResult.rows?.map((p: any) => p.id) || [];
    
    // Fetch images for multi-city hotel packages
    let multiCityHotelImages: any[] = [];
    if (multiCityHotelPackageIds.length > 0) {
      try {
        const imagesResult = await query<any>(
          `SELECT package_id, id, public_url, is_cover
           FROM multi_city_hotel_package_images
           WHERE package_id::text = ANY($1::text[])`,
          [multiCityHotelPackageIds]
        );
        multiCityHotelImages = imagesResult.rows || [];
      } catch (error: any) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          console.warn('multi_city_hotel_package_images table not found, skipping image data');
          multiCityHotelImages = [];
        } else {
          console.warn('Error fetching multi-city hotel images (non-fatal):', error.message);
          multiCityHotelImages = [];
        }
      }
    }

    // Combine multi-city hotel packages with images
    const multiCityHotelPackages = (multiCityHotelPackagesResult.rows || []).map((pkg: any) => {
      const pkgImages = multiCityHotelImages.filter((img: any) => img.package_id === pkg.id);
      const coverImage = pkgImages.find((img: any) => img.is_cover);
      const imageUrl = coverImage?.public_url || pkgImages[0]?.public_url || '';

      return {
        ...pkg,
        imageUrl,
        images: pkgImages,
      };
    });

    // Fetch fixed departure flight packages
    const fixedDepartureFlightPackagesResult = await query<any>(
      `SELECT 
        fdfp.id, fdfp.title, fdfp.short_description, fdfp.status, fdfp.base_price, fdfp.currency,
        fdfp.destination_region, fdfp.created_at, fdfp.published_at
       FROM fixed_departure_flight_packages fdfp
       WHERE fdfp.operator_id::text = $1
       ORDER BY fdfp.created_at DESC`,
      [operatorId]
    );

    const fixedDepartureFlightPackageIds = fixedDepartureFlightPackagesResult.rows?.map((p: any) => p.id) || [];
    
    // Fetch images for fixed departure flight packages (if table exists)
    let fixedDepartureFlightImages: any[] = [];
    if (fixedDepartureFlightPackageIds.length > 0) {
      try {
        const imagesResult = await query<any>(
          `SELECT package_id, id, public_url, is_cover
           FROM fixed_departure_flight_package_images
           WHERE package_id::text = ANY($1::text[])`,
          [fixedDepartureFlightPackageIds]
        );
        fixedDepartureFlightImages = imagesResult.rows || [];
      } catch (error: any) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          console.warn('fixed_departure_flight_package_images table not found, skipping image data');
          fixedDepartureFlightImages = [];
        } else {
          console.warn('Error fetching fixed departure flight images (non-fatal):', error.message);
          fixedDepartureFlightImages = [];
        }
      }
    }

    // Combine fixed departure flight packages with images
    const fixedDepartureFlightPackages = (fixedDepartureFlightPackagesResult.rows || []).map((pkg: any) => {
      const pkgImages = fixedDepartureFlightImages.filter((img: any) => img.package_id === pkg.id);
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
      multiCityHotelPackages,
      fixedDepartureFlightPackages,
    });
  } catch (error) {
    console.error('Error fetching operator packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

