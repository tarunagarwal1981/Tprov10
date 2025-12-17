# CORS vs Bucket Policy - Important Difference

## ⚠️ You're in the Wrong Section!

The error you're seeing is because you're trying to paste CORS configuration into the **Bucket Policy** section. These are **two different things**:

- **Bucket Policy** = Access control (who can access the bucket)
- **CORS Configuration** = Cross-origin settings (which websites can request from the bucket)

## Where to Find CORS Section

### Step 1: You're Currently Here (WRONG)
```
Permissions Tab
├── Block public access (bucket settings)
├── Bucket policy  ← YOU ARE HERE (WRONG PLACE)
└── Access control list (ACL)
```

### Step 2: Scroll Down to Find CORS (CORRECT)
```
Permissions Tab
├── Block public access (bucket settings)
├── Bucket policy
├── Access control list (ACL)
└── Cross-origin resource sharing (CORS)  ← GO HERE INSTEAD!
```

## Correct Steps

1. **Stay on the Permissions tab** (you're already there)
2. **Scroll down** past the Bucket Policy section
3. **Look for**: "Cross-origin resource sharing (CORS)" section
4. **Click "Edit"** in that section (NOT the Bucket Policy Edit button)
5. **Paste the CORS configuration** (see below)

## CORS Configuration (Array Format)

CORS uses an **array format** (starts with `[`), not an object (starts with `{`):

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

**Note**: This starts with `[` (array), not `{` (object)

## Visual Guide

```
┌─────────────────────────────────────────┐
│ Permissions Tab                          │
├─────────────────────────────────────────┤
│                                           │
│ Block public access                      │
│ [Edit]                                    │
│                                           │
│ Bucket policy              ← NOT HERE!  │
│ [Edit] [Delete]                           │
│                                           │
│ Access control list (ACL)                │
│ [Edit]                                    │
│                                           │
│ Cross-origin resource sharing (CORS)    │
│ [Edit]                    ← CLICK HERE! │
│                                           │
└─────────────────────────────────────────┘
```

## If CORS Section is Not Visible

If you don't see the CORS section:

1. Make sure you're on the **Permissions** tab
2. Scroll all the way down
3. If still not visible, try:
   - Refresh the page
   - Check if you're logged in as root user
   - The CORS section should be at the bottom of the Permissions tab

## Quick Navigation

Direct link to CORS section (if available):
https://console.aws.amazon.com/s3/buckets/travel-app-storage-1769?region=us-east-1&tab=permissions

Then scroll down to find "Cross-origin resource sharing (CORS)"
