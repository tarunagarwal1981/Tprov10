# AWS Amplify Hosting Setup Guide 🚀

## 🎯 Goal
Deploy Next.js app to AWS Amplify with VPC connection for RDS access.

---

## ✅ Prerequisites

- ✅ AWS Account
- ✅ Next.js application ready
- ✅ Git repository (GitHub, GitLab, or Bitbucket)
- ✅ RDS instance in VPC (already done ✅)
- ✅ Cognito configured (already done ✅)

---

## 📋 Step-by-Step Setup

### **Step 1: Connect Amplify to Git Repository**

1. **Go to AWS Amplify Console**
   - https://console.aws.amazon.com/amplify/
   - Click **"New app"** → **"Host web app"**

2. **Connect Repository**
   - Select your Git provider (GitHub/GitLab/Bitbucket)
   - Authorize AWS Amplify
   - Select your repository
   - Select branch (usually `main` or `master`)

3. **Configure Build Settings**
   - Amplify auto-detects Next.js
   - Build command: `npm run build` (auto-detected)
   - Output directory: `.next` (auto-detected)

---

### **Step 2: Configure Environment Variables**

Add these to Amplify environment variables:

```env
# AWS Cognito
NEXT_PUBLIC_COGNITO_DOMAIN=travel-app-auth-2285.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9
COGNITO_USER_POOL_ID=us-east-1_oF5qfa2IX
AWS_REGION=us-east-1

# AWS RDS
RDS_HOST=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_USERNAME=postgres
RDS_PASSWORD=ju3vrLHJUW8PqDG4
RDS_DATABASE=postgres

# AWS S3
S3_BUCKET_NAME=travel-app-storage-1769
AWS_REGION=us-east-1
```

**Where to add:**
- Amplify Console → Your App → Environment variables
- Add each variable

---

### **Step 3: Connect Amplify to VPC (For RDS Access)**

1. **Go to App Settings**
   - Amplify Console → Your App → **"App settings"**
   - Click **"VPC"** in left sidebar

2. **Configure VPC Connection**
   - Select your VPC (the one with RDS)
   - Select subnets (private subnets where RDS is)
   - Select security group (one that allows RDS access)

3. **Save Configuration**
   - Click **"Save"**
   - Amplify will restart to apply changes

**Important:** This allows Amplify's server-side functions (API Routes) to connect to RDS.

---

### **Step 4: Deploy**

1. **Review Build Settings**
   - Check build command
   - Check environment variables

2. **Deploy**
   - Click **"Save and deploy"**
   - Amplify will:
     - Build your Next.js app
     - Deploy to CDN
     - Set up SSL certificate
     - Create preview URL

3. **Wait for Deployment**
   - First deployment: ~5-10 minutes
   - Subsequent: ~2-5 minutes

---

### **Step 5: Configure Custom Domain (Optional)**

1. **Go to Domain Management**
   - Amplify Console → Your App → **"Domain management"**

2. **Add Domain**
   - Enter your domain
   - Follow DNS setup instructions
   - Amplify provides SSL automatically

---

## 🔍 Verify RDS Connection

After deployment, test RDS connection:

1. **Check API Routes**
   - Visit: `https://your-app.amplifyapp.com/api/health`
   - Should connect to RDS

2. **Test Database Query**
   - Create test API route
   - Query RDS from API route
   - Verify connection works

---

## 📊 Monitoring & Costs

### **Monitor Usage:**
- Amplify Console → Your App → **"Monitoring"**
- View:
  - Build minutes used
  - Bandwidth used
  - Request count

### **Cost Tracking:**
- AWS Cost Explorer
- Filter by "Amplify" service
- Monitor monthly spend

---

## 🚀 Benefits After Setup

✅ **Automatic Deployments**
- Push to Git → Auto-deploy
- Preview deployments for PRs

✅ **Auto-Scaling**
- Handles traffic spikes
- No capacity planning

✅ **Global CDN**
- Fast worldwide
- Included in Amplify

✅ **SSL Certificates**
- Automatic HTTPS
- Free SSL

✅ **Environment Management**
- Staging/production
- Easy environment switching

---

## ⚠️ Troubleshooting

### **RDS Connection Issues:**
- Verify VPC connection in Amplify settings
- Check security groups allow Amplify → RDS
- Verify RDS is in private subnet
- Check environment variables are set

### **Build Failures:**
- Check build logs in Amplify Console
- Verify all dependencies in package.json
- Check Node.js version compatibility

### **Environment Variables:**
- Ensure all variables are set
- Check variable names match code
- Verify no typos

---

## ✅ Next Steps After Deployment

1. **Test Authentication**
   - Try login with Cognito
   - Verify tokens work

2. **Test Database Queries**
   - Test API routes
   - Verify RDS connection

3. **Monitor Performance**
   - Check response times
   - Monitor costs

4. **Set Up Alerts**
   - CloudWatch alarms
   - Cost alerts

---

**Ready to deploy?** Follow the steps above! 🚀

