#!/usr/bin/env node

/**
 * Check S3 Bucket Policy for deny statements
 */

const { S3Client, GetBucketPolicyCommand } = require('@aws-sdk/client-s3');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'travel-app-storage-1769';
const REGION = process.env.AWS_REGION || process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1';

const s3Client = new S3Client({
  region: REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

async function checkBucketPolicy() {
  console.log('🔍 Checking S3 Bucket Policy...\n');
  console.log('📦 Bucket:', BUCKET_NAME);
  console.log('📍 Region:', REGION);
  console.log('');

  try {
    const command = new GetBucketPolicyCommand({ Bucket: BUCKET_NAME });
    const response = await s3Client.send(command);
    
    if (response.Policy) {
      const policy = JSON.parse(response.Policy);
      console.log('✅ Bucket policy found:\n');
      console.log(JSON.stringify(policy, null, 2));
      console.log('');
      
      // Check for deny statements
      const denyStatements = (policy.Statement || []).filter((stmt) => stmt.Effect === 'Deny');
      
      if (denyStatements.length > 0) {
        console.log('⚠️  Found DENY statements in bucket policy:');
        denyStatements.forEach((stmt, index) => {
          console.log(`\n  Deny Statement ${index + 1}:`);
          console.log(`    Effect: ${stmt.Effect}`);
          console.log(`    Action: ${JSON.stringify(stmt.Action)}`);
          console.log(`    Resource: ${JSON.stringify(stmt.Resource)}`);
          console.log(`    Principal: ${JSON.stringify(stmt.Principal)}`);
          if (stmt.Condition) {
            console.log(`    Condition: ${JSON.stringify(stmt.Condition)}`);
          }
        });
        console.log('\n💡 These deny statements might be blocking access!');
      } else {
        console.log('✅ No deny statements found in bucket policy');
      }
    } else {
      console.log('ℹ️  No bucket policy configured');
    }
  } catch (error) {
    if (error.name === 'NoSuchBucketPolicy') {
      console.log('ℹ️  No bucket policy configured');
    } else {
      console.error('❌ Error checking bucket policy:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      if (error.name === 'AccessDenied') {
        console.error('\n💡 Permission issue. Need s3:GetBucketPolicy permission.');
      }
    }
  }
}

async function main() {
  await checkBucketPolicy();
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
