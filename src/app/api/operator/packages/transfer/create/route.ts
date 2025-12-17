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
    // NOTE: published_at is intentionally omitted on create; it will be null by default
    // and can be set explicitly on publish/update flows.
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
        instant_confirmation, special_instructions, featured,
        pickup_date, pickup_time, return_date, return_time,
        pickup_location_name, pickup_location_address, pickup_location_coordinates,
        dropoff_location_name, dropoff_location_address, dropoff_location_coordinates,
        number_of_passengers, number_of_luggage_pieces
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
        $45, $46, $47, $48, $49, $50, $51, $52
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
        packageData.pickup_date || null,
        packageData.pickup_time || null,
        packageData.return_date || null,
        packageData.return_time || null,
        packageData.pickup_location_name || null,
        packageData.pickup_location_address || null,
        packageData.pickup_location_coordinates ? JSON.stringify(packageData.pickup_location_coordinates) : null,
        packageData.dropoff_location_name || null,
        packageData.dropoff_location_address || null,
        packageData.dropoff_location_coordinates ? JSON.stringify(packageData.dropoff_location_coordinates) : null,
        packageData.number_of_passengers || null,
        packageData.number_of_luggage_pieces || null,
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

    // Insert vehicle images (if table exists)
    if (vehicleImages && vehicleImages.length > 0 && Object.keys(vehicleIdMap).length > 0) {
      for (const vehicleImageData of vehicleImages) {
        const vehicleId = vehicleIdMap[vehicleImageData.vehicleIndex];
        if (!vehicleId) continue;

        try {
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
        } catch (error: any) {
          // Table might not exist yet, log and continue
          if (error.message && error.message.includes('does not exist')) {
            console.warn('transfer_vehicle_images table does not exist yet, skipping vehicle image insert');
          } else {
            throw error; // Re-throw if it's a different error
          }
        }
      }
    }

    // Stops & additional services tables are not present in the RDS schema for transfers,
    // and the corresponding UI is disabled, so we intentionally skip inserting them here.

    // Insert hourly pricing
    if (hourly_pricing && hourly_pricing.length > 0) {
      for (const pricing of hourly_pricing) {
        await query(
          `INSERT INTO transfer_hourly_pricing (
            package_id, hours, vehicle_type, vehicle_name, max_passengers,
            rate_usd, description, features, is_active, display_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            packageId,
            pricing.hours || 1,
            pricing.vehicle_type || 'SEDAN',
            pricing.vehicle_name || '',
            pricing.max_passengers || 4,
            pricing.rate_usd || 0,
            pricing.description || null,
            pricing.features ? JSON.stringify(pricing.features) : JSON.stringify([]),
            pricing.is_active !== undefined ? pricing.is_active : true,
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
            package_id, from_location, from_address, from_coordinates,
            to_location, to_address, to_coordinates,
            distance, distance_unit, estimated_duration_minutes,
            vehicle_type, vehicle_name, max_passengers,
            cost_usd, description, features, is_active, display_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
          [
            packageId,
            pricing.from_location || '',
            pricing.from_address || null,
            pricing.from_coordinates ? JSON.stringify(pricing.from_coordinates) : null,
            pricing.to_location || '',
            pricing.to_address || null,
            pricing.to_coordinates ? JSON.stringify(pricing.to_coordinates) : null,
            pricing.distance || null,
            pricing.distance_unit || 'KM',
            pricing.estimated_duration_minutes || null,
            pricing.vehicle_type || 'SEDAN',
            pricing.vehicle_name || '',
            pricing.max_passengers || 4,
            pricing.cost_usd || 0,
            pricing.description || null,
            pricing.features ? JSON.stringify(pricing.features) : JSON.stringify([]),
            pricing.is_active !== undefined ? pricing.is_active : true,
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

