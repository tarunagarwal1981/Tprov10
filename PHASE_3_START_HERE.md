# Phase 3: Start Here - Authentication Migration 🚀

## ✅ Phase 2 Complete!
- Database migrated to RDS
- Ready for authentication migration

---

## 🎯 Quick Start: Create Cognito User Pool

### **Step 1: Open AWS Cognito Console**
👉 https://console.aws.amazon.com/cognito/

### **Step 2: Create User Pool**

1. Click **"Create User Pool"**

2. **Sign-in options:**
   - ✅ Email
   - ❌ Username
   - Click **"Next"**

3. **Password policy:**
   - Minimum: 8 characters
   - ✅ Uppercase, lowercase, numbers, symbols
   - Click **"Next"**

4. **MFA:**
   - Select **"No MFA"**
   - Click **"Next"**

5. **User pool name:**
   - Enter: **`travel-app-users`**
   - Click **"Next"**

6. **User attributes:**
   - ✅ **email** (required, immutable)
   - ✅ **name** (optional, mutable)
   - Click **"Next"**

7. **Custom attributes** (IMPORTANT!):
   - Click **"Add custom attribute"**
     - Name: **`role`**
     - Type: **String**
     - Mutable: ✅ **Yes**
   - Click **"Add custom attribute"** again
     - Name: **`supabase_user_id`**
     - Type: **String**
     - Mutable: ✅ **Yes**
   - Click **"Next"**

8. **App client:**
   - Click **"Add an app client"**
   - Name: **`travel-app-client`**
   - ✅ **Generate client secret**: **No**
   - Click **"Next"**

9. **Review and create:**
   - Click **"Create User Pool"**

10. **Save credentials:**
    - Copy **User Pool ID** → Save to `AWS_CREDENTIALS_SAFE.md`
    - Copy **App Client ID** → Save to `AWS_CREDENTIALS_SAFE.md`

---

## 📋 What You'll Need

- [ ] Cognito User Pool ID
- [ ] Cognito App Client ID
- [ ] Google OAuth credentials (Client ID, Secret)
- [ ] GitHub OAuth credentials (Client ID, Secret)

---

## 🚀 After Creating User Pool

1. **Configure OAuth providers** (Google, GitHub)
2. **Create Cognito domain**
3. **Migrate users from Supabase**
4. **Update application code**

See `MIGRATION_PHASE_3_GUIDE.md` for detailed steps.

---

**Start by creating the User Pool in AWS Console!** 👆

