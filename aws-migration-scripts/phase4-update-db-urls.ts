/**
 * Update Database URLs Script
 * Replaces Supabase Storage URLs with S3 URLs in the database
 * 
 * Usage:
 *   npx tsx aws-migration-scripts/phase4-update-db-urls.ts
 */

import { query } from '../src/lib/aws/database.js';

const S3_BASE_URL = process.env.S3_BUCKET_NAME 
  ? `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`
  : 'https://travel-app-storage-1769.s3.us-east-1.amazonaws.com';

const SUPABASE_STORAGE_URL = 'https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public';

async function updateDatabaseUrls() {
  console.log('🔄 Updating database URLs from Supabase to S3...\n');

  try {
    // Update activity_package_images table
    console.log('📦 Updating activity_package_images table...');
    
    const updatePublicUrl = `
      UPDATE activity_package_images
      SET public_url = REPLACE(
        public_url,
        '${SUPABASE_STORAGE_URL}/activity-package-images/',
        '${S3_BASE_URL}/activity-package-images/'
      )
      WHERE public_url LIKE '%supabase.co%'
    `;

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

    console.log(`✅ Updated ${publicUrlResult.rowCount || 0} public_url records`);
    console.log(`✅ Updated ${storagePathResult.rowCount || 0} storage_path records`);

    // Verify updates
    console.log('\n🔍 Verifying updates...');
    const verifyResult = await query(`
      SELECT COUNT(*) as count
      FROM activity_package_images
      WHERE public_url LIKE '%supabase.co%' OR storage_path LIKE '%supabase.co%'
    `);

    const remainingCount = verifyResult.rows[0]?.count || 0;
    
    if (remainingCount > 0) {
      console.log(`⚠️  ${remainingCount} records still contain Supabase URLs`);
      console.log('   These may need manual review.');
    } else {
      console.log('✅ All URLs updated successfully!');
    }

    // Show sample of updated URLs
    console.log('\n📋 Sample of updated URLs:');
    const sampleResult = await query(`
      SELECT id, public_url, storage_path
      FROM activity_package_images
      WHERE public_url LIKE '%s3.amazonaws.com%'
      LIMIT 5
    `);

    sampleResult.rows.forEach((row: any) => {
      console.log(`   - ${row.id}: ${row.public_url}`);
    });

    console.log('\n✅ Database URL update completed!');

  } catch (error: any) {
    console.error('❌ Error updating database URLs:', error);
    throw error;
  }
}

// Run update
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || 
    process.argv[1]?.endsWith('phase4-update-db-urls.ts')) {
  updateDatabaseUrls().catch(console.error);
}

export { updateDatabaseUrls };

