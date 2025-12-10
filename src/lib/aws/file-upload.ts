/**
 * AWS S3 File Upload Service
 * Replaces Supabase Storage file upload functionality
 * 
 * This module provides a compatible interface with the old Supabase upload
 * to minimize changes in consuming components.
 */

import { uploadFile as s3UploadFile, getPublicUrl, deleteFile as s3DeleteFile } from './s3-upload';

export interface FileUploadResult {
  data: {
    path: string;
    fullPath: string;
    publicUrl: string;
  } | null;
  error: Error | null;
}

export interface FileUploadOptions {
  bucket: string; // S3 folder (maps to bucket name for compatibility)
  folder?: string;
  fileName?: string;
  file: File;
  userId: string;
}

/**
 * Upload a file to S3
 * Compatible interface with Supabase uploadFile
 */
export async function uploadFile({
  bucket,
  folder = '',
  fileName,
  file,
  userId
}: FileUploadOptions): Promise<FileUploadResult> {
  try {
    // Create S3 folder path: bucket/userId/folder/filename
    const s3Folder = folder 
      ? `${bucket}/${userId}/${folder}` 
      : `${bucket}/${userId}`;

    // Upload to S3
    const result = await s3UploadFile(
      file,
      s3Folder,
      fileName,
      file.type
    );

    return {
      data: {
        path: result.path,
        fullPath: result.key,
        publicUrl: result.publicUrl,
      },
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(error.message || 'Upload failed'),
    };
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<{ data: boolean | null; error: Error | null }> {
  try {
    // S3 key is the full path
    const key = filePath.startsWith(bucket) ? filePath : `${bucket}/${filePath}`;
    await s3DeleteFile(key);

    return { data: true, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(error.message || 'Delete failed'),
    };
  }
}

/**
 * Convert base64 data URL to File object
 */
export function base64ToFile(base64DataUrl: string, fileName: string): File {
  const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 data URL');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  
  if (!base64Data) {
    throw new Error('No base64 data found');
  }
  
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], fileName, { type: mimeType });
}

/**
 * Upload multiple files to S3
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
  folder: string = 'activity-packages',
  bucket: string = 'activity-package-images'
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

  return uploadMultipleFiles(sizeValidFiles, bucket, folder, userId);
}

