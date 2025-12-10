/**
 * Transfer Packages Supabase Service
 * Handles all CRUD operations for transfer packages
 */

import { createSupabaseBrowserClient, withErrorHandling, SupabaseError } from './client';
// Migrated to S3
import { uploadImageFiles, base64ToFile } from '@/lib/aws/file-upload';
import type { TransferPackageFormData } from '../types/transfer-package';

// ============================================================================
// CONSTANTS
// ============================================================================

const TRANSFER_PACKAGES_BUCKET = 'activity-package-images'; // Using same bucket with different folder structure (FIXED: was 'activity-packages-images')

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface TransferPackage {
  id: string;
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
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface TransferPackageImage {
  id: string;
  package_id: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string;
  public_url: string | null;
  alt_text: string | null;
  is_cover: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TransferPackageVehicle {
  id: string;
  package_id: string;
  vehicle_type: 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS';
  name: string;
  description: string | null;
  passenger_capacity: number;
  luggage_capacity: number;
  features: string[];
  base_price: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TransferPackageStop {
  id: string;
  package_id: string;
  location_name: string;
  location_address: string | null;
  location_coordinates: any;
  duration_hours: number;
  duration_minutes: number;
  description: string | null;
  stop_order: number;
  created_at: string;
}

export interface TransferAdditionalService {
  id: string;
  package_id: string;
  name: string;
  description: string | null;
  price: number;
  is_included: boolean;
  is_active: boolean;
  created_at: string;
}

export interface TransferHourlyPricing {
  id: string;
  package_id: string;
  hours: number;
  vehicle_type: 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS';
  vehicle_name: string;
  max_passengers: number;
  rate_usd: number;
  description: string | null;
  features: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TransferPointToPointPricing {
  id: string;
  package_id: string;
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
  created_at: string;
  updated_at: string;
}

export interface TransferVehicleImage {
  id: string;
  vehicle_id: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string;
  public_url: string | null;
  alt_text: string | null;
  display_order: number;
  created_at: string;
}

export interface TransferPackageVehicleWithImages extends TransferPackageVehicle {
  vehicle_images: TransferVehicleImage[];
}

export interface TransferPackageWithRelations extends TransferPackage {
  images: TransferPackageImage[];
  vehicles: TransferPackageVehicleWithImages[];
  stops: TransferPackageStop[];
  additional_services: TransferAdditionalService[];
  hourly_pricing: TransferHourlyPricing[];
  point_to_point_pricing: TransferPointToPointPricing[];
}

export interface CreateTransferPackageData {
  package: Partial<TransferPackage>;
  images?: Partial<TransferPackageImage>[];
  vehicles?: Partial<TransferPackageVehicle>[];
  vehicleImages?: Array<{
    vehicleIndex: number;
    image: Partial<TransferVehicleImage>;
  }>;
  stops?: Partial<TransferPackageStop>[];
  additional_services?: Partial<TransferAdditionalService>[];
  hourly_pricing?: Partial<TransferHourlyPricing>[];
  point_to_point_pricing?: Partial<TransferPointToPointPricing>[];
}

// ============================================================================
// FORM DATA TO DATABASE CONVERSION
// ============================================================================

export function formDataToDatabase(
  formData: TransferPackageFormData,
  userId: string
): CreateTransferPackageData {
  const packageData: Partial<TransferPackage> = {
    operator_id: userId,
    // Basic Information
    title: formData.basicInformation.title,
    short_description: formData.basicInformation.shortDescription,
    full_description: formData.basicInformation.fullDescription,
    destination_name: formData.basicInformation.destination.name,
    destination_address: formData.basicInformation.destination.address,
    destination_city: formData.basicInformation.destination.city,
    destination_country: formData.basicInformation.destination.country,
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
    base_price: 0, // Set from pricing policies section
    currency: 'USD', // You can make this dynamic
    
    // Policies
    cancellation_policy_type: formData.pricingPolicies.cancellationPolicy.type,
    cancellation_refund_percentage: formData.pricingPolicies.cancellationPolicy.refundPercentage,
    cancellation_deadline_hours: formData.pricingPolicies.cancellationPolicy.cancellationDeadline,
    no_show_policy: formData.pricingPolicies.noShowPolicy,
    terms_and_conditions: formData.pricingPolicies.termsAndConditions,
    
    // Availability
    available_days: formData.availabilityBooking.availableDays,
    advance_booking_hours: formData.availabilityBooking.advanceBookingRequired,
    maximum_advance_booking_days: formData.availabilityBooking.maximumAdvanceBooking,
    instant_confirmation: formData.availabilityBooking.instantConfirmation,
    special_instructions: formData.availabilityBooking.specialInstructions,
    
    status: 'draft',
    featured: false,
  };

  // Images - package gallery images ONLY (no vehicle images here)
  const images: Partial<TransferPackageImage>[] = formData.basicInformation.imageGallery.map((img, index) => ({
    file_name: img.fileName,
    file_size: img.fileSize,
    mime_type: img.mimeType,
    storage_path: img.url,
    public_url: img.url,
    is_cover: img.isCover,
    is_featured: false,
    display_order: index,
  }));

  // Collect vehicle images separately (to be linked after vehicle creation)
  const vehicleImages: Array<{
    vehicleIndex: number;
    image: Partial<TransferVehicleImage>;
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

  // Vehicles - from transferDetails.vehicles
  const vehicles: Partial<TransferPackageVehicle>[] = (formData.transferDetails.vehicles || []).map((vehicle, index) => ({
    vehicle_type: vehicle.vehicleType || 'SEDAN',
    name: vehicle.vehicleName,
    description: null,
    passenger_capacity: vehicle.maxCapacity,
    luggage_capacity: 0, // Not tracked in new form
    features: [],
    base_price: 0, // Set from pricing section
    is_active: true,
    display_order: vehicle.order || index,
  }));

  // Stops (for multi-stop transfers)
  const stops: Partial<TransferPackageStop>[] = [];
  if (formData.transferDetails.multiStopDetails) {
    formData.transferDetails.multiStopDetails.stops.forEach((stop) => {
      stops.push({
        location_name: stop.location.name,
        location_address: stop.location.address,
        location_coordinates: stop.location.coordinates,
        duration_hours: stop.duration.hours,
        duration_minutes: stop.duration.minutes,
        description: stop.description,
        stop_order: stop.order,
      });
    });
  }

  // Additional Services
  const additional_services: Partial<TransferAdditionalService>[] = (formData.driverService.additionalServices || []).map((service) => ({
    name: service.name,
    description: service.description,
    price: service.price,
    is_included: service.isIncluded,
    is_active: true,
  }));

  // Hourly Pricing Options
  const hourly_pricing: Partial<TransferHourlyPricing>[] = (formData.pricingPolicies.hourlyPricingOptions || []).map((option, index) => ({
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

  // Point-to-Point Pricing Options
  const point_to_point_pricing: Partial<TransferPointToPointPricing>[] = (formData.pricingPolicies.pointToPointPricingOptions || []).map((option, index) => ({
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

// ============================================================================
// DATABASE TO FORM DATA CONVERTER
// ============================================================================

export function databaseToFormData(
  packageData: TransferPackageWithRelations
): TransferPackageFormData {
  // TODO: Properly type all fields - for now using type assertion for quick implementation
  // This converter needs careful field-by-field mapping to match FormData types exactly
  const coverImage = packageData.images?.find(img => img.is_cover);
  
  return ({
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
      featuredImage: coverImage ? {
        id: coverImage.id,
        fileName: coverImage.file_name || '',
        fileSize: coverImage.file_size || 0,
        mimeType: coverImage.mime_type || 'image/jpeg',
        url: coverImage.public_url || '',
        isCover: true,
        order: 0,
        uploadedAt: coverImage.created_at ? new Date(coverImage.created_at) : new Date(),
      } : null,
      imageGallery: (packageData.images || []).map((img, index) => ({
        id: img.id,
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
      stops: ((packageData.stops || []) as any[]).map((stop: any) => ({
        id: stop.id,
        stopName: stop.stop_name || '',
        stopAddress: stop.stop_address || '',
        stopDuration: stop.stop_duration_minutes || 0,
        stopOrder: stop.stop_order || 0,
        isOptional: stop.is_optional || false,
      })),
      vehicles: ((packageData.vehicles || []) as any[]).map((vehicle: any, index: number) => ({
        id: vehicle.id,
        vehicleName: vehicle.name || '',
        vehicleType: vehicle.vehicle_type || undefined,
        maxCapacity: vehicle.passenger_capacity || 1,
        vehicleImage: vehicle.vehicle_images && vehicle.vehicle_images[0] ? {
          id: vehicle.vehicle_images[0].id || `temp-${Date.now()}`,
          fileName: vehicle.vehicle_images[0].file_name || '',
          fileSize: vehicle.vehicle_images[0].file_size || 0,
          mimeType: vehicle.vehicle_images[0].mime_type || 'image/jpeg',
          url: vehicle.vehicle_images[0].public_url || '',
          isCover: false,
          order: 0,
          uploadedAt: vehicle.vehicle_images[0].created_at ? new Date(vehicle.vehicle_images[0].created_at) : new Date(),
        } : null,
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
    },
    pricingPolicies: {
      additionalCharges: [], // Not stored in database currently
      cancellationPolicy: {
        type: packageData.cancellation_policy_type || 'MODERATE',
        refundPercentage: packageData.cancellation_refund_percentage || 0,
        cancellationDeadline: packageData.cancellation_deadline_hours || 24,
      },
      noShowPolicy: packageData.no_show_policy || '',
      termsAndConditions: packageData.terms_and_conditions || '',
      hourlyPricingOptions: ((packageData.hourly_pricing || []) as any[]).map((pricing: any) => ({
        id: pricing.id,
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
      pointToPointPricingOptions: ((packageData.point_to_point_pricing || []) as any[]).map((pricing: any) => ({
        id: pricing.id,
        fromLocation: pricing.from_location || '',
        toLocation: pricing.to_location || '',
        vehicleType: pricing.vehicle_type || 'SEDAN',
        vehicleName: pricing.vehicle_name || '',
        maxPassengers: pricing.max_passengers || 4,
        costUSD: pricing.cost_usd || 0,
        distance: pricing.distance || 0,
        distanceUnit: pricing.distance_unit || 'KM',
        estimatedDuration: pricing.estimated_duration_minutes || 0,
        description: pricing.description || '',
        features: pricing.features || [],
        isActive: pricing.is_active !== false,
        displayOrder: pricing.display_order || 0,
      })),
    },
    availabilityBooking: {
      availableDays: packageData.available_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      advanceBookingRequired: packageData.advance_booking_hours || 24,
      maximumAdvanceBooking: packageData.maximum_advance_booking_days || 365,
      instantConfirmation: packageData.instant_confirmation !== false,
      specialInstructions: packageData.special_instructions || '',
    },
  }) as any as TransferPackageFormData; // Type assertion for quick implementation - TODO: fix types properly
}

// ============================================================================
// CREATE TRANSFER PACKAGE
// ============================================================================

export async function createTransferPackage(
  data: CreateTransferPackageData,
  userId: string
): Promise<{ data: TransferPackageWithRelations | null; error: SupabaseError | null }> {
  const supabase = createSupabaseBrowserClient();
  
  return withErrorHandling(async () => {
    // First, upload any base64 images to storage
    const finalImages: Partial<TransferPackageImage>[] = [];
    
    if (data.images && data.images.length > 0) {
      const base64Images = data.images.filter(img => img.storage_path?.startsWith('data:'));
      const alreadyUploadedImages = data.images.filter(img => !img.storage_path?.startsWith('data:'));
      
      if (base64Images.length > 0) {
        const files = base64Images.map(img => {
          const fileName = img.file_name || `image_${Date.now()}.jpg`;
          return base64ToFile(img.storage_path!, fileName);
        });
        
        const uploadResults = await uploadImageFiles(files, userId, 'transfer-packages', TRANSFER_PACKAGES_BUCKET);
        
        const newImageRecords = uploadResults.map((result, index) => {
          const base64Image = base64Images[index];
          return {
            file_name: base64Image?.file_name || '',
            file_size: base64Image?.file_size || 0,
            mime_type: base64Image?.mime_type || 'image/jpeg',
            storage_path: result.data?.path || '',
            public_url: result.data?.publicUrl || '',
            alt_text: base64Image?.alt_text || '',
            is_cover: base64Image?.is_cover || false,
            is_featured: base64Image?.is_featured || false,
            display_order: base64Image?.display_order || 0,
          };
        });
        
        finalImages.push(...newImageRecords);
      }
      
      finalImages.push(...alreadyUploadedImages);
    }

    // Process vehicle images - upload base64 images to S3
    let processedVehicleImages = data.vehicleImages || [];
    if (data.vehicleImages && data.vehicles) {
      const uploadPromises = data.vehicleImages.map(async (vehicleImageData: any, index: number) => {
        if (vehicleImageData.image.storage_path?.startsWith('data:')) {
          const fileName = vehicleImageData.image.file_name || `vehicle_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
          const file = base64ToFile(vehicleImageData.image.storage_path, fileName);
          const uploadResult = await uploadImageFiles([file], userId, 'transfer-packages/vehicles', TRANSFER_PACKAGES_BUCKET);
          
          if (uploadResult[0] && uploadResult[0].data) {
            return {
              vehicleIndex: vehicleImageData.vehicleIndex,
              image: {
                ...vehicleImageData.image,
                storage_path: uploadResult[0].data.path,
                public_url: uploadResult[0].data.publicUrl,
              },
            };
          }
        }
        return vehicleImageData;
      });
      processedVehicleImages = await Promise.all(uploadPromises);
    }

    // Use API route for database operations instead of Supabase
    const response = await fetch('/api/operator/packages/transfer/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: data.package,
        images: finalImages,
        vehicles: data.vehicles,
        vehicleImages: processedVehicleImages,
        stops: data.stops,
        additional_services: data.additional_services,
        hourly_pricing: data.hourly_pricing,
        point_to_point_pricing: data.point_to_point_pricing,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create package');
    }

    const apiResult = await response.json();
    const packageId = apiResult.data?.id;

    if (!packageId) {
      throw new Error('Failed to get package ID from API');
    }

    // Return a result structure compatible with the expected format
    const result: TransferPackageWithRelations = {
      id: packageId,
      ...data.package as any,
      images: finalImages as any,
      vehicles: (data.vehicles || []).map((v, idx) => ({
        ...v,
        id: `temp-${idx}`,
        vehicle_images: processedVehicleImages
          .filter((vi: any) => vi.vehicleIndex === idx)
          .map((vi: any) => vi.image),
      })) as any,
      stops: data.stops || [],
      additional_services: data.additional_services || [],
      hourly_pricing: data.hourly_pricing || [],
      point_to_point_pricing: data.point_to_point_pricing || [],
    } as any;

    return { data: result, error: null };
  });
}

// ============================================================================
// GET TRANSFER PACKAGE
// ============================================================================

export async function getTransferPackage(
  id: string
): Promise<{ data: TransferPackageWithRelations | null; error: SupabaseError | null }> {
  const supabase = createSupabaseBrowserClient();
  
  return withErrorHandling(async () => {
    // Get main package
    const { data: packageData, error: packageError } = await supabase
      .from('transfer_packages')
      .select('*')
      .eq('id', id)
      .single();

    if (packageError) throw packageError;

    // Get related data
    const [imagesResult, vehiclesResult, stopsResult, servicesResult, hourlyPricingResult, p2pPricingResult] = await Promise.all([
      supabase.from('transfer_package_images').select('*').eq('package_id', id).order('display_order'),
      supabase.from('transfer_package_vehicles').select('*').eq('package_id', id).order('display_order'),
      supabase.from('transfer_package_stops').select('*').eq('package_id', id).order('stop_order'),
      supabase.from('transfer_additional_services').select('*').eq('package_id', id),
      supabase.from('transfer_hourly_pricing').select('*').eq('package_id', id).order('display_order'),
      supabase.from('transfer_point_to_point_pricing').select('*').eq('package_id', id).order('display_order'),
    ]);

    // Fetch vehicle images for all vehicles
    const vehicleIds = (vehiclesResult.data || []).map((v: any) => v.id);
    const vehicleImagesMap: { [key: string]: any[] } = {};
    
    if (vehicleIds.length > 0) {
      const { data: vehicleImagesData } = await supabase
        .from('transfer_vehicle_images')
        .select('*')
        .in('vehicle_id', vehicleIds)
        .order('display_order');
      
      // Group images by vehicle_id
      if (vehicleImagesData) {
        vehicleImagesData.forEach((img: any) => {
          if (!vehicleImagesMap[img.vehicle_id]) {
            vehicleImagesMap[img.vehicle_id] = [];
          }
          vehicleImagesMap[img.vehicle_id]!.push(img);
        });
      }
    }

    // Attach vehicle images to vehicles
    const vehiclesWithImages = (vehiclesResult.data || []).map((vehicle: any) => ({
      ...vehicle,
      vehicle_images: vehicleImagesMap[vehicle.id] || [],
    }));

    const result: TransferPackageWithRelations = {
      ...packageData,
      images: imagesResult.data || [],
      vehicles: vehiclesWithImages,
      stops: stopsResult.data || [],
      additional_services: servicesResult.data || [],
      hourly_pricing: hourlyPricingResult.data || [],
      point_to_point_pricing: p2pPricingResult.data || [],
    };

    return { data: result, error: null };
  });
}

// ============================================================================
// UPDATE TRANSFER PACKAGE
// ============================================================================

export async function updateTransferPackage(
  id: string,
  data: CreateTransferPackageData
): Promise<{ data: TransferPackageWithRelations | null; error: SupabaseError | null }> {
  const supabase = createSupabaseBrowserClient();
  
  return withErrorHandling(async () => {
    // Get userId from existing package (needed for image uploads)
    let userId = '';
    try {
      const getResponse = await fetch(`/api/operator/packages/transfer/${id}`);
      if (getResponse.ok) {
        const existing = await getResponse.json();
        userId = existing.data?.operator_id || '';
      }
    } catch (e) {
      console.warn('Could not fetch operator_id for image uploads:', e);
    }

    // Handle images - upload base64 images first
    const finalImages: Partial<TransferPackageImage>[] = [];
    
    if (data.images && data.images.length > 0) {
      const base64Images = data.images.filter(img => img.storage_path?.startsWith('data:'));
      const alreadyUploadedImages = data.images.filter(img => !img.storage_path?.startsWith('data:'));

      if (base64Images.length > 0 && userId) {
        const files = base64Images.map(img => {
          const fileName = img.file_name || `image_${Date.now()}.jpg`;
          return base64ToFile(img.storage_path!, fileName);
        });
        
        const uploadResults = await uploadImageFiles(files, userId, 'transfer-packages', TRANSFER_PACKAGES_BUCKET);
        
        const newImageRecords = uploadResults.map((result, index) => {
          const base64Image = base64Images[index];
          return {
            file_name: base64Image?.file_name || '',
            file_size: base64Image?.file_size || 0,
            mime_type: base64Image?.mime_type || 'image/jpeg',
            storage_path: result.data?.path || '',
            public_url: result.data?.publicUrl || '',
            alt_text: base64Image?.alt_text || '',
            is_cover: base64Image?.is_cover || false,
            is_featured: base64Image?.is_featured || false,
            display_order: base64Image?.display_order || 0,
          };
        });
        
        finalImages.push(...newImageRecords);
      }
      
      finalImages.push(...alreadyUploadedImages);
    }

    // Process vehicle images - upload base64 images to S3
    let processedVehicleImages = data.vehicleImages || [];
    if (data.vehicleImages && userId) {
      const uploadPromises = data.vehicleImages.map(async (vehicleImageData: any, index: number) => {
        if (vehicleImageData.image.storage_path?.startsWith('data:')) {
          const fileName = vehicleImageData.image.file_name || `vehicle_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
          const file = base64ToFile(vehicleImageData.image.storage_path, fileName);
          const uploadResult = await uploadImageFiles([file], userId, 'transfer-packages/vehicles', TRANSFER_PACKAGES_BUCKET);
          
          if (uploadResult[0] && uploadResult[0].data) {
            return {
              vehicleIndex: vehicleImageData.vehicleIndex,
              image: {
                ...vehicleImageData.image,
                storage_path: uploadResult[0].data.path,
                public_url: uploadResult[0].data.publicUrl,
              },
            };
          }
        }
        return vehicleImageData;
      });
      processedVehicleImages = await Promise.all(uploadPromises);
    }

    // Use API route for database operations instead of Supabase
    const response = await fetch('/api/operator/packages/transfer/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId: id,
        package: data.package,
        images: finalImages,
        vehicles: data.vehicles,
        vehicleImages: processedVehicleImages,
        stops: data.stops,
        additional_services: data.additional_services,
        hourly_pricing: data.hourly_pricing,
        point_to_point_pricing: data.point_to_point_pricing,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update package');
    }

    const apiResult = await response.json();
    
    // Return a result structure compatible with the expected format
    const result: TransferPackageWithRelations = {
      id,
      ...data.package as any,
      images: finalImages as any,
      vehicles: (data.vehicles || []).map((v, idx) => ({
        ...v,
        id: `temp-${idx}`,
        vehicle_images: processedVehicleImages
          .filter((vi: any) => vi.vehicleIndex === idx)
          .map((vi: any) => vi.image),
      })) as any,
      stops: data.stops || [],
      additional_services: data.additional_services || [],
      hourly_pricing: data.hourly_pricing || [],
      point_to_point_pricing: data.point_to_point_pricing || [],
    } as any;

    return { data: result, error: null };
  });
}

// ============================================================================
// LIST TRANSFER PACKAGES
// ============================================================================

export async function listTransferPackages(
  filters: { operator_id?: string; status?: string } = {}
): Promise<{ data: TransferPackageWithRelations[] | null; error: SupabaseError | null }> {
  const supabase = createSupabaseBrowserClient();
  
  return withErrorHandling(async () => {
    let query = supabase
      .from('transfer_packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.operator_id) {
      query = query.eq('operator_id', filters.operator_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status as any);
    }

    const { data: packages, error } = await query;

    if (error) throw error;

    // For list view, we'll get basic package info without all relations
    // You can extend this to include relations if needed

    return { data: (packages || []) as TransferPackageWithRelations[], error: null };
  });
}

// ============================================================================
// LIST TRANSFER PACKAGES WITH CARD DATA (For Display Cards)
// ============================================================================

export async function listTransferPackagesWithCardData(
  filters: { operator_id?: string; status?: string } = {}
): Promise<{ data: TransferPackageWithRelations[] | null; error: SupabaseError | null }> {
  const supabase = createSupabaseBrowserClient();
  
  return withErrorHandling(async () => {
    // Get base packages
    let query = supabase
      .from('transfer_packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.operator_id) {
      query = query.eq('operator_id', filters.operator_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status as any);
    }

    const { data: packages, error: packagesError } = await query;

    if (packagesError) throw packagesError;
    if (!packages || packages.length === 0) {
      return { data: [], error: null };
    }

    // Get all package IDs
    const packageIds = packages.map(p => p.id);

    // Fetch all related data in parallel (including package images for card carousel)
    const [packageImagesResult, vehiclesResult, hourlyPricingResult, p2pPricingResult] = await Promise.all([
      supabase
        .from('transfer_package_images')
        .select('package_id, public_url, alt_text, display_order')
        .in('package_id', packageIds)
        .order('display_order'),
      supabase
        .from('transfer_package_vehicles')
        .select('*')
        .in('package_id', packageIds)
        .order('display_order'),
      supabase
        .from('transfer_hourly_pricing')
        .select('rate_usd, hours, package_id')
        .in('package_id', packageIds),
      supabase
        .from('transfer_point_to_point_pricing')
        .select('cost_usd, from_location, to_location, package_id')
        .in('package_id', packageIds),
    ]);

    // Get all vehicle IDs to fetch their images
    const vehicleIds = (vehiclesResult.data || []).map(v => v.id);
    let vehicleImagesData: any[] = [];

    if (vehicleIds.length > 0) {
      const { data: images } = await supabase
        .from('transfer_vehicle_images')
        .select('vehicle_id, public_url, alt_text')
        .in('vehicle_id', vehicleIds)
        .order('display_order');
      
      vehicleImagesData = images || [];
    }

    // Group data by package_id
    const packageImagesByPackage: { [key: string]: any[] } = {};
    const vehiclesByPackage: { [key: string]: any[] } = {};
    const vehicleImagesMap: { [key: string]: any[] } = {};
    const hourlyPricingByPackage: { [key: string]: any[] } = {};
    const p2pPricingByPackage: { [key: string]: any[] } = {};

    // Group package images
    (packageImagesResult.data || []).forEach(img => {
      if (!packageImagesByPackage[img.package_id]) {
        packageImagesByPackage[img.package_id] = [];
      }
      packageImagesByPackage[img.package_id]!.push(img);
    });

    // Group vehicles
    (vehiclesResult.data || []).forEach(vehicle => {
      if (!vehiclesByPackage[vehicle.package_id]) {
        vehiclesByPackage[vehicle.package_id] = [];
      }
      vehiclesByPackage[vehicle.package_id]!.push(vehicle);
    });

    // Group vehicle images by vehicle_id
    vehicleImagesData.forEach(img => {
      if (!vehicleImagesMap[img.vehicle_id]) {
        vehicleImagesMap[img.vehicle_id] = [];
      }
      vehicleImagesMap[img.vehicle_id]!.push(img);
    });

    // Group pricing
    (hourlyPricingResult.data || []).forEach(pricing => {
      if (!hourlyPricingByPackage[pricing.package_id]) {
        hourlyPricingByPackage[pricing.package_id] = [];
      }
      hourlyPricingByPackage[pricing.package_id]!.push(pricing);
    });

    (p2pPricingResult.data || []).forEach(pricing => {
      if (!p2pPricingByPackage[pricing.package_id]) {
        p2pPricingByPackage[pricing.package_id] = [];
      }
      p2pPricingByPackage[pricing.package_id]!.push(pricing);
    });

    // Combine everything
    const packagesWithData: TransferPackageWithRelations[] = packages.map(pkg => {
      // Get vehicles for this package and attach their images
      const pkgVehicles = (vehiclesByPackage[pkg.id] || []).map(vehicle => ({
        ...vehicle,
        vehicle_images: vehicleImagesMap[vehicle.id] || [],
      }));

      return {
        ...pkg,
        images: packageImagesByPackage[pkg.id] || [], // Package images for card carousel
        vehicles: pkgVehicles,
        stops: [], // Not needed for card view
        additional_services: [], // Not needed for card view
        hourly_pricing: hourlyPricingByPackage[pkg.id] || [],
        point_to_point_pricing: p2pPricingByPackage[pkg.id] || [],
      };
    });

    return { data: packagesWithData, error: null };
  });
}

// ============================================================================
// DELETE TRANSFER PACKAGE
// ============================================================================

export async function deleteTransferPackage(
  id: string
): Promise<{ data: boolean | null; error: SupabaseError | null }> {
  const supabase = createSupabaseBrowserClient();
  
  return withErrorHandling(async () => {
    const { error } = await supabase
      .from('transfer_packages')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { data: true, error: null };
  });
}

