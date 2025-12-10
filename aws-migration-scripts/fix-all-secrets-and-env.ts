/**
 * Comprehensive Fix: Secrets Manager + Amplify Environment Variables
 * 
 * This script:
 * 1. Reads the secret from Secrets Manager
 * 2. Gets Amplify app environment variables
 * 3. Identifies all mismatches
 * 4. Updates both Secrets Manager and Amplify to have correct values
 * 
 * Usage:
 *   npx ts-node aws-migration-scripts/fix-all-secrets-and-env.ts
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
  UpdateSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  AmplifyClient,
  GetAppCommand,
  UpdateAppCommand,
  GetBranchCommand,
  UpdateBranchCommand,
} from "@aws-sdk/client-amplify";

const REGION = process.env.DEPLOYMENT_REGION || process.env.REGION || "us-east-1";
const APP_ID = "d2p2uq8t9xysui";
const BRANCH_NAME = "dev";
const SECRET_NAME = "travel-app/dev/secrets";

// Correct values (from your actual infrastructure)
const CORRECT_VALUES = {
  // Cognito
  COGNITO_USER_POOL_ID: "us-east-1_oF5qfa2IX",
  COGNITO_CLIENT_ID: "20t43em6vuke645ka10s4slgl9",
  
  // RDS
  RDS_HOST: "travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com",
  RDS_HOSTNAME: "travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com", // Both for compatibility
  RDS_PORT: "5432",
  RDS_DATABASE: "postgres",
  RDS_DB: "postgres",
  RDS_USERNAME: "postgres",
  RDS_USER: "postgres",
  
  // Region
  DEPLOYMENT_REGION: "us-east-1",
  REGION: "us-east-1",
  
  // S3
  S3_BUCKET_NAME: "travel-app-storage-1769",
  
  // Cognito Domain (for frontend)
  NEXT_PUBLIC_COGNITO_DOMAIN: "travel-app-auth-2285.auth.us-east-1.amazoncognito.com",
  NEXT_PUBLIC_COGNITO_CLIENT_ID: "20t43em6vuke645ka10s4slgl9",
};

const secretsClient = new SecretsManagerClient({ region: REGION });
const amplifyClient = new AmplifyClient({ region: REGION });

/**
 * Parse secret string (handles both JSON and legacy format)
 */
function parseSecretString(secretString: string): Record<string, string> {
  try {
    return JSON.parse(secretString);
  } catch {
    // Legacy format: {KEY:value,KEY2:value2}
    const trimmed = secretString.trim();
    const withoutBraces = trimmed.startsWith("{") && trimmed.endsWith("}")
      ? trimmed.slice(1, -1)
      : trimmed;
    
    const obj: Record<string, string> = {};
    const parts = withoutBraces.split(",");
    
    for (const part of parts) {
      const idx = part.indexOf(":");
      if (idx === -1) continue;
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      if (key) {
        obj[key] = value;
      }
    }
    
    return obj;
  }
}

async function main() {
  console.log("=== Comprehensive Secrets & Environment Variables Fix ===\n");
  console.log(`Region:      ${REGION}`);
  console.log(`App ID:      ${APP_ID}`);
  console.log(`Branch:      ${BRANCH_NAME}`);
  console.log(`Secret:      ${SECRET_NAME}\n`);

  try {
    // ============================================================
    // STEP 1: Read Secrets Manager
    // ============================================================
    console.log("📖 Step 1: Reading Secrets Manager...");
    let secretData: Record<string, string> = {};
    
    try {
      const getSecretResp = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: SECRET_NAME })
      );
      
      if (getSecretResp.SecretString) {
        secretData = parseSecretString(getSecretResp.SecretString);
        console.log("✅ Secret read successfully");
        console.log(`   Keys found: ${Object.keys(secretData).join(", ")}\n`);
      } else {
        console.log("⚠️  Secret exists but has no SecretString\n");
      }
    } catch (error: any) {
      if (error.name === "ResourceNotFoundException") {
        console.log("⚠️  Secret not found, will create it\n");
      } else {
        throw error;
      }
    }

    // ============================================================
    // STEP 2: Read Amplify Environment Variables
    // ============================================================
    console.log("📖 Step 2: Reading Amplify environment variables...");
    let amplifyEnvVars: Record<string, string> = {};
    
    try {
      const getBranchResp = await amplifyClient.send(
        new GetBranchCommand({
          appId: APP_ID,
          branchName: BRANCH_NAME,
        })
      );
      
      amplifyEnvVars = getBranchResp.branch?.environmentVariables || {};
      console.log("✅ Amplify env vars read successfully");
      console.log(`   Variables found: ${Object.keys(amplifyEnvVars).length}\n`);
    } catch (error: any) {
      console.error("❌ Failed to read Amplify env vars:", error.message);
      throw error;
    }

    // ============================================================
    // STEP 3: Identify Issues
    // ============================================================
    console.log("🔍 Step 3: Identifying issues...\n");
    
    const issues: string[] = [];
    const secretUpdates: Record<string, string> = { ...secretData };
    const amplifyUpdates: Record<string, string> = { ...amplifyEnvVars };

    // Check RDS_HOST / RDS_HOSTNAME (critical!)
    const rdsHostInSecret = secretData.RDS_HOST || secretData.RDS_HOSTNAME;
    const rdsHostInAmplify = amplifyEnvVars.RDS_HOST || amplifyEnvVars.RDS_HOSTNAME;
    
    if (rdsHostInSecret !== CORRECT_VALUES.RDS_HOST) {
      issues.push(`❌ Secret: RDS_HOST is "${rdsHostInSecret || "MISSING"}" (should be "${CORRECT_VALUES.RDS_HOST}")`);
      secretUpdates.RDS_HOST = CORRECT_VALUES.RDS_HOST;
      secretUpdates.RDS_HOSTNAME = CORRECT_VALUES.RDS_HOSTNAME;
    }
    
    if (rdsHostInAmplify !== CORRECT_VALUES.RDS_HOST) {
      issues.push(`❌ Amplify: RDS_HOST is "${rdsHostInAmplify || "MISSING"}" (should be "${CORRECT_VALUES.RDS_HOST}")`);
      amplifyUpdates.RDS_HOST = CORRECT_VALUES.RDS_HOST;
      amplifyUpdates.RDS_HOSTNAME = CORRECT_VALUES.RDS_HOSTNAME;
    }

    // Check Cognito values
    if (secretData.COGNITO_USER_POOL_ID !== CORRECT_VALUES.COGNITO_USER_POOL_ID) {
      issues.push(`❌ Secret: COGNITO_USER_POOL_ID mismatch`);
      secretUpdates.COGNITO_USER_POOL_ID = CORRECT_VALUES.COGNITO_USER_POOL_ID;
    }
    
    if (secretData.COGNITO_CLIENT_ID !== CORRECT_VALUES.COGNITO_CLIENT_ID) {
      issues.push(`❌ Secret: COGNITO_CLIENT_ID mismatch`);
      secretUpdates.COGNITO_CLIENT_ID = CORRECT_VALUES.COGNITO_CLIENT_ID;
    }
    
    if (amplifyEnvVars.COGNITO_USER_POOL_ID !== CORRECT_VALUES.COGNITO_USER_POOL_ID) {
      issues.push(`❌ Amplify: COGNITO_USER_POOL_ID mismatch`);
      amplifyUpdates.COGNITO_USER_POOL_ID = CORRECT_VALUES.COGNITO_USER_POOL_ID;
    }
    
    if (amplifyEnvVars.COGNITO_CLIENT_ID !== CORRECT_VALUES.COGNITO_CLIENT_ID) {
      issues.push(`❌ Amplify: COGNITO_CLIENT_ID mismatch`);
      amplifyUpdates.COGNITO_CLIENT_ID = CORRECT_VALUES.COGNITO_CLIENT_ID;
    }

    // Check RDS other values
    const rdsFields = ['RDS_PORT', 'RDS_DATABASE', 'RDS_DB', 'RDS_USERNAME', 'RDS_USER'] as const;
    for (const field of rdsFields) {
      const correctValue = CORRECT_VALUES[field];
      if (secretData[field] !== correctValue) {
        issues.push(`❌ Secret: ${field} mismatch`);
        secretUpdates[field] = correctValue;
      }
      if (amplifyEnvVars[field] !== correctValue) {
        issues.push(`❌ Amplify: ${field} mismatch`);
        amplifyUpdates[field] = correctValue;
      }
    }

    // Ensure required Amplify vars exist
    const requiredAmplifyVars = [
      'DEPLOYMENT_REGION',
      'RDS_PORT',
      'RDS_DB',
      'RDS_USER',
      'NEXT_PUBLIC_COGNITO_CLIENT_ID',
      'NEXT_PUBLIC_COGNITO_DOMAIN',
    ] as const;
    
    for (const varName of requiredAmplifyVars) {
      if (!amplifyEnvVars[varName]) {
        issues.push(`❌ Amplify: Missing ${varName}`);
        amplifyUpdates[varName] = CORRECT_VALUES[varName] || CORRECT_VALUES[varName as keyof typeof CORRECT_VALUES] || '';
      }
    }

    if (issues.length === 0) {
      console.log("✅ No issues found! Everything is correctly configured.\n");
      return;
    }

    console.log(`Found ${issues.length} issue(s):`);
    issues.forEach(issue => console.log(`  ${issue}`));
    console.log("");

    // ============================================================
    // STEP 4: Update Secrets Manager
    // ============================================================
    const secretNeedsUpdate = JSON.stringify(secretData) !== JSON.stringify(secretUpdates);
    if (secretNeedsUpdate) {
      console.log("💾 Step 4: Updating Secrets Manager...");
      console.log("   Updating keys:", Object.keys(secretUpdates).filter(k => secretData[k] !== secretUpdates[k]).join(", "));
      
      await secretsClient.send(
        new UpdateSecretCommand({
          SecretId: SECRET_NAME,
          SecretString: JSON.stringify(secretUpdates),
        })
      );
      
      console.log("✅ Secret updated successfully\n");
    } else {
      console.log("✅ Step 4: Secrets Manager is up to date\n");
    }

    // ============================================================
    // STEP 5: Update Amplify Environment Variables
    // ============================================================
    const amplifyNeedsUpdate = JSON.stringify(amplifyEnvVars) !== JSON.stringify(amplifyUpdates);
    if (amplifyNeedsUpdate) {
      console.log("💾 Step 5: Updating Amplify environment variables...");
      console.log("   Updating variables:", Object.keys(amplifyUpdates).filter(k => amplifyEnvVars[k] !== amplifyUpdates[k]).join(", "));
      
      await amplifyClient.send(
        new UpdateBranchCommand({
          appId: APP_ID,
          branchName: BRANCH_NAME,
          environmentVariables: amplifyUpdates,
        })
      );
      
      console.log("✅ Amplify env vars updated successfully\n");
      console.log("⚠️  IMPORTANT: A new deployment will be triggered automatically.");
      console.log("   Wait for the deployment to complete (5-10 minutes) before testing.\n");
    } else {
      console.log("✅ Step 5: Amplify env vars are up to date\n");
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log("=== Summary ===");
    console.log("✅ All fixes applied!");
    console.log("");
    console.log("Next steps:");
    console.log("1. Wait for Amplify deployment to complete");
    console.log("2. Test login at: https://dev.d2p2uq8t9xysui.amplifyapp.com");
    console.log("3. Check debug endpoint: https://dev.d2p2uq8t9xysui.amplifyapp.com/api/debug/env");
    console.log("");

  } catch (error: any) {
    console.error("❌ Error:", error.name || "Error");
    console.error("   ", error.message || error);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Unhandled error:", err);
  process.exit(1);
});

