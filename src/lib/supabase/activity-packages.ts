/**
 * Activity Packages Supabase Service
 * Handles all CRUD operations for activity packages with gallery support
 */

import { createSupabaseBrowserClient, withErrorHandling, SupabaseError } from './client';
// TODO: Migrate to S3 - temporarily keeping Supabase for compatibility
// import { uploadImageFiles, base64ToFile, deleteFile } from './file-upload';
import { uploadImageFiles, base64ToFile, deleteFile } from '@/lib/aws/file-upload';
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

    // Use API route for database operations instead of Supabase
    const response = await fetch('/api/operator/packages/activity/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: data.package,
        images: finalImages,
        time_slots: data.time_slots,
        variants: data.variants,
        faqs: data.faqs,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || 'Failed to create package';
      throw new Error(errorMessage);
    }

    const apiResult = await response.json();
    const packageId = apiResult.data?.id;

    if (!packageId) {
      throw new Error('Failed to get package ID from API');
    }

    // Return a result structure compatible with the expected format
    const result: ActivityPackageWithRelations = {
      id: packageId,
      ...data.package,
      images: finalImages as any,
      time_slots: data.time_slots || [],
      variants: data.variants || [],
      faqs: data.faqs || [],
    } as any;

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
  
  console.log('🔄 [updateActivityPackage] Starting update', {
    packageId: id,
    hasImages: !!data.images,
    imageCount: data.images?.length || 0
  });
  
  return withErrorHandling(async () => {
    // Get the operator ID from the package (using API route)
    let userId = '';
    try {
      const getResponse = await fetch(`/api/operator/packages/activity/${id}`);
      if (getResponse.ok) {
        const existing = await getResponse.json();
        userId = existing.data?.operator_id || '';
      }
    } catch (e) {
      console.warn('Could not fetch operator_id for image uploads:', e);
    }

    // Process images first - upload any base64 images to storage
    const finalImages: ActivityPackageImageInsert[] = [];
    
    if (data.images && data.images.length > 0) {
      console.log('📸 [updateActivityPackage] Processing images', {
        totalImages: data.images.length,
        images: data.images.map(img => ({
          file_name: img.file_name,
          storage_path_preview: img.storage_path?.substring(0, 50) + '...',
          is_base64: img.storage_path?.startsWith('data:'),
          is_cover: img.is_cover
        }))
      });
      
      // Separate base64 images from already uploaded images
      const base64Images = data.images.filter(img => img.storage_path?.startsWith('data:'));
      const alreadyUploadedImages = data.images.filter(img => !img.storage_path?.startsWith('data:'));
      
      console.log('🔍 [updateActivityPackage] Image separation', {
        base64Count: base64Images.length,
        alreadyUploadedCount: alreadyUploadedImages.length
      });
      
      if (base64Images.length > 0) {
        console.log('📤 [updateActivityPackage] Uploading base64 images to storage', {
          count: base64Images.length
        });
        
        // Convert base64 to files and upload
        const files = base64Images.map(img => {
          const fileName = img.file_name || `image_${Date.now()}.jpg`;
          return base64ToFile(img.storage_path!, fileName);
        });
        
        const uploadResults = await uploadImageFiles(files, userId, 'activity-packages-images');
        
        console.log('✅ [updateActivityPackage] Upload complete', {
          uploadCount: uploadResults.length,
          results: uploadResults.map(r => ({
            path: r.data?.path,
            publicUrl: r.data?.publicUrl?.substring(0, 50) + '...'
          }))
        });
        
        // Create image records with proper storage paths
        const newImageRecords = uploadResults.map((result, index) => {
          const base64Image = base64Images[index];
          return {
            package_id: id,
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
      
      // Add already uploaded images with package_id
      finalImages.push(...alreadyUploadedImages.map(img => ({ ...img, package_id: id })));
      
      console.log('🎯 [updateActivityPackage] Final images ready', {
        finalImageCount: finalImages.length,
        finalImages: finalImages.map(img => ({
          file_name: img.file_name,
          storage_path: img.storage_path,
          public_url: img.public_url?.substring(0, 50) + '...',
          is_cover: img.is_cover
        }))
      });
    }

    // Use API route for database operations instead of Supabase
    const response = await fetch('/api/operator/packages/activity/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId: id,
        package: data.package,
        images: finalImages.length > 0 ? finalImages : data.images, // Use finalImages if we processed any, otherwise use provided images
        time_slots: data.time_slots,
        variants: data.variants,
        faqs: data.faqs,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update package');
    }

    const apiResult = await response.json();
    
    // Return a result structure compatible with the expected format
    const result: ActivityPackageWithRelations = {
      id,
      ...data.package,
      images: finalImages.length > 0 ? finalImages as any : (data.images || []),
      time_slots: data.time_slots || [],
      variants: data.variants || [],
      faqs: data.faqs || [],
    } as any;

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

    const userId = session.user.id;

    // Upload file to S3 using AWS file upload service
    const { uploadFile } = await import('@/lib/aws/file-upload');
    const uploadResult = await uploadFile({
      bucket: 'activity-package-images',
      folder: packageId,
      file,
      userId,
    });

    if (uploadResult.error || !uploadResult.data) {
      throw uploadResult.error || new Error('Upload failed');
    }

    // Create image record in database (using RDS via Supabase client for now)
    const imageData: ActivityPackageImageInsert = {
      package_id: packageId,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: uploadResult.data.path,
      public_url: uploadResult.data.publicUrl,
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
      const { deleteFile } = await import('@/lib/aws/file-upload');
      await deleteFile('activity-package-images', uploadResult.data.path);
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

    // Delete from S3 storage
    const { deleteFile } = await import('@/lib/aws/file-upload');
    const deleteResult = await deleteFile('activity-package-images', image.storage_path);

    if (deleteResult.error) {
      return { data: null, error: deleteResult.error };
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
  operatorId: string,
  status: 'draft' | 'published' | 'archived' | 'suspended' = 'draft'
): CreateActivityPackageData {
  const packageData: ActivityPackageInsert = {
    operator_id: operatorId,
    title: formData.basicInformation.title || '',
    short_description: formData.basicInformation.shortDescription || '',
    full_description: formData.basicInformation.fullDescription || '',
    status: status,
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

  console.log('📦 [formDataToDatabase] Processing images', {
    imageGalleryCount: formData.basicInformation?.imageGallery?.length || 0,
    imageGallery: formData.basicInformation?.imageGallery?.map(img => ({
      fileName: img.fileName,
      url: img.url?.substring(0, 50) + '...',
      isCover: img.isCover
    })),
    featuredImage: formData.basicInformation?.featuredImage ? {
      fileName: formData.basicInformation.featuredImage.fileName,
      url: formData.basicInformation.featuredImage.url?.substring(0, 50) + '...',
      isCover: formData.basicInformation.featuredImage.isCover
    } : null
  });

  const images: ActivityPackageImageInsert[] = [
    ...(formData.basicInformation?.featuredImage ? [formData.basicInformation.featuredImage] : []),
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

  console.log('✅ [formDataToDatabase] Images transformed', {
    totalImages: images.length,
    images: images.map(img => ({
      file_name: img.file_name,
      storage_path: img.storage_path?.substring(0, 50) + '...',
      is_cover: img.is_cover,
      is_featured: img.is_featured
    }))
  });

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
