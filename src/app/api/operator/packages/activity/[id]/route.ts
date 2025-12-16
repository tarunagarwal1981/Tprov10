import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';
import { getPresignedDownloadUrl } from '@/lib/aws/s3-upload';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/operator/packages/activity/[id]
 * Get an activity package with all related data from RDS
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get main package
    const packageResult = await query<any>(
      `SELECT * FROM activity_packages WHERE id::text = $1`,
      [id]
    );

    if (!packageResult.rows || packageResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Activity package not found' },
        { status: 404 }
      );
    }

    const packageData = packageResult.rows[0];

    // Get related data in parallel
    const [imagesResult, timeSlotsResult, variantsResult, faqsResult, pricingResult] = await Promise.all([
      query<any>(`SELECT * FROM activity_package_images WHERE package_id::text = $1 ORDER BY display_order`, [id]).catch(() => ({ rows: [] })),
      query<any>(`SELECT * FROM activity_package_time_slots WHERE package_id::text = $1 ORDER BY start_time`, [id]).catch(() => ({ rows: [] })),
      query<any>(`SELECT * FROM activity_package_variants WHERE package_id::text = $1 ORDER BY display_order`, [id]).catch(() => ({ rows: [] })),
      query<any>(`SELECT * FROM activity_package_faqs WHERE package_id::text = $1 ORDER BY display_order`, [id]).catch(() => ({ rows: [] })),
      query<any>(`SELECT * FROM activity_pricing_packages WHERE package_id::text = $1 ORDER BY display_order`, [id]).catch(() => ({ rows: [] })),
    ]);

    // Generate presigned URLs for images (if they're S3 paths and not already public URLs)
    console.log('🖼️ [API] Processing images for presigned URLs:', {
      imageCount: imagesResult.rows?.length || 0,
      images: (imagesResult.rows || []).map((img: any) => ({
        id: img.id,
        file_name: img.file_name,
        storage_path: img.storage_path?.substring(0, 80) + '...',
        public_url: img.public_url?.substring(0, 80) + '...',
      }))
    });

    const imagesWithPresignedUrls = await Promise.all(
      (imagesResult.rows || []).map(async (img: any) => {
        // Check if we need to generate a presigned URL
        // Generate presigned URL if:
        // 1. storage_path exists and is an S3 path (starts with activity-packages-images/)
        // 2. public_url is missing, is a direct S3 URL, or is not already CloudFront/presigned
        // Skip images with base64 data URLs in storage_path (corrupted data)
        const isBase64Storage = img.storage_path && img.storage_path.startsWith('data:');
        if (isBase64Storage) {
          console.warn('⚠️ [API] Skipping image with base64 in storage_path (corrupted data):', {
            id: img.id,
            file_name: img.file_name,
            storage_path_preview: img.storage_path?.substring(0, 60),
            has_public_url: !!img.public_url,
          });
          // If it has a valid public_url, use that; otherwise skip this image
          if (img.public_url && !img.public_url.startsWith('data:')) {
            return { ...img, public_url: img.public_url };
          }
          // Return null to filter out later
          return null;
        }
        
        const hasS3Path = img.storage_path && img.storage_path.startsWith('activity-packages-images/');
        const isDirectS3Url = img.public_url && img.public_url.includes('.s3.') && img.public_url.includes('amazonaws.com');
        const isAlreadyPresigned = img.public_url && (img.public_url.includes('cloudfront') || img.public_url.includes('?X-Amz'));
        
        console.log('🔍 [API] Image analysis:', {
          file_name: img.file_name,
          hasS3Path,
          isDirectS3Url,
          isAlreadyPresigned,
          storage_path_preview: img.storage_path?.substring(0, 60),
          public_url_preview: img.public_url?.substring(0, 60),
        });
        
        if (hasS3Path && (!img.public_url || isDirectS3Url || !isAlreadyPresigned)) {
          console.log('📤 [API] Generating presigned URL for:', img.storage_path?.substring(0, 60));
          try {
            const presignedUrl = await getPresignedDownloadUrl(img.storage_path, 3600); // 1 hour expiry
            console.log('✅ [API] Presigned URL generated:', {
              file_name: img.file_name,
              presigned_url_preview: presignedUrl?.substring(0, 80) + '...',
            });
            return {
              ...img,
              public_url: presignedUrl,
            };
          } catch (error: any) {
            console.error('❌ [API] Failed to generate presigned URL:', {
              file_name: img.file_name,
              storage_path: img.storage_path,
              error: error.message,
              stack: error.stack,
            });
            // Fallback to original public_url or storage_path
            return {
              ...img,
              public_url: img.public_url || img.storage_path,
            };
          }
        } else {
          console.log('⏭️ [API] Skipping presigned URL generation:', {
            file_name: img.file_name,
            reason: !hasS3Path ? 'No S3 path' : isAlreadyPresigned ? 'Already presigned/CloudFront' : 'Other',
          });
        }
        return img;
      })
    );
    
    // Filter out null images (corrupted base64 data)
    const validImages = imagesWithPresignedUrls.filter((img: any) => img !== null);

    console.log('🎯 [API] Final images with URLs:', {
      imageCount: validImages.length,
      filteredOut: imagesWithPresignedUrls.length - validImages.length,
      images: validImages.map((img: any) => ({
        file_name: img.file_name,
        public_url_preview: img.public_url?.substring(0, 80) + '...',
        is_presigned: img.public_url?.includes('?X-Amz'),
      }))
    });

    // Get vehicles for pricing packages
    const pricingPackageIds = (pricingResult.rows || []).map((p: any) => p.id);
    let vehiclesResult: any = { rows: [] };
    if (pricingPackageIds.length > 0) {
      vehiclesResult = await query<any>(
        `SELECT * FROM activity_pricing_package_vehicles WHERE pricing_package_id::text = ANY($1::text[]) ORDER BY display_order`,
        [pricingPackageIds]
      ).catch(() => ({ rows: [] }));
    }

    // Group vehicles by pricing_package_id
    const vehiclesMap: { [key: string]: any[] } = {};
    (vehiclesResult.rows || []).forEach((vehicle: any) => {
      if (!vehiclesMap[vehicle.pricing_package_id]) {
        vehiclesMap[vehicle.pricing_package_id] = [];
      }
      vehiclesMap[vehicle.pricing_package_id]!.push(vehicle);
    });

    // Transform database rows (snake_case) to ActivityPricingPackage format (camelCase)
    const pricingWithVehicles = (pricingResult.rows || []).map((pkg: any) => ({
      id: pkg.id,
      packageId: pkg.package_id,
      packageName: pkg.package_name || '',
      description: pkg.description || undefined,
      adultPrice: Number(pkg.adult_price) || 0,
      childPrice: Number(pkg.child_price) || 0,
      childMinAge: Number(pkg.child_min_age) || 0,
      childMaxAge: Number(pkg.child_max_age) || 0,
      infantPrice: pkg.infant_price !== null ? Number(pkg.infant_price) : undefined,
      infantMaxAge: pkg.infant_max_age || undefined,
      transferIncluded: pkg.transfer_included || false,
      transferType: pkg.transfer_type as 'SHARED' | 'PRIVATE' | undefined,
      transferPriceAdult: pkg.transfer_price_adult !== null ? Number(pkg.transfer_price_adult) : undefined,
      transferPriceChild: pkg.transfer_price_child !== null ? Number(pkg.transfer_price_child) : undefined,
      transferPriceInfant: pkg.transfer_price_infant !== null ? Number(pkg.transfer_price_infant) : undefined,
      pickupLocation: pkg.pickup_location || undefined,
      pickupInstructions: pkg.pickup_instructions || undefined,
      dropoffLocation: pkg.dropoff_location || undefined,
      dropoffInstructions: pkg.dropoff_instructions || undefined,
      includedItems: pkg.included_items || [],
      excludedItems: pkg.excluded_items || undefined,
      isActive: pkg.is_active !== undefined ? pkg.is_active : true,
      isFeatured: pkg.is_featured || false,
      displayOrder: pkg.display_order || 0,
      vehicles: vehiclesMap[pkg.id] || [],
    }));

    const result = {
      ...packageData,
      images: validImages,
      time_slots: timeSlotsResult.rows || [],
      variants: variantsResult.rows || [],
      faqs: faqsResult.rows || [],
      pricing_packages: pricingWithVehicles,
    };

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching activity package:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity package', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

