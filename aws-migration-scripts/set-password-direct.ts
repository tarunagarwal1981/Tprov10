/**
 * Set Password Directly in Cognito (No Email Sent)
 * 
 * This sets the password directly without sending an email to the user.
 * Use this when you want to change a password without notifying the user.
 * 
 * Usage:
 *   npx ts-node aws-migration-scripts/set-password-direct.ts <email> <new-password>
 * 
 * Example:
 *   npx ts-node aws-migration-scripts/set-password-direct.ts agent@gmail.com NewPassword123!
 */

import {
  CognitoIdentityProviderClient,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognito = new CognitoIdentityProviderClient({
  region: process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1'
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "us-east-1_oF5qfa2IX";

if (!USER_POOL_ID) {
  console.error('❌ COGNITO_USER_POOL_ID is not set');
  process.exit(1);
}

async function setPasswordDirect(email: string, newPassword: string) {
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
    console.log('');

    // Set password directly (no email sent)
    console.log(`🔐 Setting password directly (no email will be sent)...`);
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: newPassword,
      Permanent: true, // Set as permanent password
    });

    await cognito.send(setPasswordCommand);
    console.log(`✅ Password set successfully!`);
    console.log(`   No email was sent to the user`);
    console.log('');
    console.log(`📝 User can now login with:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('');
    console.log(`⚠️  Share the password with the user securely!`);

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
  console.error('Usage: npx ts-node aws-migration-scripts/set-password-direct.ts <email> <new-password>');
  console.error('');
  console.error('Example:');
  console.error('  npx ts-node aws-migration-scripts/set-password-direct.ts agent@gmail.com NewPassword123!');
  process.exit(1);
}

setPasswordDirect(email, password).catch((error) => {
  console.error('Failed to set password:', error);
  process.exit(1);
});

