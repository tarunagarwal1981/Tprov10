/**
 * Transfer Packages Supabase Service
 * Handles all CRUD operations for transfer packages
 */

import { createSupabaseBrowserClient, withErrorHandling, SupabaseError } from './client';
import { uploadImageFiles, base64ToFile } from './file-upload';
import type { TransferPackageFormData } from '../types/transfer-package';

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

export interface TransferPackageWithRelations extends TransferPackage {
  images: TransferPackageImage[];
  vehicles: TransferPackageVehicle[];
  stops: TransferPackageStop[];
  additional_services: TransferAdditionalService[];
  hourly_pricing: TransferHourlyPricing[];
  point_to_point_pricing: TransferPointToPointPricing[];
}

export interface CreateTransferPackageData {
  package: Partial<TransferPackage>;
  images?: Partial<TransferPackageImage>[];
  vehicles?: Partial<TransferPackageVehicle>[];
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
    base_price: formData.vehicleOptions.vehicles[0]?.basePrice || 0,
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

  // Images
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

  // Vehicles
  const vehicles: Partial<TransferPackageVehicle>[] = formData.vehicleOptions.vehicles.map((vehicle, index) => ({
    vehicle_type: vehicle.vehicleType,
    name: vehicle.name,
    description: vehicle.description,
    passenger_capacity: vehicle.passengerCapacity,
    luggage_capacity: vehicle.luggageCapacity,
    features: vehicle.features,
    base_price: vehicle.basePrice,
    is_active: vehicle.isActive,
    display_order: index,
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
  const additional_services: Partial<TransferAdditionalService>[] = formData.driverService.additionalServices.map((service) => ({
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
    stops,
    additional_services,
    hourly_pricing,
    point_to_point_pricing,
  };
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
        
        const uploadResults = await uploadImageFiles(files, userId, 'transfer-packages');
        
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

    // Insert main package
    const { data: packageData, error: packageError } = await supabase
      .from('transfer_packages')
      .insert(data.package as any)
      .select()
      .single();

    if (packageError) {
      throw packageError;
    }

    const packageId = packageData.id;
    const result: TransferPackageWithRelations = {
      ...packageData,
      images: [],
      vehicles: [],
      stops: [],
      additional_services: [],
      hourly_pricing: [],
      point_to_point_pricing: [],
    };

    // Insert images
    if (finalImages.length > 0) {
      const imagesWithPackageId = finalImages.map(img => ({
        ...img,
        package_id: packageId,
      })) as any[];

      const { data: imagesData, error: imagesError } = await supabase
        .from('transfer_package_images')
        .insert(imagesWithPackageId)
        .select();

      if (imagesError) throw imagesError;
      result.images = imagesData || [];
    }

    // Insert vehicles
    if (data.vehicles && data.vehicles.length > 0) {
      const vehiclesWithPackageId = data.vehicles.map(vehicle => ({
        ...vehicle,
        package_id: packageId,
      })) as any[];

      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('transfer_package_vehicles')
        .insert(vehiclesWithPackageId)
        .select();

      if (vehiclesError) throw vehiclesError;
      result.vehicles = vehiclesData || [];
    }

    // Insert stops
    if (data.stops && data.stops.length > 0) {
      const stopsWithPackageId = data.stops.map(stop => ({
        ...stop,
        package_id: packageId,
      })) as any[];

      const { data: stopsData, error: stopsError } = await supabase
        .from('transfer_package_stops')
        .insert(stopsWithPackageId)
        .select();

      if (stopsError) throw stopsError;
      result.stops = stopsData || [];
    }

    // Insert additional services
    if (data.additional_services && data.additional_services.length > 0) {
      const servicesWithPackageId = data.additional_services.map(service => ({
        ...service,
        package_id: packageId,
      })) as any[];

      const { data: servicesData, error: servicesError } = await supabase
        .from('transfer_additional_services')
        .insert(servicesWithPackageId)
        .select();

      if (servicesError) throw servicesError;
      result.additional_services = servicesData || [];
    }

    // Insert hourly pricing options
    if (data.hourly_pricing && data.hourly_pricing.length > 0) {
      const hourlyPricingWithPackageId = data.hourly_pricing.map(option => ({
        ...option,
        package_id: packageId,
      })) as any[];

      const { data: hourlyPricingData, error: hourlyPricingError } = await supabase
        .from('transfer_hourly_pricing')
        .insert(hourlyPricingWithPackageId)
        .select();

      if (hourlyPricingError) throw hourlyPricingError;
      result.hourly_pricing = hourlyPricingData || [];
    }

    // Insert point-to-point pricing options
    if (data.point_to_point_pricing && data.point_to_point_pricing.length > 0) {
      const p2pPricingWithPackageId = data.point_to_point_pricing.map(option => ({
        ...option,
        package_id: packageId,
      })) as any[];

      const { data: p2pPricingData, error: p2pPricingError } = await supabase
        .from('transfer_point_to_point_pricing')
        .insert(p2pPricingWithPackageId)
        .select();

      if (p2pPricingError) throw p2pPricingError;
      result.point_to_point_pricing = p2pPricingData || [];
    }

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

    const result: TransferPackageWithRelations = {
      ...packageData,
      images: imagesResult.data || [],
      vehicles: vehiclesResult.data || [],
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
    // Update main package
    const { data: packageData, error: packageError } = await supabase
      .from('transfer_packages')
      .update(data.package)
      .eq('id', id)
      .select()
      .single();

    if (packageError) throw packageError;

    // For simplicity, we'll delete and re-insert related data
    // In production, you might want more sophisticated merge logic

    // Delete existing related data
    await Promise.all([
      supabase.from('transfer_package_images').delete().eq('package_id', id),
      supabase.from('transfer_package_vehicles').delete().eq('package_id', id),
      supabase.from('transfer_package_stops').delete().eq('package_id', id),
      supabase.from('transfer_additional_services').delete().eq('package_id', id),
      supabase.from('transfer_hourly_pricing').delete().eq('package_id', id),
      supabase.from('transfer_point_to_point_pricing').delete().eq('package_id', id),
    ]);

    // Re-insert as in create
    const result: TransferPackageWithRelations = {
      ...packageData,
      images: [],
      vehicles: [],
      stops: [],
      additional_services: [],
      hourly_pricing: [],
      point_to_point_pricing: [],
    };

    // Insert new data (similar to create logic)
    // ... (implement similar to createTransferPackage)

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

