/**
 * AWS S3 File Upload Utilities
 * 
 * This module provides file upload/download functions using AWS S3,
 * replacing Supabase Storage functionality.
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

export interface UploadResult {
  path: string;
  publicUrl: string;
  key: string;
}

/**
 * Upload a file to S3
 * @param file - File object or Buffer
 * @param folder - Folder path in S3 (e.g., 'activity-package-images')
 * @param fileName - Optional custom file name (auto-generated if not provided)
 * @param contentType - Optional content type (auto-detected if not provided)
 */
export async function uploadFile(
  file: File | Buffer | ArrayBuffer,
  folder: string,
  fileName?: string,
  contentType?: string
): Promise<UploadResult> {
  // Generate file name if not provided
  const finalFileName = fileName || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const key = `${folder}/${finalFileName}`;

  // Convert file to Buffer
  let body: Buffer;
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    body = Buffer.from(arrayBuffer);
    contentType = contentType || file.type || 'application/octet-stream';
  } else if (file instanceof ArrayBuffer) {
    body = Buffer.from(file);
  } else {
    body = file;
  }

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType || getContentTypeFromFileName(finalFileName),
    Metadata: {
      'uploaded-at': new Date().toISOString(),
    },
  });

  await s3.send(command);

  // Generate public URL (CloudFront or S3)
  const publicUrl = CLOUDFRONT_DOMAIN
    ? `https://${CLOUDFRONT_DOMAIN}/${key}`
    : `https://${BUCKET_NAME}.s3.${process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1'}.amazonaws.com/${key}`;

  return {
    path: key,
    publicUrl,
    key,
  };
}

/**
 * Get a presigned URL for direct browser upload (more efficient for large files)
 * @param fileName - File name
 * @param folder - Folder path in S3
 * @param contentType - Content type
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 */
export async function getPresignedUploadUrl(
  fileName: string,
  folder: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<{ signedUrl: string; key: string }> {
  const key = `${folder}/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn });
  return { signedUrl, key };
}

/**
 * Get a presigned URL for downloading a file
 * @param key - S3 object key (path)
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3, command, { expiresIn });
}

/**
 * Get public URL for a file (if bucket is public or using CloudFront)
 * @param key - S3 object key (path)
 */
export function getPublicUrl(key: string): string {
  if (CLOUDFRONT_DOMAIN) {
    return `https://${CLOUDFRONT_DOMAIN}/${key}`;
  }
  return `https://${BUCKET_NAME}.s3.${process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

/**
 * Delete a file from S3
 * @param key - S3 object key (path)
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3.send(command);
}

/**
 * Get content type from file extension
 */
function getContentTypeFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Text
    'txt': 'text/plain',
    'json': 'application/json',
    'xml': 'application/xml',
    'csv': 'text/csv',
    // Archives
    'zip': 'application/zip',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
  };
  return contentTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Upload multiple files
 * @param files - Array of files to upload
 * @param folder - Folder path in S3
 */
export async function uploadFiles(
  files: Array<File | { file: File | Buffer; fileName?: string; contentType?: string }>,
  folder: string
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map(async (file) => {
      if (file instanceof File) {
        return uploadFile(file, folder);
      } else {
        return uploadFile(
          file.file,
          folder,
          file.fileName,
          file.contentType
        );
      }
    })
  );

  return results;
}

