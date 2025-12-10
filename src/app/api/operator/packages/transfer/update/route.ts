import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PUT /api/operator/packages/transfer/update
 * Update an existing transfer package with all related data
 */
export async function PUT(request: NextRequest) {
  try {
    const { packageId, package: packageData, images, vehicles, vehicleImages, stops, additional_services, hourly_pricing, point_to_point_pricing } = await request.json();

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
      `UPDATE transfer_packages SET
        title = $1, short_description = $2, full_description = $3, status = $4,
        destination_name = $5, destination_address = $6, destination_city = $7, destination_country = $8,
        destination_coordinates = $9, transfer_type = $10, total_distance = $11, distance_unit = $12,
        estimated_duration_hours = $13, estimated_duration_minutes = $14, route_points = $15,
        meet_and_greet = $16, name_board = $17, driver_uniform = $18, flight_tracking = $19,
        luggage_assistance = $20, door_to_door_service = $21, contact_driver_in_advance = $22,
        contact_lead_time = $23, real_time_tracking = $24, languages_supported = $25, tags = $26,
        base_price = $27, currency = $28, cancellation_policy_type = $29, cancellation_refund_percentage = $30,
        cancellation_deadline_hours = $31, no_show_policy = $32, terms_and_conditions = $33,
        available_days = $34, advance_booking_hours = $35, maximum_advance_booking_days = $36,
        instant_confirmation = $37, special_instructions = $38, featured = $39, published_at = $40,
        updated_at = NOW()
      WHERE id = $41`,
      [
        packageData.title || '',
        packageData.short_description || '',
        packageData.full_description || null,
        packageData.status || 'draft',
        packageData.destination_name || '',
        packageData.destination_address || null,
        packageData.destination_city || null,
        packageData.destination_country || null,
        packageData.destination_coordinates ? JSON.stringify(packageData.destination_coordinates) : null,
        packageData.transfer_type || 'ONE_WAY',
        packageData.total_distance || null,
        packageData.distance_unit || 'KM',
        packageData.estimated_duration_hours || null,
        packageData.estimated_duration_minutes || null,
        packageData.route_points ? JSON.stringify(packageData.route_points) : null,
        packageData.meet_and_greet || false,
        packageData.name_board || false,
        packageData.driver_uniform || false,
        packageData.flight_tracking || false,
        packageData.luggage_assistance || false,
        packageData.door_to_door_service || false,
        packageData.contact_driver_in_advance || false,
        packageData.contact_lead_time || 0,
        packageData.real_time_tracking || false,
        packageData.languages_supported ? JSON.stringify(packageData.languages_supported) : JSON.stringify([]),
        packageData.tags ? JSON.stringify(packageData.tags) : JSON.stringify([]),
        packageData.base_price || 0,
        packageData.currency || 'USD',
        packageData.cancellation_policy_type || 'MODERATE',
        packageData.cancellation_refund_percentage || 80,
        packageData.cancellation_deadline_hours || null,
        packageData.no_show_policy || null,
        packageData.terms_and_conditions || null,
        packageData.available_days ? JSON.stringify(packageData.available_days) : JSON.stringify([]),
        packageData.advance_booking_hours || 0,
        packageData.maximum_advance_booking_days || null,
        packageData.instant_confirmation || false,
        packageData.special_instructions || null,
        packageData.featured || false,
        packageData.published_at || null,
        packageId,
      ]
    );

    // Delete existing related data and re-insert
    // Get vehicle IDs first to delete vehicle images
    const existingVehicles = await query<{ id: string }>(
      'SELECT id FROM transfer_package_vehicles WHERE package_id = $1',
      [packageId]
    );
    const vehicleIds = existingVehicles.rows?.map(v => v.id) || [];

    // Delete related data
    if (vehicleIds.length > 0) {
      await query('DELETE FROM transfer_vehicle_images WHERE vehicle_id = ANY($1)', [vehicleIds]);
    }
    await query('DELETE FROM transfer_package_images WHERE package_id = $1', [packageId]);
    await query('DELETE FROM transfer_package_vehicles WHERE package_id = $1', [packageId]);
    await query('DELETE FROM transfer_package_stops WHERE package_id = $1', [packageId]);
    await query('DELETE FROM transfer_additional_services WHERE package_id = $1', [packageId]);
    await query('DELETE FROM transfer_hourly_pricing WHERE package_id = $1', [packageId]);
    await query('DELETE FROM transfer_point_to_point_pricing WHERE package_id = $1', [packageId]);

    // Re-insert images
    if (images && images.length > 0) {
      for (const image of images) {
        await query(
          `INSERT INTO transfer_package_images (
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
            image.alt_text || null,
            image.is_cover || false,
            image.is_featured || false,
            image.display_order || 0,
          ]
        );
      }
    }

    // Re-insert vehicles
    const vehicleIdMap: Record<number, string> = {};
    if (vehicles && vehicles.length > 0) {
      for (const [index, vehicle] of vehicles.entries()) {
        const vehicleResult = await query<{ id: string }>(
          `INSERT INTO transfer_package_vehicles (
            package_id, vehicle_type, name, description, passenger_capacity,
            luggage_capacity, features, base_price, is_active, display_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id`,
          [
            packageId,
            vehicle.vehicle_type || 'SEDAN',
            vehicle.name || '',
            vehicle.description || null,
            vehicle.passenger_capacity || 4,
            vehicle.luggage_capacity || 2,
            vehicle.features ? JSON.stringify(vehicle.features) : JSON.stringify([]),
            vehicle.base_price || 0,
            vehicle.is_active !== undefined ? vehicle.is_active : true,
            vehicle.display_order || index + 1,
          ]
        );

        if (vehicleResult.rows && vehicleResult.rows[0]) {
          vehicleIdMap[index] = vehicleResult.rows[0].id;
        }
      }
    }

    // Re-insert vehicle images
    if (vehicleImages && vehicleImages.length > 0 && Object.keys(vehicleIdMap).length > 0) {
      for (const vehicleImageData of vehicleImages) {
        const vehicleId = vehicleIdMap[vehicleImageData.vehicleIndex];
        if (!vehicleId) continue;

        await query(
          `INSERT INTO transfer_vehicle_images (
            vehicle_id, file_name, file_size, mime_type, storage_path, public_url,
            alt_text, display_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            vehicleId,
            vehicleImageData.image.file_name || '',
            vehicleImageData.image.file_size || 0,
            vehicleImageData.image.mime_type || 'image/jpeg',
            vehicleImageData.image.storage_path || '',
            vehicleImageData.image.public_url || '',
            vehicleImageData.image.alt_text || null,
            vehicleImageData.image.display_order || 0,
          ]
        );
      }
    }

    // Re-insert stops
    if (stops && stops.length > 0) {
      for (const stop of stops) {
        await query(
          `INSERT INTO transfer_package_stops (
            package_id, stop_name, stop_address, stop_coordinates, stop_order, notes
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            packageId,
            stop.stop_name || '',
            stop.stop_address || null,
            stop.stop_coordinates ? JSON.stringify(stop.stop_coordinates) : null,
            stop.stop_order || 0,
            stop.notes || null,
          ]
        );
      }
    }

    // Re-insert additional services
    if (additional_services && additional_services.length > 0) {
      for (const service of additional_services) {
        await query(
          `INSERT INTO transfer_additional_services (
            package_id, service_name, description, price, is_active
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            packageId,
            service.service_name || '',
            service.description || null,
            service.price || 0,
            service.is_active !== undefined ? service.is_active : true,
          ]
        );
      }
    }

    // Re-insert hourly pricing
    if (hourly_pricing && hourly_pricing.length > 0) {
      for (const pricing of hourly_pricing) {
        await query(
          `INSERT INTO transfer_hourly_pricing (
            package_id, hours, rate_usd, display_order
          ) VALUES ($1, $2, $3, $4)`,
          [
            packageId,
            pricing.hours || 1,
            pricing.rate_usd || 0,
            pricing.display_order || 0,
          ]
        );
      }
    }

    // Re-insert point-to-point pricing
    if (point_to_point_pricing && point_to_point_pricing.length > 0) {
      for (const pricing of point_to_point_pricing) {
        await query(
          `INSERT INTO transfer_point_to_point_pricing (
            package_id, from_location, to_location, cost_usd, display_order
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            packageId,
            pricing.from_location || '',
            pricing.to_location || '',
            pricing.cost_usd || 0,
            pricing.display_order || 0,
          ]
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: packageId },
      message: 'Transfer package updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating transfer package:', error);
    return NextResponse.json(
      { error: 'Failed to update package', details: error.message },
      { status: 500 }
    );
  }
}

