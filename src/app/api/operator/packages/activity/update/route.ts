import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PUT /api/operator/packages/activity/update
 * Update an existing activity package with all related data
 */
export async function PUT(request: NextRequest) {
  try {
    const { packageId, package: packageData, images, time_slots, variants, faqs } = await request.json();

    if (!packageId) {
      return NextResponse.json(
        { error: 'packageId is required' },
        { status: 400 }
      );
    }

    if (!packageData) {
      return NextResponse.json(
        { error: 'package data is required' },
        { status: 400 }
      );
    }

    // Update main package
    await query(
      `UPDATE activity_packages SET
        title = $1, short_description = $2, full_description = $3, status = $4,
        destination_name = $5, destination_address = $6, destination_city = $7, destination_country = $8,
        destination_postal_code = $9, destination_coordinates = $10,
        duration_hours = $11, duration_minutes = $12, difficulty_level = $13,
        languages_supported = $14, tags = $15,
        meeting_point_name = $16, meeting_point_address = $17, meeting_point_coordinates = $18,
        meeting_point_instructions = $19, operating_days = $20,
        whats_included = $21, whats_not_included = $22, what_to_bring = $23,
        important_information = $24, minimum_age = $25, maximum_age = $26,
        child_policy = $27, infant_policy = $28, age_verification_required = $29,
        wheelchair_accessible = $30, accessibility_facilities = $31, special_assistance = $32,
        cancellation_policy_type = $33, cancellation_policy_custom = $34, cancellation_refund_percentage = $35,
        cancellation_deadline_hours = $36, weather_policy = $37,
        health_safety_requirements = $38, health_safety_additional_info = $39,
        base_price = $40, currency = $41, price_type = $42, child_price_type = $43, child_price_value = $44,
        infant_price = $45, group_discounts = $46, seasonal_pricing = $47,
        dynamic_pricing_enabled = $48, dynamic_pricing_base_multiplier = $49,
        dynamic_pricing_demand_multiplier = $50, dynamic_pricing_season_multiplier = $51,
        slug = $52, meta_title = $53, meta_description = $54, published_at = $55,
        updated_at = NOW()
      WHERE id = $56`,
      [
        packageData.title || '',
        packageData.short_description || '',
        packageData.full_description || '',
        packageData.status || 'draft',
        packageData.destination_name || '',
        packageData.destination_address || '',
        packageData.destination_city || '',
        packageData.destination_country || '',
        packageData.destination_postal_code || null,
        packageData.destination_coordinates || '',
        packageData.duration_hours || 2,
        packageData.duration_minutes || 0,
        packageData.difficulty_level || 'EASY',
        packageData.languages_supported ? JSON.stringify(packageData.languages_supported) : JSON.stringify(['EN']),
        packageData.tags ? JSON.stringify(packageData.tags) : JSON.stringify([]),
        packageData.meeting_point_name || '',
        packageData.meeting_point_address || '',
        packageData.meeting_point_coordinates || '',
        packageData.meeting_point_instructions || null,
        packageData.operating_days ? JSON.stringify(packageData.operating_days) : JSON.stringify([]),
        packageData.whats_included ? JSON.stringify(packageData.whats_included) : JSON.stringify([]),
        packageData.whats_not_included ? JSON.stringify(packageData.whats_not_included) : JSON.stringify([]),
        packageData.what_to_bring ? JSON.stringify(packageData.what_to_bring) : JSON.stringify([]),
        packageData.important_information || null,
        packageData.minimum_age || 0,
        packageData.maximum_age || null,
        packageData.child_policy || null,
        packageData.infant_policy || null,
        packageData.age_verification_required || false,
        packageData.wheelchair_accessible || false,
        packageData.accessibility_facilities ? JSON.stringify(packageData.accessibility_facilities) : JSON.stringify([]),
        packageData.special_assistance || null,
        packageData.cancellation_policy_type || 'MODERATE',
        packageData.cancellation_policy_custom || null,
        packageData.cancellation_refund_percentage || 80,
        packageData.cancellation_deadline_hours || null,
        packageData.weather_policy || null,
        packageData.health_safety_requirements ? JSON.stringify(packageData.health_safety_requirements) : null,
        packageData.health_safety_additional_info || null,
        packageData.base_price || null,
        packageData.currency || 'USD',
        packageData.price_type || null,
        packageData.child_price_type || null,
        packageData.child_price_value || null,
        packageData.infant_price || null,
        packageData.group_discounts ? JSON.stringify(packageData.group_discounts) : null,
        packageData.seasonal_pricing ? JSON.stringify(packageData.seasonal_pricing) : null,
        packageData.dynamic_pricing_enabled || false,
        packageData.dynamic_pricing_base_multiplier || null,
        packageData.dynamic_pricing_demand_multiplier || null,
        packageData.dynamic_pricing_season_multiplier || null,
        packageData.slug || null,
        packageData.meta_title || null,
        packageData.meta_description || null,
        packageData.published_at || null,
        packageId,
      ]
    );

    // Delete existing related data and re-insert
    // Note: In a production system, you might want to do smarter updates (compare and only update changed items)
    
    // Delete and re-insert images
    if (images !== undefined) {
      await query('DELETE FROM activity_package_images WHERE package_id = $1', [packageId]);
      if (images.length > 0) {
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
    }

    // Delete and re-insert time slots
    if (time_slots !== undefined) {
      await query('DELETE FROM activity_package_time_slots WHERE package_id = $1', [packageId]);
      if (time_slots.length > 0) {
        for (const slot of time_slots) {
          await query(
            `INSERT INTO activity_package_time_slots (
              package_id, start_time, end_time, duration_minutes, is_available,
              max_capacity, current_bookings, price_adjustment, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              packageId,
              slot.start_time || null,
              slot.end_time || null,
              slot.duration_minutes || null,
              slot.is_available !== undefined ? slot.is_available : true,
              slot.max_capacity || null,
              slot.current_bookings || 0,
              slot.price_adjustment || null,
              slot.notes || null,
            ]
          );
        }
      }
    }

    // Delete and re-insert variants
    if (variants !== undefined) {
      await query('DELETE FROM activity_package_variants WHERE package_id = $1', [packageId]);
      if (variants.length > 0) {
        for (const variant of variants) {
          await query(
            `INSERT INTO activity_package_variants (
              package_id, name, description, price_adjustment, is_available,
              max_quantity, display_order
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              packageId,
              variant.name || '',
              variant.description || null,
              variant.price_adjustment || null,
              variant.is_available !== undefined ? variant.is_available : true,
              variant.max_quantity || null,
              variant.display_order || 0,
            ]
          );
        }
      }
    }

    // Delete and re-insert FAQs
    if (faqs !== undefined) {
      await query('DELETE FROM activity_package_faqs WHERE package_id = $1', [packageId]);
      if (faqs.length > 0) {
        for (const faq of faqs) {
          await query(
            `INSERT INTO activity_package_faqs (
              package_id, question, answer, display_order
            ) VALUES ($1, $2, $3, $4)`,
            [
              packageId,
              faq.question || '',
              faq.answer || '',
              faq.display_order || 0,
            ]
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: packageId },
      message: 'Activity package updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating activity package:', error);
    return NextResponse.json(
      { error: 'Failed to update package', details: error.message },
      { status: 500 }
    );
  }
}

