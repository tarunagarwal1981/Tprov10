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
  return withErrorHandling(async () => {
    // First, upload any base64 images to storage
    const finalImages: ActivityPackageImageInsert[] = [];
    
    if (data.images && data.images.length > 0) {
      console.log('📸 [createActivityPackage] Processing images', {
        totalImages: data.images.length,
        images: data.images.map(img => ({
          file_name: img.file_name,
          storage_path_preview: img.storage_path?.substring(0, 50) + '...',
          public_url_preview: img.public_url?.substring(0, 50) + '...',
          is_base64: img.storage_path?.startsWith('data:'),
          has_public_url: !!img.public_url,
        }))
      });
      
      // Separate base64 images from already uploaded images
      // Base64 images: storage_path starts with 'data:'
      // Already uploaded: have public_url OR storage_path is a URL/path (not base64)
      const base64Images = data.images.filter(img => img.storage_path?.startsWith('data:'));
      const alreadyUploadedImages = data.images.filter(img => {
        const isNotBase64 = !img.storage_path?.startsWith('data:');
        const hasPublicUrl = !!img.public_url;
        const isUrlOrPath = img.storage_path && (
          img.storage_path.startsWith('http://') || 
          img.storage_path.startsWith('https://') || 
          img.storage_path.startsWith('/') ||
          img.storage_path.includes('s3') ||
          img.storage_path.includes('amazonaws')
        );
        return isNotBase64 && (hasPublicUrl || isUrlOrPath);
      });
      
      console.log('🔍 [createActivityPackage] Image separation', {
        base64Count: base64Images.length,
        alreadyUploadedCount: alreadyUploadedImages.length,
      });
      
      if (base64Images.length > 0) {
        // Convert base64 to files and upload via API route (server-side)
        const uploadResults = await Promise.all(
          base64Images.map(async (img) => {
            const fileName = img.file_name || `image_${Date.now()}.jpg`;
            const file = base64ToFile(img.storage_path!, fileName);
            
            // Create form data for API upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', `activity-packages-images/${userId}`);
            formData.append('fileName', fileName);
            
            // Upload via API route (server-side has AWS credentials)
            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            
            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json();
              throw new Error(errorData.error || 'Upload failed');
            }
            
            const uploadData = await uploadResponse.json();
            return {
              data: {
                path: uploadData.data.path,
                publicUrl: uploadData.data.publicUrl,
              },
              error: null,
            };
          })
        );
        
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
 * Get activity package by ID with all relations from RDS
 */
export async function getActivityPackage(
  id: string
): Promise<{ data: ActivityPackageWithRelations | null; error: SupabaseError | null }> {
  return withErrorHandling(async () => {
    // Use API route for RDS database operations
    const response = await fetch(`/api/operator/packages/activity/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { data: null, error: null };
      }
      const errorData = await response.json();
      const errorMessage = errorData.error || 'Failed to fetch package';
      throw new Error(errorMessage);
    }

    const apiResult = await response.json();
    return { data: apiResult.data || null, error: null };
  });
}

/**
 * Update activity package
 */
export async function updateActivityPackage(
  id: string,
  data: UpdateActivityPackageData,
  userId?: string // Optional userId parameter - if not provided, will try to fetch it
): Promise<{ data: ActivityPackageWithRelations | null; error: SupabaseError | null }> {
  console.log('🔄 [updateActivityPackage] Starting update', {
    packageId: id,
    hasImages: !!data.images,
    imageCount: data.images?.length || 0,
    userIdProvided: !!userId
  });
  
  return withErrorHandling(async () => {
    // Get the operator ID - prefer provided userId, then package data, then fetch from API
    let operatorId = userId || '';
    
    if (!operatorId && data.package?.operator_id) {
      operatorId = data.package.operator_id;
      console.log('👤 [updateActivityPackage] Using userId from package data');
    }
    
    if (!operatorId) {
      // Try to fetch from API as last resort
      try {
        const getResponse = await fetch(`/api/operator/packages/activity/${id}`);
        if (getResponse.ok) {
          const existing = await getResponse.json();
          operatorId = existing.data?.operator_id || '';
          console.log('👤 [updateActivityPackage] Fetched userId from API:', operatorId ? 'Found' : 'Missing');
        } else {
          console.warn('⚠️ [updateActivityPackage] Failed to fetch package for userId');
        }
      } catch (e) {
        console.warn('⚠️ [updateActivityPackage] Could not fetch operator_id for image uploads:', e);
      }
    }

    if (!operatorId) {
      console.error('❌ [updateActivityPackage] No userId available - image uploads will fail!');
    } else {
      console.log('✅ [updateActivityPackage] Using userId:', operatorId.substring(0, 8) + '...');
    }

    // Process images first - upload any base64 images to storage
    const finalImages: ActivityPackageImageInsert[] = [];
    
    if (data.images && data.images.length > 0) {
      console.log('📸 [updateActivityPackage] Processing images', {
        totalImages: data.images.length,
        images: data.images.map(img => ({
          file_name: img.file_name,
          storage_path_preview: img.storage_path?.substring(0, 50) + '...',
          public_url_preview: img.public_url?.substring(0, 50) + '...',
          is_base64: img.storage_path?.startsWith('data:'),
          has_public_url: !!img.public_url,
          is_cover: img.is_cover
        }))
      });
      
      // Separate base64 images from already uploaded images
      // Base64 images: storage_path starts with 'data:'
      // Already uploaded: have public_url OR storage_path is a URL/path (not base64)
      const base64Images = data.images.filter(img => img.storage_path?.startsWith('data:'));
      const alreadyUploadedImages = data.images.filter(img => {
        // Not base64 AND (has public_url OR storage_path is a valid URL/path)
        const isNotBase64 = !img.storage_path?.startsWith('data:');
        const hasPublicUrl = !!img.public_url;
        const isUrlOrPath = img.storage_path && (
          img.storage_path.startsWith('http://') || 
          img.storage_path.startsWith('https://') || 
          img.storage_path.startsWith('/') ||
          img.storage_path.includes('s3') ||
          img.storage_path.includes('amazonaws')
        );
        return isNotBase64 && (hasPublicUrl || isUrlOrPath);
      });
      
      console.log('🔍 [updateActivityPackage] Image separation', {
        base64Count: base64Images.length,
        alreadyUploadedCount: alreadyUploadedImages.length,
        base64Files: base64Images.map(img => img.file_name),
        uploadedFiles: alreadyUploadedImages.map(img => img.file_name)
      });
      
      if (base64Images.length > 0) {
        if (!operatorId) {
          console.error('❌ [updateActivityPackage] Cannot upload images - userId is missing!');
          throw new Error('User ID is required for image uploads');
        }
        
        console.log('📤 [updateActivityPackage] Uploading base64 images to storage', {
          count: base64Images.length,
          userId: operatorId.substring(0, 8) + '...'
        });
        
        // Convert base64 to files and upload via API route (server-side)
        const uploadResults = await Promise.all(
          base64Images.map(async (img) => {
            const fileName = img.file_name || `image_${Date.now()}.jpg`;
            const file = base64ToFile(img.storage_path!, fileName);
            
            // Create form data for API upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', `activity-packages-images/${operatorId}/${id}`);
            formData.append('fileName', fileName);
            
            // Upload via API route (server-side has AWS credentials)
            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            
            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json();
              throw new Error(errorData.error || 'Upload failed');
            }
            
            const uploadData = await uploadResponse.json();
            return {
              data: {
                path: uploadData.data.path,
                publicUrl: uploadData.data.publicUrl,
              },
              error: null,
            };
          })
        );
        
        // Check for upload errors
        const failedUploads = uploadResults.filter(r => r.error || !r.data);
        if (failedUploads.length > 0) {
          console.error('❌ [updateActivityPackage] Some image uploads failed:', failedUploads);
          throw new Error(`Failed to upload ${failedUploads.length} image(s): ${failedUploads[0]?.error?.message || 'Unknown error'}`);
        }
        
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
  const result = await withErrorHandling(async () => {
    // Use API route for RDS database operations
    const response = await fetch('/api/operator/packages/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId: id,
        packageType: 'Activity',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || 'Failed to delete package';
      throw new Error(errorMessage);
    }

    return { data: true, error: null };
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
      bucket: 'activity-packages-images',
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
      await deleteFile('activity-packages-images', uploadResult.data.path);
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
    const deleteResult = await deleteFile('activity-packages-images', image.storage_path);

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
    // These fields are not used in UI - set to defaults
    difficulty_level: 'EASY', // Not editable in UI
    languages_supported: ['EN'], // Not editable in UI
    tags: [], // Not editable in UI
    meeting_point_name: formData.activityDetails?.meetingPoint?.name || '',
    meeting_point_address: formData.activityDetails?.meetingPoint?.address || '',
    meeting_point_coordinates: `${formData.activityDetails?.meetingPoint?.coordinates?.longitude || 0},${formData.activityDetails?.meetingPoint?.coordinates?.latitude || 0}`,
    meeting_point_instructions: formData.activityDetails?.meetingPoint?.instructions || null,
    operating_days: formData.activityDetails?.operationalHours?.operatingDays || [],
    whats_included: formData.activityDetails?.whatsIncluded || [],
    whats_not_included: formData.activityDetails?.whatsNotIncluded || [],
    what_to_bring: formData.activityDetails?.whatToBring || [],
    important_information: formData.activityDetails?.importantInformation || null,
    // Policies fields are not used in UI - set to defaults
    minimum_age: 0, // Not editable in UI
    maximum_age: null, // Not editable in UI
    child_policy: null, // Not editable in UI
    infant_policy: null, // Not editable in UI
    age_verification_required: false, // Not editable in UI
    wheelchair_accessible: false, // Not editable in UI
    accessibility_facilities: [], // Not editable in UI
    special_assistance: null, // Not editable in UI
    cancellation_policy_type: 'MODERATE', // Not editable in UI
    cancellation_policy_custom: null, // Not editable in UI
    cancellation_refund_percentage: 80, // Not editable in UI
    cancellation_deadline_hours: 24, // Not editable in UI
    weather_policy: null, // Not editable in UI
    health_safety_requirements: [] as any, // Not editable in UI
    health_safety_additional_info: null, // Not editable in UI
    // Old pricing fields are not used in UI - pricing is handled through pricingOptions
    // Set to defaults
    base_price: 0, // Not editable in UI - pricing uses pricingOptions instead
    currency: formData.pricing?.currency || 'USD', // Only currency is used
    price_type: 'PERSON', // Not editable in UI
    child_price_type: null, // Not editable in UI
    child_price_value: null, // Not editable in UI
    infant_price: null, // Not editable in UI
    group_discounts: [] as any, // Not editable in UI
    seasonal_pricing: [] as any, // Not editable in UI
    dynamic_pricing_enabled: false, // Not editable in UI
    // Dynamic pricing multipliers are INTEGER in DB (multiply by 100 for precision)
    dynamic_pricing_base_multiplier: 100, // Default 1.0 = 100, not editable in UI
    dynamic_pricing_demand_multiplier: 100, // Default 1.0 = 100, not editable in UI
    dynamic_pricing_season_multiplier: 100, // Default 1.0 = 100, not editable in UI
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
  ].map((img, index) => {
    const isBase64 = img.url?.startsWith('data:');
    const isUrl = img.url && !isBase64 && (img.url.startsWith('http://') || img.url.startsWith('https://') || img.url.startsWith('/'));
    
    return {
      package_id: '', // Will be set by the service
      file_name: img.fileName || '',
      file_size: img.fileSize || 0,
      mime_type: img.mimeType || 'image/jpeg',
      storage_path: img.url || '', // Keep the full URL (base64, http/https URL, or S3 path)
      public_url: isBase64 ? '' : (img.url || ''), // Only set public_url for non-base64 (URLs or S3 paths)
      alt_text: img.fileName || '',
      is_cover: img.isCover || false,
      is_featured: img.isCover || false,
      display_order: index,
    };
  });

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
      // Note: difficultyLevel, languagesSupported, and tags are not used in UI
      // They exist in DB but are ignored when loading form data
      featuredImage: (() => {
        const coverImage = dbData.images.find(img => img.is_cover);
        if (!coverImage) {
          console.log('⚠️ [databaseToFormData] No cover image found');
          return null;
        }
        if (!coverImage.public_url) {
          console.log('⚠️ [databaseToFormData] Cover image missing public_url:', {
            file_name: coverImage.file_name,
            storage_path: coverImage.storage_path?.substring(0, 60),
            id: coverImage.id,
          });
          return null;
        }
        console.log('🖼️ [databaseToFormData] Featured image:', {
          file_name: coverImage.file_name,
          url: coverImage.public_url, // Full URL
          url_length: coverImage.public_url.length,
          url_preview: coverImage.public_url.length > 150 ? coverImage.public_url.substring(0, 150) + '...' : coverImage.public_url,
          is_presigned: coverImage.public_url.includes('?X-Amz'),
          has_query_params: coverImage.public_url.includes('?'),
          storage_path: coverImage.storage_path?.substring(0, 60),
        });
        return {
          id: coverImage.id,
          url: coverImage.public_url,
          fileName: coverImage.file_name,
          fileSize: coverImage.file_size,
          mimeType: coverImage.mime_type,
          isCover: true,
          order: coverImage.display_order,
          uploadedAt: new Date(coverImage.uploaded_at),
        };
      })(),
      imageGallery: dbData.images
        .filter(img => {
          // Skip images with base64 in storage_path (corrupted data)
          const isBase64Storage = img.storage_path && img.storage_path.startsWith('data:');
          if (isBase64Storage) {
            console.warn('⚠️ [databaseToFormData] Skipping image with base64 in storage_path:', {
              id: img.id,
              file_name: img.file_name,
              storage_path_preview: img.storage_path?.substring(0, 60),
            });
            return false;
          }
          const hasUrl = !!img.public_url && !img.public_url.startsWith('data:');
          if (!hasUrl) {
            console.log('⚠️ [databaseToFormData] Image missing valid public_url:', {
              file_name: img.file_name,
              public_url: img.public_url?.substring(0, 60),
              storage_path: img.storage_path?.substring(0, 60),
            });
          }
          return hasUrl;
        })
        .map(img => {
          console.log('🖼️ [databaseToFormData] Gallery image:', {
            file_name: img.file_name,
            url: img.public_url, // Full URL
            url_length: img.public_url?.length || 0,
            url_preview: img.public_url ? (img.public_url.length > 150 ? img.public_url.substring(0, 150) + '...' : img.public_url) : 'MISSING',
            is_presigned: img.public_url?.includes('?X-Amz'),
            has_query_params: img.public_url?.includes('?'),
            storage_path: img.storage_path?.substring(0, 60),
          });
          return {
            id: img.id,
            url: img.public_url!,
            fileName: img.file_name,
            fileSize: img.file_size,
            mimeType: img.mime_type,
            isCover: img.is_cover,
            order: img.display_order,
            uploadedAt: new Date(img.uploaded_at),
          };
        }),
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
    // Policies are not used in UI - tab is commented out
    // policiesRestrictions: undefined,
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
      // Only currency is used in UI - all other pricing fields are ignored
      // Pricing is managed through pricingOptions instead
      currency: dbData.currency,
      // Note: basePrice, priceType, childPrice, infantPrice, groupDiscounts,
      // seasonalPricing, and dynamicPricing exist in DB but are not used in UI
    },
  };
}
