/**
 * Presigned URL API Route
 * Generates presigned URLs for direct browser uploads to S3
 * More efficient for large files
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '@/lib/aws/s3-upload';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { fileName, folder, contentType } = await request.json();

    if (!fileName || !folder) {
      return NextResponse.json(
        { error: 'Missing fileName or folder' },
        { status: 400 }
      );
    }

    const result = await getPresignedUploadUrl(
      fileName,
      folder,
      contentType || 'application/octet-stream',
      3600 // 1 hour expiration
    );

    return NextResponse.json({
      success: true,
      signedUrl: result.signedUrl,
      key: result.key,
    });
  } catch (error: any) {
    console.error('Presigned URL error:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL', details: error.message },
      { status: 500 }
    );
  }
}

