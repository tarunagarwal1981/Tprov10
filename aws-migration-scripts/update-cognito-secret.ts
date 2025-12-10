/**
 * Update Cognito config inside Secrets Manager secret
 *
 * This script updates COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID
 * in the JSON stored in `travel-app/dev/secrets`.
 *
 * Usage:
 *   npx ts-node aws-migration-scripts/update-cognito-secret.ts
 *
 * It uses hard-coded values that match the `travel-app-users` pool:
 *   - User pool ID: us-east-1_oF5qfa2IX
 *   - Client ID:    20t43em6vuke645ka10s4slgl9
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
  UpdateSecretCommand,
} from "@aws-sdk/client-secrets-manager";

const REGION = process.env.DEPLOYMENT_REGION || process.env.REGION || "us-east-1";

// Secret name used in this project
const SECRET_NAME = process.env.SECRETS_MANAGER_SECRET_NAME || "travel-app/dev/secrets";

// Target Cognito configuration (matches `travel-app-users` pool)
const TARGET_USER_POOL_ID = "us-east-1_oF5qfa2IX";
const TARGET_CLIENT_ID = "20t43em6vuke645ka10s4slgl9";

const secrets = new SecretsManagerClient({ region: REGION });

async function main() {
  console.log("=== Update Cognito values in Secrets Manager ===");
  console.log(`Region:       ${REGION}`);
  console.log(`Secret name:  ${SECRET_NAME}`);
  console.log(`User pool ID: ${TARGET_USER_POOL_ID}`);
  console.log(`Client ID:    ${TARGET_CLIENT_ID}`);
  console.log("");

  try {
    // 1. Read existing secret
    console.log("🔍 Fetching current secret value...");
    const getResp = await secrets.send(
      new GetSecretValueCommand({
        SecretId: SECRET_NAME,
      })
    );

    if (!getResp.SecretString) {
      console.error("❌ Secret does not contain a SecretString JSON payload");
      process.exit(1);
    }

    const currentJson = getResp.SecretString;
    let current: any;
    try {
      current = JSON.parse(currentJson);
    } catch (err) {
      console.warn("⚠️ Existing secret is not valid JSON, attempting to parse legacy format...");
      console.warn(currentJson);

      // Fallback: handle legacy format like
      // {RDS_PASSWORD:xxx,SUPABASE_SERVICE_ROLE_KEY:yyy,COGNITO_CLIENT_ID:zzz,COGNITO_USER_POOL_ID:aaa}
      const trimmed = currentJson.trim();
      const withoutBraces =
        trimmed.startsWith("{") && trimmed.endsWith("}")
          ? trimmed.slice(1, -1)
          : trimmed;

      const parts = withoutBraces.split(",");
      const obj: Record<string, string> = {};

      for (const part of parts) {
        const idx = part.indexOf(":");
        if (idx === -1) continue;
        const key = part.slice(0, idx).trim();
        const value = part.slice(idx + 1).trim();
        if (!key) continue;
        obj[key] = value;
      }

      current = obj;
    }

    console.log("Current values:");
    console.log("  COGNITO_USER_POOL_ID:", current.COGNITO_USER_POOL_ID);
    console.log("  COGNITO_CLIENT_ID:   ", current.COGNITO_CLIENT_ID);
    console.log("");

    // 2. Update fields
    const updated = {
      ...current,
      COGNITO_USER_POOL_ID: TARGET_USER_POOL_ID,
      COGNITO_CLIENT_ID: TARGET_CLIENT_ID,
    };

    console.log("Updating to:");
    console.log("  COGNITO_USER_POOL_ID:", updated.COGNITO_USER_POOL_ID);
    console.log("  COGNITO_CLIENT_ID:   ", updated.COGNITO_CLIENT_ID);
    console.log("");

    const updatedString = JSON.stringify(updated);

    // 3. Write back to Secrets Manager
    console.log("💾 Writing updated secret to Secrets Manager...");
    await secrets.send(
      new UpdateSecretCommand({
        SecretId: SECRET_NAME,
        SecretString: updatedString,
      })
    );

    console.log("✅ Secret updated successfully.");
  } catch (error: any) {
    console.error("❌ Failed to update secret:");
    console.error("   ", error.name || "Error", "-", error.message || error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Unhandled error:", err);
  process.exit(1);
});


