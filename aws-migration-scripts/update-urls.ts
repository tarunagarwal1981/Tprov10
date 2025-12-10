/**
 * Update Database URLs Script for EC2
 * Replaces Supabase Storage URLs with S3 URLs in the database
 */

import { Pool } from 'pg';

const pool = new Pool({
  host: 'travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'ju3vrLHJUW8PqDG4',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

const S3_BASE_URL = 'https://travel-app-storage-1769.s3.us-east-1.amazonaws.com';
const SUPABASE_STORAGE_URL = 'https://megmjzszmqnmzdxwzigt.supabase.co/storage/v1/object/public';

async function updateDatabaseUrls() {
  console.log('🔄 Updating database URLs from Supabase to S3...\n');

  try {
    console.log('📦 Updating activity_package_images table...');
    
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

    const publicUrlResult = await pool.query(updatePublicUrl);
    console.log(`✅ Updated ${publicUrlResult.rowCount || 0} public_url records`);

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

    const storagePathResult = await pool.query(updateStoragePath);
    console.log(`✅ Updated ${storagePathResult.rowCount || 0} storage_path records`);

    // Verify updates
    console.log('\n🔍 Verifying updates...');
    const verifyResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE public_url LIKE '%supabase.co%' OR storage_path LIKE '%supabase.co%') as remaining,
        COUNT(*) FILTER (WHERE public_url LIKE '%s3.amazonaws.com%') as s3_count
      FROM activity_package_images
    `);

    const stats = verifyResult.rows[0] as { remaining: string; s3_count: string };
    const remaining = parseInt(stats.remaining) || 0;
    const s3Count = parseInt(stats.s3_count) || 0;

    if (remaining > 0) {
      console.log(`⚠️  ${remaining} records still contain Supabase URLs`);
    } else {
      console.log('✅ All URLs updated successfully!');
    }

    console.log(`📊 S3 URLs: ${s3Count}`);
    console.log(`📊 Remaining Supabase URLs: ${remaining}`);

    // Show sample
    const sampleResult = await pool.query(`
      SELECT id, LEFT(public_url, 80) as url
      FROM activity_package_images
      WHERE public_url LIKE '%s3.amazonaws.com%'
      LIMIT 3
    `);
    
    console.log('\n📋 Sample URLs:');
    sampleResult.rows.forEach((row: any) => {
      console.log(`   - ${row.url}`);
    });

    console.log('\n✅ Database URL update completed!');
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

updateDatabaseUrls();

