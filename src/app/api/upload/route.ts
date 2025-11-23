/**
 * File Upload API Route
 * Handles file uploads to AWS S3
 * Replaces Supabase Storage uploads
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/aws/s3-upload';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;
    const fileName = formData.get('fileName') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!folder) {
      return NextResponse.json(
        { error: 'No folder specified' },
        { status: 400 }
      );
    }

    // Upload to S3
    const result = await uploadFile(
      file,
      folder,
      fileName || undefined,
      file.type
    );

    return NextResponse.json({
      success: true,
      data: {
        path: result.path,
        publicUrl: result.publicUrl,
        key: result.key,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}

