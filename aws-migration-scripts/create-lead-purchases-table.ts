/**
 * Create lead_purchases table in RDS via the database Lambda.
 *
 * Usage:
 *   npx ts-node aws-migration-scripts/create-lead-purchases-table.ts
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
  console.log("=== Creating lead_purchases table in RDS via Lambda ===");
  console.log("Region:", REGION);
  console.log("Database Lambda:", DATABASE_LAMBDA_NAME);
  console.log("");

  try {
    // 1. Create table if not exists
    console.log("➡️  Creating lead_purchases table (if not exists)...");

    const createTableSql = `
      CREATE TABLE IF NOT EXISTS lead_purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        -- We intentionally do NOT add foreign key constraints here because
        -- the referenced tables in RDS may not yet have the required unique
        -- constraints. The application logic already enforces integrity.
        lead_id UUID NOT NULL,
        agent_id UUID NOT NULL,
        purchase_price NUMERIC(10,2) NOT NULL,
        purchased_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT valid_purchase_price CHECK (purchase_price >= 0),
        CONSTRAINT unique_agent_lead_purchase UNIQUE (lead_id, agent_id)
      );
    `;

    await invokeQuery(createTableSql);
    console.log("   ✅ lead_purchases table ensured");

    // 2. Create indexes
    console.log("➡️  Creating indexes (if not exist)...");

    const indexSql = `
      CREATE INDEX IF NOT EXISTS idx_lead_purchases_lead_id ON lead_purchases(lead_id);
      CREATE INDEX IF NOT EXISTS idx_lead_purchases_agent_id ON lead_purchases(agent_id);
      CREATE INDEX IF NOT EXISTS idx_lead_purchases_purchased_at ON lead_purchases(purchased_at DESC);
    `;

    await invokeQuery(indexSql);
    console.log("   ✅ Indexes ensured");

    console.log("");
    console.log("=== Done ===");
    console.log("lead_purchases table is now created in RDS.");
  } catch (error: any) {
    console.error("❌ Failed to create lead_purchases table:", error?.message || error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Unhandled error:", err);
  process.exit(1);
});


