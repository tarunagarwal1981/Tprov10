#!/usr/bin/env ts-node
/**
 * ============================================================================
 * User Migration Script - Supabase to AWS Cognito
 * ============================================================================
 * 
 * This script migrates users from Supabase to AWS Cognito User Pool
 * 
 * Usage:
 *   npm install @aws-sdk/client-cognito-identity-provider @supabase/supabase-js
 *   ts-node 5-migrate-users.ts
 */

import { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { createClient } from "@supabase/supabase-js";

// Configuration - Replace with your values
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "";

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const cognito = new CognitoIdentityProviderClient({ region: AWS_REGION });

interface SupabaseUser {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  phone_number?: string;
  created_at: string;
}

async function migrateUsers() {
  console.log("🚀 Starting user migration from Supabase to Cognito...\n");

  try {
    // Fetch all users from Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch users from Supabase: ${error.message}`);
    }

    if (!users || users.length === 0) {
      console.log("No users found in Supabase");
      return;
    }

    console.log(`Found ${users.length} users to migrate\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ email: string; error: string }> = [];

    for (const user of users as SupabaseUser[]) {
      try {
        console.log(`Migrating: ${user.email}...`);

        // Step 1: Create user in Cognito
        const createUserCommand = new AdminCreateUserCommand({
          UserPoolId: COGNITO_USER_POOL_ID,
          Username: user.email,
          UserAttributes: [
            { Name: 'email', Value: user.email },
            { Name: 'email_verified', Value: 'true' }, // Mark as verified
            { Name: 'name', Value: user.full_name || '' },
            { Name: 'custom:role', Value: user.role || 'user' },
            { Name: 'custom:supabase_id', Value: user.id }, // Keep original ID for reference
          ],
          MessageAction: 'SUPPRESS', // Don't send welcome email (users already exist)
          DesiredDeliveryMediums: ['EMAIL'],
        });

        await cognito.send(createUserCommand);

        // Step 2: Set user status to CONFIRMED (since they're migrated users)
        // Note: Users will need to reset password on first login to AWS
        // Alternatively, you can set a temporary password

        console.log(`  ✅ Created: ${user.email}`);
        successCount++;

      } catch (error: any) {
        console.error(`  ❌ Failed: ${user.email} - ${error.message}`);
        errorCount++;
        errors.push({
          email: user.email,
          error: error.message,
        });

        // Continue with next user even if one fails
        continue;
      }
    }

    // Summary
    console.log("\n=== Migration Summary ===");
    console.log(`Total users: ${users.length}`);
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);

    if (errors.length > 0) {
      console.log("\n=== Errors ===");
      errors.forEach(({ email, error }) => {
        console.log(`${email}: ${error}`);
      });
    }

    console.log("\n📧 IMPORTANT: Users will need to reset their password on first login");
    console.log("Send password reset emails using script: 6-send-password-reset.ts");

  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

// Run migration
migrateUsers()
  .then(() => {
    console.log("\n✅ Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed:", error);
    process.exit(1);
  });


