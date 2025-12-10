# AWS Amplify Setup - Step by Step 🚀

## 🎯 Goal
Deploy Next.js app to AWS Amplify with VPC connection for RDS access.

---

## ✅ Prerequisites Checklist

- [ ] AWS Account (you have this ✅)
- [ ] Git repository (GitHub/GitLab/Bitbucket)
- [ ] Next.js app ready (you have this ✅)
- [ ] RDS in VPC (already done ✅)
- [ ] Cognito configured (already done ✅)

---

## 📋 Step 1: Connect Amplify to Git Repository

### **1.1 Open AWS Amplify Console**
👉 https://console.aws.amazon.com/amplify/

### **1.2 Create New App**
1. Click **"New app"** → **"Host web app"**
2. Select your Git provider:
   - **GitHub** (most common)
   - **GitLab**
   - **Bitbucket**
3. Click **"Connect"** and authorize AWS Amplify

### **1.3 Select Repository**
1. Choose your repository
2. Select branch (usually `main` or `master`)
3. Click **"Next"**

### **1.4 Configure Build Settings**
Amplify auto-detects Next.js, but verify:
- **Build command**: `npm run build`
- **Output directory**: `.next`
- **Node version**: `18.x` or `20.x`

Click **"Next"**

---

## 📋 Step 2: Configure Environment Variables

### **2.1 Add Environment Variables**

In Amplify Console → Your App → **"Environment variables"**, add:

```env
# AWS Cognito (Public - for client-side)
NEXT_PUBLIC_COGNITO_DOMAIN=travel-app-auth-2285.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9

# AWS Cognito (Server-side)
COGNITO_USER_POOL_ID=us-east-1_oF5qfa2IX
AWS_REGION=us-east-1

# AWS RDS (Server-side only)
RDS_HOST=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_USERNAME=postgres
RDS_PASSWORD=ju3vrLHJUW8PqDG4
RDS_DATABASE=postgres

# AWS S3
S3_BUCKET_NAME=travel-app-storage-1769
```

**Important:**
- Variables starting with `NEXT_PUBLIC_` are exposed to browser
- Others are server-side only (secure)

---

## 📋 Step 3: Connect Amplify to VPC (Critical for RDS!)

### **3.1 Go to VPC Settings**
1. Amplify Console → Your App
2. Click **"App settings"** (left sidebar)
3. Click **"VPC"**

### **3.2 Configure VPC Connection**

**VPC ID:** `[Will be shown after we get it]`

**Subnets:**
- Select **private subnets** (where RDS is)
- Need at least 2 subnets in different AZs
- Subnet IDs: `[Will be shown after we get them]`

**Security Group:**
- Create new security group OR
- Use existing: `[Will be shown after we get it]`
- Must allow:
  - Inbound: PostgreSQL (5432) from Amplify
  - Outbound: All traffic

### **3.3 Save VPC Configuration**
- Click **"Save"**
- Amplify will restart to apply changes
- Wait ~2-3 minutes

---

## 📋 Step 4: Deploy

### **4.1 Review Configuration**
- Check build settings
- Verify environment variables
- Confirm VPC connection

### **4.2 Deploy**
- Click **"Save and deploy"**
- First deployment: ~5-10 minutes
- Watch build logs for any errors

### **4.3 Verify Deployment**
- Check deployment status
- Visit preview URL
- Test application

---

## 🔍 Step 5: Verify RDS Connection

### **5.1 Test API Route**
Create a test endpoint to verify RDS connection:

```typescript
// src/app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/aws/database';

export async function GET() {
  try {
    const result = await query('SELECT NOW() as current_time');
    return NextResponse.json({ 
      success: true, 
      time: result.rows[0].current_time,
      message: 'RDS connection successful!' 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

### **5.2 Test in Browser**
- Visit: `https://your-app.amplifyapp.com/api/test-db`
- Should return: `{ success: true, time: "...", message: "RDS connection successful!" }`

---

## ⚠️ Troubleshooting

### **RDS Connection Fails:**
1. Verify VPC connection in Amplify settings
2. Check security group allows Amplify → RDS (port 5432)
3. Verify RDS is in private subnet
4. Check environment variables are set correctly

### **Build Fails:**
1. Check build logs in Amplify Console
2. Verify all dependencies in `package.json`
3. Check Node.js version compatibility
4. Look for missing environment variables

### **Environment Variables Not Working:**
1. Ensure variable names match code exactly
2. Check `NEXT_PUBLIC_` prefix for client-side vars
3. Redeploy after adding variables

---

## ✅ After Amplify Setup

Once Amplify is set up and working:
- ✅ Application deployed
- ✅ RDS accessible from API routes
- ✅ Cognito authentication working
- ✅ Ready for Phase 4: Storage Migration

---

**Ready to start?** Let's begin with Step 1! 🚀

