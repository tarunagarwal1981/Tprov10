import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/check-activity-schema
 * Check the actual schema of activity package tables in RDS
 */
export async function GET(request: NextRequest) {
  try {
    // Get column information for activity_packages
    const activityPackagesSchema = await query(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'activity_packages'
      ORDER BY ordinal_position
    `);

    // Get column information for activity_package_time_slots
    const timeSlotsSchema = await query(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'activity_package_time_slots'
      ORDER BY ordinal_position
    `);

    // Get column information for activity_package_variants
    const variantsSchema = await query(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'activity_package_variants'
      ORDER BY ordinal_position
    `);

    // Get column information for activity_package_faqs
    const faqsSchema = await query(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'activity_package_faqs'
      ORDER BY ordinal_position
    `);

    return NextResponse.json({
      success: true,
      schemas: {
        activity_packages: activityPackagesSchema.rows,
        activity_package_time_slots: timeSlotsSchema.rows,
        activity_package_variants: variantsSchema.rows,
        activity_package_faqs: faqsSchema.rows,
      },
    });
  } catch (error: any) {
    console.error('Error checking schema:', error);
    return NextResponse.json(
      {
        error: 'Failed to check schema',
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
