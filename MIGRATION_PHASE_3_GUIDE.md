# Phase 3: Authentication Migration (Cognito) 🚀

## ✅ Phase 2 Complete!
- ✅ RDS database migrated
- ✅ Schema and data imported
- ✅ Database connection ready

---

## 🎯 Phase 3 Overview

Migrate authentication from **Supabase Auth** to **AWS Cognito**:
1. Create Cognito User Pool
2. Configure OAuth providers (Google, GitHub)
3. Migrate existing users
4. Update application code

---

## Step 3.1: Create Cognito User Pool

### Option A: AWS Console (Recommended for First Time)

1. **Go to Cognito Console**
   - https://console.aws.amazon.com/cognito/
   - Click **"Create User Pool"**

2. **Configure Sign-In Options**
   - ✅ **Email** (required)
   - ❌ Username (optional, we'll use email)
   - Click **"Next"**

3. **Password Policy**
   - Minimum length: **8 characters**
   - Require uppercase: ✅
   - Require lowercase: ✅
   - Require numbers: ✅
   - Require symbols: ✅
   - Click **"Next"**

4. **MFA (Multi-Factor Authentication)**
   - Select: **"No MFA"** (can enable later)
   - Click **"Next"**

5. **User Pool Name**
   - Name: **`travel-app-users`**
   - Click **"Next"**

6. **Configure User Attributes**
   - ✅ **email** (required, immutable)
   - ✅ **name** (optional, mutable)
   - Click **"Next"**

7. **Add Custom Attributes** (Important!)
   - Click **"Add custom attribute"**
   - Name: **`role`**
   - Type: **String**
   - Mutable: ✅ **Yes**
   - Min length: 1
   - Max length: 50
   - Click **"Add"**
   
   - Click **"Add custom attribute"** again
   - Name: **`supabase_user_id`** (to map old Supabase IDs)
   - Type: **String**
   - Mutable: ✅ **Yes**
   - Min length: 1
   - Max length: 100
   - Click **"Add"**
   - Click **"Next"**

8. **App Client Configuration**
   - Click **"Add an app client"**
   - App client name: **`travel-app-client`**
   - ✅ **Generate client secret**: **No** (for public clients like Next.js)
   - Click **"Next"**

9. **Review and Create**
   - Review all settings
   - Click **"Create User Pool"**

10. **Save Credentials**
    - Copy **User Pool ID** (e.g., `us-east-1_XXXXXXXXX`)
    - Copy **App Client ID** (e.g., `1a2b3c4d5e6f7g8h9i0j`)
    - Save to `AWS_CREDENTIALS_SAFE.md`

---

### Option B: AWS CLI (Automated)

I'll create a script to automate this. For now, use the console method above.

---

## Step 3.2: Configure OAuth Providers

### Google OAuth Setup

1. **Get Google OAuth Credentials** (if not already have)
   - Go to: https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID
   - Authorized redirect URIs:
     - `https://[YOUR_COGNITO_DOMAIN]/oauth2/idpresponse`
     - `http://localhost:3000/auth/callback` (for local dev)

2. **Add Google Provider in Cognito**
   - AWS Console → Cognito → User Pools → **travel-app-users**
   - Go to **"Sign-in experience"** tab
   - Scroll to **"Federated identity provider sign-in"**
   - Click **"Add identity provider"** → **"Google"**
   - Enter:
     - **Client ID**: [Your Google Client ID]
     - **Client secret**: [Your Google Client Secret]
     - **Authorized scopes**: `email profile openid`
   - **Attribute mapping**:
     - `email` → `email`
     - `name` → `name`
   - Click **"Save changes"**

### GitHub OAuth Setup

1. **Get GitHub OAuth Credentials** (if not already have)
   - Go to: https://github.com/settings/developers
   - Create OAuth App
   - Authorization callback URL:
     - `https://[YOUR_COGNITO_DOMAIN]/oauth2/idpresponse`

2. **Add GitHub Provider in Cognito**
   - AWS Console → Cognito → User Pools → **travel-app-users**
   - Go to **"Sign-in experience"** tab
   - Click **"Add identity provider"** → **"GitHub"**
   - Enter:
     - **Client ID**: [Your GitHub Client ID]
     - **Client secret**: [Your GitHub Client Secret]
   - **Attribute mapping**:
     - `email` → `email`
     - `login` → `name`
   - Click **"Save changes"**

---

## Step 3.3: Configure App Client OAuth Settings

1. **Go to App Client Settings**
   - Cognito → User Pools → **travel-app-users**
   - Go to **"App integration"** tab
   - Find **"App client: travel-app-client"**
   - Click **"Edit"**

2. **OAuth 2.0 Grant Types**
   - ✅ **Authorization code grant**
   - ✅ **Implicit grant** (for PKCE)
   - ✅ **Refresh token**

3. **Allowed OAuth Scopes**
   - ✅ **email**
   - ✅ **openid**
   - ✅ **profile**

4. **Allowed Callback URLs**
   ```
   http://localhost:3000/auth/callback
   https://yourdomain.com/auth/callback
   ```

5. **Allowed Sign-out URLs**
   ```
   http://localhost:3000
   https://yourdomain.com
   ```

6. **Click "Save changes"**

---

## Step 3.4: Create Cognito Domain (for OAuth)

1. **Go to Domain Configuration**
   - Cognito → User Pools → **travel-app-users**
   - Go to **"App integration"** tab
   - Scroll to **"Domain"**
   - Click **"Create Cognito domain"** or **"Use your own domain"**

2. **Cognito Domain** (Easier)
   - Domain prefix: **`travel-app-auth`** (must be unique)
   - Click **"Create Cognito domain"**
   - Save domain: `travel-app-auth.auth.us-east-1.amazoncognito.com`

3. **Save to Credentials**
   - Add to `AWS_CREDENTIALS_SAFE.md`

---

## Step 3.5: Migrate Users from Supabase

### Run Migration Script

I've created a migration script. First, let's set up environment variables:

```bash
# In your terminal (PowerShell)
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
$env:COGNITO_USER_POOL_ID="us-east-1_XXXXXXXXX"
$env:AWS_REGION="us-east-1"
```

Then run:

```bash
npx ts-node aws-migration-scripts/migrate-users.ts
```

**What the script does:**
1. Fetches all users from Supabase
2. Creates users in Cognito
3. Sets custom attributes (role, supabase_user_id)
4. Updates RDS database with new Cognito user IDs

---

## Step 3.6: Update Application Code

### Files to Update:

1. **`src/lib/aws/cognito.ts`** ✅ (Already created)
2. **`src/context/SupabaseAuthContext.tsx`** → Replace with Cognito
3. **`src/app/api/auth/[...nextauth]/route.ts`** (if using NextAuth)
4. **All login/register components**

---

## ✅ Phase 3 Complete When:

- ✅ Cognito User Pool created
- ✅ OAuth providers configured (Google, GitHub)
- ✅ App client configured
- ✅ Cognito domain created
- ✅ Users migrated
- ✅ Application code updated

---

## 🚀 Next Steps

After Phase 3, we'll move to:
- **Phase 4**: Storage Migration (S3)
- **Phase 5**: Backend Code Migration
- **Phase 6**: Testing & Deployment

---

**Let's start with Step 3.1: Create Cognito User Pool via AWS Console!** 🎯

