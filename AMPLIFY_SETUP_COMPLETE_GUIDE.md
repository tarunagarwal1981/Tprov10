# AWS Amplify Complete Setup Guide 🚀

## 🎯 Goal
Deploy Next.js app to AWS Amplify with VPC connection for RDS access, then proceed to Phase 4.

---

## ✅ Prerequisites Ready

- ✅ AWS Account
- ✅ Next.js application
- ✅ RDS in VPC: `travel-app-db`
- ✅ Cognito configured: `us-east-1_oF5qfa2IX`
- ✅ VPC Information gathered

---

## 📋 Step-by-Step Setup

### **Step 1: Open AWS Amplify Console**

👉 **https://console.aws.amazon.com/amplify/**

---

### **Step 2: Connect Git Repository**

1. Click **"New app"** → **"Host web app"**
2. Select Git provider:
   - **GitHub** (recommended)
   - **GitLab**
   - **Bitbucket**
3. Authorize AWS Amplify
4. Select your repository
5. Select branch: `main` or `master`
6. Click **"Next"**

---

### **Step 3: Configure Build Settings**

Amplify auto-detects Next.js, verify:

- **App name**: `travel-app` (or your choice)
- **Build command**: `npm run build`
- **Output directory**: `.next`
- **Node version**: `20.x` (recommended)

Click **"Next"**

---

### **Step 4: Add Environment Variables**

**Before deploying**, add these environment variables:

**In Amplify Console → Your App → Environment variables:**

```env
# AWS Cognito (Public - Client-side)
NEXT_PUBLIC_COGNITO_DOMAIN=travel-app-auth-2285.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9

# AWS Cognito (Server-side)
COGNITO_USER_POOL_ID=us-east-1_oF5qfa2IX
AWS_REGION=us-east-1

# AWS RDS (Server-side only - Secure!)
RDS_HOST=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_USERNAME=postgres
RDS_PASSWORD=ju3vrLHJUW8PqDG4
RDS_DATABASE=postgres

# AWS S3
S3_BUCKET_NAME=travel-app-storage-1769
```

**Important:**
- Variables with `NEXT_PUBLIC_` are exposed to browser
- Others are server-side only (secure)

---

### **Step 5: Connect to VPC (Critical for RDS!)**

**Before this step**, update security group to allow Amplify → RDS:

1. **Update Security Group** (if needed):
   ```powershell
   # Allow PostgreSQL from VPC (Amplify will be in VPC)
   aws ec2 authorize-security-group-ingress \
     --group-id sg-0351956ce61a8d1f1 \
     --protocol tcp \
     --port 5432 \
     --cidr 10.0.0.0/16
   ```

2. **In Amplify Console:**
   - Your App → **"App settings"** → **"VPC"**
   - Click **"Edit"**

3. **Configure VPC:**
   - **VPC**: `vpc-035de28e2067ea386`
   - **Subnets**: 
     - `subnet-03492171db95e0412`
     - `subnet-0a9c5d406940f11d2`
   - **Security Group**: `sg-0351956ce61a8d1f1`

4. **Save** and wait ~2-3 minutes for restart

---

### **Step 6: Deploy**

1. **Review Configuration**
   - Check build settings
   - Verify environment variables
   - Confirm VPC connection

2. **Deploy**
   - Click **"Save and deploy"**
   - First deployment: ~5-10 minutes
   - Watch build logs

3. **Get Deployment URL**
   - Amplify provides: `https://[branch].[app-id].amplifyapp.com`
   - Save this URL!

---

### **Step 7: Verify Deployment**

1. **Test Application**
   - Visit deployment URL
   - Check if app loads

2. **Test RDS Connection**
   - Visit: `https://your-app.amplifyapp.com/api/test-db`
   - Should return: `{ success: true, message: "RDS connection successful!" }`

3. **Test Authentication**
   - Try login page
   - Verify Cognito works

---

## ✅ After Amplify Setup

Once verified:
- ✅ Application deployed
- ✅ RDS accessible
- ✅ Cognito working
- ✅ Ready for Phase 4: Storage Migration

---

## 🚀 Next: Phase 4 - Storage Migration

After Amplify is set up, we'll:
1. Migrate files from Supabase Storage to S3
2. Update upload/download code
3. Configure CloudFront CDN (optional)

---

**Ready to start?** Follow the steps above! 🎯

