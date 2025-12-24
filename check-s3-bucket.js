#!/usr/bin/env node

/**
 * Check if a specific S3 bucket exists and get its details
 * This works even without ListAllMyBuckets permission
 */

const { S3Client, HeadBucketCommand, GetBucketLocationCommand, GetBucketCorsCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'travel-app-storage-1769';
const REGION = process.env.AWS_REGION || process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1';

// Use credentials from environment or .env.local
const s3Client = new S3Client({
  region: REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

async function checkBucket() {
  console.log('🔍 Checking S3 bucket...\n');
  console.log('📦 Bucket name:', BUCKET_NAME);
  console.log('📍 Region:', REGION);
  console.log('🔑 Using credentials:', process.env.AWS_ACCESS_KEY_ID ? 'From environment' : 'Default credential chain');
  console.log('');

  try {
    // Check if bucket exists and we have access
    console.log('1️⃣  Checking if bucket exists and is accessible...');
    const headCommand = new HeadBucketCommand({ Bucket: BUCKET_NAME });
    await s3Client.send(headCommand);
    console.log('   ✅ Bucket exists and is accessible!\n');

    // Get bucket location
    try {
      console.log('2️⃣  Getting bucket region...');
      const locationCommand = new GetBucketLocationCommand({ Bucket: BUCKET_NAME });
      const locationResponse = await s3Client.send(locationCommand);
      const bucketRegion = locationResponse.LocationConstraint || 'us-east-1';
      console.log(`   ✅ Bucket region: ${bucketRegion}\n`);
    } catch (err) {
      console.log(`   ⚠️  Could not determine region: ${err.message}\n`);
    }

    // Check CORS configuration
    try {
      console.log('3️⃣  Checking CORS configuration...');
      const corsCommand = new GetBucketCorsCommand({ Bucket: BUCKET_NAME });
      const corsResponse = await s3Client.send(corsCommand);
      if (corsResponse.CORSRules && corsResponse.CORSRules.length > 0) {
        console.log(`   ✅ CORS is configured (${corsResponse.CORSRules.length} rule(s)):`);
        corsResponse.CORSRules.forEach((rule, index) => {
          console.log(`      Rule ${index + 1}:`);
          console.log(`         AllowedOrigins: ${rule.AllowedOrigins?.join(', ') || 'none'}`);
          console.log(`         AllowedMethods: ${rule.AllowedMethods?.join(', ') || 'none'}`);
        });
      } else {
        console.log('   ❌ CORS is NOT configured');
      }
      console.log('');
    } catch (err) {
      if (err.name === 'NoSuchCORSConfiguration') {
        console.log('   ❌ CORS is NOT configured\n');
      } else {
        console.log(`   ⚠️  Could not check CORS: ${err.message}\n`);
      }
    }

    // Try to list some objects (to verify we can access the bucket)
    try {
      console.log('4️⃣  Checking bucket access (listing first 5 objects)...');
      const listCommand = new ListObjectsV2Command({ 
        Bucket: BUCKET_NAME,
        MaxKeys: 5 
      });
      const listResponse = await s3Client.send(listCommand);
      if (listResponse.Contents && listResponse.Contents.length > 0) {
        console.log(`   ✅ Found ${listResponse.Contents.length} object(s) (showing first 5):`);
        listResponse.Contents.forEach((obj, index) => {
          console.log(`      ${index + 1}. ${obj.Key} (${(obj.Size / 1024).toFixed(2)} KB)`);
        });
        if (listResponse.KeyCount && listResponse.KeyCount > 5) {
          console.log(`      ... and ${listResponse.KeyCount - 5} more`);
        }
      } else {
        console.log('   ℹ️  Bucket is empty (no objects found)');
      }
      console.log('');
    } catch (err) {
      console.log(`   ⚠️  Could not list objects: ${err.message}\n`);
    }

    console.log('✨ Summary:');
    console.log(`   Bucket Name: ${BUCKET_NAME}`);
    console.log(`   Status: ✅ Accessible`);
    console.log(`   Region: ${REGION}`);
    console.log('');
    console.log('💡 To configure CORS, use AWS Console or update IAM permissions.');

  } catch (error) {
    console.error('❌ Error checking bucket:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.$metadata) {
      console.error('Request ID:', error.$metadata.requestId);
      console.error('HTTP Status:', error.$metadata.httpStatusCode);
    }
    
    if (error.name === 'NotFound' || error.name === 'NoSuchBucket') {
      console.error(`\n❌ Bucket "${BUCKET_NAME}" does not exist or is not accessible.`);
      console.error('💡 Check if:');
      console.error('   1. The bucket name is correct');
      console.error('   2. The bucket is in the correct region');
      console.error('   3. You have permission to access this bucket');
    } else if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
      console.error('\n💡 Credential issue. Check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
    } else if (error.name === 'AccessDenied') {
      console.error(`\n💡 Permission issue. The IAM user may not have permission to access bucket "${BUCKET_NAME}".`);
      console.error('   Required permissions: s3:HeadBucket, s3:GetBucketLocation, s3:GetBucketCORS, s3:ListBucket');
    }
    
    process.exit(1);
  }
}

async function main() {
  await checkBucket();
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
