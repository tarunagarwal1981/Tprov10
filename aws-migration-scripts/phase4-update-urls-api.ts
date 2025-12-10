/**
 * Alternative: Update Database URLs via API Route
 * This creates an API route that can be called from the browser
 * Since Amplify has VPC access to RDS, this will work
 * 
 * WARNING: This is a one-time operation. Consider adding authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const S3_BASE_URL = 'https://travel-app-storage-1769.s3.us-east-1.amazonaws.com';
const SUPABASE_STORAGE_URL = 'https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('🔄 Updating database URLs from Supabase to S3...');

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

    // Verify
    const verifyResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE public_url LIKE '%supabase.co%' OR storage_path LIKE '%supabase.co%') as remaining,
        COUNT(*) FILTER (WHERE public_url LIKE '%s3.amazonaws.com%') as s3_count
      FROM activity_package_images
    `);

    const stats = verifyResult.rows[0];

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
    });
  } catch (error: any) {
    console.error('Error updating URLs:', error);
    return NextResponse.json(
      { error: 'Update failed', details: error.message },
      { status: 500 }
    );
  }
}

