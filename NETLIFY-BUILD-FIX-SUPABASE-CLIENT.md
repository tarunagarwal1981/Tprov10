# Netlify Build Fix - Supabase Client Initialization

## Problem

The Netlify build was failing with the error:
```
Error: supabaseUrl is required.
    at <unknown> (.next/server/app/api/user/profile/route.js:34:35471)
> Build error occurred
[Error: Failed to collect page data for /api/user/profile]
```

## Root Cause

The Supabase client was being initialized at the **module level** (top-level) in API routes:

```typescript
// ❌ BAD: Executed during build time
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { ... }
);
```

During Next.js build process:
1. Next.js analyzes all routes for static generation
2. Module-level code gets executed at **build time**
3. Environment variables might not be available during build
4. `createClient()` throws error: "supabaseUrl is required"

## Solution

### 1. Move Client Creation to Runtime

Changed from module-level initialization to a runtime function:

**Files Fixed:**
- `src/app/api/user/profile/route.ts`
- `netlify/functions/user-profile.ts`

**Before:**
```typescript
// ❌ Executed at build time
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Use supabaseAdmin...
}
```

**After:**
```typescript
// ✅ Helper function (not executed at build time)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(request: NextRequest) {
  // ✅ Create client at runtime (when request comes in)
  const supabaseAdmin = getSupabaseAdmin();
  // Use supabaseAdmin...
}
```

### 2. Force Dynamic Rendering

Added route configuration to prevent build-time pre-rendering:

```typescript
// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

## Benefits

✅ **Build-time safety**: Client creation doesn't happen during build  
✅ **Runtime validation**: Environment variables checked when actually needed  
✅ **Better error messages**: Clear error if env vars are missing at runtime  
✅ **No build failures**: Build succeeds even without runtime env vars  
✅ **Same functionality**: Works exactly the same at runtime  

## Files Changed

1. **`src/app/api/user/profile/route.ts`**
   - Added `getSupabaseAdmin()` helper function
   - Added `export const dynamic = 'force-dynamic'`
   - Added `export const runtime = 'nodejs'`
   - Client now created inside POST handler

2. **`netlify/functions/user-profile.ts`**
   - Added `getSupabaseAdmin()` helper function
   - Client now created inside handler function

## Testing

To test the fix:

1. **Local build:**
   ```bash
   npm run build
   ```
   Should complete successfully

2. **Netlify deployment:**
   - Push to repository
   - Netlify will build and deploy
   - Check deployment logs for success

3. **Runtime test:**
   - Login to the application
   - User profile should load correctly
   - API route should work as expected

## Prevention

To prevent this issue in the future:

### ❌ Don't Do This:
```typescript
// Module-level Supabase client
const supabase = createClient(url, key);

export async function handler() {
  // Use supabase...
}
```

### ✅ Do This Instead:
```typescript
// Helper function
function getSupabase() {
  return createClient(url, key);
}

export async function handler() {
  const supabase = getSupabase(); // Create at runtime
  // Use supabase...
}
```

### ✅ Or Use Lazy Initialization:
```typescript
let _supabase: any = null;

function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(url, key);
  }
  return _supabase;
}
```

## Related Documentation

- [Next.js Dynamic Rendering](https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering)
- [Next.js Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [Supabase Server-Side Auth](https://supabase.com/docs/guides/auth/server-side)

## Summary

The build failure was caused by Supabase client initialization happening at build time instead of runtime. By moving the client creation into a helper function called during request handling, we ensure:

1. Build process completes successfully
2. Environment variables are accessed at runtime
3. Better error handling and validation
4. Same functionality for end users

This is a common pattern when working with Next.js API routes and external services that require environment variables.

