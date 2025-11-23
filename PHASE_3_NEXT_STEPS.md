# Phase 3: Next Steps - Configure OAuth & Migrate Users 🚀

## ✅ Cognito User Pool Created!

**Credentials:**
- **User Pool ID**: `us-east-1_oF5qfa2IX`
- **App Client ID**: `20t43em6vuke645ka10s4slgl9`
- **Cognito Domain**: `travel-app-auth-2285.auth.us-east-1.amazoncognito.com`

---

## Step 1: Configure App Client OAuth Settings

### Via AWS Console:

1. **Go to Cognito Console**
   - https://console.aws.amazon.com/cognito/
   - Click on **"travel-app-users"** user pool

2. **Configure App Client**
   - Go to **"App integration"** tab
   - Find **"App client: travel-app-client"**
   - Click **"Edit"**

3. **OAuth 2.0 Grant Types**
   - ✅ **Authorization code grant**
   - ✅ **Implicit grant** (for PKCE)

4. **Allowed OAuth Scopes**
   - ✅ **email**
   - ✅ **openid**
   - ✅ **profile**

5. **Allowed Callback URLs**
   ```
   http://localhost:3000/auth/callback
   https://yourdomain.com/auth/callback
   ```

6. **Allowed Sign-out URLs**
   ```
   http://localhost:3000
   https://yourdomain.com
   ```

7. **Click "Save changes"**

---

## Step 2: Configure OAuth Providers (Optional)

### Google OAuth Setup

1. **Get Google OAuth Credentials** (if not already have)
   - Go to: https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID
   - Authorized redirect URIs:
     - `https://travel-app-auth-2285.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`
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
     - `https://travel-app-auth-2285.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`

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

## Step 3: Update Environment Variables

Add these to your `.env.local` file:

```env
# AWS Cognito
COGNITO_USER_POOL_ID=us-east-1_oF5qfa2IX
COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9
COGNITO_DOMAIN=travel-app-auth-2285.auth.us-east-1.amazoncognito.com
AWS_REGION=us-east-1

# Keep Supabase for now (for user migration)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Step 4: Migrate Users from Supabase

### Run Migration Script

```powershell
# Set environment variables
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
$env:COGNITO_USER_POOL_ID="us-east-1_oF5qfa2IX"
$env:COGNITO_CLIENT_ID="20t43em6vuke645ka10s4slgl9"
$env:AWS_REGION="us-east-1"

# Run migration
npx ts-node aws-migration-scripts/migrate-users.ts
```

**What the script does:**
1. Fetches all users from Supabase
2. Creates users in Cognito
3. Sets custom attributes (role, supabase_user_id)
4. Updates RDS database with new Cognito user IDs

---

## Step 5: Update Application Code

After migration, we'll update:
1. `src/context/SupabaseAuthContext.tsx` → Replace with Cognito
2. Login/register components
3. API routes

---

## ✅ Phase 3 Complete When:

- ✅ Cognito User Pool created
- ✅ App client configured
- ✅ OAuth providers configured (optional)
- ✅ Users migrated
- ✅ Application code updated

---

**Start with Step 1: Configure App Client OAuth Settings in AWS Console!** 🎯

