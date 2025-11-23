/**
 * Storage Migration Script: Supabase Storage → AWS S3
 * 
 * This script migrates all images/files from Supabase Storage to AWS S3
 * 
 * Usage:
 *   npx ts-node aws-migration-scripts/migrate-storage.ts
 * 
 * Environment Variables Required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
 *   S3_BUCKET_NAME - AWS S3 bucket name
 *   AWS_REGION - AWS region (default: us-east-1)
 *   AWS_ACCESS_KEY_ID - AWS access key (optional, uses default credentials if not set)
 *   AWS_SECRET_ACCESS_KEY - AWS secret key (optional)
 */

import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-providers";

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const s3 = new S3Client({ 
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID 
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    : undefined,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
  errors: Array<{ file: string; error: string }>;
}

/**
 * Check if file already exists in S3
 */
async function fileExistsInS3(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }));
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Migrate a single file from Supabase to S3
 */
async function migrateFile(
  bucketName: string,
  fileName: string,
  stats: MigrationStats
): Promise<void> {
  const s3Key = `${bucketName}/${fileName}`;

  try {
    // Check if file already exists in S3
    const exists = await fileExistsInS3(s3Key);
    if (exists) {
      console.log(`⏭️  Skipping (already exists): ${fileName}`);
      stats.skipped++;
      return;
    }

    // Download from Supabase
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(fileName);

    if (downloadError) {
      throw new Error(`Download failed: ${downloadError.message}`);
    }

    // Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get file metadata from Supabase
    const { data: fileInfo } = await supabase.storage
      .from(bucketName)
      .list(fileName.split('/').slice(0, -1).join('/') || '', {
        search: fileName.split('/').pop(),
      });

    const contentType = fileInfo?.[0]?.metadata?.mimetype || 
                       getContentTypeFromFileName(fileName) || 
                       'application/octet-stream';

    // Upload to S3
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        'original-bucket': bucketName,
        'migrated-from': 'supabase',
        'migrated-at': new Date().toISOString(),
        'original-filename': fileName,
      },
    }));

    console.log(`✅ Migrated: ${fileName} (${formatBytes(buffer.length)})`);
    stats.migrated++;
  } catch (error: any) {
    const errorMsg = error.message || 'Unknown error';
    console.error(`❌ Failed to migrate ${fileName}:`, errorMsg);
    stats.failed++;
    stats.errors.push({ file: fileName, error: errorMsg });
  }
}

/**
 * Get content type from file extension
 */
function getContentTypeFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'json': 'application/json',
  };
  return contentTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * List all files in a Supabase bucket (recursive)
 */
async function listAllFiles(bucketName: string, path: string = ''): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const { data: items, error } = await supabase.storage
      .from(bucketName)
      .list(path, { limit: 1000 });

    if (error) {
      console.error(`Error listing ${path}:`, error);
      return files;
    }

    for (const item of items || []) {
      const fullPath = path ? `${path}/${item.name}` : item.name;
      
      if (item.id === null) {
        // It's a folder, recurse
        const subFiles = await listAllFiles(bucketName, fullPath);
        files.push(...subFiles);
      } else {
        // It's a file
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing ${path}:`, error);
  }

  return files;
}

/**
 * Migrate all files from a Supabase bucket to S3
 */
async function migrateBucket(bucketName: string): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  console.log(`\n📦 Migrating bucket: ${bucketName}`);
  console.log('─'.repeat(50));

  try {
    // List all files in bucket
    console.log('📋 Listing files...');
    const files = await listAllFiles(bucketName);
    stats.total = files.length;

    if (files.length === 0) {
      console.log('ℹ️  No files found in this bucket');
      return stats;
    }

    console.log(`Found ${files.length} files to migrate\n`);

    // Migrate each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[${i + 1}/${files.length}] Processing: ${file}`);
      await migrateFile(bucketName, file, stats);

      // Small delay to avoid rate limiting
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return stats;
  } catch (error) {
    console.error(`❌ Error migrating bucket ${bucketName}:`, error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrateStorage() {
  console.log('🚀 Starting storage migration from Supabase to AWS S3...\n');

  // Validate environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  if (!BUCKET_NAME) {
    throw new Error('Missing S3 bucket name. Set S3_BUCKET_NAME');
  }

  // Supabase buckets to migrate
  const buckets = [
    'activity-package-images',
    'transfer-packages',
    'multi-city-packages',
  ];

  const overallStats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Migrate each bucket
    for (const bucketName of buckets) {
      const stats = await migrateBucket(bucketName);
      
      // Aggregate stats
      overallStats.total += stats.total;
      overallStats.migrated += stats.migrated;
      overallStats.skipped += stats.skipped;
      overallStats.failed += stats.failed;
      overallStats.errors.push(...stats.errors);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary');
    console.log('='.repeat(50));
    console.log(`📦 Total files: ${overallStats.total}`);
    console.log(`✅ Successfully migrated: ${overallStats.migrated}`);
    console.log(`⏭️  Skipped (already exists): ${overallStats.skipped}`);
    console.log(`❌ Failed: ${overallStats.failed}`);

    if (overallStats.errors.length > 0) {
      console.log('\n❌ Errors:');
      overallStats.errors.slice(0, 10).forEach(({ file, error }) => {
        console.log(`  - ${file}: ${error}`);
      });
      if (overallStats.errors.length > 10) {
        console.log(`  ... and ${overallStats.errors.length - 10} more errors`);
      }
    }

    if (overallStats.failed === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Review above.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration (ES module compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || 
                     process.argv[1]?.endsWith('migrate-storage.ts') ||
                     process.argv[1]?.endsWith('migrate-storage.js');

if (isMainModule) {
  migrateStorage().catch(console.error);
}

export { migrateStorage, migrateBucket };

