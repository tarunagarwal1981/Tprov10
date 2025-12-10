/**
 * Reset User Password in Cognito
 * 
 * This script resets a user's password in Cognito
 * 
 * Usage:
 *   npx ts-node aws-migration-scripts/reset-user-password.ts <email> <new-password>
 * 
 * Example:
 *   npx ts-node aws-migration-scripts/reset-user-password.ts agent@gmail.com Agent123!
 */

import { 
  CognitoIdentityProviderClient, 
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognito = new CognitoIdentityProviderClient({ 
  region: process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1' 
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

if (!USER_POOL_ID) {
  console.error('❌ COGNITO_USER_POOL_ID is not set');
  process.exit(1);
}

async function resetPassword(email: string, newPassword: string) {
  try {
    // First, check if user exists
    console.log(`🔍 Checking if user exists: ${email}`);
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });

    const userResponse = await cognito.send(getUserCommand);
    console.log(`✅ User found: ${userResponse.Username}`);
    console.log(`   Status: ${userResponse.UserStatus}`);

    // Reset password
    console.log(`\n🔐 Resetting password...`);
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: newPassword,
      Permanent: true, // Set as permanent password (user doesn't need to change it)
    });

    await cognito.send(setPasswordCommand);
    console.log(`✅ Password reset successfully!`);
    console.log(`\n📝 User can now login with:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);

  } catch (error: any) {
    if (error.name === 'UserNotFoundException') {
      console.error(`❌ User not found: ${email}`);
      console.error(`   Make sure the user exists in Cognito User Pool`);
    } else if (error.name === 'InvalidPasswordException') {
      console.error(`❌ Invalid password: ${error.message}`);
      console.error(`   Password must meet Cognito password policy:`);
      console.error(`   - Minimum 8 characters`);
      console.error(`   - At least one uppercase letter`);
      console.error(`   - At least one lowercase letter`);
      console.error(`   - At least one number`);
      console.error(`   - At least one special character`);
    } else {
      console.error(`❌ Error: ${error.name}`);
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Get command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: npx ts-node aws-migration-scripts/reset-user-password.ts <email> <new-password>');
  console.error('\nExample:');
  console.error('  npx ts-node aws-migration-scripts/reset-user-password.ts agent@gmail.com Agent123!');
  process.exit(1);
}

resetPassword(email, password).catch((error) => {
  console.error('Failed to reset password:', error);
  process.exit(1);
});

