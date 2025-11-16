/**
 * AWS S3 Storage Library
 * Drop-in replacement for Supabase Storage
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Configuration
const config = {
  region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
  bucket: process.env.S3_BUCKET_NAME || process.env.NEXT_PUBLIC_S3_BUCKET_NAME || "",
  cloudFrontDomain: process.env.CLOUDFRONT_DOMAIN || process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || "",
};

const s3Client = new S3Client({
  region: config.region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Types
export interface UploadResult {
  path: string;
  publicUrl: string;
  error: Error | null;
}

export interface StorageFile {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  publicUrl: string;
}

/**
 * Upload a file to S3
 * Equivalent to: supabase.storage.from(bucket).upload(path, file)
 */
export async function uploadFile(
  folder: string,
  file: File | Buffer,
  options?: {
    contentType?: string;
    cacheControl?: string;
    upsert?: boolean;
  }
): Promise<UploadResult> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = file instanceof File ? file.name : `file_${timestamp}.bin`;
    const fileExtension = fileName.split('.').pop() || 'bin';
    const key = `${folder}/${timestamp}_${randomId}.${fileExtension}`;

    // Prepare file body
    let body: Buffer;
    if (file instanceof File) {
      // Browser File object
      const arrayBuffer = await file.arrayBuffer();
      body = Buffer.from(arrayBuffer);
    } else {
      // Node.js Buffer
      body = file;
    }

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: options?.contentType || (file instanceof File ? file.type : 'application/octet-stream'),
      CacheControl: options?.cacheControl || 'public, max-age=31536000',
    });

    await s3Client.send(command);

    // Generate public URL (CloudFront or S3)
    const publicUrl = config.cloudFrontDomain
      ? `https://${config.cloudFrontDomain}/${key}`
      : `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;

    return {
      path: key,
      publicUrl,
      error: null,
    };
  } catch (error: any) {
    return {
      path: "",
      publicUrl: "",
      error: new Error(error.message || "Upload failed"),
    };
  }
}

/**
 * Upload with progress (for large files)
 */
export async function uploadFileWithProgress(
  folder: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<UploadResult> {
  // For large files, you might want to use multipart upload
  // This is a simplified version
  return uploadFile(folder, file);
}

/**
 * Get public URL for a file
 * Equivalent to: supabase.storage.from(bucket).getPublicUrl(path)
 */
export function getPublicUrl(path: string): string {
  if (config.cloudFrontDomain) {
    return `https://${config.cloudFrontDomain}/${path}`;
  }
  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${path}`;
}

/**
 * Get signed URL for private files (expires after specified time)
 * Equivalent to: supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
 */
export async function getSignedDownloadUrl(
  path: string,
  expiresIn: number = 3600
): Promise<{ signedUrl: string; error: Error | null }> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: path,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    return { signedUrl, error: null };
  } catch (error: any) {
    return {
      signedUrl: "",
      error: new Error(error.message || "Failed to generate signed URL"),
    };
  }
}

/**
 * Get signed upload URL (for direct browser-to-S3 uploads)
 */
export async function getSignedUploadUrl(
  folder: string,
  fileName: string,
  expiresIn: number = 3600
): Promise<{ signedUrl: string; path: string; error: Error | null }> {
  try {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileName.split('.').pop() || 'bin';
    const key = `${folder}/${timestamp}_${randomId}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    return { signedUrl, path: key, error: null };
  } catch (error: any) {
    return {
      signedUrl: "",
      path: "",
      error: new Error(error.message || "Failed to generate upload URL"),
    };
  }
}

/**
 * Delete a file
 * Equivalent to: supabase.storage.from(bucket).remove([path])
 */
export async function deleteFile(path: string): Promise<{ error: Error | null }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: path,
    });

    await s3Client.send(command);

    return { error: null };
  } catch (error: any) {
    return {
      error: new Error(error.message || "Delete failed"),
    };
  }
}

/**
 * List files in a folder
 * Equivalent to: supabase.storage.from(bucket).list(path)
 */
export async function listFiles(
  folder: string
): Promise<{ files: StorageFile[]; error: Error | null }> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: config.bucket,
      Prefix: folder,
    });

    const response = await s3Client.send(command);

    const files: StorageFile[] = (response.Contents || []).map((item) => ({
      name: item.Key!.split('/').pop()!,
      path: item.Key!,
      size: item.Size || 0,
      lastModified: item.LastModified || new Date(),
      publicUrl: getPublicUrl(item.Key!),
    }));

    return { files, error: null };
  } catch (error: any) {
    return {
      files: [],
      error: new Error(error.message || "List failed"),
    };
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(
  path: string
): Promise<{ metadata: any; error: Error | null }> {
  try {
    const command = new HeadObjectCommand({
      Bucket: config.bucket,
      Key: path,
    });

    const response = await s3Client.send(command);

    return {
      metadata: {
        size: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        etag: response.ETag,
      },
      error: null,
    };
  } catch (error: any) {
    return {
      metadata: null,
      error: new Error(error.message || "Failed to get metadata"),
    };
  }
}

/**
 * Move/rename a file (copy then delete)
 */
export async function moveFile(
  oldPath: string,
  newPath: string
): Promise<{ error: Error | null }> {
  try {
    // S3 doesn't have a native move operation, so we copy then delete
    const { CopyObjectCommand } = await import("@aws-sdk/client-s3");

    // Copy
    const copyCommand = new CopyObjectCommand({
      Bucket: config.bucket,
      CopySource: `${config.bucket}/${oldPath}`,
      Key: newPath,
    });
    await s3Client.send(copyCommand);

    // Delete original
    await deleteFile(oldPath);

    return { error: null };
  } catch (error: any) {
    return {
      error: new Error(error.message || "Move failed"),
    };
  }
}

/**
 * Download file as blob (browser only)
 */
export async function downloadFile(
  path: string
): Promise<{ blob: Blob | null; error: Error | null }> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: path,
    });

    const response = await s3Client.send(command);

    // Convert stream to blob
    const chunks: Uint8Array[] = [];
    const reader = (response.Body as any).getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const blob = new Blob(chunks, { type: response.ContentType });

    return { blob, error: null };
  } catch (error: any) {
    return {
      blob: null,
      error: new Error(error.message || "Download failed"),
    };
  }
}

/**
 * Bucket management (create bucket, set CORS, etc.)
 */
export const bucket = {
  /**
   * Create a new bucket
   */
  async create(bucketName: string, region: string = config.region) {
    const { CreateBucketCommand } = await import("@aws-sdk/client-s3");
    
    const command = new CreateBucketCommand({
      Bucket: bucketName,
      CreateBucketConfiguration: {
        LocationConstraint: region !== 'us-east-1' ? region : undefined,
      },
    });

    await s3Client.send(command);
  },

  /**
   * Set CORS configuration
   */
  async setCORS(bucketName: string) {
    const { PutBucketCorsCommand } = await import("@aws-sdk/client-s3");

    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "DELETE"],
            AllowedHeaders: ["*"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    });

    await s3Client.send(command);
  },
};

export default {
  uploadFile,
  uploadFileWithProgress,
  getPublicUrl,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  deleteFile,
  listFiles,
  getFileMetadata,
  moveFile,
  downloadFile,
  bucket,
};


