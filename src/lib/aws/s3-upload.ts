/**
 * AWS S3 File Upload Utilities
 * 
 * This module provides file upload/download functions using AWS S3,
 * replacing Supabase Storage functionality.
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Configure S3 client with credentials
// In local dev, use environment variables if available
// In production (Lambda/EC2), use default credential chain (IAM role)
const isLocalDev = typeof window === 'undefined' && !process.env.AWS_EXECUTION_ENV && !process.env.AWS_LAMBDA_FUNCTION_NAME;

const s3ClientConfig: any = {
  region: process.env.AWS_REGION || process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1',
};

// In local development, use explicit credentials from environment variables
if (isLocalDev && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3ClientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN }),
  };
  console.log('[S3 Client] Using credentials from environment variables (local dev)');
} else if (isLocalDev) {
  console.warn('[S3 Client] ⚠️  No AWS credentials found. Using default credential chain.');
}

const s3 = new S3Client(s3ClientConfig);
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
  // Log which credentials are being used
  const credentialsInfo = isLocalDev && process.env.AWS_ACCESS_KEY_ID
    ? { source: 'environment_variables', accessKeyId: process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' }
    : { source: 'default_credential_chain', note: 'Using IAM role or default credentials' };
  
  console.log('🔐 [S3] Generating presigned URL:', {
    key: key.substring(0, 80) + '...',
    bucket: BUCKET_NAME,
    expiresIn,
    region: process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1',
    credentials: credentialsInfo,
  });

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    // Don't set ResponseContentType - let S3 use the original content type
  });

  try {
    const signedUrl = await getSignedUrl(s3, command, { expiresIn });
    console.log('✅ [S3] Presigned URL generated:', {
      key: key.substring(0, 60),
      url_preview: signedUrl.substring(0, 150) + '...',
      url_length: signedUrl.length,
      has_query_params: signedUrl.includes('?'),
      query_params_count: (signedUrl.match(/\?/g) || []).length,
      contains_credential: signedUrl.includes('X-Amz-Credential'),
      contains_signature: signedUrl.includes('X-Amz-Signature'),
      contains_expires: signedUrl.includes('X-Amz-Expires'),
    });
    return signedUrl;
  } catch (error: any) {
    console.error('❌ [S3] Error generating presigned URL:', {
      key: key.substring(0, 60),
      error: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
    });
    throw error;
  }
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

