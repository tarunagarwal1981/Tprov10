# Phase 3: Quick Reference 🚀

## ✅ Completed

- ✅ Cognito User Pool: `us-east-1_oF5qfa2IX`
- ✅ App Client: `20t43em6vuke645ka10s4slgl9`
- ✅ Cognito Domain: `travel-app-auth-2285.auth.us-east-1.amazoncognito.com`
- ✅ Custom attributes added (role, supabase_user_id)
- ✅ App Client OAuth settings configured

---

## 📋 Environment Variables

Add to `.env.local`:

```env
# AWS Cognito
COGNITO_USER_POOL_ID=us-east-1_oF5qfa2IX
COGNITO_CLIENT_ID=20t43em6vuke645ka10s4slgl9
COGNITO_DOMAIN=travel-app-auth-2285.auth.us-east-1.amazoncognito.com
AWS_REGION=us-east-1

# Supabase (for migration only)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🚀 Next Steps

### 1. Configure OAuth Providers (Optional)

**Google:**
- AWS Console → Cognito → User Pools → travel-app-users
- Sign-in experience → Add identity provider → Google
- Enter Client ID & Secret

**GitHub:**
- AWS Console → Cognito → User Pools → travel-app-users
- Sign-in experience → Add identity provider → GitHub
- Enter Client ID & Secret

### 2. Migrate Users

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

### 3. Update Application Code

- Replace `SupabaseAuthContext` with Cognito
- Update login/register components
- Update API routes

---

## 🔗 Useful Links

- **Cognito Console**: https://console.aws.amazon.com/cognito/
- **User Pool**: https://console.aws.amazon.com/cognito/v2/idp/user-pools/us-east-1_oF5qfa2IX

---

**See `PHASE_3_NEXT_STEPS.md` for detailed instructions!**

