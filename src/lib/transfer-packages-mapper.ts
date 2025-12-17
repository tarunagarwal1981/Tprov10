/**
 * Transfer Package mapping utilities (form ↔ database shape)
 * 
 * These are pure TypeScript helpers and do not depend on Supabase.
 * They are used by the AWS RDS-backed API layer.
 */

import type { TransferPackageFormData } from '@/lib/types/transfer-package';

// Lightweight copies of the core DB-facing types we need for mapping.
// These mirror the RDS schema but are intentionally minimal.
export interface TransferPackageDB {
  id?: string;
  operator_id: string;
  title: string;
  short_description: string;
  full_description: string | null;
  destination_name: string;
  destination_address: string | null;
  destination_city: string | null;
  destination_country: string | null;
  destination_coordinates: any;
  transfer_type: 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_STOP';
  total_distance: number | null;
  distance_unit: 'KM' | 'MILES';
  estimated_duration_hours: number | null;
  estimated_duration_minutes: number | null;
  route_points: any;
  meet_and_greet: boolean;
  name_board: boolean;
  driver_uniform: boolean;
  flight_tracking: boolean;
  luggage_assistance: boolean;
  door_to_door_service: boolean;
  contact_driver_in_advance: boolean;
  contact_lead_time: number;
  real_time_tracking: boolean;
  languages_supported: string[];
  tags: string[];
  base_price: number;
  currency: string;
  cancellation_policy_type: 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'CUSTOM';
  cancellation_refund_percentage: number;
  cancellation_deadline_hours: number;
  no_show_policy: string | null;
  terms_and_conditions: string | null;
  available_days: string[];
  advance_booking_hours: number;
  maximum_advance_booking_days: number;
  instant_confirmation: boolean;
  special_instructions: string | null;
  status: 'draft' | 'published' | 'archived' | 'suspended';
  featured: boolean;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
}

export interface TransferPackageImageDB {
  id?: string;
  package_id?: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string;
  public_url: string | null;
  alt_text: string | null;
  is_cover: boolean;
  is_featured: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface TransferPackageVehicleDB {
  id?: string;
  package_id?: string;
  vehicle_type: 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS';
  name: string;
  description: string | null;
  passenger_capacity: number;
  luggage_capacity: number;
  features: string[];
  base_price: number;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface TransferVehicleImageDB {
  id?: string;
  vehicle_id?: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string;
  public_url: string | null;
  alt_text: string | null;
  display_order: number;
  created_at?: string;
}

export interface TransferPackageStopDB {
  id?: string;
  package_id?: string;
  location_name: string;
  location_address: string | null;
  location_coordinates: any;
  duration_hours: number;
  duration_minutes: number;
  description: string | null;
  stop_order: number;
  created_at?: string;
}

export interface TransferAdditionalServiceDB {
  id?: string;
  package_id?: string;
  name: string;
  description: string | null;
  price: number;
  is_included: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface TransferHourlyPricingDB {
  id?: string;
  package_id?: string;
  hours: number;
  vehicle_type: 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS';
  vehicle_name: string;
  max_passengers: number;
  rate_usd: number;
  description: string | null;
  features: string[];
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface TransferPointToPointPricingDB {
  id?: string;
  package_id?: string;
  from_location: string;
  from_address: string | null;
  from_coordinates: any;
  to_location: string;
  to_address: string | null;
  to_coordinates: any;
  distance: number | null;
  distance_unit: 'KM' | 'MILES';
  estimated_duration_minutes: number | null;
  vehicle_type: 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS';
  vehicle_name: string;
  max_passengers: number;
  cost_usd: number;
  description: string | null;
  features: string[];
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface TransferPackageWithRelationsDB extends TransferPackageDB {
  images: TransferPackageImageDB[];
  vehicles: (TransferPackageVehicleDB & { vehicle_images?: TransferVehicleImageDB[] })[];
  stops: TransferPackageStopDB[];
  additional_services: TransferAdditionalServiceDB[];
  hourly_pricing: TransferHourlyPricingDB[];
  point_to_point_pricing: TransferPointToPointPricingDB[];
}

export interface CreateTransferPackageDataDB {
  package: Partial<TransferPackageDB>;
  images?: Partial<TransferPackageImageDB>[];
  vehicles?: Partial<TransferPackageVehicleDB>[];
  vehicleImages?: Array<{
    vehicleIndex: number;
    image: Partial<TransferVehicleImageDB>;
  }>;
  stops?: Partial<TransferPackageStopDB>[];
  additional_services?: Partial<TransferAdditionalServiceDB>[];
  hourly_pricing?: Partial<TransferHourlyPricingDB>[];
  point_to_point_pricing?: Partial<TransferPointToPointPricingDB>[];
}

// ---------------------------------------------------------------------------
// FORM DATA → DB SHAPES
// ---------------------------------------------------------------------------

export function formDataToDatabase(
  formData: TransferPackageFormData,
  userId: string
): CreateTransferPackageDataDB {
  const packageData: Partial<TransferPackageDB> = {
    operator_id: userId,
    // Basic Information
    title: formData.basicInformation.title,
    short_description: formData.basicInformation.shortDescription,
    full_description: formData.basicInformation.fullDescription,
    destination_name: formData.basicInformation.destination.name,
    destination_address: formData.basicInformation.destination.address || null,
    destination_city: formData.basicInformation.destination.city || null,
    destination_country: formData.basicInformation.destination.country || null,
    destination_coordinates: formData.basicInformation.destination.coordinates,
    languages_supported: formData.basicInformation.languagesSupported,
    tags: formData.basicInformation.tags,

    // Transfer Details
    transfer_type: formData.transferDetails.transferType,
    total_distance: formData.transferDetails.routeInfo.totalDistance,
    distance_unit: formData.transferDetails.routeInfo.distanceUnit,
    estimated_duration_hours: formData.transferDetails.routeInfo.estimatedDuration.hours,
    estimated_duration_minutes: formData.transferDetails.routeInfo.estimatedDuration.minutes,
    route_points: formData.transferDetails.routeInfo.routePoints,

    // Driver Service
    meet_and_greet: formData.driverService.meetAndGreet,
    name_board: formData.driverService.nameBoard,
    driver_uniform: formData.driverService.driverUniform,
    flight_tracking: formData.driverService.flightTracking,
    luggage_assistance: formData.driverService.luggageAssistance,
    door_to_door_service: formData.driverService.doorToDoorService,
    contact_driver_in_advance: formData.driverService.contactDriverInAdvance,
    contact_lead_time: formData.driverService.contactLeadTime,
    real_time_tracking: formData.driverService.realTimeTracking,

    // Pricing
    base_price: 0,
    currency: 'USD',

    // Policies
    cancellation_policy_type: formData.pricingPolicies.cancellationPolicy.type,
    cancellation_refund_percentage: formData.pricingPolicies.cancellationPolicy.refundPercentage,
    cancellation_deadline_hours: formData.pricingPolicies.cancellationPolicy.cancellationDeadline,
    no_show_policy: formData.pricingPolicies.noShowPolicy || null,
    terms_and_conditions: formData.pricingPolicies.termsAndConditions || null,

    // Availability
    available_days: formData.availabilityBooking.availableDays,
    advance_booking_hours: formData.availabilityBooking.advanceBookingRequired,
    maximum_advance_booking_days: formData.availabilityBooking.maximumAdvanceBooking,
    instant_confirmation: formData.availabilityBooking.instantConfirmation,
    special_instructions: formData.availabilityBooking.specialInstructions || null,

    status: 'draft',
    featured: false,
  };

  const images: Partial<TransferPackageImageDB>[] =
    formData.basicInformation.imageGallery.map((img, index) => ({
      file_name: img.fileName,
      file_size: img.fileSize,
      mime_type: img.mimeType,
      storage_path: img.url,
      public_url: img.url,
      is_cover: img.isCover,
      is_featured: false,
      display_order: index,
    }));

  const vehicleImages: Array<{
    vehicleIndex: number;
    image: Partial<TransferVehicleImageDB>;
  }> = [];

  (formData.transferDetails.vehicles || []).forEach((vehicle, vehicleIndex) => {
    if (vehicle.vehicleImage) {
      vehicleImages.push({
        vehicleIndex,
        image: {
          file_name: vehicle.vehicleImage.fileName,
          file_size: vehicle.vehicleImage.fileSize,
          mime_type: vehicle.vehicleImage.mimeType,
          storage_path: vehicle.vehicleImage.url,
          public_url: vehicle.vehicleImage.url,
          alt_text: `${vehicle.vehicleName} - Vehicle Image`,
          display_order: 0,
        },
      });
    }
  });

  const vehicles: Partial<TransferPackageVehicleDB>[] =
    (formData.transferDetails.vehicles || []).map((vehicle, index) => ({
      vehicle_type: vehicle.vehicleType || 'SEDAN',
      name: vehicle.vehicleName,
      description: null,
      passenger_capacity: vehicle.maxCapacity,
      luggage_capacity: 0,
      features: [],
      base_price: 0,
      is_active: true,
      display_order: vehicle.order || index,
    }));

  const stops: Partial<TransferPackageStopDB>[] = [];
  if (formData.transferDetails.multiStopDetails) {
    formData.transferDetails.multiStopDetails.stops.forEach((stop) => {
      stops.push({
        location_name: stop.location.name,
        location_address: stop.location.address || null,
        location_coordinates: stop.location.coordinates,
        duration_hours: stop.duration.hours,
        duration_minutes: stop.duration.minutes,
        description: stop.description || null,
        stop_order: stop.order,
      });
    });
  }

  const additional_services: Partial<TransferAdditionalServiceDB>[] =
    (formData.driverService.additionalServices || []).map((service) => ({
      name: service.name,
      description: service.description || null,
      price: service.price,
      is_included: service.isIncluded,
      is_active: true,
    }));

  const hourly_pricing: Partial<TransferHourlyPricingDB>[] =
    (formData.pricingPolicies.hourlyPricingOptions || []).map((option, index) => ({
      hours: option.hours,
      vehicle_type: option.vehicleType,
      vehicle_name: option.vehicleName,
      max_passengers: option.maxPassengers,
      rate_usd: option.rateUSD,
      description: option.description || null,
      features: option.features || [],
      is_active: option.isActive,
      display_order: option.displayOrder || index,
    }));

  const point_to_point_pricing: Partial<TransferPointToPointPricingDB>[] =
    (formData.pricingPolicies.pointToPointPricingOptions || []).map((option, index) => ({
      from_location: option.fromLocation,
      from_address: option.fromAddress || null,
      from_coordinates: option.fromCoordinates || null,
      to_location: option.toLocation,
      to_address: option.toAddress || null,
      to_coordinates: option.toCoordinates || null,
      distance: option.distance || null,
      distance_unit: option.distanceUnit,
      estimated_duration_minutes: option.estimatedDurationMinutes || null,
      vehicle_type: option.vehicleType,
      vehicle_name: option.vehicleName,
      max_passengers: option.maxPassengers,
      cost_usd: option.costUSD,
      description: option.description || null,
      features: option.features || [],
      is_active: option.isActive,
      display_order: option.displayOrder || index,
    }));

  return {
    package: packageData,
    images,
    vehicles,
    vehicleImages,
    stops,
    additional_services,
    hourly_pricing,
    point_to_point_pricing,
  };
}

// ---------------------------------------------------------------------------
// DB SHAPES → FORM DATA
// ---------------------------------------------------------------------------

export function databaseToFormData(
  packageData: TransferPackageWithRelationsDB
): TransferPackageFormData {
  const coverImage = packageData.images?.find((img) => img.is_cover);

  return {
    basicInformation: {
      title: packageData.title || '',
      shortDescription: packageData.short_description || '',
      fullDescription: packageData.full_description || '',
      destination: {
        name: packageData.destination_name || '',
        address: packageData.destination_address || '',
        city: packageData.destination_city || '',
        country: packageData.destination_country || '',
        coordinates: packageData.destination_coordinates,
      },
      duration: {
        hours: packageData.estimated_duration_hours || 0,
        minutes: packageData.estimated_duration_minutes || 0,
      },
      languagesSupported: (packageData.languages_supported || []) as any,
      tags: (packageData.tags || []) as any,
      featuredImage: coverImage
        ? {
            id: coverImage.id || '',
            fileName: coverImage.file_name || '',
            fileSize: coverImage.file_size || 0,
            mimeType: coverImage.mime_type || 'image/jpeg',
            url: coverImage.public_url || '',
            isCover: true,
            order: 0,
            uploadedAt: coverImage.created_at ? new Date(coverImage.created_at) : new Date(),
          }
        : null,
      imageGallery: (packageData.images || []).map((img, index) => ({
        id: img.id || '',
        fileName: img.file_name || '',
        fileSize: img.file_size || 0,
        mimeType: img.mime_type || 'image/jpeg',
        url: img.public_url || '',
        isCover: img.is_cover || false,
        order: index,
        uploadedAt: img.created_at ? new Date(img.created_at) : new Date(),
      })),
    },
    transferDetails: {
      transferType: packageData.transfer_type || 'ONE_WAY',
      routeInfo: {
        totalDistance: packageData.total_distance || 0,
        distanceUnit: packageData.distance_unit || 'KM',
        estimatedDuration: {
          hours: packageData.estimated_duration_hours || 0,
          minutes: packageData.estimated_duration_minutes || 0,
        },
        routePoints: packageData.route_points,
      },
      // Multi-stop details are not used in current UI; we leave them undefined.
      vehicles: (packageData.vehicles || []).map((vehicle: any, index: number) => ({
        id: vehicle.id || '',
        vehicleName: vehicle.name || '',
        vehicleType: vehicle.vehicle_type || undefined,
        maxCapacity: vehicle.passenger_capacity || 1,
        vehicleImage:
          vehicle.vehicle_images && vehicle.vehicle_images[0]
            ? {
                id: vehicle.vehicle_images[0].id || `temp-${Date.now()}`,
                fileName: vehicle.vehicle_images[0].file_name || '',
                fileSize: vehicle.vehicle_images[0].file_size || 0,
                mimeType: vehicle.vehicle_images[0].mime_type || 'image/jpeg',
                url: vehicle.vehicle_images[0].public_url || '',
                isCover: false,
                order: 0,
                uploadedAt: vehicle.vehicle_images[0].created_at
                  ? new Date(vehicle.vehicle_images[0].created_at)
                  : new Date(),
              }
            : null,
        order: index + 1,
      })),
    },
    driverService: {
      meetAndGreet: packageData.meet_and_greet || false,
      nameBoard: packageData.name_board || false,
      driverUniform: packageData.driver_uniform || false,
      flightTracking: packageData.flight_tracking || false,
      luggageAssistance: packageData.luggage_assistance || false,
      doorToDoorService: packageData.door_to_door_service || false,
      contactDriverInAdvance: packageData.contact_driver_in_advance || false,
      contactLeadTime: packageData.contact_lead_time || 0,
      realTimeTracking: packageData.real_time_tracking || false,
      additionalServices: (packageData.additional_services || []).map((service) => ({
        id: service.id || '',
        name: service.name || '',
        description: service.description || '',
        price: service.price || 0,
        isIncluded: service.is_included || false,
      })),
    },
    pricingPolicies: {
      additionalCharges: [],
      cancellationPolicy: {
        type: packageData.cancellation_policy_type || 'MODERATE',
        refundPercentage: packageData.cancellation_refund_percentage || 0,
        cancellationDeadline: packageData.cancellation_deadline_hours || 24,
      },
      noShowPolicy: packageData.no_show_policy || '',
      termsAndConditions: packageData.terms_and_conditions || '',
      hourlyPricingOptions: (packageData.hourly_pricing || []).map((pricing) => ({
        id: pricing.id || '',
        hours: pricing.hours || 1,
        vehicleType: pricing.vehicle_type || 'SEDAN',
        vehicleName: pricing.vehicle_name || '',
        maxPassengers: pricing.max_passengers || 4,
        rateUSD: pricing.rate_usd || 0,
        description: pricing.description || '',
        features: pricing.features || [],
        isActive: pricing.is_active !== false,
        displayOrder: pricing.display_order || 0,
      })),
      pointToPointPricingOptions: (packageData.point_to_point_pricing || []).map((pricing) => ({
        id: pricing.id || '',
        fromLocation: pricing.from_location || '',
        toLocation: pricing.to_location || '',
        vehicleType: pricing.vehicle_type || 'SEDAN',
        vehicleName: pricing.vehicle_name || '',
        maxPassengers: pricing.max_passengers || 4,
        costUSD: pricing.cost_usd || 0,
        distance: pricing.distance || 0,
        distanceUnit: pricing.distance_unit || 'KM',
        estimatedDurationMinutes: pricing.estimated_duration_minutes || 0,
        description: pricing.description || '',
        features: pricing.features || [],
        isActive: pricing.is_active !== false,
        displayOrder: pricing.display_order || 0,
      })),
    },
    availabilityBooking: {
      availableDays: packageData.available_days || [],
      advanceBookingRequired: packageData.advance_booking_hours || 24,
      maximumAdvanceBooking: packageData.maximum_advance_booking_days || 365,
      instantConfirmation: packageData.instant_confirmation !== false,
      specialInstructions: packageData.special_instructions || '',
      bookingRestrictions: [],
      availableTimeSlots: [],
    },
  };
}


