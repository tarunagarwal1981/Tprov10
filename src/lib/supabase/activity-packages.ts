/**
 * Activity Packages Supabase Service
 * Handles all CRUD operations for activity packages with gallery support
 */

import { createSupabaseBrowserClient, withErrorHandling, SupabaseError } from './client';
import { uploadImageFiles, base64ToFile, deleteFile } from './file-upload';
import type {
  ActivityPackage,
  ActivityPackageInsert,
  ActivityPackageUpdate,
  ActivityPackageImage,
  ActivityPackageImageInsert,
  ActivityPackageImageUpdate,
  ActivityPackageTimeSlot,
  ActivityPackageTimeSlotInsert,
  ActivityPackageTimeSlotUpdate,
  ActivityPackageVariant,
  ActivityPackageVariantInsert,
  ActivityPackageVariantUpdate,
  ActivityPackageFAQ,
  ActivityPackageFAQInsert,
  ActivityPackageFAQUpdate,
} from './types';
import type { ActivityPackageFormData } from '../types/activity-package';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ActivityPackageWithRelations extends ActivityPackage {
  images: ActivityPackageImage[];
  time_slots: ActivityPackageTimeSlot[];
  variants: ActivityPackageVariant[];
  faqs: ActivityPackageFAQ[];
}

export interface CreateActivityPackageData {
  package: ActivityPackageInsert;
  images?: ActivityPackageImageInsert[];
  time_slots?: ActivityPackageTimeSlotInsert[];
  variants?: ActivityPackageVariantInsert[];
  faqs?: ActivityPackageFAQInsert[];
}

export interface UpdateActivityPackageData {
  package: ActivityPackageUpdate;
  images?: ActivityPackageImageInsert[];
  time_slots?: ActivityPackageTimeSlotInsert[];
  variants?: ActivityPackageVariantInsert[];
  faqs?: ActivityPackageFAQInsert[];
}

export interface ActivityPackageFilters {
  status?: ActivityPackage['status'];
  difficulty_level?: ActivityPackage['difficulty_level'];
  destination_city?: string;
  destination_country?: string;
  min_price?: number;
  max_price?: number;
  tags?: ActivityPackage['tags'];
  languages_supported?: ActivityPackage['languages_supported'];
  operator_id?: string;
}

export interface ActivityPackageListOptions {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'base_price' | 'title';
  sort_order?: 'asc' | 'desc';
  filters?: ActivityPackageFilters;
}

export interface ActivityPackageListResponse {
  packages: ActivityPackageWithRelations[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ============================================================================
// ACTIVITY PACKAGE CRUD OPERATIONS
// ============================================================================

/**
 * Create a new activity package
 */
export async function createActivityPackage(
  data: CreateActivityPackageData,
  userId: string
): Promise<{ data: ActivityPackageWithRelations | null; error: SupabaseError | null }> {
  const supabase = createSupabaseBrowserClient();
  
  return withErrorHandling(async () => {
    // First, upload any base64 images to storage
    const finalImages: ActivityPackageImageInsert[] = [];
    
    if (data.images && data.images.length > 0) {
      // Separate base64 images from already uploaded images
      const base64Images = data.images.filter(img => img.storage_path?.startsWith('data:'));
      const alreadyUploadedImages = data.images.filter(img => !img.storage_path?.startsWith('data:'));
      
      if (base64Images.length > 0) {
        // Convert base64 to files and upload
        const files = base64Images.map(img => {
          const fileName = img.file_name || `image_${Date.now()}.jpg`;
          return base64ToFile(img.storage_path!, fileName);
        });
        
        const uploadResults = await uploadImageFiles(files, userId, 'activity-packages-images');
        
        // Create image records with proper storage paths
        const newImageRecords = uploadResults.map((result, index) => {
          const base64Image = base64Images[index];
          return {
            package_id: '', // Will be set later
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
      
      // Add already uploaded images
      finalImages.push(...alreadyUploadedImages);
    }

    // Start a transaction-like operation
    const { data: packageData, error: packageError } = await supabase
      .from('activity_packages')
      .insert(data.package)
      .select()
      .single();

    if (packageError) {
      throw packageError;
    }

    const packageId = packageData.id;
    const result: ActivityPackageWithRelations = {
      ...packageData,
      images: [],
      time_slots: [],
      variants: [],
      faqs: [],
    };

    // Insert related data if provided
    if (finalImages.length > 0) {
      const imagesWithPackageId = finalImages.map(img => ({
        ...img,
        package_id: packageId,
      }));

      const { data: imagesData, error: imagesError } = await supabase
        .from('activity_package_images')
        .insert(imagesWithPackageId)
        .select();

      if (imagesError) {
        throw imagesError;
      }
      result.images = imagesData || [];
    }

    if (data.time_slots && data.time_slots.length > 0) {
      const timeSlotsWithPackageId = data.time_slots.map(slot => ({
        ...slot,
        package_id: packageId,
      }));

      const { data: timeSlotsData, error: timeSlotsError } = await supabase
        .from('activity_package_time_slots')
        .insert(timeSlotsWithPackageId)
        .select();

      if (timeSlotsError) {
        throw timeSlotsError;
      }
      result.time_slots = timeSlotsData || [];
    }

    if (data.variants && data.variants.length > 0) {
      const variantsWithPackageId = data.variants.map(variant => ({
        ...variant,
        package_id: packageId,
      }));

      const { data: variantsData, error: variantsError } = await supabase
        .from('activity_package_variants')
        .insert(variantsWithPackageId)
        .select();

      if (variantsError) {
        throw variantsError;
      }
      result.variants = variantsData || [];
    }

    if (data.faqs && data.faqs.length > 0) {
      const faqsWithPackageId = data.faqs.map(faq => ({
        ...faq,
        package_id: packageId,
      }));

      const { data: faqsData, error: faqsError } = await supabase
        .from('activity_package_faqs')
        .insert(faqsWithPackageId)
        .select();

      if (faqsError) {
        throw faqsError;
      }
      result.faqs = faqsData || [];
    }

    return { data: result, error: null };
  });
}

/**
 * Get activity package by ID with all relations
 */
export async function getActivityPackage(
  id: string
): Promise<{ data: ActivityPackageWithRelations | null; error: SupabaseError | null }> {
  const supabase = createSupabaseBrowserClient();
  
  return withErrorHandling(async () => {
    // Get the main package
    const { data: packageData, error: packageError } = await supabase
      .from('activity_packages')
      .select('*')
      .eq('id', id)
      .single();

    if (packageError) {
      throw packageError;
    }

    if (!packageData) {
      return { data: null, error: null };
    }

    // Get related data
    const [imagesResult, timeSlotsResult, variantsResult, faqsResult] = await Promise.all([
      supabase
        .from('activity_package_images')
        .select('*')
        .eq('package_id', id)
        .order('display_order'),
      supabase
        .from('activity_package_time_slots')
        .select('*')
        .eq('package_id', id)
        .order('start_time'),
      supabase
        .from('activity_package_variants')
        .select('*')
        .eq('package_id', id)
        .order('display_order'),
      supabase
        .from('activity_package_faqs')
        .select('*')
        .eq('package_id', id)
        .order('display_order'),
    ]);

    const result: ActivityPackageWithRelations = {
      ...packageData,
      images: imagesResult.data || [],
      time_slots: timeSlotsResult.data || [],
      variants: variantsResult.data || [],
      faqs: faqsResult.data || [],
    };

    return { data: result, error: null };
  });
}

/**
 * Update activity package
 */
export async function updateActivityPackage(
  id: string,
  data: UpdateActivityPackageData
): Promise<{ data: ActivityPackageWithRelations | null; error: SupabaseError | null }> {
  const supabase = createSupabaseBrowserClient();
  
  return withErrorHandling(async () => {
    // Update the main package
    const { data: packageData, error: packageError } = await supabase
      .from('activity_packages')
      .update(data.package)
      .eq('id', id)
      .select()
      .single();

    if (packageError) {
      throw packageError;
    }

    if (!packageData) {
      return { data: null, error: null };
    }

    const result: ActivityPackageWithRelations = {
      ...packageData,
      images: [],
      time_slots: [],
      variants: [],
      faqs: [],
    };

    // Update related data if provided
    if (data.images) {
      // Delete existing images and insert new ones
      await supabase
        .from('activity_package_images')
        .delete()
        .eq('package_id', id);

      if (data.images.length > 0) {
        const imagesWithPackageId = data.images.map(img => ({
          ...img,
          package_id: id,
        }));

        const { data: imagesData, error: imagesError } = await supabase
          .from('activity_package_images')
          .insert(imagesWithPackageId)
          .select();

        if (imagesError) {
          throw imagesError;
        }
        result.images = imagesData || [];
      }
    } else {
      // Keep existing images
      const { data: imagesData } = await supabase
        .from('activity_package_images')
        .select('*')
        .eq('package_id', id)
        .order('display_order');
      result.images = imagesData || [];
    }

    if (data.time_slots) {
      // Delete existing time slots and insert new ones
      await supabase
        .from('activity_package_time_slots')
        .delete()
        .eq('package_id', id);

      if (data.time_slots.length > 0) {
        const timeSlotsWithPackageId = data.time_slots.map(slot => ({
          ...slot,
          package_id: id,
        }));

        const { data: timeSlotsData, error: timeSlotsError } = await supabase
          .from('activity_package_time_slots')
          .insert(timeSlotsWithPackageId)
          .select();

        if (timeSlotsError) {
          throw timeSlotsError;
        }
        result.time_slots = timeSlotsData || [];
      }
    } else {
      // Keep existing time slots
      const { data: timeSlotsData } = await supabase
        .from('activity_package_time_slots')
        .select('*')
        .eq('package_id', id)
        .order('start_time');
      result.time_slots = timeSlotsData || [];
    }

    if (data.variants) {
      // Delete existing variants and insert new ones
      await supabase
        .from('activity_package_variants')
        .delete()
        .eq('package_id', id);

      if (data.variants.length > 0) {
        const variantsWithPackageId = data.variants.map(variant => ({
          ...variant,
          package_id: id,
        }));

        const { data: variantsData, error: variantsError } = await supabase
          .from('activity_package_variants')
          .insert(variantsWithPackageId)
          .select();

        if (variantsError) {
          throw variantsError;
        }
        result.variants = variantsData || [];
      }
    } else {
      // Keep existing variants
      const { data: variantsData } = await supabase
        .from('activity_package_variants')
        .select('*')
        .eq('package_id', id)
        .order('display_order');
      result.variants = variantsData || [];
    }

    if (data.faqs) {
      // Delete existing FAQs and insert new ones
      await supabase
        .from('activity_package_faqs')
        .delete()
        .eq('package_id', id);

      if (data.faqs.length > 0) {
        const faqsWithPackageId = data.faqs.map(faq => ({
          ...faq,
          package_id: id,
        }));

        const { data: faqsData, error: faqsError } = await supabase
          .from('activity_package_faqs')
          .insert(faqsWithPackageId)
          .select();

        if (faqsError) {
          throw faqsError;
        }
        result.faqs = faqsData || [];
      }
    } else {
      // Keep existing FAQs
      const { data: faqsData } = await supabase
        .from('activity_package_faqs')
        .select('*')
        .eq('package_id', id)
        .order('display_order');
      result.faqs = faqsData || [];
    }

    return { data: result, error: null };
  });
}

/**
 * Delete activity package
 */
export async function deleteActivityPackage(
  id: string
): Promise<{ data: boolean; error: SupabaseError | null }> {
  const supabase = createSupabaseBrowserClient();
  
  const result = await withErrorHandling(async () => {
    const { error } = await supabase
      .from('activity_packages')
      .delete()
      .eq('id', id);

    return { data: true, error };
  });

  return {
    data: result.data ?? false,
    error: result.error
  };
}

/**
 * List activity packages with filtering and pagination
 */
export async function listActivityPackages(
  options: ActivityPackageListOptions = {}
): Promise<{ data: ActivityPackageListResponse | null; error: SupabaseError | null }> {
  const supabase = createSupabaseBrowserClient();
  
  return withErrorHandling(async () => {
    const {
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'desc',
      filters = {},
    } = options;

    let query = supabase
      .from('activity_packages')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.difficulty_level) {
      query = query.eq('difficulty_level', filters.difficulty_level);
    }
    if (filters.destination_city) {
      query = query.ilike('destination_city', `%${filters.destination_city}%`);
    }
    if (filters.destination_country) {
      query = query.ilike('destination_country', `%${filters.destination_country}%`);
    }
    if (filters.min_price !== undefined) {
      query = query.gte('base_price', filters.min_price);
    }
    if (filters.max_price !== undefined) {
      query = query.lte('base_price', filters.max_price);
    }
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }
    if (filters.languages_supported && filters.languages_supported.length > 0) {
      query = query.overlaps('languages_supported', filters.languages_supported);
    }
    if (filters.operator_id) {
      query = query.eq('operator_id', filters.operator_id);
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: packages, error, count } = await query;

    if (error) {
      throw error;
    }

    if (!packages) {
      return {
        data: {
          packages: [],
          total: 0,
          page,
          limit,
          total_pages: 0,
        },
        error: null,
      };
    }

    // Get related data for each package
    const packagesWithRelations: ActivityPackageWithRelations[] = await Promise.all(
      packages.map(async (pkg) => {
        const [imagesResult, timeSlotsResult, variantsResult, faqsResult] = await Promise.all([
          supabase
            .from('activity_package_images')
            .select('*')
            .eq('package_id', pkg.id)
            .order('display_order')
            .limit(5), // Limit images for list view
          supabase
            .from('activity_package_time_slots')
            .select('*')
            .eq('package_id', pkg.id)
            .eq('is_active', true)
            .order('start_time')
            .limit(3), // Limit time slots for list view
          supabase
            .from('activity_package_variants')
            .select('*')
            .eq('package_id', pkg.id)
            .eq('is_active', true)
            .order('display_order')
            .limit(3), // Limit variants for list view
          supabase
            .from('activity_package_faqs')
            .select('*')
            .eq('package_id', pkg.id)
            .order('display_order')
            .limit(3), // Limit FAQs for list view
        ]);

        return {
          ...pkg,
          images: imagesResult.data || [],
          time_slots: timeSlotsResult.data || [],
          variants: variantsResult.data || [],
          faqs: faqsResult.data || [],
        };
      })
    );

    const total = count || 0;
    const total_pages = Math.ceil(total / limit);

    return {
      data: {
        packages: packagesWithRelations,
        total,
        page,
        limit,
        total_pages,
      },
      error: null,
    };
  });
}

// ============================================================================
// IMAGE MANAGEMENT OPERATIONS
// ============================================================================

/**
 * Upload image for activity package
 */
export async function uploadActivityPackageImage(
  packageId: string,
  file: File,
  metadata?: {
    alt_text?: string;
    caption?: string;
    is_cover?: boolean;
    is_featured?: boolean;
    display_order?: number;
  }
): Promise<{ data: ActivityPackageImage | null; error: SupabaseError | null }> {
  const supabase = createSupabaseBrowserClient();
  
  return withErrorHandling(async () => {
    // Check authentication before proceeding
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Authentication required for image upload. Please log in again.');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${packageId}/${fileName}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('activity-package-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      // Handle specific authentication errors
      if (uploadError.message?.includes('Invalid Refresh Token') || uploadError.message?.includes('JWT')) {
        throw new Error('Your session has expired. Please refresh the page and log in again.');
      }
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('activity-package-images')
      .getPublicUrl(filePath);

    // Create image record
    const imageData: ActivityPackageImageInsert = {
      package_id: packageId,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: filePath,
      public_url: urlData.publicUrl,
      alt_text: metadata?.alt_text,
      caption: metadata?.caption,
      is_cover: metadata?.is_cover || false,
      is_featured: metadata?.is_featured || false,
      display_order: metadata?.display_order || 0,
    };

    const { data: imageRecord, error: imageError } = await supabase
      .from('activity_package_images')
      .insert(imageData)
      .select()
      .single();

    if (imageError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from('activity-package-images')
        .remove([filePath]);
      throw imageError;
    }

    return { data: imageRecord, error: null };
  });
}

/**
 * Delete activity package image
 */
export async function deleteActivityPackageImage(
  imageId: string
): Promise<{ data: boolean; error: SupabaseError | null }> {
  const supabase = createSupabaseBrowserClient();
  
  const result = await withErrorHandling(async () => {
    // Get image record first
    const { data: image, error: fetchError } = await supabase
      .from('activity_package_images')
      .select('storage_path')
      .eq('id', imageId)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    if (!image) {
      return { data: null, error: new Error('Image not found') };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('activity-package-images')
      .remove([image.storage_path]);

    if (storageError) {
      return { data: null, error: storageError };
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('activity_package_images')
      .delete()
      .eq('id', imageId);

    if (dbError) {
      return { data: null, error: dbError };
    }

    return { data: true, error: null };
  });

  return {
    data: result.data ?? false,
    error: result.error
  };
}

/**
 * Update activity package image metadata
 */
export async function updateActivityPackageImage(
  imageId: string,
  updates: ActivityPackageImageUpdate
): Promise<{ data: ActivityPackageImage | null; error: SupabaseError | null }> {
  const supabase = createSupabaseBrowserClient();
  
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('activity_package_images')
      .update(updates)
      .eq('id', imageId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert form data to database format
 */
export function formDataToDatabase(
  formData: ActivityPackageFormData,
  operatorId: string
): CreateActivityPackageData {
  const packageData: ActivityPackageInsert = {
    operator_id: operatorId,
    title: formData.basicInformation.title || '',
    short_description: formData.basicInformation.shortDescription || '',
    full_description: formData.basicInformation.fullDescription || '',
    destination_name: formData.basicInformation.destination?.name || '',
    destination_address: formData.basicInformation.destination?.address || '',
    destination_city: formData.basicInformation.destination?.city || '',
    destination_country: formData.basicInformation.destination?.country || '',
    destination_postal_code: formData.basicInformation.destination?.postalCode || null,
    destination_coordinates: `${formData.basicInformation.destination?.coordinates?.longitude || 0},${formData.basicInformation.destination?.coordinates?.latitude || 0}`,
    duration_hours: formData.basicInformation.duration?.hours || 2,
    duration_minutes: formData.basicInformation.duration?.minutes || 0,
    // difficulty_level: formData.basicInformation.difficultyLevel || 'EASY',
    // languages_supported: formData.basicInformation.languagesSupported || ['EN'],
    // tags: formData.basicInformation.tags || [],
    meeting_point_name: formData.activityDetails?.meetingPoint?.name || '',
    meeting_point_address: formData.activityDetails?.meetingPoint?.address || '',
    meeting_point_coordinates: `${formData.activityDetails?.meetingPoint?.coordinates?.longitude || 0},${formData.activityDetails?.meetingPoint?.coordinates?.latitude || 0}`,
    meeting_point_instructions: formData.activityDetails?.meetingPoint?.instructions || null,
    operating_days: formData.activityDetails?.operationalHours?.operatingDays || [],
    whats_included: formData.activityDetails?.whatsIncluded || [],
    whats_not_included: formData.activityDetails?.whatsNotIncluded || [],
    what_to_bring: formData.activityDetails?.whatToBring || [],
    important_information: formData.activityDetails?.importantInformation || null,
    minimum_age: formData.policiesRestrictions?.ageRestrictions?.minimumAge || 0,
    maximum_age: formData.policiesRestrictions?.ageRestrictions?.maximumAge || null,
    child_policy: formData.policiesRestrictions?.ageRestrictions?.childPolicy || null,
    infant_policy: formData.policiesRestrictions?.ageRestrictions?.infantPolicy || null,
    age_verification_required: formData.policiesRestrictions?.ageRestrictions?.ageVerificationRequired || false,
    wheelchair_accessible: formData.policiesRestrictions?.accessibility?.wheelchairAccessible || false,
    accessibility_facilities: formData.policiesRestrictions?.accessibility?.facilities || [],
    special_assistance: formData.policiesRestrictions?.accessibility?.specialAssistance || null,
    cancellation_policy_type: formData.policiesRestrictions?.cancellationPolicy?.type || 'MODERATE',
    cancellation_policy_custom: formData.policiesRestrictions?.cancellationPolicy?.customPolicy || null,
    cancellation_refund_percentage: formData.policiesRestrictions?.cancellationPolicy?.refundPercentage || 80,
    cancellation_deadline_hours: formData.policiesRestrictions?.cancellationPolicy?.cancellationDeadline || 24,
    weather_policy: formData.policiesRestrictions?.weatherPolicy || null,
    health_safety_requirements: (formData.policiesRestrictions?.healthSafety?.requirements || []) as any,
    health_safety_additional_info: formData.policiesRestrictions?.healthSafety?.additionalInfo || null,
    base_price: formData.pricing?.basePrice || 0,
    currency: formData.pricing?.currency || 'USD',
    price_type: formData.pricing?.priceType || 'PERSON',
    child_price_type: formData.pricing?.childPrice?.type || null,
    child_price_value: formData.pricing?.childPrice?.value || null,
    infant_price: formData.pricing?.infantPrice || null,
    group_discounts: (formData.pricing?.groupDiscounts || []) as any,
    seasonal_pricing: (formData.pricing?.seasonalPricing || []) as any,
    dynamic_pricing_enabled: formData.pricing?.dynamicPricing?.enabled || false,
    dynamic_pricing_base_multiplier: formData.pricing?.dynamicPricing?.baseMultiplier || 1.0,
    dynamic_pricing_demand_multiplier: formData.pricing?.dynamicPricing?.demandMultiplier || 1.0,
    dynamic_pricing_season_multiplier: formData.pricing?.dynamicPricing?.seasonMultiplier || 1.0,
  };

  const images: ActivityPackageImageInsert[] = [
    ...(formData.basicInformation?.imageGallery || []),
    ...(formData.activityDetails?.meetingPoint?.images || []),
    ...(formData.packageVariants?.variants?.flatMap(v => v.images || []) || []),
  ].map((img, index) => ({
    package_id: '', // Will be set by the service
    file_name: img.fileName || '',
    file_size: img.fileSize || 0,
    mime_type: img.mimeType || 'image/jpeg',
    storage_path: img.url || '', // Keep the full URL (base64 or file path)
    public_url: img.url?.startsWith('data:') ? '' : img.url || '', // Only set public_url for non-base64
    alt_text: img.fileName || '',
    is_cover: img.isCover || false,
    is_featured: img.isCover || false,
    display_order: index,
  }));

  const timeSlots: ActivityPackageTimeSlotInsert[] = (formData.activityDetails?.operationalHours?.timeSlots || []).map(slot => ({
    package_id: '', // Will be set by the service
    start_time: slot.startTime || '09:00',
    end_time: slot.endTime || '17:00',
    capacity: slot.capacity || 1,
    is_active: slot.isActive !== undefined ? slot.isActive : true,
    days: slot.days || [],
  }));

  const variants: ActivityPackageVariantInsert[] = (formData.packageVariants?.variants || []).map((variant, index) => ({
    package_id: '', // Will be set by the service
    name: variant.name || '',
    description: variant.description || null,
    price_adjustment: variant.priceAdjustment || 0,
    features: variant.features || [],
    max_capacity: variant.maxCapacity || 1,
    is_active: variant.isActive !== undefined ? variant.isActive : true,
    display_order: index,
  }));

  const faqs: ActivityPackageFAQInsert[] = (formData.faq?.faqs || []).map((faq, index) => ({
    package_id: '', // Will be set by the service
    question: faq.question || '',
    answer: faq.answer || '',
    category: faq.category || 'GENERAL',
    display_order: index,
  }));

  return {
    package: packageData,
    images,
    time_slots: timeSlots,
    variants,
    faqs,
  };
}

/**
 * Convert database data to form format
 */
export function databaseToFormData(
  dbData: ActivityPackageWithRelations
): ActivityPackageFormData {
  // This would be the reverse conversion
  // Implementation depends on the exact structure needed
  // For now, returning a basic structure
  return {
    basicInformation: {
      title: dbData.title,
      shortDescription: dbData.short_description,
      fullDescription: dbData.full_description,
      destination: {
        name: dbData.destination_name,
        address: dbData.destination_address,
        coordinates: { latitude: 0, longitude: 0 }, // Would need to parse POINT
        city: dbData.destination_city,
        country: dbData.destination_country,
        postalCode: dbData.destination_postal_code || undefined,
      },
      duration: {
        hours: dbData.duration_hours,
        minutes: dbData.duration_minutes,
      },
      // difficultyLevel: dbData.difficulty_level,
      // languagesSupported: dbData.languages_supported,
      // tags: dbData.tags,
      featuredImage: dbData.images.find(img => img.is_cover) ? {
        id: dbData.images.find(img => img.is_cover)!.id,
        url: dbData.images.find(img => img.is_cover)!.public_url,
        fileName: dbData.images.find(img => img.is_cover)!.file_name,
        fileSize: dbData.images.find(img => img.is_cover)!.file_size,
        mimeType: dbData.images.find(img => img.is_cover)!.mime_type,
        isCover: true,
        order: dbData.images.find(img => img.is_cover)!.display_order,
        uploadedAt: new Date(dbData.images.find(img => img.is_cover)!.uploaded_at),
      } : null,
      imageGallery: dbData.images.map(img => ({
        id: img.id,
        url: img.public_url,
        fileName: img.file_name,
        fileSize: img.file_size,
        mimeType: img.mime_type,
        isCover: img.is_cover,
        order: img.display_order,
        uploadedAt: new Date(img.uploaded_at),
      })),
    },
    // ... other sections would be mapped similarly
    activityDetails: {
      operationalHours: {
        operatingDays: dbData.operating_days,
        timeSlots: dbData.time_slots.map(slot => ({
          id: slot.id,
          startTime: slot.start_time,
          endTime: slot.end_time,
          capacity: slot.capacity,
          isActive: slot.is_active,
          days: slot.days,
        })),
      },
      meetingPoint: {
        name: dbData.meeting_point_name,
        address: dbData.meeting_point_address,
        coordinates: { latitude: 0, longitude: 0 }, // Would need to parse POINT
        instructions: dbData.meeting_point_instructions || '',
        images: [],
      },
      whatToBring: dbData.what_to_bring,
      whatsIncluded: dbData.whats_included,
      whatsNotIncluded: dbData.whats_not_included,
        importantInformation: dbData.important_information || '',
    },
    packageVariants: {
      variants: dbData.variants.map(variant => ({
        id: variant.id,
        name: variant.name,
        description: variant.description || '',
        priceAdjustment: variant.price_adjustment,
        features: variant.features,
        maxCapacity: variant.max_capacity,
        images: [],
        isActive: variant.is_active,
        order: variant.display_order,
      })),
    },
    policiesRestrictions: {
      ageRestrictions: {
        minimumAge: dbData.minimum_age,
        maximumAge: dbData.maximum_age || undefined,
        childPolicy: dbData.child_policy || '',
        infantPolicy: dbData.infant_policy || '',
        ageVerificationRequired: dbData.age_verification_required,
      },
      accessibility: {
        wheelchairAccessible: dbData.wheelchair_accessible,
        facilities: dbData.accessibility_facilities,
        specialAssistance: dbData.special_assistance || '',
      },
      cancellationPolicy: {
        type: dbData.cancellation_policy_type,
        customPolicy: dbData.cancellation_policy_custom || '',
        refundPercentage: dbData.cancellation_refund_percentage,
        cancellationDeadline: dbData.cancellation_deadline_hours,
      },
      weatherPolicy: dbData.weather_policy || '',
      healthSafety: {
        requirements: dbData.health_safety_requirements as any,
        additionalInfo: dbData.health_safety_additional_info || '',
      },
    },
    faq: {
      faqs: dbData.faqs.map(faq => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        order: faq.display_order,
      })),
    },
    pricing: {
      basePrice: dbData.base_price,
      currency: dbData.currency,
      priceType: dbData.price_type,
      childPrice: dbData.child_price_type && dbData.child_price_value ? {
        type: dbData.child_price_type,
        value: dbData.child_price_value,
      } : undefined,
      infantPrice: dbData.infant_price || undefined,
      groupDiscounts: dbData.group_discounts as any,
      seasonalPricing: dbData.seasonal_pricing as any,
      dynamicPricing: {
        enabled: dbData.dynamic_pricing_enabled,
        baseMultiplier: dbData.dynamic_pricing_base_multiplier,
        demandMultiplier: dbData.dynamic_pricing_demand_multiplier,
        seasonMultiplier: dbData.dynamic_pricing_season_multiplier,
      },
    },
  };
}
