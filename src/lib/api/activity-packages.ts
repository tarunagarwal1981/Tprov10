/**
 * Activity Packages API Service
 * Wrapper for API routes - no Supabase dependencies
 */

import type { ActivityPackageFormData } from '@/lib/types/activity-package';

// Re-export transformation functions from supabase file (they don't use Supabase)
export { formDataToDatabase, databaseToFormData } from '@/lib/supabase/activity-packages';

export interface CreateActivityPackageData {
  package: any;
  images?: any[];
  time_slots?: any[];
  variants?: any[];
  faqs?: any[];
}

export interface UpdateActivityPackageData {
  package: any;
  images?: any[];
  time_slots?: any[];
  variants?: any[];
  faqs?: any[];
}

export interface ActivityPackageWithRelations {
  id: string;
  [key: string]: any;
}

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
}

/**
 * Create a new activity package using API route
 */
export async function createActivityPackage(
  data: CreateActivityPackageData,
  userId: string
): Promise<{ data: ActivityPackageWithRelations | null; error: SupabaseError | null }> {
  try {
    const response = await fetch('/api/operator/packages/activity/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: { ...data.package, operator_id: userId },
        images: data.images || [],
        time_slots: data.time_slots || [],
        variants: data.variants || [],
        faqs: data.faqs || [],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        data: null,
        error: {
          message: errorData.error || 'Failed to create package',
          details: errorData.details,
        },
      };
    }

    const apiResult = await response.json();
    const packageId = apiResult.data?.id || apiResult.package?.id;

    if (!packageId) {
      return {
        data: null,
        error: { message: 'Failed to get package ID from API' },
      };
    }

    const result: ActivityPackageWithRelations = {
      id: packageId,
      ...data.package,
      images: data.images || [],
      time_slots: data.time_slots || [],
      variants: data.variants || [],
      faqs: data.faqs || [],
    };

    return { data: result, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.message || 'Failed to create package',
      },
    };
  }
}

/**
 * Update activity package using API route
 * Handles base64 image uploads to S3 before saving to database
 */
export async function updateActivityPackage(
  id: string,
  data: UpdateActivityPackageData,
  userId?: string // Optional userId parameter - required for image uploads
): Promise<{ data: ActivityPackageWithRelations | null; error: SupabaseError | null }> {
  try {
    console.log('🔄 [updateActivityPackage] Starting update', {
      packageId: id,
      hasImages: !!data.images,
      imageCount: data.images?.length || 0,
      userIdProvided: !!userId
    });

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
    const finalImages: any[] = [];
    
    if (data.images && data.images.length > 0) {
      console.log('📸 [updateActivityPackage] Processing images', {
        totalImages: data.images.length,
        images: data.images.map((img: any) => ({
          file_name: img.file_name,
          storage_path_preview: img.storage_path?.substring(0, 50) + '...',
          public_url_preview: img.public_url?.substring(0, 50) + '...',
          is_base64: img.storage_path?.startsWith('data:'),
          has_public_url: !!img.public_url,
          is_cover: img.is_cover
        }))
      });
      
      // Separate base64 images from already uploaded images
      const base64Images = data.images.filter((img: any) => img.storage_path?.startsWith('data:'));
      const alreadyUploadedImages = data.images.filter((img: any) => {
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
        base64Files: base64Images.map((img: any) => img.file_name),
        uploadedFiles: alreadyUploadedImages.map((img: any) => img.file_name)
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
        
        // Import base64ToFile for conversion
        const { base64ToFile } = await import('@/lib/aws/file-upload');
        
        // Convert base64 to files and upload via API route (server-side)
        const uploadResults = await Promise.all(
          base64Images.map(async (img: any) => {
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
      finalImages.push(...alreadyUploadedImages.map((img: any) => ({ ...img, package_id: id })));
      
      console.log('🎯 [updateActivityPackage] Final images ready', {
        finalImageCount: finalImages.length,
        finalImages: finalImages.map((img: any) => ({
          file_name: img.file_name,
          storage_path: img.storage_path,
          public_url: img.public_url?.substring(0, 50) + '...',
          is_cover: img.is_cover
        }))
      });
    }

    // Use API route for database operations
    const response = await fetch('/api/operator/packages/activity/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId: id,
        package: data.package,
        images: finalImages.length > 0 ? finalImages : data.images, // Use finalImages if we processed any, otherwise use provided images
        time_slots: data.time_slots || [],
        variants: data.variants || [],
        faqs: data.faqs || [],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        data: null,
        error: {
          message: errorData.error || 'Failed to update package',
          details: errorData.details,
        },
      };
    }

    const apiResult = await response.json();
    const result: ActivityPackageWithRelations = {
      id,
      ...data.package,
      images: finalImages.length > 0 ? finalImages : (data.images || []),
      time_slots: data.time_slots || [],
      variants: data.variants || [],
      faqs: data.faqs || [],
    };

    return { data: result, error: null };
  } catch (error: any) {
    console.error('❌ [updateActivityPackage] Error:', error);
    return {
      data: null,
      error: {
        message: error.message || 'Failed to update package',
      },
    };
  }
}

/**
 * Get activity package by ID
 */
export async function getActivityPackage(
  id: string
): Promise<{ data: ActivityPackageWithRelations | null; error: SupabaseError | null }> {
  try {
    console.log('📥 [getActivityPackage] Fetching package:', id);
    const response = await fetch(`/api/operator/packages/activity/${id}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [getActivityPackage] API error:', errorData);
      return {
        data: null,
        error: {
          message: errorData.error || 'Failed to fetch package',
        },
      };
    }

    const apiResult = await response.json();
    const packageData = apiResult.package || apiResult.data;
    
    console.log('✅ [getActivityPackage] Package received:', {
      id: packageData?.id,
      title: packageData?.title,
      imageCount: packageData?.images?.length || 0,
      images: packageData?.images?.map((img: any) => ({
        id: img.id,
        file_name: img.file_name,
        public_url: img.public_url, // Full URL
        public_url_length: img.public_url?.length || 0,
        public_url_preview: img.public_url ? (img.public_url.length > 100 ? img.public_url.substring(0, 100) + '...' : img.public_url) : 'MISSING',
        storage_path: img.storage_path?.substring(0, 80),
        is_presigned: img.public_url?.includes('?X-Amz'),
        is_cover: img.is_cover,
        has_public_url: !!img.public_url,
      }))
    });
    
    return { data: packageData, error: null };
  } catch (error: any) {
    console.error('❌ [getActivityPackage] Error:', error);
    return {
      data: null,
      error: {
        message: error.message || 'Failed to fetch package',
      },
    };
  }
}
