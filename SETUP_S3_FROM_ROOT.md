# Setting Up S3 Bucket Access from Root User

## Option 1: Configure CORS Directly as Root User (Quickest)

### Step 1: Use Root Credentials

1. **Get root credentials** (if you have access)
2. **Set environment variables**:
   ```bash
   export AWS_ACCESS_KEY_ID=<root-access-key>
   export AWS_SECRET_ACCESS_KEY=<root-secret-key>
   export AWS_REGION=us-east-1
   ```

### Step 2: Run the CORS Configuration Script

```bash
node fix-s3-cors.js
```

This will configure CORS for the bucket `travel-app-storage-1769` with all the required origins.

---

## Option 2: Update IAM Permissions for Your User/Role

### Step 1: Login as Root User

1. Go to: https://console.aws.amazon.com/
2. Login with root credentials

### Step 2: Create/Update IAM Policy

1. Go to: https://console.aws.amazon.com/iam/
2. Navigate to: **Policies** → **Create policy**
3. Click **JSON** tab
4. Paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3BucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetBucketLocation",
        "s3:ListBucket",
        "s3:ListAllMyBuckets",
        "s3:GetBucketCORS",
        "s3:PutBucketCORS",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectVersion"
      ],
      "Resource": [
        "arn:aws:s3:::travel-app-storage-1769",
        "arn:aws:s3:::travel-app-storage-1769/*"
      ]
    }
  ]
}
```

5. Click **Next**
6. Name it: `S3TravelAppStorageAccess`
7. Click **Create policy**

### Step 3: Attach Policy to User

1. Go to: **Users** → `tarunagarwal`
2. Click **Add permissions** → **Attach policies directly**
3. Search for: `S3TravelAppStorageAccess`
4. Check the box and click **Add permissions**

### Step 4: Remove Any Deny Policies

1. Still in the user page, check **Permissions** tab
2. Look for any policies with **Deny** effect
3. If you find any that block S3 access, you may need to:
   - Remove them, OR
   - Update them to exclude the travel-app-storage-1769 bucket

### Step 5: Test Access

After updating permissions, test with:

```bash
node check-s3-bucket.js
```

---

## Option 3: Configure CORS via AWS Console (No CLI Needed)

### As Root User:

1. Go to: https://console.aws.amazon.com/s3/
2. Select bucket: `travel-app-storage-1769`
3. Go to: **Permissions** → **CORS**
4. Click **Edit**
5. Copy the contents from `cors-config.json` and paste
6. Click **Save changes**

---

## Quick CORS Configuration (Copy This)

If using AWS Console, paste this JSON:

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

---

## Verification

After configuring CORS:

1. **Wait 1-2 minutes** for changes to propagate
2. **Refresh your application**
3. **Check browser console** - 403 errors should be gone
4. **Images should load correctly**

---

## Troubleshooting

### If you still see 403 errors:

1. **Check CORS configuration**:
   ```bash
   node check-s3-bucket.js
   ```

2. **Verify the origin** - Make sure your application's origin matches one in the CORS config

3. **Check browser console** - Look for CORS-related error messages

4. **Test presigned URL directly** - Copy a presigned URL from logs and paste in browser address bar
