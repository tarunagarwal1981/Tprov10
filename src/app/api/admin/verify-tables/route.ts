import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/verify-tables
 * Verify all itinerary-related tables exist in AWS RDS
 * 
 * This endpoint uses the Lambda database service to check table existence
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting table verification...');

    const requiredTables = [
      // Itinerary tables
      'itineraries',
      'itinerary_days',
      'itinerary_items',
      
      // Multi-city package tables
      'multi_city_packages',
      'multi_city_hotel_packages',
      'multi_city_pricing_packages',
      'multi_city_hotel_pricing_packages',
      'multi_city_pricing_rows',
      'multi_city_hotel_pricing_rows',
      'multi_city_private_package_rows',
      'multi_city_hotel_private_package_rows',
      'multi_city_package_day_plans',
      'multi_city_hotel_package_day_plans',
      'multi_city_package_cities',
      'multi_city_hotel_package_cities',
      'multi_city_hotel_package_city_hotels',
      'multi_city_package_images',
      'multi_city_hotel_package_images',
    ];

    const results: {
      exists: string[];
      missing: string[];
      hasTimeSlots: boolean;
      errors: Array<{ table: string; error: string }>;
    } = {
      exists: [],
      missing: [],
      hasTimeSlots: false,
      errors: [],
    };

    // Test connection first
    try {
      const testResult = await query('SELECT NOW() as current_time');
      console.log('✅ Database connection successful');
    } catch (error: any) {
      return NextResponse.json(
        {
          error: 'Database connection failed',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Check each table
    for (const tableName of requiredTables) {
      try {
        const tableCheck = await query<{ exists: boolean }>(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          ) as exists`,
          [tableName]
        );

        if (tableCheck.rows[0]?.exists) {
          results.exists.push(tableName);

          // Check for time_slots column if it's itinerary_days
          if (tableName === 'itinerary_days') {
            try {
              const columnCheck = await query<{ exists: boolean }>(
                `SELECT EXISTS (
                  SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = $1 
                  AND column_name = 'time_slots'
                ) as exists`,
                [tableName]
              );
              results.hasTimeSlots = columnCheck.rows[0]?.exists === true;
            } catch (error: any) {
              results.errors.push({ table: tableName, error: `Column check failed: ${error.message}` });
            }
          }
        } else {
          results.missing.push(tableName);
        }
      } catch (error: any) {
        results.errors.push({ table: tableName, error: error.message });
        results.missing.push(tableName);
      }
    }

    const summary = {
      total: requiredTables.length,
      found: results.exists.length,
      missing: results.missing.length,
      timeSlotsColumn: results.hasTimeSlots ? 'EXISTS' : 'MISSING (backward compatible)',
      allTablesExist: results.missing.length === 0,
    };

    return NextResponse.json({
      success: true,
      summary,
      tables: {
        exists: results.exists,
        missing: results.missing,
      },
      timeSlots: {
        exists: results.hasTimeSlots,
        note: results.hasTimeSlots 
          ? 'time_slots column exists in itinerary_days' 
          : 'time_slots column missing but code handles this gracefully',
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
      recommendations: results.missing.length > 0
        ? [
            'Run migrations to create missing tables',
            'Use: ./scripts/migrate-itinerary-tables.sh or run migration 017',
          ]
        : results.hasTimeSlots
        ? ['All tables exist and time_slots column is present']
        : [
            'All tables exist',
            'time_slots column is missing but backward compatible',
            'To add it: Run supabase/migrations/017_enhance_itinerary_days.sql',
          ],
    });
  } catch (error: any) {
    console.error('❌ Verification failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Verification failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

