/**
 * Fix existing lead_purchases records with null IDs
 * 
 * This script finds all records in lead_purchases table that have null IDs
 * and updates them with generated UUIDs.
 * 
 * Usage:
 *   npx ts-node aws-migration-scripts/fix-existing-lead-purchases-ids.ts
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
  console.log("=== Fixing existing lead_purchases records with null IDs ===");
  console.log("Region:", REGION);
  console.log("Database Lambda:", DATABASE_LAMBDA_NAME);
  console.log("");

  try {
    // 1. Check for records with null IDs
    console.log("➡️  Checking for records with null IDs...");
    const checkResult = await invokeQuery(`
      SELECT COUNT(*) as count 
      FROM lead_purchases 
      WHERE id IS NULL;
    `);
    
    const nullCount = parseInt(checkResult.body?.rows?.[0]?.count || "0", 10);
    console.log(`   Found ${nullCount} record(s) with null IDs`);

    if (nullCount === 0) {
      console.log("");
      console.log("✅ No records with null IDs found. Nothing to fix!");
      return;
    }

    // 2. Update records with null IDs
    console.log("➡️  Updating records with null IDs...");
    
    // First, let's see what records we have
    const recordsResult = await invokeQuery(`
      SELECT lead_id, agent_id, purchase_price, purchased_at, created_at
      FROM lead_purchases 
      WHERE id IS NULL
      ORDER BY created_at;
    `);
    
    const records = recordsResult.body?.rows || [];
    console.log(`   Found ${records.length} record(s) to update`);
    
    if (records.length > 0) {
      console.log("   Sample records:");
      records.slice(0, 3).forEach((record: any, index: number) => {
        console.log(`     ${index + 1}. lead_id: ${record.lead_id}, agent_id: ${record.agent_id}, price: ${record.purchase_price}`);
      });
      if (records.length > 3) {
        console.log(`     ... and ${records.length - 3} more`);
      }
    }

    // Update each record with a generated UUID
    // We'll use a single UPDATE statement with gen_random_uuid()
    console.log("➡️  Generating UUIDs and updating records...");
    const updateResult = await invokeQuery(`
      UPDATE lead_purchases 
      SET id = gen_random_uuid()
      WHERE id IS NULL
      RETURNING id, lead_id, agent_id;
    `);

    const updatedRows = updateResult.body?.rows || [];
    console.log(`   ✅ Updated ${updatedRows.length} record(s)`);

    // 3. Verify no null IDs remain
    console.log("➡️  Verifying fix...");
    const verifyResult = await invokeQuery(`
      SELECT COUNT(*) as count 
      FROM lead_purchases 
      WHERE id IS NULL;
    `);
    
    const remainingNulls = parseInt(verifyResult.body?.rows?.[0]?.count || "0", 10);
    
    if (remainingNulls === 0) {
      console.log("   ✅ Verification successful! No null IDs remaining.");
    } else {
      console.log(`   ⚠️  Warning: ${remainingNulls} record(s) still have null IDs`);
    }

    // 4. Show summary
    const totalResult = await invokeQuery(`
      SELECT COUNT(*) as count 
      FROM lead_purchases;
    `);
    const totalCount = parseInt(totalResult.body?.rows?.[0]?.count || "0", 10);
    
    console.log("");
    console.log("=== Summary ===");
    console.log(`Total records in lead_purchases: ${totalCount}`);
    console.log(`Records fixed: ${updatedRows.length}`);
    console.log(`Records with null IDs remaining: ${remainingNulls}`);
    console.log("");
    console.log("✅ Done!");
  } catch (error: any) {
    console.error("❌ Failed to fix existing records:", error?.message || error);
    console.error("Error details:", error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Unhandled error:", err);
  process.exit(1);
});

