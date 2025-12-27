/**
 * Admin API: Update Database URLs
 * Updates Supabase Storage URLs to S3 URLs in the database
 * 
 * WARNING: Add authentication before using in production!
 * 
 * Usage:
 *   POST /api/admin/update-urls
 *   Headers: Authorization: Bearer <admin-secret>
 */

import { NextRequest, NextResponse } from 'next/server';
// Use Lambda database service for reliable VPC access
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const S3_BASE_URL = process.env.S3_BUCKET_NAME 
  ? `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1'}.amazonaws.com`
  : 'https://travel-app-storage-1769.s3.us-east-1.amazonaws.com';

const SUPABASE_STORAGE_URL = 'https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // const authHeader = request.headers.get('authorization');
    // const expectedSecret = process.env.ADMIN_SECRET;
    // if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('🔄 Updating database URLs to S3...');

    // Update public_url
    const updatePublicUrl = `
      UPDATE activity_package_images
      SET public_url = REPLACE(
        public_url,
        '${SUPABASE_STORAGE_URL}/activity-package-images/',
        '${S3_BASE_URL}/activity-package-images/'
      )
      WHERE public_url LIKE '%supabase.co%'
    `;

    // Update storage_path
    const updateStoragePath = `
      UPDATE activity_package_images
      SET storage_path = REPLACE(
        storage_path,
        '${SUPABASE_STORAGE_URL}/activity-package-images/',
        'activity-package-images/'
      )
      WHERE storage_path LIKE '%supabase.co%'
    `;

    const publicUrlResult = await query(updatePublicUrl);
    const storagePathResult = await query(updateStoragePath);

    // Verify updates
    const verifyResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE public_url LIKE '%supabase.co%' OR storage_path LIKE '%supabase.co%') as remaining,
        COUNT(*) FILTER (WHERE public_url LIKE '%s3.amazonaws.com%') as s3_count
      FROM activity_package_images
    `);

    const stats = verifyResult.rows[0] as { remaining: string; s3_count: string };

    // Get sample of updated URLs
    const sampleResult = await query(`
      SELECT id, public_url, storage_path
      FROM activity_package_images
      WHERE public_url LIKE '%s3.amazonaws.com%'
      LIMIT 5
    `);

    return NextResponse.json({
      success: true,
      updated: {
        publicUrl: publicUrlResult.rowCount || 0,
        storagePath: storagePathResult.rowCount || 0,
      },
      verification: {
        remainingSupabaseUrls: parseInt(stats.remaining) || 0,
        s3Urls: parseInt(stats.s3_count) || 0,
      },
      sample: sampleResult.rows,
    });
  } catch (error: any) {
    console.error('Error updating URLs:', error);
    return NextResponse.json(
      { error: 'Update failed', details: error.message },
      { status: 500 }
    );
  }
}

