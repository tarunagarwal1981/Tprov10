/**
 * Fix lead_purchases table: Add DEFAULT for id column
 * 
 * This script fixes the issue where the lead_purchases table was created
 * without a DEFAULT value for the id column, causing INSERT failures.
 * 
 * Usage:
 *   npx ts-node aws-migration-scripts/fix-lead-purchases-id-default.ts
 * 
 * Environment:
 *   - DATABASE_LAMBDA_NAME (optional, default: travel-app-database-service)
 *   - DEPLOYMENT_REGION or REGION (optional, default: us-east-1)
 */

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const REGION = process.env.DEPLOYMENT_REGION || process.env.REGION || "us-east-1";
const DATABASE_LAMBDA_NAME =
  process.env.DATABASE_LAMBDA_NAME || "travel-app-database-service";

if (!DATABASE_LAMBDA_NAME) {
  console.error("❌ DATABASE_LAMBDA_NAME is not set");
  process.exit(1);
}

const lambda = new LambdaClient({ region: REGION });

interface LambdaResponse {
  statusCode: number;
  body: any;
}

async function invokeQuery(sql: string, params: any[] = []): Promise<LambdaResponse> {
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

async function main() {
  console.log("=== Fixing lead_purchases table: Adding DEFAULT for id column ===");
  console.log("Region:", REGION);
  console.log("Database Lambda:", DATABASE_LAMBDA_NAME);
  console.log("");

  try {
    // 1. Enable pgcrypto extension (for gen_random_uuid) if not already enabled
    // gen_random_uuid() is available in PostgreSQL 13+ or via pgcrypto extension
    console.log("➡️  Ensuring pgcrypto extension is enabled...");
    try {
      await invokeQuery(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
      console.log("   ✅ pgcrypto extension ensured");
    } catch (extError: any) {
      // If extension creation fails, try uuid-ossp as fallback
      console.log("   ⚠️  pgcrypto extension failed, trying uuid-ossp...");
      try {
        await invokeQuery(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        console.log("   ✅ uuid-ossp extension ensured");
      } catch (uuidError: any) {
        console.log("   ⚠️  Extension creation failed, but continuing...");
        console.log("   Note: PostgreSQL 13+ has gen_random_uuid() built-in");
      }
    }

    // 2. Check current column definition
    console.log("➡️  Checking current id column definition...");
    try {
      const checkResult = await invokeQuery(`
        SELECT column_default 
        FROM information_schema.columns 
        WHERE table_name = 'lead_purchases' AND column_name = 'id';
      `);
      console.log("   Current default:", checkResult.body?.rows?.[0]?.column_default || "NULL");
    } catch (checkError) {
      console.log("   ⚠️  Could not check current definition, continuing...");
    }

    // 3. Alter the table to add DEFAULT gen_random_uuid() to id column
    // We'll try gen_random_uuid() first (PostgreSQL 13+ or pgcrypto)
    // If that fails, fall back to uuid_generate_v4() (uuid-ossp)
    console.log("➡️  Adding DEFAULT gen_random_uuid() to id column...");
    try {
      await invokeQuery(`
        ALTER TABLE lead_purchases 
        ALTER COLUMN id SET DEFAULT gen_random_uuid();
      `);
      console.log("   ✅ DEFAULT gen_random_uuid() added successfully");
    } catch (genRandomError: any) {
      console.log("   ⚠️  gen_random_uuid() failed, trying uuid_generate_v4()...");
      try {
        await invokeQuery(`
          ALTER TABLE lead_purchases 
          ALTER COLUMN id SET DEFAULT uuid_generate_v4();
        `);
        console.log("   ✅ DEFAULT uuid_generate_v4() added successfully");
      } catch (uuidGenError: any) {
        console.error("   ❌ Both UUID generation methods failed!");
        console.error("   gen_random_uuid error:", genRandomError?.message);
        console.error("   uuid_generate_v4 error:", uuidGenError?.message);
        throw new Error("Failed to set DEFAULT for id column");
      }
    }

    // 4. Verify the change
    console.log("➡️  Verifying the change...");
    const verifyResult = await invokeQuery(`
      SELECT column_default 
      FROM information_schema.columns 
      WHERE table_name = 'lead_purchases' AND column_name = 'id';
    `);
    const newDefault = verifyResult.body?.rows?.[0]?.column_default;
    console.log("   New default:", newDefault || "NULL");
    
    if (newDefault && (newDefault.includes('gen_random_uuid') || newDefault.includes('uuid_generate_v4'))) {
      console.log("   ✅ Verification successful!");
    } else {
      console.log("   ⚠️  Warning: Default may not be set correctly");
    }

    console.log("");
    console.log("=== Done ===");
    console.log("lead_purchases.id column now has a DEFAULT value for UUID generation.");
    console.log("Lead purchases should now work correctly!");
  } catch (error: any) {
    console.error("❌ Failed to fix lead_purchases table:", error?.message || error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Unhandled error:", err);
  process.exit(1);
});

