# Amplify Environment Variables - Quick Fix 🔧

## Problem
Your app is still trying to use Supabase and crashing because environment variables aren't set in Amplify.

## Quick Fix: Add Environment Variables to Amplify

### **Step 1: Go to Amplify Console**

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click on your app
3. Go to **App settings** → **Environment variables**

### **Step 2: Add These Variables**

Add these environment variables (temporary - for migration):

```
NEXT_PUBLIC_SUPABASE_URL=https://megmjzszmqnmzdxwzigt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**To get your Supabase anon key:**
- Go to Supabase Dashboard → Settings → API
- Copy the "anon public" key

### **Step 3: Also Add AWS Variables**

Make sure these are set:

```
AWS_REGION=us-east-1
S3_BUCKET_NAME=travel-app-storage-1769
RDS_HOST=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DB=postgres
RDS_USER=postgres
RDS_PASSWORD=ju3vrLHJUW8PqDG4
```

### **Step 4: Redeploy**

After adding variables:
1. Click **Save**
2. Amplify will automatically trigger a new deployment
3. Wait for deployment to complete (5-10 minutes)

---

## After Deployment

Once deployed:
1. The app should load without Supabase errors
2. The API route `/api/admin/update-urls` will be available
3. You can then call it to update database URLs

---

## Long-term: Remove Supabase Dependencies

After migration is complete, we can:
1. Remove Supabase environment variables
2. Update code to not require Supabase
3. Clean up Supabase imports

But for now, adding the env vars will fix the immediate issue.

---

**Quick Action:** Add the environment variables in Amplify now! 🚀

