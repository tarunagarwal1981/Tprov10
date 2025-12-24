/**
 * Script to check IAM permissions for S3 access
 * This helps identify if there's a deny policy blocking access
 * 
 * Run with: node scripts/check-iam-permissions.js
 */

const { IAMClient, GetUserCommand, ListAttachedUserPoliciesCommand, GetUserPolicyCommand, ListUserPoliciesCommand } = require('@aws-sdk/client-iam');
require('dotenv').config({ path: '.env.local' });

async function checkIAMPermissions() {
  const client = new IAMClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const userName = 'tarunagarwal';

  try {
    console.log('🔍 Checking IAM permissions for user:', userName);
    console.log('');

    // Get user info
    const userResult = await client.send(new GetUserCommand({ UserName: userName }));
    console.log('✅ User found:', userResult.User.UserName);
    console.log('   ARN:', userResult.User.Arn);
    console.log('');

    // List attached managed policies
    console.log('📋 Checking attached managed policies...');
    const attachedPolicies = await client.send(
      new ListAttachedUserPoliciesCommand({ UserName: userName })
    );

    if (attachedPolicies.AttachedPolicies && attachedPolicies.AttachedPolicies.length > 0) {
      console.log(`   Found ${attachedPolicies.AttachedPolicies.length} attached policy(ies):`);
      for (const policy of attachedPolicies.AttachedPolicies) {
        console.log(`   - ${policy.PolicyName} (${policy.PolicyArn})`);
      }
    } else {
      console.log('   No attached managed policies found');
    }
    console.log('');

    // List inline policies
    console.log('📋 Checking inline policies...');
    const inlinePolicies = await client.send(
      new ListUserPoliciesCommand({ UserName: userName })
    );

    if (inlinePolicies.PolicyNames && inlinePolicies.PolicyNames.length > 0) {
      console.log(`   Found ${inlinePolicies.PolicyNames.length} inline policy(ies):`);
      for (const policyName of inlinePolicies.PolicyNames) {
        console.log(`   - ${policyName}`);
        
        // Get policy document
        try {
          const policyDoc = await client.send(
            new GetUserPolicyCommand({ UserName: userName, PolicyName: policyName })
          );
          
          // Decode the policy document
          const policy = JSON.parse(decodeURIComponent(policyDoc.PolicyDocument));
          
          console.log(`     Policy document:`);
          console.log(JSON.stringify(policy, null, 2));
          
          // Check for deny statements
          if (policy.Statement) {
            const denyStatements = policy.Statement.filter(
              (stmt) => stmt.Effect === 'Deny' && 
              (stmt.Action === 's3:GetObject' || 
               (Array.isArray(stmt.Action) && stmt.Action.includes('s3:GetObject')) ||
               stmt.Action === 's3:*' ||
               (Array.isArray(stmt.Action) && stmt.Action.includes('s3:*')))
            );
            
            if (denyStatements.length > 0) {
              console.log(`     ⚠️  WARNING: Found DENY statements blocking S3 access:`);
              denyStatements.forEach((stmt, idx) => {
                console.log(`     Deny Statement ${idx + 1}:`);
                console.log(`       Action: ${JSON.stringify(stmt.Action)}`);
                console.log(`       Resource: ${JSON.stringify(stmt.Resource)}`);
              });
            }
          }
        } catch (error) {
          console.log(`     ⚠️  Could not retrieve policy document: ${error.message}`);
        }
      }
    } else {
      console.log('   No inline policies found');
    }
    console.log('');

    console.log('📝 Summary:');
    console.log('   If you see DENY statements above, those are blocking S3 access.');
    console.log('   You need to either:');
    console.log('   1. Remove the deny policy');
    console.log('   2. Update it to exclude travel-app-storage-1769 bucket');
    console.log('   3. Add an exception for your bucket');
    console.log('');
    console.log('   See FIX_IAM_DENY_POLICY.md for detailed instructions.');

  } catch (error) {
    if (error.name === 'NoSuchEntity') {
      console.error('❌ User not found:', userName);
      console.error('   Make sure the user exists in IAM');
    } else if (error.name === 'AccessDenied') {
      console.error('❌ Access denied. You need IAM permissions to check user policies.');
      console.error('   Error:', error.message);
    } else {
      console.error('❌ Error:', error.message);
      console.error('   Code:', error.name);
    }
    throw error;
  }
}

// Run the script
checkIAMPermissions()
  .then(() => {
    console.log('\n✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
