# Quick Fix: Configure CORS (Not Bucket Policy!)

## ❌ The Problem

You're trying to paste CORS configuration into the **Bucket Policy** section. That's why you're getting the error:
> "Policies must be valid JSON and the first byte must be '{'"

**Bucket Policy** expects a JSON object starting with `{`
**CORS Configuration** expects a JSON array starting with `[`

## ✅ The Solution

### Step 1: Find the CORS Section

1. You're currently on the **Permissions** tab (good!)
2. You see "Bucket policy" section (this is NOT where you paste CORS)
3. **Scroll down** past the Bucket Policy section
4. Look for: **"Cross-origin resource sharing (CORS)"** section
5. Click **"Edit"** button in that section

### Step 2: Paste This (Array Format)

Copy this **entire block** (it starts with `[` not `{`):

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

### Step 3: Save

Click **"Save changes"** at the bottom

## Visual Guide

```
Permissions Tab
│
├─ Block public access
│  [Edit]
│
├─ Bucket policy  ← ❌ NOT HERE! (This expects { ... })
│  [Edit] [Delete]
│
├─ Access control list (ACL)
│  [Edit]
│
└─ Cross-origin resource sharing (CORS)  ← ✅ HERE!
   [Edit]  ← Click this Edit button
```

## Key Differences

| Section | Format | Starts With |
|---------|--------|------------|
| Bucket Policy | Object | `{` |
| CORS | Array | `[` |

## If You Don't See CORS Section

1. Make sure you're on **Permissions** tab
2. Scroll all the way to the bottom
3. It should be the last section before the bottom of the page
4. If still not visible, try refreshing the page

## After Saving

1. Wait 1-2 minutes for changes to propagate
2. Refresh your application
3. 403 errors should be gone!
