import { NextRequest, NextResponse } from 'next/server';
import { getPresignedDownloadUrl } from '@/lib/aws/s3-upload';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/images/presigned
 * Generate presigned URLs for S3 images
 * Body: { paths: string[] } - Array of S3 paths (keys)
 */
export async function POST(request: NextRequest) {
  try {
    const { paths } = await request.json();

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json(
        { error: 'paths array is required' },
        { status: 400 }
      );
    }

    // Generate presigned URLs for all paths
    const presignedUrls = await Promise.all(
      paths.map(async (path: string) => {
        try {
          const url = await getPresignedDownloadUrl(path, 3600); // 1 hour expiry
          return { path, url };
        } catch (error: any) {
          console.error(`Failed to generate presigned URL for ${path}:`, error);
          return { path, url: null, error: error.message };
        }
      })
    );

    // Create a map for easy lookup
    const urlMap: Record<string, string | null> = {};
    presignedUrls.forEach(({ path, url }) => {
      urlMap[path] = url;
    });

    return NextResponse.json({
      success: true,
      urls: urlMap,
    });
  } catch (error: any) {
    console.error('Error generating presigned URLs:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URLs', details: error.message },
      { status: 500 }
    );
  }
}
