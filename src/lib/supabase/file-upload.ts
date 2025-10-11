/**
 * File Upload Service for Supabase Storage
 * Handles uploading files to Supabase Storage buckets
 */

import { createSupabaseBrowserClient, withErrorHandling, SupabaseError } from './client';

export interface FileUploadResult {
  data: {
    path: string;
    fullPath: string;
    publicUrl: string;
  } | null;
  error: SupabaseError | null;
}

export interface FileUploadOptions {
  bucket: string;
  folder?: string;
  fileName?: string;
  file: File;
  userId: string;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile({
  bucket,
  folder = '',
  fileName,
  file,
  userId
}: FileUploadOptions): Promise<FileUploadResult> {
  const supabase = createSupabaseBrowserClient();
  
  return withErrorHandling(async () => {
    // Check if user is authenticated before attempting upload
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Authentication required for file upload. Please log in again.');
    }

    // Generate unique filename if not provided
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const finalFileName = fileName || `${timestamp}_${randomId}.${fileExtension}`;
    
    // Create the file path: userId/folder/filename
    const filePath = folder ? `${userId}/${folder}/${finalFileName}` : `${userId}/${finalFileName}`;
    
    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      // Handle specific authentication errors
      if (uploadError.message?.includes('Invalid Refresh Token') || uploadError.message?.includes('JWT')) {
        throw new Error('Your session has expired. Please refresh the page and log in again.');
      }
      throw uploadError;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      data: {
        path: filePath,
        fullPath: uploadData.path,
        publicUrl: urlData.publicUrl
      },
      error: null
    };
  });
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<{ data: boolean | null; error: SupabaseError | null }> {
  const supabase = createSupabaseBrowserClient();
  
  return withErrorHandling(async () => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return { data: true, error: null };
  });
}

/**
 * Convert base64 data URL to File object
 */
export function base64ToFile(base64DataUrl: string, fileName: string): File {
  // Extract the base64 data and mime type
  const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 data URL');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  
  if (!base64Data) {
    throw new Error('No base64 data found');
  }
  
  // Convert base64 to binary
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  
  // Create File object
  return new File([byteArray], fileName, { type: mimeType });
}

/**
 * Upload multiple files to Supabase Storage
 */
export async function uploadMultipleFiles(
  files: File[],
  bucket: string,
  folder: string,
  userId: string
): Promise<FileUploadResult[]> {
  const uploadPromises = files.map(file => 
    uploadFile({
      bucket,
      folder,
      file,
      userId
    })
  );

  return Promise.all(uploadPromises);
}

/**
 * Process and upload image files with validation
 */
export async function uploadImageFiles(
  imageFiles: File[],
  userId: string,
  folder: string = 'activity-packages'
): Promise<FileUploadResult[]> {
  // Validate file types
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const validFiles = imageFiles.filter(file => validTypes.includes(file.type));
  
  if (validFiles.length !== imageFiles.length) {
    throw new Error('Some files are not valid image types');
  }

  // Validate file sizes (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  const sizeValidFiles = validFiles.filter(file => file.size <= maxSize);
  
  if (sizeValidFiles.length !== validFiles.length) {
    throw new Error('Some files exceed the 10MB size limit');
  }

  return uploadMultipleFiles(sizeValidFiles, 'activity-packages', folder, userId);
}
