/**
 * Migrate lead_purchases data from Supabase to RDS via the database Lambda.
 *
 * Usage:
 *   npx ts-node aws-migration-scripts/migrate-lead-purchases.ts
 *
 * Required environment:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - DATABASE_LAMBDA_NAME (optional, default: travel-app-database-service)
 *   - DEPLOYMENT_REGION or REGION (optional, default: us-east-1)
 */

import { createClient } from "@supabase/supabase-js";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const REGION = process.env.DEPLOYMENT_REGION || process.env.REGION || "us-east-1";
const DATABASE_LAMBDA_NAME =
  process.env.DATABASE_LAMBDA_NAME || "travel-app-database-service";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  process.exit(1);
}

if (!DATABASE_LAMBDA_NAME) {
  console.error("❌ DATABASE_LAMBDA_NAME is not set");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
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

async function getTotalRows(): Promise<number> {
  const { count, error } = await supabase
    .from("lead_purchases" as any)
    .select("*", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count || 0;
}

async function main() {
  console.log("=== Migrating lead_purchases from Supabase to RDS ===");
  console.log("Region:", REGION);
  console.log("Database Lambda:", DATABASE_LAMBDA_NAME);
  console.log("Supabase URL:", SUPABASE_URL);
  console.log("");

  try {
    // Ensure table exists in RDS
    console.log("➡️  Ensuring lead_purchases table exists in RDS...");
    await invokeQuery(
      `
      CREATE TABLE IF NOT EXISTS lead_purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        -- No foreign key constraints here; see create-lead-purchases-table.ts
        lead_id UUID NOT NULL,
        agent_id UUID NOT NULL,
        purchase_price NUMERIC(10,2) NOT NULL,
        purchased_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT valid_purchase_price CHECK (purchase_price >= 0),
        CONSTRAINT unique_agent_lead_purchase UNIQUE (lead_id, agent_id)
      );
    `
    );

    await invokeQuery(
      `
      CREATE INDEX IF NOT EXISTS idx_lead_purchases_lead_id ON lead_purchases(lead_id);
      CREATE INDEX IF NOT EXISTS idx_lead_purchases_agent_id ON lead_purchases(agent_id);
      CREATE INDEX IF NOT EXISTS idx_lead_purchases_purchased_at ON lead_purchases(purchased_at DESC);
    `
    );
    console.log("   ✅ Table and indexes ensured");
    console.log("");

    const totalRows = await getTotalRows();
    console.log(`Total rows in Supabase lead_purchases: ${totalRows}`);

    if (totalRows === 0) {
      console.log("Nothing to migrate.");
      return;
    }

    const batchSize = 200;
    let migrated = 0;

    for (let offset = 0; offset < totalRows; offset += batchSize) {
      console.log(
        `➡️  Fetching rows ${offset + 1} to ${Math.min(
          offset + batchSize,
          totalRows
        )} from Supabase...`
      );

      const { data, error } = await supabase
        .from("lead_purchases" as any)
        .select("*")
        .order("created_at", { ascending: true })
        .range(offset, offset + batchSize - 1);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        break;
      }

      console.log(`   Fetched ${data.length} rows, inserting into RDS...`);

      for (const row of data) {
        const sql = `
          INSERT INTO lead_purchases (
            id, lead_id, agent_id, purchase_price, purchased_at, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING;
        `;

        const params = [
          row.id,
          row.lead_id,
          row.agent_id,
          row.purchase_price,
          row.purchased_at,
          row.created_at,
        ];

        await invokeQuery(sql, params);
        migrated++;
      }

      console.log(`   ✅ Migrated so far: ${migrated}/${totalRows}`);
    }

    console.log("");
    console.log("=== Migration Complete ===");
    console.log(`Total rows migrated: ${migrated}/${totalRows}`);
    console.log("");
    console.log("You can now test the My Leads page; purchased leads should load from RDS.");
  } catch (error: any) {
    console.error("❌ Migration failed:", error?.message || error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Unhandled error:", err);
  process.exit(1);
});


