# Local Development RDS Connection Fix 🔧

## ⚠️ Problem

**Error:** `connect ETIMEDOUT 98.86.100.70:5432`

**Cause:** RDS is in a **private subnet** and cannot be accessed from your local machine.

---

## ✅ Solution Applied

I've updated the code to **handle connection errors gracefully**:

1. **Profile API Route** (`/api/user/profile`):
   - Catches database connection timeouts
   - Falls back to Cognito user info if database is unavailable
   - Returns helpful error message for local development

2. **Auth Context**:
   - Handles 503 (Service Unavailable) errors gracefully
   - Creates minimal user profile from Cognito info
   - Allows app to continue working without database

---

## 🎯 What Happens Now

**In Local Development:**
- ✅ Login works (Cognito authentication)
- ✅ App continues to function
- ⚠️ User profile uses minimal data from Cognito (not full database profile)
- ⚠️ Database-dependent features won't work locally

**In Production (Amplify):**
- ✅ Full database access via VPC
- ✅ Complete user profiles
- ✅ All features work normally

---

## 🔧 Alternative Solutions for Local Development

### **Option 1: Make RDS Publicly Accessible (Temporary)**

**⚠️ Security Warning:** Only for development, not production!

1. **Go to RDS Console**
   - Select your RDS instance
   - Click **Modify**
   - Under **Connectivity**, check **Publicly accessible**
   - Click **Continue** → **Apply immediately**

2. **Update Security Group**
   - Add inbound rule: PostgreSQL (5432) from your IP

3. **Test Connection**
   - Try logging in again

4. **⚠️ Remember to make it private again after testing!**

---

### **Option 2: Use AWS VPN or Bastion Host**

1. **Set up AWS VPN** or **Site-to-Site VPN**
2. **Or use EC2 Bastion Host** (like we did for migration)
3. **Connect through VPN/Bastion** to access RDS

---

### **Option 3: Use Local PostgreSQL for Development**

1. **Install PostgreSQL locally**
2. **Create `.env.local` with local database:**
   ```
   RDS_HOSTNAME=localhost
   RDS_PORT=5432
   RDS_DATABASE=travel_app_dev
   RDS_USERNAME=postgres
   RDS_PASSWORD=your_local_password
   ```
3. **Import schema/data** from RDS to local DB

---

## 📋 Current Behavior

**With the fix applied:**

1. **Login succeeds** ✅
2. **Profile loading fails gracefully** ⚠️
3. **App uses minimal profile from Cognito** ✅
4. **App continues to work** ✅

**You can now:**
- ✅ Test authentication flows
- ✅ Test UI components
- ✅ Develop new features
- ⚠️ Database features won't work locally (but will work in Amplify)

---

## 🚀 Recommended Approach

**For now:**
- ✅ Use the graceful error handling (already applied)
- ✅ Test locally with minimal profile
- ✅ Deploy to Amplify for full database testing

**For full local development:**
- Option 3 (Local PostgreSQL) is best for long-term development
- Option 1 (Public RDS) is quickest for testing but less secure

---

**The app should now work in local development with graceful fallback!** ✅

