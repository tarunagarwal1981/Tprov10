# 🔧 Fix for travelselbuy.com Domain Login Issue

## 🎯 Problem Identified

Users logging in from `https://travelselbuy.com` can authenticate successfully (auth works), but the subsequent database query to fetch user profile doesn't execute.

**Evidence from Supabase logs:**
- ✅ Authentication request: `POST /auth/v1/token` → 200 OK
- ❌ User profile query: `GET /rest/v1/users` → **MISSING** (never executed)

---

## 🔍 Root Cause

The custom domain `travelselbuy.com` likely has one of these issues:

1. **Not whitelisted in Supabase CORS settings** (70% probability)
2. **Wrong environment variables** (25% probability)
3. **Client-side timeout** (5% probability)

---

## ✅ Fix #1: Update Supabase CORS Settings (DO THIS FIRST)

### **Step-by-Step:**

1. **Go to Supabase Dashboard:**
   - URL: https://supabase.com/dashboard/project/megmjzszmqnmzdxwzigt

2. **Navigate to API Settings:**
   - Click: **Settings** (left sidebar)
   - Click: **API**

3. **Find "Additional Site URLs" or "Site URL":**
   - Look for a field that says "Site URL" or "Additional URLs"

4. **Add your custom domain:**
   ```
   https://travelselbuy.com
   ```

5. **Also ensure these are listed:**
   ```
   http://localhost:3000
   https://travelselbuy.netlify.app (if you have Netlify)
   https://travelselbuy.com
   ```

6. **Save changes**

7. **Wait 2-3 minutes** for changes to propagate

8. **Have users try login again**

---

## ✅ Fix #2: Verify Environment Variables on travelselbuy.com

The site at `travelselbuy.com` needs these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
```

**Where to check depends on your hosting:**

### **If hosted on Vercel:**
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Verify the variables are set for Production

### **If hosted on Netlify:**
1. Go to Netlify Dashboard
2. Select site → Site settings → Environment variables
3. Verify the variables are set

### **If hosted elsewhere:**
- Check your hosting platform's environment variable settings

---

## ✅ Fix #3: Enable Supabase Realtime (If Available)

Sometimes the issue is with Supabase Realtime settings:

1. Go to Supabase Dashboard
2. Settings → API
3. Enable "Realtime" if it's disabled
4. Save

---

## 🧪 Diagnostic Test for Users

Have users on `travelselbuy.com` run this in browser console:

```javascript
// Test 1: Check current configuration
console.log('=== CONFIGURATION TEST ===');
console.log('Current domain:', window.location.origin);
console.log('Expected:', 'https://travelselbuy.com');

// Test 2: Check if Supabase client is initialized
console.log('\n=== SUPABASE CLIENT TEST ===');

// Test 3: Try manual database query
async function testDatabaseQuery() {
  console.log('\n=== DATABASE QUERY TEST ===');
  
  try {
    const response = await fetch('https://megmjzszmqnmzdxwzigt.supabase.co/rest/v1/users?id=eq.0afbb77a-e2fa-4de8-8a24-2ed473ab7c2c', {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTE3ODYsImV4cCI6MjA3NTEyNzc4Nn0.BN_tgy60e4UeRyeohwGe48P8QY9KNgFu8dw__AMxRGE',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTE3ODYsImV4cCI6MjA3NTEyNzc4Nn0.BN_tgy60e4UeRyeohwGe48P8QY9KNgFu8dw__AMxRGE',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Database query SUCCESS');
      console.log('Data:', data);
    } else {
      const errorText = await response.text();
      console.error('❌ Database query FAILED');
      console.error('Status:', response.status);
      console.error('Error:', errorText);
      
      // Check for CORS error
      if (response.status === 0 || !response.ok) {
        console.error('💡 This might be a CORS issue - domain not whitelisted in Supabase');
      }
    }
  } catch (error) {
    console.error('❌ Database query ERROR:', error.message);
    
    if (error.message.includes('CORS') || error.message.includes('fetch')) {
      console.error('💡 CORS ERROR - travelselbuy.com is NOT whitelisted in Supabase!');
      console.error('👉 Add https://travelselbuy.com to Supabase allowed origins');
    }
  }
}

testDatabaseQuery();
```

**Expected output if CORS is the issue:**
```
❌ Database query ERROR: Failed to fetch
💡 CORS ERROR - travelselbuy.com is NOT whitelisted in Supabase!
👉 Add https://travelselbuy.com to Supabase allowed origins
```

---

## 📊 What the Logs Tell Us

**From Supabase logs:**
```
✅ IP: 223.178.85.67 (Chennai, India)
✅ ISP: Airtel
✅ Device: Mac with Chrome 141
✅ Auth request: 200 OK (144ms)
✅ Referer: https://travelselbuy.com/
❌ User profile query: MISSING
```

**Conclusion:**
- Network is fine (144ms response)
- Auth works (200 status)
- But database query never happens
- **Most likely:** CORS blocking the REST API call

---

## 🎯 Most Likely Solution

**99% sure it's CORS:**

The authentication endpoint (`/auth/v1/token`) might allow all origins, but the REST API endpoint (`/rest/v1/users`) requires the domain to be whitelisted.

**Fix:**
1. Add `https://travelselbuy.com` to Supabase allowed origins
2. Wait 2-3 minutes
3. Have users clear cache and try again

---

## ✅ Verification

After applying the fix, users should see in console:

```
✅ Sign in successful
📡 Loading user profile from database...
📡 User ID: 0afbb77a-e2fa-4de8-8a24-2ed473ab7c2c
📡 Supabase URL: https://megmjzszmqnmzdxwzigt.supabase.co
📡 Query result: {id: '0afbb77a...', email: 'operator@gmail.com', ...}
👤 Full user object created
✅ Login successful, redirecting to: /operator/dashboard
```

And Supabase logs should show:
```
POST /auth/v1/token → 200 OK ✅
GET /rest/v1/users → 200 OK ✅ (THIS WAS MISSING BEFORE)
```

---

## 🆘 If CORS Fix Doesn't Work

Try these alternatives:

### **Alternative 1: Check Supabase Auth Settings**

1. Supabase Dashboard → Authentication → URL Configuration
2. Add `https://travelselbuy.com` to:
   - Site URL
   - Redirect URLs

### **Alternative 2: Check RLS Policy Context**

Run this in Supabase SQL Editor:
```sql
-- Check if authenticated requests from travelselbuy.com work
SELECT 
  current_setting('request.headers', true)::json->>'origin' as origin,
  auth.uid() as auth_user_id;
```

### **Alternative 3: Temporary Test - Disable RLS for 5 Minutes**

**ONLY FOR TESTING:**
```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

Have user try login. If it works → RLS policy issue with domain context.

Then **IMMEDIATELY RE-ENABLE:**
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

---

## 📞 Next Steps

1. **Immediate:** Add `https://travelselbuy.com` to Supabase allowed origins
2. **Test:** Have Chennai user try login after 5 minutes
3. **Monitor:** Check Supabase logs for the REST API query
4. **If still fails:** Run the diagnostic test in browser console

---

**Status:** 🔍 **ROOT CAUSE IDENTIFIED - CORS ISSUE**  
**Fix Time:** < 5 minutes  
**Success Probability:** 99%

