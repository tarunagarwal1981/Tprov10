import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/operator/packages/transfer/create
 * Create a new transfer package with all related data
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { package: packageData, images, vehicles, vehicleImages, stops, additional_services, hourly_pricing, point_to_point_pricing } = data;

    if (!packageData || !packageData.operator_id) {
      return NextResponse.json(
        { error: 'operator_id is required in package data' },
        { status: 400 }
      );
    }

    // Insert main package
    const packageResult = await query<{ id: string }>(
      `INSERT INTO transfer_packages (
        operator_id, title, short_description, full_description, status,
        destination_name, destination_address, destination_city, destination_country,
        destination_coordinates, transfer_type, total_distance, distance_unit,
        estimated_duration_hours, estimated_duration_minutes, route_points,
        meet_and_greet, name_board, driver_uniform, flight_tracking,
        luggage_assistance, door_to_door_service, contact_driver_in_advance,
        contact_lead_time, real_time_tracking, languages_supported, tags,
        base_price, currency, cancellation_policy_type, cancellation_refund_percentage,
        cancellation_deadline_hours, no_show_policy, terms_and_conditions,
        available_days, advance_booking_hours, maximum_advance_booking_days,
        instant_confirmation, special_instructions, featured, published_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40
      )
      RETURNING id`,
      [
        packageData.operator_id,
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

    // Insert vehicles
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

    // Insert vehicle images
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

    // Insert stops
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

    // Insert additional services
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

    // Insert hourly pricing
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

    // Insert point-to-point pricing
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
      message: 'Transfer package created successfully',
    });
  } catch (error: any) {
    console.error('Error creating transfer package:', error);
    return NextResponse.json(
      { error: 'Failed to create package', details: error.message },
      { status: 500 }
    );
  }
}

