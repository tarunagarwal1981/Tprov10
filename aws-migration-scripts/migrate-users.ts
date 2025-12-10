/**
 * User Migration Script: Supabase → AWS Cognito
 * 
 * This script migrates all users from Supabase to AWS Cognito User Pool
 * 
 * Usage:
 *   npx ts-node aws-migration-scripts/migrate-users.ts
 * 
 * Environment Variables Required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
 *   COGNITO_USER_POOL_ID - AWS Cognito User Pool ID
 *   COGNITO_CLIENT_ID - AWS Cognito App Client ID
 *   AWS_REGION - AWS region (default: us-east-1)
 */

import { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { createClient } from "@supabase/supabase-js";
import { Pool } from 'pg';

// Create database pool for RDS
const dbPool = new Pool({
  host: process.env.RDS_HOSTNAME || process.env.RDS_HOST,
  port: parseInt(process.env.RDS_PORT || '5432'),
  database: process.env.RDS_DATABASE || 'postgres',
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

// Initialize clients
// Use NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabase = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const cognito = new CognitoIdentityProviderClient({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;

interface SupabaseUser {
  id: string;
  email: string;
  role?: string;
  name?: string;
  created_at?: string;
}

/**
 * Generate a secure temporary password
 */
function generateTempPassword(): string {
  const length = 16;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Check if user already exists in Cognito
 */
async function userExistsInCognito(email: string): Promise<boolean> {
  try {
    const command = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${email}"`,
      Limit: 1,
    });
    
    const response = await cognito.send(command);
    return (response.Users?.length || 0) > 0;
  } catch (error) {
    console.error(`Error checking user existence:`, error);
    return false;
  }
}

/**
 * Migrate a single user from Supabase to Cognito
 */
async function migrateUser(user: SupabaseUser): Promise<{ success: boolean; cognitoSub?: string; error?: string }> {
  try {
    // Check if user already exists
    const exists = await userExistsInCognito(user.email);
    if (exists) {
      console.log(`⚠️  User already exists in Cognito: ${user.email}`);
      return { success: false, error: 'User already exists' };
    }

    // Create user in Cognito
    const tempPassword = generateTempPassword();
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: user.email,
      UserAttributes: [
        { Name: 'email', Value: user.email },
        { Name: 'email_verified', Value: 'true' },
        ...(user.role ? [{ Name: 'custom:role', Value: user.role }] : []),
        { Name: 'custom:supabase_user_id', Value: user.id }, // Map to old Supabase ID
        ...(user.name ? [{ Name: 'name', Value: user.name }] : []),
      ],
      MessageAction: 'SUPPRESS', // Don't send welcome email
      TemporaryPassword: tempPassword,
      DesiredDeliveryMediums: ['EMAIL'],
    });

    const createResponse = await cognito.send(createCommand);
    const cognitoSub = createResponse.User?.Username;

    if (!cognitoSub) {
      throw new Error('Failed to get Cognito user ID');
    }

    // Set permanent password (user will need to change on first login)
    // Note: In production, you might want to send password reset email instead
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: cognitoSub,
      Password: tempPassword,
      Permanent: false, // User must change password on first login
    });

    await cognito.send(setPasswordCommand);

    // Update user record in database with Cognito sub
    // This allows mapping between old Supabase IDs and new Cognito IDs
    try {
      await dbPool.query(
        `UPDATE users 
         SET cognito_sub = $1, migrated_at = NOW() 
         WHERE id = $2`,
        [cognitoSub, user.id]
      );
    } catch (dbError: any) {
      console.warn(`⚠️  Could not update database for ${user.email}: ${dbError.message}`);
      // Continue even if database update fails
    }

    console.log(`✅ Migrated user: ${user.email} (${user.id} → ${cognitoSub})`);
    return { success: true, cognitoSub };
  } catch (error: any) {
    if (error.name === 'UsernameExistsException') {
      console.log(`⚠️  User already exists: ${user.email}`);
      return { success: false, error: 'User already exists' };
    }
    console.error(`❌ Failed to migrate ${user.email}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main migration function
 */
async function migrateUsers() {
  console.log('🚀 Starting user migration from Supabase to AWS Cognito...\n');

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY');
  }

  if (!USER_POOL_ID || !CLIENT_ID) {
    throw new Error('Missing Cognito credentials. Set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID');
  }

  try {
    // Get all users from Supabase
    console.log('📥 Fetching users from Supabase...');
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, name, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }

    if (!users || users.length === 0) {
      console.log('ℹ️  No users found in Supabase');
      return;
    }

    console.log(`Found ${users.length} users to migrate\n`);

    // Add cognito_sub column if it doesn't exist
    try {
      await dbPool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS cognito_sub TEXT,
        ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP WITH TIME ZONE
      `);
      console.log('✅ Database schema updated\n');
    } catch (error: any) {
      console.warn(`⚠️  Could not add cognito_sub column: ${error.message}`);
      console.warn('⚠️  Continuing migration without database updates...\n');
    }

    // Migrate each user
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      const result = await migrateUser(user);
      
      if (result.success) {
        successCount++;
      } else if (result.error === 'User already exists') {
        skippedCount++;
      } else {
        errorCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`⚠️  Skipped (already exists): ${skippedCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📦 Total processed: ${users.length}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some users failed to migrate. Review errors above.');
    } else {
      console.log('\n🎉 Migration completed successfully!');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await dbPool.end();
  }
}

// Run migration if this file is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || 
                     process.argv[1]?.endsWith('migrate-users.ts') ||
                     process.argv[1]?.endsWith('migrate-users.js');

if (isMainModule || !process.env.VITEST) {
  migrateUsers().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export { migrateUser, migrateUsers };

