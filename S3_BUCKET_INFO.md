# S3 Bucket Information

## Bucket Details

Based on the application logs and environment configuration:

- **Bucket Name**: `travel-app-storage-1769`
- **Region**: `us-east-1`
- **Status**: ✅ Bucket exists and is accessible (presigned URLs are being generated successfully)

## Current Issue

The bucket exists and presigned URLs are being generated correctly, but images are getting **403 Forbidden** errors when loaded in the browser. This is a **CORS (Cross-Origin Resource Sharing)** issue.

## Evidence

1. ✅ Presigned URLs are being generated successfully (logs show 550-character URLs with proper signatures)
2. ✅ S3 uploads are working (images are being saved to the bucket)
3. ❌ Browser requests to presigned URLs return 403 Forbidden
4. ❌ CORS is not configured (or not configured correctly)

## Required CORS Configuration

The bucket needs CORS configuration to allow requests from:

- `http://localhost:3000` (local development)
- `http://localhost:3001` (local development)
- `http://127.0.0.1:3000` (local development)
- `https://travelselbuy.com` (production)
- `https://www.travelselbuy.com` (production)
- `https://dev.travelselbuy.com` (development)

## How to Configure CORS

Since the IAM user `tarunagarwal` doesn't have permission to update CORS, you need to:

### Option 1: AWS Console (Recommended)

1. Go to: https://console.aws.amazon.com/s3/
2. Navigate to bucket: `travel-app-storage-1769`
3. Go to: **Permissions** → **CORS**
4. Paste the configuration from `cors-config.json`
5. Click **Save changes**

### Option 2: Use Admin/Root Account

If you have admin access:
1. Use admin credentials
2. Run: `node fix-s3-cors.js`

### Option 3: Update IAM Permissions

1. Go to: https://console.aws.amazon.com/iam/
2. Users → `tarunagarwal` → Permissions
3. Add policy allowing:
   - `s3:PutBucketCORS`
   - `s3:GetBucketCORS`
   - `s3:GetBucketLocation`
4. Then run: `node fix-s3-cors.js`

## CORS Configuration File

The CORS configuration is ready in `cors-config.json`. Copy its contents and paste into AWS Console.

## After CORS is Configured

Once CORS is properly configured:
1. The 403 errors should stop
2. Images should load correctly in the browser
3. Presigned URLs will work from all configured origins

## Verification

After configuring CORS, you can verify by:
1. Refreshing the application
2. Checking browser console - 403 errors should be gone
3. Images should display correctly
