import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/operator/packages/duplicate
 * Duplicate a package (activity, transfer, or multi-city) with all related data
 * Body: { packageId, packageType, operatorId }
 */
export async function POST(request: NextRequest) {
  try {
    const { packageId, packageType, operatorId } = await request.json();

    if (!packageId || !packageType || !operatorId) {
      return NextResponse.json(
        { error: 'packageId, packageType, and operatorId are required' },
        { status: 400 }
      );
    }

    let tableName: string;
    let imageTableName: string;
    let relatedTables: string[] = [];

    // Determine tables based on package type
    switch (packageType) {
      case 'Activity':
        tableName = 'activity_packages';
        imageTableName = 'activity_package_images';
        relatedTables = ['activity_pricing_packages', 'activity_package_inclusions', 'activity_package_exclusions'];
        break;
      case 'Transfer':
        tableName = 'transfer_packages';
        imageTableName = 'transfer_package_images';
        relatedTables = ['transfer_package_vehicles', 'transfer_package_stops'];
        break;
      case 'Multi-City':
        tableName = 'multi_city_packages';
        imageTableName = 'multi_city_package_images';
        relatedTables = [
          'multi_city_package_cities',
          'multi_city_pricing_packages',
          'multi_city_package_day_plans',
          'multi_city_package_inclusions',
          'multi_city_package_exclusions',
          'multi_city_package_cancellation_tiers',
        ];
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid package type' },
          { status: 400 }
        );
    }

    // Fetch original package
    const originalPackage = await queryOne<any>(
      `SELECT * FROM ${tableName} WHERE id::text = $1 LIMIT 1`,
      [packageId]
    );

    if (!originalPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Create duplicate package data (exclude id, timestamps)
    const { id, created_at, updated_at, published_at, ...packageData } = originalPackage;
    const duplicatedPackage = {
      ...packageData,
      title: `${originalPackage.title} (Copy)`,
      status: 'draft',
      operator_id: operatorId,
    };

    // Insert duplicated package
    const insertResult = await query<{ id: string }>(
      `INSERT INTO ${tableName} (${Object.keys(duplicatedPackage).join(', ')})
       VALUES (${Object.keys(duplicatedPackage).map((_, i) => `$${i + 1}`).join(', ')})
       RETURNING id`,
      Object.values(duplicatedPackage)
    );

    if (!insertResult.rows || !insertResult.rows[0]) {
      return NextResponse.json(
        { error: 'Failed to duplicate package' },
        { status: 500 }
      );
    }

    const newPackageId = insertResult.rows[0].id;

    // Copy images
    const images = await query<any>(
      `SELECT * FROM ${imageTableName} WHERE package_id::text = $1`,
      [packageId]
    );

    if (images.rows && images.rows.length > 0) {
      for (const image of images.rows) {
        const { id: imageId, created_at: imgCreated, updated_at: imgUpdated, uploaded_at, ...imageData } = image;
        await query(
          `INSERT INTO ${imageTableName} (${Object.keys(imageData).join(', ')}, package_id)
           VALUES (${Object.keys(imageData).map((_, i) => `$${i + 1}`).join(', ')}, $${Object.keys(imageData).length + 1})`,
          [...Object.values(imageData), newPackageId]
        );
      }
    }

    // Copy related data based on package type
    if (packageType === 'Multi-City') {
      // Copy cities
      const cities = await query<any>(
        `SELECT * FROM multi_city_package_cities WHERE package_id::text = $1`,
        [packageId]
      );
      const cityIdMap: Record<string, string> = {};
      
      if (cities.rows && cities.rows.length > 0) {
        for (const city of cities.rows) {
          const { id: cityId, created_at: cityCreated, ...cityData } = city;
          const cityResult = await query<{ id: string }>(
            `INSERT INTO multi_city_package_cities (${Object.keys(cityData).join(', ')}, package_id)
             VALUES (${Object.keys(cityData).map((_, i) => `$${i + 1}`).join(', ')}, $${Object.keys(cityData).length + 1})
             RETURNING id`,
            [...Object.values(cityData), newPackageId]
          );
          if (cityResult.rows && cityResult.rows[0]) {
            cityIdMap[cityId] = cityResult.rows[0].id;
          }
        }
      }

      // Copy pricing packages and rows
      const pricingPackages = await query<any>(
        `SELECT * FROM multi_city_pricing_packages WHERE package_id::text = $1`,
        [packageId]
      );
      
      if (pricingPackages.rows && pricingPackages.rows.length > 0) {
        for (const pricingPkg of pricingPackages.rows) {
          const { id: pricingId, ...pricingData } = pricingPkg;
          const newPricingResult = await query<{ id: string }>(
            `INSERT INTO multi_city_pricing_packages (${Object.keys(pricingData).join(', ')}, package_id)
             VALUES (${Object.keys(pricingData).map((_, i) => `$${i + 1}`).join(', ')}, $${Object.keys(pricingData).length + 1})
             RETURNING id`,
            [...Object.values(pricingData), newPackageId]
          );
          
          if (newPricingResult.rows && newPricingResult.rows[0]) {
            const newPricingId = newPricingResult.rows[0].id;
            
            // Copy pricing rows
            const pricingRows = await query<any>(
              `SELECT * FROM multi_city_pricing_rows WHERE pricing_package_id::text = $1`,
              [pricingId]
            );
            if (pricingRows.rows && pricingRows.rows.length > 0) {
              for (const row of pricingRows.rows) {
                const { id: rowId, ...rowData } = row;
                await query(
                  `INSERT INTO multi_city_pricing_rows (${Object.keys(rowData).join(', ')}, pricing_package_id)
                   VALUES (${Object.keys(rowData).map((_, i) => `$${i + 1}`).join(', ')}, $${Object.keys(rowData).length + 1})`,
                  [...Object.values(rowData), newPricingId]
                );
              }
            }
          }
        }
      }

      // Copy day plans (update city_id references)
      const dayPlans = await query<any>(
        `SELECT * FROM multi_city_package_day_plans WHERE package_id::text = $1`,
        [packageId]
      );
      if (dayPlans.rows && dayPlans.rows.length > 0) {
        for (const dayPlan of dayPlans.rows) {
          const { id: dayId, created_at: dayCreated, updated_at: dayUpdated, city_id, ...dayData } = dayPlan;
          const newCityId = city_id ? cityIdMap[city_id] || null : null;
          await query(
            `INSERT INTO multi_city_package_day_plans (${Object.keys(dayData).join(', ')}, package_id, city_id)
             VALUES (${Object.keys(dayData).map((_, i) => `$${i + 1}`).join(', ')}, $${Object.keys(dayData).length + 1}, $${Object.keys(dayData).length + 2})`,
            [...Object.values(dayData), newPackageId, newCityId]
          );
        }
      }

      // Copy inclusions, exclusions, cancellation tiers
      for (const table of ['multi_city_package_inclusions', 'multi_city_package_exclusions', 'multi_city_package_cancellation_tiers']) {
        const relatedData = await query<any>(
          `SELECT * FROM ${table} WHERE package_id::text = $1`,
          [packageId]
        );
        if (relatedData.rows && relatedData.rows.length > 0) {
          for (const item of relatedData.rows) {
            const { id: itemId, created_at: itemCreated, ...itemData } = item;
            await query(
              `INSERT INTO ${table} (${Object.keys(itemData).join(', ')}, package_id)
               VALUES (${Object.keys(itemData).map((_, i) => `$${i + 1}`).join(', ')}, $${Object.keys(itemData).length + 1})`,
              [...Object.values(itemData), newPackageId]
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      packageId: newPackageId,
      message: 'Package duplicated successfully',
    });
  } catch (error) {
    console.error('Error duplicating package:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate package', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


