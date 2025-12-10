/**
 * Migrate package image data from Supabase to RDS via the database Lambda.
 * Migrates: transfer_package_images, activity_package_images, multi_city_package_images
 *
 * Usage:
 *   npx tsx aws-migration-scripts/migrate-package-images.ts
 *
 * Required environment (set in .env.local or export):
 *   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - DATABASE_LAMBDA_NAME (optional, default: travel-app-database-service)
 *   - DEPLOYMENT_REGION or REGION (optional, default: us-east-1)
 */

// Load environment variables from .env.local if it exists
try {
  const fs = require('fs');
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // Remove quotes if present
          const cleanValue = value.replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = cleanValue;
          }
        }
      }
    }
    console.log('✅ Loaded environment variables from .env.local');
  }
} catch (e) {
  // File doesn't exist or can't be read - that's okay
}

import { createClient } from "@supabase/supabase-js";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const REGION = process.env.DEPLOYMENT_REGION || process.env.REGION || "us-east-1";
const DATABASE_LAMBDA_NAME =
  process.env.DATABASE_LAMBDA_NAME || "travel-app-database-service";

// Get Supabase credentials from environment
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("❌ SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable is required");
  console.error("   Set it in your .env.local file or export it before running:");
  console.error("   export SUPABASE_URL=https://[YOUR_PROJECT].supabase.co");
  console.error("   export SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]");
  process.exit(1);
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required");
  console.error("   Set it in your .env.local file or export it before running:");
  console.error("   export SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const lambda = new LambdaClient({ region: REGION });

/**
 * Invoke database Lambda to execute a query
 */
async function invokeQuery(sql: string, params: any[] = []): Promise<any> {
  const payload = {
    action: "query",
    query: sql,
    params,
  };

  const command = new InvokeCommand({
    FunctionName: DATABASE_LAMBDA_NAME,
    Payload: Buffer.from(JSON.stringify(payload)),
  });

  const response = await lambda.send(command);
  if (!response.Payload) {
    throw new Error("Lambda returned no payload");
  }

  const result = JSON.parse(Buffer.from(response.Payload).toString());

  if (typeof result.body === "string") {
    try {
      result.body = JSON.parse(result.body);
    } catch {
      // keep as string
    }
  }

  if (result.statusCode !== 200) {
    throw new Error(
      `Lambda query failed: ${result.statusCode} - ${JSON.stringify(result.body)}`
    );
  }

  return result;
}

/**
 * Migrate transfer_package_images
 */
async function migrateTransferPackageImages(): Promise<void> {
  console.log("\n📦 Migrating transfer_package_images...");

  const { count, error: countError } = await supabase
    .from("transfer_package_images" as any)
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("❌ Error counting:", countError);
    return;
  }

  const total = count || 0;
  console.log(`   Found ${total} records`);

  if (total === 0) {
    console.log("   ✅ No data to migrate");
    return;
  }

  let migrated = 0;
  let skipped = 0;
  const batchSize = 50;

  for (let offset = 0; offset < total; offset += batchSize) {
    const { data, error } = await supabase
      .from("transfer_package_images" as any)
      .select("*")
      .range(offset, offset + batchSize - 1)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Error fetching batch:", error);
      continue;
    }

    if (!data || data.length === 0) break;

    for (const image of data) {
      try {
        // Check if record already exists
        const existing = await invokeQuery(
          `SELECT id FROM transfer_package_images WHERE id = $1`,
          [image.id]
        );

        if (existing.body?.rows && existing.body.rows.length > 0) {
          skipped++;
          continue;
        }

        await invokeQuery(
          `INSERT INTO transfer_package_images (
            id, package_id, file_name, file_size, mime_type, storage_path, public_url,
            alt_text, is_cover, is_featured, display_order, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            image.id,
            image.package_id,
            image.file_name,
            image.file_size,
            image.mime_type,
            image.storage_path,
            image.public_url,
            image.alt_text || null,
            image.is_cover || false,
            image.is_featured || false,
            image.display_order || 0,
            image.created_at ? new Date(image.created_at).toISOString() : new Date().toISOString(),
            image.updated_at ? new Date(image.updated_at).toISOString() : new Date().toISOString(),
          ]
        );
        migrated++;
      } catch (error: any) {
        if (error.message?.includes("duplicate") || error.message?.includes("already exists")) {
          skipped++;
        } else {
          console.error(`❌ Error migrating ${image.id}:`, error.message);
        }
      }
    }

    const processed = Math.min(offset + batchSize, total);
    console.log(`   Progress: ${processed}/${total} (${Math.round((processed / total) * 100)}%)`);
  }

  console.log(`   ✅ Complete: ${migrated} migrated, ${skipped} skipped`);
}

/**
 * Migrate activity_package_images
 */
async function migrateActivityPackageImages(): Promise<void> {
  console.log("\n📦 Migrating activity_package_images...");

  const { count, error: countError } = await supabase
    .from("activity_package_images" as any)
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("❌ Error counting:", countError);
    return;
  }

  const total = count || 0;
  console.log(`   Found ${total} records`);

  if (total === 0) {
    console.log("   ✅ No data to migrate");
    return;
  }

  let migrated = 0;
  let skipped = 0;
  const batchSize = 50;

  for (let offset = 0; offset < total; offset += batchSize) {
    const { data, error } = await supabase
      .from("activity_package_images" as any)
      .select("*")
      .range(offset, offset + batchSize - 1)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Error fetching batch:", error);
      continue;
    }

    if (!data || data.length === 0) break;

    for (const image of data) {
      try {
        // Check if record already exists
        const existing = await invokeQuery(
          `SELECT id FROM activity_package_images WHERE id = $1`,
          [image.id]
        );

        if (existing.body?.rows && existing.body.rows.length > 0) {
          skipped++;
          continue;
        }

        await invokeQuery(
          `INSERT INTO activity_package_images (
            id, package_id, file_name, file_size, mime_type, storage_path, public_url,
            width, height, alt_text, caption, is_cover, is_featured, display_order,
            uploaded_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            image.id,
            image.package_id,
            image.file_name,
            image.file_size,
            image.mime_type,
            image.storage_path,
            image.public_url,
            image.width || null,
            image.height || null,
            image.alt_text || null,
            image.caption || null,
            image.is_cover || false,
            image.is_featured || false,
            image.display_order || 0,
            image.uploaded_at ? new Date(image.uploaded_at).toISOString() : new Date().toISOString(),
            image.created_at ? new Date(image.created_at).toISOString() : new Date().toISOString(),
            image.updated_at ? new Date(image.updated_at).toISOString() : new Date().toISOString(),
          ]
        );
        migrated++;
      } catch (error: any) {
        if (error.message?.includes("duplicate") || error.message?.includes("already exists")) {
          skipped++;
        } else {
          console.error(`❌ Error migrating ${image.id}:`, error.message);
        }
      }
    }

    const processed = Math.min(offset + batchSize, total);
    console.log(`   Progress: ${processed}/${total} (${Math.round((processed / total) * 100)}%)`);
  }

  console.log(`   ✅ Complete: ${migrated} migrated, ${skipped} skipped`);
}

/**
 * Migrate multi_city_package_images
 */
async function migrateMultiCityPackageImages(): Promise<void> {
  console.log("\n📦 Migrating multi_city_package_images...");

  const { count, error: countError } = await supabase
    .from("multi_city_package_images" as any)
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("❌ Error counting:", countError);
    return;
  }

  const total = count || 0;
  console.log(`   Found ${total} records`);

  if (total === 0) {
    console.log("   ✅ No data to migrate");
    return;
  }

  let migrated = 0;
  let skipped = 0;
  const batchSize = 50;

  for (let offset = 0; offset < total; offset += batchSize) {
    const { data, error } = await supabase
      .from("multi_city_package_images" as any)
      .select("*")
      .range(offset, offset + batchSize - 1)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Error fetching batch:", error);
      continue;
    }

    if (!data || data.length === 0) break;

    for (const image of data) {
      try {
        // Check if record already exists
        const existing = await invokeQuery(
          `SELECT id FROM multi_city_package_images WHERE id = $1`,
          [image.id]
        );

        if (existing.body?.rows && existing.body.rows.length > 0) {
          skipped++;
          continue;
        }

        await invokeQuery(
          `INSERT INTO multi_city_package_images (
            id, package_id, file_name, storage_path, public_url, file_size, mime_type,
            is_cover, is_featured, display_order, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            image.id,
            image.package_id,
            image.file_name,
            image.storage_path,
            image.public_url,
            image.file_size || null,
            image.mime_type || null,
            image.is_cover || false,
            image.is_featured || false,
            image.display_order || 0,
            image.created_at ? new Date(image.created_at).toISOString() : new Date().toISOString(),
          ]
        );
        migrated++;
      } catch (error: any) {
        if (error.message?.includes("duplicate") || error.message?.includes("already exists")) {
          skipped++;
        } else {
          console.error(`❌ Error migrating ${image.id}:`, error.message);
        }
      }
    }

    const processed = Math.min(offset + batchSize, total);
    console.log(`   Progress: ${processed}/${total} (${Math.round((processed / total) * 100)}%)`);
  }

  console.log(`   ✅ Complete: ${migrated} migrated, ${skipped} skipped`);
}

/**
 * Main migration function
 */
async function migratePackageImages() {
  try {
    console.log("🚀 Starting package images migration from Supabase to RDS...");
    console.log(`   Supabase URL: ${SUPABASE_URL}`);
    console.log(`   Lambda: ${DATABASE_LAMBDA_NAME}`);
    console.log(`   Region: ${REGION}`);

    // Migrate each table
    await migrateTransferPackageImages();
    await migrateActivityPackageImages();
    await migrateMultiCityPackageImages();

    console.log("\n🎉 Package images migration completed successfully!");
  } catch (error: any) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  migratePackageImages()
    .then(() => {
      console.log("\n✅ Done");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration failed:", error);
      process.exit(1);
    });
}

export { migratePackageImages };

