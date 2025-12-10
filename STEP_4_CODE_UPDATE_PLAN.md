# Step 4: Application Code Update Plan 📝

## 🎯 Goal
Replace Supabase Auth with AWS Cognito throughout the application.

---

## 📋 Files to Update

### 1. Authentication Context
- **File**: `src/context/SupabaseAuthContext.tsx`
- **Action**: Replace with Cognito-based context
- **New File**: `src/context/CognitoAuthContext.tsx`

### 2. Authentication Utilities
- **File**: `src/lib/supabase/client.ts` (keep for migration)
- **New File**: `src/lib/aws/cognito.ts` ✅ (already created)

### 3. Login/Register Components
- Find and update login pages
- Find and update register pages
- Update OAuth buttons (Google, GitHub)

### 4. API Routes
- Update auth API routes
- Update user profile routes
- Replace Supabase client with Cognito

### 5. Middleware
- Update auth middleware if exists
- Update protected routes

---

## 🚀 Implementation Strategy

1. **Create Cognito Auth Context** (new file)
2. **Update login components** to use Cognito
3. **Update register components** to use Cognito
4. **Update API routes** to use Cognito
5. **Test authentication flow**

---

## ⚠️ Important Notes

- Keep Supabase code temporarily (for reference)
- Update environment variables
- Test each component after update
- Keep database connection (already using RDS)

---

**Ready to start?** Let me know when OAuth is configured, and we'll begin code updates!

