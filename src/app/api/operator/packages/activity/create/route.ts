import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/operator/packages/activity/create
 * Create a new activity package with all related data
 */
export async function POST(request: NextRequest) {
  let packageData: any = null;
  try {
    const data = await request.json();
    const { package: pkgData, images, time_slots, variants, faqs } = data;
    packageData = pkgData;

    if (!pkgData || !pkgData.operator_id) {
      return NextResponse.json(
        { error: 'operator_id is required in package data' },
        { status: 400 }
      );
    }

    // Helper function to ensure JSONB arrays are properly formatted
    // The actual database stores arrays as JSONB, not PostgreSQL arrays
    const ensureJSONB = (value: any, defaultValue: any = []): any => {
      // Handle null/undefined
      if (value === null || value === undefined) {
        return defaultValue;
      }
      
      // Handle empty strings - treat as default
      if (typeof value === 'string' && value.trim() === '') {
        return defaultValue;
      }
      
      // If already a string, try to parse it first to validate
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          // Ensure parsed value is an array or object (valid JSONB)
          if (Array.isArray(parsed) || (typeof parsed === 'object' && parsed !== null)) {
            return parsed;
          }
          // If parsed value is not array/object, return default
          return defaultValue;
        } catch (e) {
          // Invalid JSON string, return default
          console.warn('[ensureJSONB] Invalid JSON string, using default:', { value, error: e });
          return defaultValue;
        }
      }
      
      // If it's already an array or object, return as-is (will be JSON.stringify'd by pg)
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        return value;
      }
      
      // For any other type (number, boolean, etc.), wrap in array if default is array
      if (Array.isArray(defaultValue)) {
        return [value];
      }
      
      // Otherwise return default
      return defaultValue;
    };

    // Prepare JSONB values with validation
    // Note: difficulty_level, languages_supported, and tags may not be in formData but have defaults
    const jsonbValues = {
      languages_supported: ensureJSONB(pkgData.languages_supported, ['EN']),
      tags: ensureJSONB(pkgData.tags, []),
      operating_days: ensureJSONB(pkgData.operating_days, []),
      whats_included: ensureJSONB(pkgData.whats_included, []),
      whats_not_included: ensureJSONB(pkgData.whats_not_included, []),
      what_to_bring: ensureJSONB(pkgData.what_to_bring, []),
      accessibility_facilities: ensureJSONB(pkgData.accessibility_facilities, []),
      health_safety_requirements: ensureJSONB(pkgData.health_safety_requirements, []),
      group_discounts: ensureJSONB(pkgData.group_discounts, []),
      seasonal_pricing: ensureJSONB(pkgData.seasonal_pricing, []),
    };

    // Log JSONB values for debugging with type information
    console.log('[Package Create] JSONB values prepared:', {
      languages_supported: { value: jsonbValues.languages_supported, type: typeof jsonbValues.languages_supported, isArray: Array.isArray(jsonbValues.languages_supported) },
      tags: { value: jsonbValues.tags, type: typeof jsonbValues.tags, isArray: Array.isArray(jsonbValues.tags) },
      operating_days: { value: jsonbValues.operating_days, type: typeof jsonbValues.operating_days, isArray: Array.isArray(jsonbValues.operating_days) },
      whats_included: { value: jsonbValues.whats_included, type: typeof jsonbValues.whats_included, isArray: Array.isArray(jsonbValues.whats_included) },
      whats_not_included: { value: jsonbValues.whats_not_included, type: typeof jsonbValues.whats_not_included, isArray: Array.isArray(jsonbValues.whats_not_included) },
      what_to_bring: { value: jsonbValues.what_to_bring, type: typeof jsonbValues.what_to_bring, isArray: Array.isArray(jsonbValues.what_to_bring) },
      accessibility_facilities: { value: jsonbValues.accessibility_facilities, type: typeof jsonbValues.accessibility_facilities, isArray: Array.isArray(jsonbValues.accessibility_facilities) },
      health_safety_requirements: { value: jsonbValues.health_safety_requirements, type: typeof jsonbValues.health_safety_requirements, isArray: Array.isArray(jsonbValues.health_safety_requirements) },
      group_discounts: { value: jsonbValues.group_discounts, type: typeof jsonbValues.group_discounts, isArray: Array.isArray(jsonbValues.group_discounts) },
      seasonal_pricing: { value: jsonbValues.seasonal_pricing, type: typeof jsonbValues.seasonal_pricing, isArray: Array.isArray(jsonbValues.seasonal_pricing) },
    });
    
    // Also log the original values to see what came in
    console.log('[Package Create] Original packageData JSONB fields:', {
      languages_supported: { value: pkgData.languages_supported, type: typeof pkgData.languages_supported },
      tags: { value: pkgData.tags, type: typeof pkgData.tags },
      operating_days: { value: pkgData.operating_days, type: typeof pkgData.operating_days },
      whats_included: { value: pkgData.whats_included, type: typeof pkgData.whats_included },
      whats_not_included: { value: pkgData.whats_not_included, type: typeof pkgData.whats_not_included },
      what_to_bring: { value: pkgData.what_to_bring, type: typeof pkgData.what_to_bring },
      accessibility_facilities: { value: pkgData.accessibility_facilities, type: typeof pkgData.accessibility_facilities },
      health_safety_requirements: { value: pkgData.health_safety_requirements, type: typeof pkgData.health_safety_requirements },
      group_discounts: { value: pkgData.group_discounts, type: typeof pkgData.group_discounts },
      seasonal_pricing: { value: pkgData.seasonal_pricing, type: typeof pkgData.seasonal_pricing },
    });

    // Insert main package
    // Note: Coordinates are stored as TEXT (not POINT), arrays are stored as JSONB
    // Explicitly cast JSONB parameters to ensure proper type handling through Lambda
    const packageResult = await query<{ id: string }>(
      `INSERT INTO activity_packages (
        operator_id, title, short_description, full_description, status,
        destination_name, destination_address, destination_city, destination_country,
        destination_postal_code, destination_coordinates,
        duration_hours, duration_minutes, difficulty_level,
        languages_supported, tags,
        meeting_point_name, meeting_point_address, meeting_point_coordinates,
        meeting_point_instructions, operating_days,
        whats_included, whats_not_included, what_to_bring,
        important_information, minimum_age, maximum_age,
        child_policy, infant_policy, age_verification_required,
        wheelchair_accessible, accessibility_facilities, special_assistance,
        cancellation_policy_type, cancellation_policy_custom, cancellation_refund_percentage,
        cancellation_deadline_hours, weather_policy,
        health_safety_requirements, health_safety_additional_info,
        base_price, currency, price_type, child_price_type, child_price_value,
        infant_price, group_discounts, seasonal_pricing,
        dynamic_pricing_enabled, dynamic_pricing_base_multiplier,
        dynamic_pricing_demand_multiplier, dynamic_pricing_season_multiplier,
        slug, meta_title, meta_description, published_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36,
        $37, $38, $39, $40,
        $41, $42, $43, $44, $45,
        $46, $47, $48, $49,
        $50, $51, $52, $53,
        $54, $55, $56
      )
      RETURNING id`,
      [
        pkgData.operator_id,
        pkgData.title || '',
        pkgData.short_description || '',
        pkgData.full_description || '',
        pkgData.status || 'draft',
        pkgData.destination_name || '',
        pkgData.destination_address || '',
        pkgData.destination_city || '',
        pkgData.destination_country || '',
        pkgData.destination_postal_code || null,
        pkgData.destination_coordinates || '', // TEXT, not POINT
        pkgData.duration_hours || 2,
        pkgData.duration_minutes || 0,
        pkgData.difficulty_level || 'EASY',
        JSON.stringify(jsonbValues.languages_supported), // JSONB - stringify to ensure proper format
        JSON.stringify(jsonbValues.tags), // JSONB - stringify to ensure proper format
        pkgData.meeting_point_name || '',
        pkgData.meeting_point_address || '',
        pkgData.meeting_point_coordinates || '', // TEXT, not POINT
        pkgData.meeting_point_instructions || null,
        JSON.stringify(jsonbValues.operating_days), // JSONB - stringify to ensure proper format
        JSON.stringify(jsonbValues.whats_included), // JSONB - stringify to ensure proper format
        JSON.stringify(jsonbValues.whats_not_included), // JSONB - stringify to ensure proper format
        JSON.stringify(jsonbValues.what_to_bring), // JSONB - stringify to ensure proper format
        pkgData.important_information || null,
        pkgData.minimum_age || 0,
        // maximum_age is TEXT in DB - ensure it's a string
        pkgData.maximum_age ? String(pkgData.maximum_age) : null,
        pkgData.child_policy || null,
        pkgData.infant_policy || null,
        pkgData.age_verification_required || false,
        pkgData.wheelchair_accessible || false,
        JSON.stringify(jsonbValues.accessibility_facilities), // JSONB - stringify to ensure proper format
        pkgData.special_assistance || null,
        pkgData.cancellation_policy_type || 'MODERATE',
        pkgData.cancellation_policy_custom || null,
        pkgData.cancellation_refund_percentage || 80,
        pkgData.cancellation_deadline_hours ?? 24, // Use nullish coalescing to respect 0
        pkgData.weather_policy || null,
        JSON.stringify(jsonbValues.health_safety_requirements), // JSONB - stringify to ensure proper format
        pkgData.health_safety_additional_info || null,
        pkgData.base_price ?? 0, // Use nullish coalescing to respect 0
        pkgData.currency || 'USD',
        pkgData.price_type || 'PERSON',
        pkgData.child_price_type || null,
        pkgData.child_price_value || null,
        pkgData.infant_price || null,
        JSON.stringify(jsonbValues.group_discounts), // JSONB - stringify to ensure proper format
        JSON.stringify(jsonbValues.seasonal_pricing), // JSONB - stringify to ensure proper format
        pkgData.dynamic_pricing_enabled || false,
        // Dynamic pricing multipliers are INTEGER in DB
        // Store as integer (multiply by 100 for precision: 1.5 becomes 150)
        pkgData.dynamic_pricing_base_multiplier 
          ? (typeof pkgData.dynamic_pricing_base_multiplier === 'number' && pkgData.dynamic_pricing_base_multiplier >= 0 && pkgData.dynamic_pricing_base_multiplier < 100)
            ? Math.round(pkgData.dynamic_pricing_base_multiplier * 100)
            : Math.round(Number(pkgData.dynamic_pricing_base_multiplier) || 100)
          : 100, // Default 1.0 = 100
        pkgData.dynamic_pricing_demand_multiplier 
          ? (typeof pkgData.dynamic_pricing_demand_multiplier === 'number' && pkgData.dynamic_pricing_demand_multiplier >= 0 && pkgData.dynamic_pricing_demand_multiplier < 100)
            ? Math.round(pkgData.dynamic_pricing_demand_multiplier * 100)
            : Math.round(Number(pkgData.dynamic_pricing_demand_multiplier) || 100)
          : 100, // Default 1.0 = 100
        pkgData.dynamic_pricing_season_multiplier 
          ? (typeof pkgData.dynamic_pricing_season_multiplier === 'number' && pkgData.dynamic_pricing_season_multiplier >= 0 && pkgData.dynamic_pricing_season_multiplier < 100)
            ? Math.round(pkgData.dynamic_pricing_season_multiplier * 100)
            : Math.round(Number(pkgData.dynamic_pricing_season_multiplier) || 100)
          : 100, // Default 1.0 = 100
        pkgData.slug || null,
        pkgData.meta_title || null,
        pkgData.meta_description || null,
        pkgData.published_at || null,
      ]
    );

    if (!packageResult.rows || !packageResult.rows[0]) {
      return NextResponse.json(
        { error: 'Failed to create package' },
        { status: 500 }
      );
    }

    const packageId = packageResult.rows[0].id;

    // Insert images (already uploaded to S3, just insert records)
    if (images && images.length > 0) {
      for (const image of images) {
        await query(
          `INSERT INTO activity_package_images (
            package_id, file_name, file_size, mime_type, storage_path, public_url,
            alt_text, is_cover, is_featured, display_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            packageId,
            image.file_name || '',
            image.file_size || 0,
            image.mime_type || 'image/jpeg',
            image.storage_path || '',
            image.public_url || '',
            image.alt_text || '',
            image.is_cover || false,
            image.is_featured || false,
            image.display_order || 0,
          ]
        );
      }
    }

    // Insert time slots (aligned with activity_package_time_slots schema)
    if (time_slots && time_slots.length > 0) {
      for (const slot of time_slots) {
        await query(
          `INSERT INTO activity_package_time_slots (
            package_id, start_time, end_time, capacity, is_active, days, price_override
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            packageId,
            slot.start_time || null,
            slot.end_time || null,
            // capacity / active / days come from formDataToDatabase mapping
            slot.capacity || 1,
            slot.is_active !== undefined ? slot.is_active : true,
            JSON.stringify(ensureJSONB(slot.days, [])), // JSONB - stringify to ensure proper format
            // No per-slot override from the form yet
            null,
          ]
        );
      }
    }

    // Insert variants
    if (variants && variants.length > 0) {
      for (const variant of variants) {
        await query(
          `INSERT INTO activity_package_variants (
            package_id, name, description, price_adjustment, features,
            max_capacity, is_active, display_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            packageId,
            variant.name || '',
            variant.description || null,
            variant.price_adjustment || 0,
            JSON.stringify(ensureJSONB(variant.features, [])), // JSONB - stringify to ensure proper format
            variant.max_capacity || variant.max_quantity || 1,
            variant.is_active !== undefined ? variant.is_active : (variant.is_available !== undefined ? variant.is_available : true),
            variant.display_order || 0,
          ]
        );
      }
    }

    // Insert FAQs
    if (faqs && faqs.length > 0) {
      for (const faq of faqs) {
        await query(
          `INSERT INTO activity_package_faqs (
            package_id, question, answer, category, display_order
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            packageId,
            faq.question || '',
            faq.answer || '',
            faq.category || 'GENERAL',
            faq.display_order || 0,
          ]
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: packageId },
      message: 'Activity package created successfully',
    });
  } catch (error: any) {
    console.error('Error creating activity package:', error);
    console.error('Error details:', {
      message: error.message,
      detail: error.detail,
      code: error.code,
      hint: error.hint,
      constraint: error.constraint,
      table: error.table,
      column: error.column,
      stack: error.stack,
    });
    
    // If it's a JSON error, log the package data to help identify the problematic field
    if ((error.message?.includes('json') || error.detail?.includes('json')) && packageData) {
      console.error('JSON error detected. Package data:', {
        languages_supported: packageData.languages_supported,
        tags: packageData.tags,
        operating_days: packageData.operating_days,
        whats_included: packageData.whats_included,
        whats_not_included: packageData.whats_not_included,
        what_to_bring: packageData.what_to_bring,
        accessibility_facilities: packageData.accessibility_facilities,
        health_safety_requirements: packageData.health_safety_requirements,
        group_discounts: packageData.group_discounts,
        seasonal_pricing: packageData.seasonal_pricing,
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create package', 
        details: error.message || 'Unknown error',
        hint: error.hint || error.detail || null,
        code: error.code || null,
      },
      { status: 500 }
    );
  }
}

