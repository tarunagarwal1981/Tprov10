#!/usr/bin/env node

/**
 * Fix S3 CORS Configuration
 * This script configures CORS for the S3 bucket to allow presigned URL access
 */

const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
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
  } : undefined, // Will use default credential chain if not provided
});

const corsConfig = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
      AllowedOrigins: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'https://*.netlify.app',
        'https://*.amplifyapp.com',
        '*', // Allow all origins for presigned URLs
      ],
      ExposeHeaders: [
        'ETag',
        'x-amz-server-side-encryption',
        'x-amz-request-id',
        'x-amz-id-2',
        'Content-Length',
        'Content-Type',
      ],
      MaxAgeSeconds: 3600,
    },
  ],
};

async function checkCurrentCORS() {
  try {
    const command = new GetBucketCorsCommand({ Bucket: BUCKET_NAME });
    const response = await s3Client.send(command);
    console.log('📋 Current CORS configuration:');
    console.log(JSON.stringify(response.CORSRules, null, 2));
    return response.CORSRules;
  } catch (error) {
    if (error.name === 'NoSuchCORSConfiguration') {
      console.log('⚠️  No CORS configuration found');
      return null;
    }
    throw error;
  }
}

async function updateCORS() {
  try {
    console.log('🔧 Configuring CORS for S3 bucket:', BUCKET_NAME);
    console.log('📍 Region:', REGION);
    console.log('📝 CORS Configuration:');
    console.log(JSON.stringify(corsConfig, null, 2));

    const command = new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: corsConfig,
    });

    await s3Client.send(command);
    console.log('✅ CORS configuration updated successfully!');
    
    // Verify the configuration
    console.log('\n🔍 Verifying CORS configuration...');
    const currentCORS = await checkCurrentCORS();
    if (currentCORS) {
      console.log('✅ CORS configuration verified');
    }
  } catch (error) {
    console.error('❌ Error configuring CORS:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.$metadata) {
      console.error('Request ID:', error.$metadata.requestId);
      console.error('HTTP Status:', error.$metadata.httpStatusCode);
    }
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Starting S3 CORS configuration fix...\n');
  
  // Check current CORS
  console.log('📋 Checking current CORS configuration...');
  const currentCORS = await checkCurrentCORS();
  console.log('');
  
  if (currentCORS && currentCORS.length > 0) {
    console.log('✅ CORS is already configured. Current rules:');
    currentCORS.forEach((rule, index) => {
      console.log(`\n  Rule ${index + 1}:`);
      console.log(`    AllowedOrigins: ${rule.AllowedOrigins?.join(', ') || 'none'}`);
      console.log(`    AllowedMethods: ${rule.AllowedMethods?.join(', ') || 'none'}`);
    });
    console.log('\n💡 If you still see 403 errors, the CORS config might need updating.');
    console.log('💡 You can update it via AWS Console (see FIX_S3_CORS_INSTRUCTIONS.md)');
    return;
  }
  
  // Update CORS
  await updateCORS();
  
  console.log('\n✨ Done! CORS configuration has been updated.');
  console.log('💡 Note: CORS changes may take a few seconds to propagate.');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
