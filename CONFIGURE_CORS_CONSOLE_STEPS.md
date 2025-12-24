# Configure S3 CORS from AWS Console (Root User)

## Step-by-Step Instructions

### Step 1: Login to AWS Console as Root User

1. Go to: **https://console.aws.amazon.com/**
2. Click **Sign in to the Console**
3. Enter your **root account email** and **password**
4. Complete any MFA if required

---

### Step 2: Navigate to S3 Service

1. In the AWS Console top search bar, type: **S3**
2. Click on **S3** service (or go directly to: https://console.aws.amazon.com/s3/)

---

### Step 3: Select Your Bucket

1. In the **Buckets** list, find and click on: **travel-app-storage-1769**
2. Click on the bucket name to open it

---

### Step 4: Open Permissions Tab

1. You'll see several tabs at the top: **Objects**, **Permissions**, **Properties**, **Metrics**, etc.
2. Click on the **Permissions** tab

---

### Step 5: Find CORS Section

1. Scroll down in the **Permissions** tab
2. Look for the **Cross-origin resource sharing (CORS)** section
3. Click on **Edit** button (or **Configure CORS** if it's not configured yet)

---

### Step 6: Paste CORS Configuration

1. You'll see a text editor/JSON editor
2. **Delete any existing content** (if any)
3. **Copy the entire JSON below** and paste it:

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

### Step 7: Save Changes

1. Scroll down to the bottom of the CORS editor
2. Click **Save changes** button
3. You should see a success message: "Successfully edited CORS configuration"

---

### Step 8: Verify Configuration

1. The page should refresh and show your CORS configuration
2. You should see the **AllowedOrigins** list with your domains
3. The configuration is now active!

---

## Visual Guide (What You'll See)

```
AWS Console → S3 → travel-app-storage-1769 → Permissions Tab

┌─────────────────────────────────────────────────┐
│ Permissions                                      │
├─────────────────────────────────────────────────┤
│                                                   │
│ Block public access (bucket settings)            │
│ [Edit button]                                     │
│                                                   │
│ Bucket policy                                    │
│ [Edit button]                                     │
│                                                   │
│ Access control list (ACL)                        │
│ [Edit button]                                     │
│                                                   │
│ Cross-origin resource sharing (CORS)  ← CLICK   │
│ [Edit button]                                     │
│                                                   │
└─────────────────────────────────────────────────┘
```

After clicking Edit, you'll see a JSON editor where you paste the configuration.

---

## Quick Copy-Paste JSON

Here's the exact JSON to copy (everything between the ``` markers):

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

## After Configuration

1. **Wait 1-2 minutes** for changes to propagate
2. **Refresh your application** (http://localhost:3000)
3. **Check browser console** - 403 errors should be gone
4. **Images should now load correctly!**

---

## Troubleshooting

### If you don't see "Edit" button:
- Make sure you're logged in as **root user** (not IAM user)
- Check that you have the correct bucket selected

### If you see an error when saving:
- Make sure the JSON is valid (no extra commas, proper brackets)
- Copy the JSON exactly as shown above

### If images still don't load after 2 minutes:
- Check browser console for any new error messages
- Verify your application's origin matches one in the AllowedOrigins list
- Try clearing browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

---

## Direct Links

- **S3 Console**: https://console.aws.amazon.com/s3/
- **Your Bucket**: https://console.aws.amazon.com/s3/buckets/travel-app-storage-1769?region=us-east-1&tab=permissions

---

## Summary

1. ✅ Login as root user
2. ✅ Go to S3 → travel-app-storage-1769
3. ✅ Click Permissions tab
4. ✅ Click Edit in CORS section
5. ✅ Paste the JSON configuration
6. ✅ Click Save changes
7. ✅ Wait 1-2 minutes
8. ✅ Test your application

Done! 🎉
