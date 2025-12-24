# Fix S3 CORS Configuration

## Problem
The IAM user `tarunagarwal` doesn't have permission to update CORS configuration. The error shows:
```
User: arn:aws:iam::815660521604:user/tarunagarwal is not authorized to perform: s3:PutBucketCORS
```

## Solution Options

### Option 1: Update IAM Permissions (Recommended)

1. **Go to AWS IAM Console**: https://console.aws.amazon.com/iam/
2. **Navigate to**: Users → tarunagarwal → Permissions
3. **Check for Deny policies** that might be blocking `s3:PutBucketCORS`
4. **Add/Update Policy** to include:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutBucketCORS",
           "s3:GetBucketCORS",
           "s3:GetBucketLocation",
           "s3:ListBucket"
         ],
         "Resource": "arn:aws:s3:::travel-app-storage-1769"
       }
     ]
   }
   ```

### Option 2: Use AWS Console to Configure CORS

1. **Go to S3 Console**: https://console.aws.amazon.com/s3/
2. **Select bucket**: `travel-app-storage-1769`
3. **Go to**: Permissions → CORS
4. **Paste this CORS configuration**:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
       "AllowedOrigins": [
         "http://localhost:3000",
         "http://localhost:3001",
         "http://127.0.0.1:3000",
         "https://travelselbuy.com",
         "https://www.travelselbuy.com",
         "https://dev.travelselbuy.com",
         "http://travelselbuy.com",
         "http://www.travelselbuy.com",
         "http://dev.travelselbuy.com"
       ],
       "ExposeHeaders": [
         "ETag",
         "x-amz-server-side-encryption",
         "x-amz-request-id",
         "x-amz-id-2",
         "Content-Length",
         "Content-Type"
       ],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
5. **Click**: Save changes

### Option 3: Use Root Account (Not Recommended, but Quick)

If you have access to the root account, you can:
1. Use root credentials temporarily
2. Run the script: `node fix-s3-cors.js`
3. Switch back to IAM user

## After CORS is Configured

Once CORS is configured, the presigned URLs should work. The 403 errors should be resolved.

## Verify CORS Configuration

After updating, you can verify by running:
```bash
node fix-s3-cors.js
```

It should show the current CORS configuration without errors.
