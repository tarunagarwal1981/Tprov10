import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/operator/packages/activity/create
 * Create a new activity package with all related data
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { package: packageData, images, time_slots, variants, faqs } = data;

    if (!packageData || !packageData.operator_id) {
      return NextResponse.json(
        { error: 'operator_id is required in package data' },
        { status: 400 }
      );
    }

    // Helper function to ensure JSONB arrays are properly stringified
    // The actual database stores arrays as JSONB, not PostgreSQL arrays
    const ensureJSONB = (value: any, defaultValue: any = []): any => {
      if (value === null || value === undefined) {
        return defaultValue;
      }
      // If already a string, try to parse it first to validate
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return parsed;
        } catch {
          return defaultValue;
        }
      }
      // If it's already an array or object, return as-is (will be JSON.stringify'd by pg)
      return value;
    };

    // Insert main package
    // Note: Coordinates are stored as TEXT (not POINT), arrays are stored as JSONB
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
        packageData.operator_id,
        packageData.title || '',
        packageData.short_description || '',
        packageData.full_description || '',
        packageData.status || 'draft',
        packageData.destination_name || '',
        packageData.destination_address || '',
        packageData.destination_city || '',
        packageData.destination_country || '',
        packageData.destination_postal_code || null,
        packageData.destination_coordinates || '', // TEXT, not POINT
        packageData.duration_hours || 2,
        packageData.duration_minutes || 0,
        packageData.difficulty_level || 'EASY',
        ensureJSONB(packageData.languages_supported, ['EN']), // JSONB
        ensureJSONB(packageData.tags, []), // JSONB
        packageData.meeting_point_name || '',
        packageData.meeting_point_address || '',
        packageData.meeting_point_coordinates || '', // TEXT, not POINT
        packageData.meeting_point_instructions || null,
        ensureJSONB(packageData.operating_days, []), // JSONB
        ensureJSONB(packageData.whats_included, []), // JSONB
        ensureJSONB(packageData.whats_not_included, []), // JSONB
        ensureJSONB(packageData.what_to_bring, []), // JSONB
        packageData.important_information || null,
        packageData.minimum_age || 0,
        packageData.maximum_age || null,
        packageData.child_policy || null,
        packageData.infant_policy || null,
        packageData.age_verification_required || false,
        packageData.wheelchair_accessible || false,
        ensureJSONB(packageData.accessibility_facilities, []), // JSONB
        packageData.special_assistance || null,
        packageData.cancellation_policy_type || 'MODERATE',
        packageData.cancellation_policy_custom || null,
        packageData.cancellation_refund_percentage || 80,
        packageData.cancellation_deadline_hours ?? 24, // Use nullish coalescing to respect 0
        packageData.weather_policy || null,
        ensureJSONB(packageData.health_safety_requirements, []), // JSONB
        packageData.health_safety_additional_info || null,
        packageData.base_price ?? 0, // Use nullish coalescing to respect 0
        packageData.currency || 'USD',
        packageData.price_type || 'PERSON',
        packageData.child_price_type || null,
        packageData.child_price_value || null,
        packageData.infant_price || null,
        ensureJSONB(packageData.group_discounts, []), // JSONB
        ensureJSONB(packageData.seasonal_pricing, []), // JSONB
        packageData.dynamic_pricing_enabled || false,
        packageData.dynamic_pricing_base_multiplier || null,
        packageData.dynamic_pricing_demand_multiplier || null,
        packageData.dynamic_pricing_season_multiplier || null,
        packageData.slug || null,
        packageData.meta_title || null,
        packageData.meta_description || null,
        packageData.published_at || null,
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
            ensureJSONB(slot.days, []), // JSONB
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
            ensureJSONB(variant.features, []), // JSONB
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
      stack: error.stack,
    });
    return NextResponse.json(
      { 
        error: 'Failed to create package', 
        details: error.message || 'Unknown error',
        hint: error.hint || error.detail || null,
      },
      { status: 500 }
    );
  }
}

