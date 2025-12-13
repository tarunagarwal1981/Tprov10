import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';
import { buildCityMatchSQL, filterPackagesByCities } from '@/lib/utils/cityMatching';
import { normalizePackageId, type PackageId, type PackageWithDetails } from '@/lib/types/package';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Logging utility for package fetching operations
 */
function logInfo(message: string, data?: Record<string, unknown>) {
  console.log(`[MultiCityHotelPackages] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

function logError(message: string, error: unknown, context?: Record<string, unknown>) {
  const errorDetails = error instanceof Error ? {
    message: error.message,
    stack: error.stack,
    name: error.name,
  } : { error: String(error) };
  
  console.error(`[MultiCityHotelPackages] ${message}`, {
    ...errorDetails,
    ...context,
  });
}

function logWarning(message: string, data?: Record<string, unknown>) {
  console.warn(`[MultiCityHotelPackages] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

/**
 * GET /api/packages/multi-city-hotel?cities=city1,city2
 * Get multi-city hotel packages matching the given cities
 * Optimized for scalability - filters at database level using SQL
 * Uses intelligent city name matching with normalization and aliases
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let cities: string[] = [];
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const citiesParam = searchParams.get('cities');
    cities = citiesParam ? citiesParam.split(',').map(c => c.trim()).filter(c => c.length > 0) : [];
    
    logInfo('Fetching multi-city hotel packages', {
      citiesCount: cities.length,
      cities: cities.length > 0 ? cities : 'all',
      hasCityFilter: cities.length > 0,
    });

    // Build efficient SQL query that filters at database level
    // This approach scales well for 4-5k+ packages
    let packagesQuery = `
      SELECT DISTINCT
        p.id, p.title, p.destination_region, p.operator_id, p.base_price, 
        p.adult_price, p.currency, p.total_nights, p.total_cities, p.status
      FROM multi_city_hotel_packages p
    `;

    const queryParams: any[] = [];

    // If cities are provided, filter packages that have matching cities
    if (cities.length > 0) {
      // Use intelligent city matching to build SQL conditions
      const cityMatch = buildCityMatchSQL(cities, 'c.name');
      
      packagesQuery += `
        WHERE p.status = 'published'
        AND EXISTS (
          SELECT 1 
          FROM multi_city_hotel_package_cities c
          WHERE c.package_id = p.id
          AND (${cityMatch.conditions})
        )
      `;
      
      queryParams.push(...cityMatch.parameters);
    } else {
      // No city filter - return all published packages
      packagesQuery += ` WHERE p.status = 'published'`;
    }

    // Execute the optimized query
    let packagesResult;
    try {
      packagesResult = await query<any>(packagesQuery, queryParams);
      
      if (!packagesResult || !packagesResult.rows) {
        logWarning('Query returned invalid result structure', { packagesResult });
        return NextResponse.json({ packages: [] });
      }
      
      logInfo('Packages query executed', {
        packagesFound: packagesResult.rows.length,
        queryParamsCount: queryParams.length,
      });
    } catch (queryError) {
      logError('Failed to execute packages query', queryError, {
        query: packagesQuery.substring(0, 200), // Log first 200 chars of query
        paramsCount: queryParams.length,
      });
      throw new Error(`Database query failed: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`);
    }

    if (packagesResult.rows.length === 0) {
      logInfo('No packages found matching criteria');
      return NextResponse.json({ packages: [] });
    }

    // Normalize package IDs to ensure type safety
    const packageIds: PackageId[] = [];
    for (const pkg of packagesResult.rows) {
      try {
        const normalizedId = normalizePackageId(pkg.id);
        packageIds.push(normalizedId);
      } catch (idError) {
        logWarning('Invalid package ID found, skipping', {
          packageId: pkg.id,
          packageTitle: pkg.title,
          error: idError instanceof Error ? idError.message : String(idError),
        });
      }
    }

    if (packageIds.length === 0) {
      logWarning('No valid package IDs found after normalization');
      return NextResponse.json({ packages: [] });
    }

    logInfo('Package IDs normalized', { validIds: packageIds.length, totalPackages: packagesResult.rows.length });

    // Fetch cities for matching packages (only for the filtered packages)
    let citiesResult;
    try {
      citiesResult = await query<any>(
        `SELECT package_id, name, nights, country 
         FROM multi_city_hotel_package_cities 
         WHERE package_id::text = ANY($1::text[])
         ORDER BY package_id, display_order`,
        [packageIds]
      );
      
      if (!citiesResult || !citiesResult.rows) {
        logWarning('Cities query returned invalid result structure');
        citiesResult = { rows: [] };
      } else {
        logInfo('Cities fetched', { citiesCount: citiesResult.rows.length });
      }
    } catch (citiesError) {
      logError('Failed to fetch cities', citiesError, { packageIdsCount: packageIds.length });
      // Continue with empty cities array rather than failing completely
      citiesResult = { rows: [] };
    }

    // Fetch images for matching packages (only cover images)
    let imagesResult;
    try {
      imagesResult = await query<any>(
        `SELECT package_id, public_url, is_cover 
         FROM multi_city_hotel_package_images 
         WHERE package_id::text = ANY($1::text[]) AND is_cover = true`,
        [packageIds]
      );
      
      if (!imagesResult || !imagesResult.rows) {
        logWarning('Images query returned invalid result structure');
        imagesResult = { rows: [] };
      } else {
        logInfo('Images fetched', { imagesCount: imagesResult.rows.length });
      }
    } catch (imagesError) {
      logError('Failed to fetch images', imagesError, { packageIdsCount: packageIds.length });
      // Continue with empty images array rather than failing completely
      imagesResult = { rows: [] };
    }

    // Build result map for efficient lookup with type-safe ID comparison
    const imagesMap = new Map<PackageId, string>();
    let imagesProcessed = 0;
    let imagesSkipped = 0;
    
    for (const img of imagesResult.rows) {
      try {
        const normalizedId = normalizePackageId(img.package_id);
        if (img.public_url) {
          imagesMap.set(normalizedId, img.public_url);
          imagesProcessed++;
        }
      } catch (idError) {
        imagesSkipped++;
        logWarning('Invalid image package_id, skipping', {
          packageId: img.package_id,
          error: idError instanceof Error ? idError.message : String(idError),
        });
      }
    }
    
    if (imagesSkipped > 0) {
      logWarning('Some images were skipped due to invalid package IDs', {
        processed: imagesProcessed,
        skipped: imagesSkipped,
      });
    }

    const citiesMap = new Map<PackageId, Array<{ name: string; nights: number; country?: string | null }>>();
    let citiesProcessed = 0;
    let citiesSkipped = 0;
    
    for (const city of citiesResult.rows) {
      try {
        const normalizedId = normalizePackageId(city.package_id);
        if (!citiesMap.has(normalizedId)) {
          citiesMap.set(normalizedId, []);
        }
      citiesMap.get(normalizedId)!.push({
        name: city.name || 'Unknown',
        nights: city.nights || 1,
        country: city.country || null,
      });
        citiesProcessed++;
      } catch (idError) {
        citiesSkipped++;
        logWarning('Invalid city package_id, skipping', {
          packageId: city.package_id,
          cityName: city.name,
          error: idError instanceof Error ? idError.message : String(idError),
        });
      }
    }
    
    if (citiesSkipped > 0) {
      logWarning('Some cities were skipped due to invalid package IDs', {
        processed: citiesProcessed,
        skipped: citiesSkipped,
      });
    }

    // Combine packages with their cities and images using type-safe ID comparison
    let packagesWithDetails: PackageWithDetails[] = [];
    let packagesSkipped = 0;
    
    for (const pkg of packagesResult.rows) {
      try {
        const normalizedId = normalizePackageId(pkg.id);
        const packageDetails: PackageWithDetails = {
          id: normalizedId,
          title: pkg.title || 'Untitled Package',
          destination_region: pkg.destination_region || null,
          operator_id: pkg.operator_id || '',
          base_price: pkg.base_price ?? null,
          currency: pkg.currency || 'USD',
          total_nights: pkg.total_nights || 0,
          total_cities: pkg.total_cities || 0,
          status: pkg.status || 'unknown',
          featured_image_url: imagesMap.get(normalizedId) || undefined,
          cities: citiesMap.get(normalizedId) || [],
          adult_price: pkg.adult_price ?? null,
        };
        
        packagesWithDetails.push(packageDetails);
      } catch (idError) {
        packagesSkipped++;
        logWarning('Invalid package ID, skipping package', {
          packageId: pkg.id,
          packageTitle: pkg.title,
          error: idError instanceof Error ? idError.message : String(idError),
        });
      }
    }
    
    if (packagesSkipped > 0) {
      logWarning('Some packages were skipped due to invalid IDs', {
        processed: packagesWithDetails.length,
        skipped: packagesSkipped,
      });
    }

    // Apply additional intelligent filtering for better accuracy
    // This handles edge cases that SQL matching might miss
    const initialCount = packagesWithDetails.length;
    if (cities.length > 0) {
      try {
        packagesWithDetails = filterPackagesByCities(
          packagesWithDetails,
          cities,
          'partial' // Accept partial matches and above
        );
        logInfo('Post-processing filter applied', {
          before: initialCount,
          after: packagesWithDetails.length,
          filtered: initialCount - packagesWithDetails.length,
        });
      } catch (filterError) {
        logError('Post-processing filter failed, returning SQL-filtered results', filterError);
        // Continue with SQL-filtered results if post-processing fails
      }
    }

    const duration = Date.now() - startTime;
    logInfo('Request completed successfully', {
      packagesReturned: packagesWithDetails.length,
      durationMs: duration,
      citiesFiltered: cities.length > 0,
    });

    return NextResponse.json({ packages: packagesWithDetails });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Request failed', error, {
      durationMs: duration,
      citiesRequested: cities.length,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch multi-city hotel packages', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

