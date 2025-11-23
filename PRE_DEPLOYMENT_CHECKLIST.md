# Pre-Deployment Checklist for Dev Branch

## ✅ Critical Checks Before Deploying to Amplify

### 1. **Authentication Context** ✅
- ✅ `src/app/layout.tsx` - Uses `CognitoAuthProvider` ✅
- ✅ `src/app/(auth)/login/page.tsx` - Uses Cognito auth ✅
- ✅ `src/app/(auth)/register/page.tsx` - Uses Cognito auth ✅
- ⚠️ Some components still reference `SupabaseAuthContext` (legacy, may need update)

### 2. **Service Files** ✅
- ✅ `queryService.ts` - Migrated to PostgreSQL ✅
- ✅ `itineraryService.ts` - Migrated to PostgreSQL ✅
- ✅ `smartItineraryFilter.ts` - Migrated to PostgreSQL ✅
- ✅ `marketplaceService.ts` - Migrated to PostgreSQL ✅

### 3. **Storage** ✅
- ✅ `src/lib/aws/file-upload.ts` - Uses S3 ✅
- ✅ `src/lib/supabase/activity-packages.ts` - Uses S3 ✅
- ✅ `src/lib/supabase/transfer-packages.ts` - Uses S3 ✅

### 4. **Database** ✅
- ✅ `src/lib/aws/database.ts` - PostgreSQL connection pool ✅
- ✅ All services use PostgreSQL directly ✅

### 5. **Environment Variables Needed in Amplify**

**Required AWS Variables:**
- `RDS_HOSTNAME` or `RDS_HOST`
- `RDS_PORT`
- `RDS_DATABASE`
- `RDS_USERNAME`
- `RDS_PASSWORD`
- `RDS_SSL` (set to "true" for production)
- `AWS_REGION`
- `AWS_COGNITO_USER_POOL_ID`
- `AWS_COGNITO_CLIENT_ID`
- `AWS_S3_BUCKET_NAME`
- `AWS_ACCESS_KEY_ID` (or use IAM role)
- `AWS_SECRET_ACCESS_KEY` (or use IAM role)

**Optional (for backward compatibility during migration):**
- `NEXT_PUBLIC_SUPABASE_URL` (can be empty, but should exist to prevent errors)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (can be empty, but should exist to prevent errors)

### 6. **Known Issues to Address**

#### ⚠️ Components Still Using SupabaseAuthContext
These components may need to be updated to use `CognitoAuthContext`:
- `src/components/shared/Header.tsx`
- `src/app/agent/marketplace/page.tsx`
- `src/app/agent/page.tsx`
- `src/app/agent/leads/page.tsx`
- And others (23 files total)

**Action**: These should be updated to use `useAuth` from `CognitoAuthContext` instead of `SupabaseAuthContext`.

#### ⚠️ Legacy Supabase Files
These files still exist but are marked as deprecated:
- `src/lib/supabase/client.ts` - Legacy, kept for backward compatibility
- `src/lib/supabase/server.ts` - Legacy, kept for backward compatibility
- `src/context/SupabaseAuthContext.tsx` - Legacy, should be replaced

**Action**: These can remain for now but should be removed after full migration.

### 7. **API Routes**
- ✅ `src/app/api/user/profile/route.ts` - Uses Cognito and RDS ✅
- ✅ `src/app/api/upload/route.ts` - Uses S3 ✅
- ✅ `src/app/api/upload/presigned/route.ts` - Uses S3 ✅
- ✅ `src/app/api/admin/update-urls/route.ts` - Uses RDS ✅

### 8. **Build Check**
Run before deploying:
```bash
npm run build
npm run type-check
```

---

## 🚀 Deployment Steps

1. **Update Components** (if needed):
   - Replace `SupabaseAuthContext` imports with `CognitoAuthContext` in remaining components

2. **Set Environment Variables in Amplify**:
   - Add all required AWS environment variables
   - Add placeholder Supabase variables (empty strings) to prevent errors

3. **Push to Dev Branch**:
   ```bash
   git checkout -b dev
   git add .
   git commit -m "Migrate to AWS: Complete backend migration to PostgreSQL, Cognito, and S3"
   git push origin dev
   ```

4. **Configure Amplify for Dev Branch**:
   - Connect dev branch in Amplify Console
   - Set all environment variables
   - Configure VPC connection (if not already done)
   - Deploy

5. **Test After Deployment**:
   - Test login/register
   - Test database queries
   - Test file uploads
   - Test marketplace functionality
   - Test itinerary builder

---

## ⚠️ Critical: Component Updates Needed

Many components still import from `SupabaseAuthContext`. These need to be updated:

**Quick Fix Pattern:**
```typescript
// OLD
import { useAuth } from '@/context/SupabaseAuthContext';

// NEW
import { useAuth } from '@/context/CognitoAuthContext';
```

The interface is the same, so it should be a simple find-replace.

---

**Status**: Ready for deployment after component updates (or can deploy and fix incrementally)

