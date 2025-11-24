/**
 * Remove Force Change Password Requirement for ALL Users
 * 
 * This script finds all users with FORCE_CHANGE_PASSWORD status
 * and sets permanent passwords for them.
 * 
 * Usage:
 *   npx ts-node aws-migration-scripts/remove-force-change-all-users.ts
 */

import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import * as crypto from "crypto";

const cognito = new CognitoIdentityProviderClient({
  region: process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1'
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "us-east-1_oF5qfa2IX";

if (!USER_POOL_ID) {
  console.error('❌ COGNITO_USER_POOL_ID is not set');
  process.exit(1);
}

/**
 * Generate a secure random password
 */
function generateSecurePassword(): string {
  const length = 12;
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";
  const allChars = lowercase + uppercase + numbers + symbols;
  
  // Ensure at least one of each type
  let password = "";
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Get all users from Cognito
 */
async function getAllUsers(): Promise<any[]> {
  console.log('🔍 Fetching all users from Cognito...');
  
  const allUsers: any[] = [];
  let paginationToken: string | undefined = undefined;
  
  do {
    const command = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      PaginationToken: paginationToken,
    });
    
    const response: any = await cognito.send(command);
    
    if (response.Users) {
      allUsers.push(...response.Users);
    }
    
    paginationToken = response.PaginationToken;
  } while (paginationToken);
  
  console.log(`✅ Found ${allUsers.length} users\n`);
  return allUsers;
}

/**
 * Get email attribute from user
 */
function getUserEmail(user: any): string {
  const emailAttr = user.Attributes?.find((attr: any) => attr.Name === 'email');
  return emailAttr?.Value || user.Username;
}

/**
 * Main function
 */
async function main() {
  console.log('=== Remove Force Change Password for All Users ===\n');
  
  try {
    // Get all users
    const allUsers = await getAllUsers();
    
    // Filter users with FORCE_CHANGE_PASSWORD status
    const usersToFix = allUsers.filter(
      (user) => user.UserStatus === 'FORCE_CHANGE_PASSWORD'
    );
    
    if (usersToFix.length === 0) {
      console.log('✅ No users with FORCE_CHANGE_PASSWORD status found!');
      console.log('   All users are already set up correctly.\n');
      return;
    }
    
    console.log(`📋 Found ${usersToFix.length} users with FORCE_CHANGE_PASSWORD status:`);
    usersToFix.forEach((user) => {
      const email = getUserEmail(user);
      console.log(`   - ${user.Username} (${email})`);
    });
    console.log('');
    
    // For automated execution, proceed without confirmation
    // If you want confirmation, uncomment the following:
    /*
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>((resolve) => {
      rl.question('Do you want to set permanent passwords for these users? (yes/no): ', resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('❌ Operation cancelled');
      return;
    }
    */
    
    console.log('🔐 Setting permanent passwords...\n');
    
    const passwords: Record<string, string> = {};
    let successCount = 0;
    let failCount = 0;
    
    for (const user of usersToFix) {
      const username = user.Username;
      const email = getUserEmail(user);
      
      console.log(`Processing: ${username} (${email})...`);
      
      try {
        // Generate a secure password
        const newPassword = generateSecurePassword();
        passwords[email] = newPassword;
        
        // Set permanent password
        const setPasswordCommand = new AdminSetUserPasswordCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
          Password: newPassword,
          Permanent: true, // This removes the force change requirement
        });
        
        await cognito.send(setPasswordCommand);
        console.log('   ✅ Password set as permanent');
        successCount++;
        
      } catch (error: any) {
        console.log(`   ❌ Failed: ${error.name} - ${error.message}`);
        failCount++;
        delete passwords[email];
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`✅ Successfully updated: ${successCount} users`);
    if (failCount > 0) {
      console.log(`❌ Failed: ${failCount} users`);
    }
    console.log('');
    
    // Save passwords to file
    if (successCount > 0) {
      const fs = require('fs');
      const path = require('path');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const passwordFile = path.join(process.cwd(), `cognito-passwords-${timestamp}.txt`);
      
      const passwordContent = Object.entries(passwords)
        .map(([email, password]) => `${email}: ${password}`)
        .join('\n');
      
      fs.writeFileSync(passwordFile, passwordContent, 'utf8');
      
      console.log(`📝 Passwords saved to: ${passwordFile}`);
      console.log('   ⚠️  Keep this file secure and share passwords with users!');
      console.log('');
    }
    
    console.log('✅ All users updated!');
    console.log('');
    console.log('📧 Next steps:');
    console.log('  1. Share passwords with users (from password file)');
    console.log('  2. Users can now login without being forced to change password');
    console.log('  3. Users can change their password after login if desired');
    
  } catch (error: any) {
    console.error('❌ Error:', error.name);
    console.error('   ', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('Failed:', error);
  process.exit(1);
});

