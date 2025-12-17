#!/usr/bin/env node

/**
 * List all S3 buckets and their details
 * This script helps find the correct bucket name
 */

const { S3Client, ListBucketsCommand, GetBucketLocationCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const REGION = process.env.AWS_REGION || process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1';

// Use credentials from environment or .env.local
const s3Client = new S3Client({
  region: REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined, // Will use default credential chain if not provided
});

async function listAllBuckets() {
  try {
    console.log('🔍 Listing all S3 buckets...\n');
    console.log('📍 Region:', REGION);
    console.log('🔑 Using credentials:', process.env.AWS_ACCESS_KEY_ID ? 'From environment' : 'Default credential chain');
    console.log('');

    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    if (!response.Buckets || response.Buckets.length === 0) {
      console.log('⚠️  No buckets found');
      return;
    }

    console.log(`✅ Found ${response.Buckets.length} bucket(s):\n`);

    for (const bucket of response.Buckets) {
      const bucketName = bucket.Name;
      console.log(`📦 Bucket: ${bucketName}`);
      console.log(`   Created: ${bucket.CreationDate}`);
      
      // Get bucket location
      try {
        const locationCommand = new GetBucketLocationCommand({ Bucket: bucketName });
        const locationResponse = await s3Client.send(locationCommand);
        const bucketRegion = locationResponse.LocationConstraint || 'us-east-1';
        console.log(`   Region: ${bucketRegion}`);
      } catch (err) {
        console.log(`   Region: Unable to determine (${err.message})`);
      }

      // Check if it has CORS configured
      try {
        const corsCommand = new GetBucketCorsCommand({ Bucket: bucketName });
        const corsResponse = await s3Client.send(corsCommand);
        if (corsResponse.CORSRules && corsResponse.CORSRules.length > 0) {
          console.log(`   CORS: ✅ Configured (${corsResponse.CORSRules.length} rule(s))`);
          corsResponse.CORSRules.forEach((rule, index) => {
            console.log(`      Rule ${index + 1}: Origins: ${rule.AllowedOrigins?.join(', ') || 'none'}`);
          });
        } else {
          console.log(`   CORS: ❌ Not configured`);
        }
      } catch (err) {
        if (err.name === 'NoSuchCORSConfiguration') {
          console.log(`   CORS: ❌ Not configured`);
        } else {
          console.log(`   CORS: ⚠️  Unable to check (${err.message})`);
        }
      }

      // Check if it matches expected bucket name
      if (bucketName.includes('travel') || bucketName.includes('storage') || bucketName.includes('app')) {
        console.log(`   ⭐ Likely match for travel app!`);
      }

      console.log('');
    }

    // Look for the specific bucket we're looking for
    const expectedBucket = process.env.S3_BUCKET_NAME || 'travel-app-storage-1769';
    const foundBucket = response.Buckets.find(b => b.Name === expectedBucket);
    
    if (foundBucket) {
      console.log(`\n✅ Found expected bucket: ${expectedBucket}`);
    } else {
      console.log(`\n⚠️  Expected bucket "${expectedBucket}" not found in the list above.`);
      console.log(`💡 Check if the bucket name in .env.local is correct.`);
    }

  } catch (error) {
    console.error('❌ Error listing buckets:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.$metadata) {
      console.error('Request ID:', error.$metadata.requestId);
      console.error('HTTP Status:', error.$metadata.httpStatusCode);
    }
    
    if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
      console.error('\n💡 Credential issue. Check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
    } else if (error.name === 'AccessDenied') {
      console.error('\n💡 Permission issue. The IAM user may not have s3:ListAllMyBuckets permission.');
    }
    
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 S3 Bucket Discovery Tool\n');
  await listAllBuckets();
  console.log('✨ Done!');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
