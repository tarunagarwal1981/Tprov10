/**
 * S3 Service
 * Handles file uploads to S3 with presigned URLs
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || process.env.DEPLOYMENT_REGION || 'us-east-1',
});

const DOCUMENTS_BUCKET = process.env.S3_DOCUMENTS_BUCKET || 'travclan-documents';
const UPLOAD_EXPIRY_SECONDS = 3600; // 1 hour
const DOWNLOAD_EXPIRY_SECONDS = 3600; // 1 hour

/**
 * Generate presigned URL for uploading a document
 */
export async function generateUploadUrl(
  userId: string,
  documentType: string,
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; s3Key: string }> {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const s3Key = `documents/${userId}/${documentType}/${timestamp}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: DOCUMENTS_BUCKET,
    Key: s3Key,
    ContentType: contentType,
    // Add metadata
    Metadata: {
      userId,
      documentType,
      uploadedAt: new Date().toISOString(),
    },
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: UPLOAD_EXPIRY_SECONDS,
  });

  return { uploadUrl, s3Key };
}

/**
 * Generate presigned URL for downloading/viewing a document
 */
export async function generateDownloadUrl(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: DOCUMENTS_BUCKET,
    Key: s3Key,
  });

  const downloadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: DOWNLOAD_EXPIRY_SECONDS,
  });

  return downloadUrl;
}

/**
 * Delete a document from S3
 */
export async function deleteDocument(s3Key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: DOCUMENTS_BUCKET,
    Key: s3Key,
  });

  await s3Client.send(command);
}

/**
 * Get S3 key from full URL or return as-is if already a key
 */
export function extractS3Key(s3UrlOrKey: string): string {
  // If it's a full S3 URL, extract the key
  if (s3UrlOrKey.includes('amazonaws.com/')) {
    const parts = s3UrlOrKey.split('.com/');
    return parts[1] || s3UrlOrKey;
  }
  // If it's already a key, return as-is
  return s3UrlOrKey;
}

