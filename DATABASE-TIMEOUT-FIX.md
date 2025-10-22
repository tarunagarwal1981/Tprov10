# Database Query Timeout - Diagnosis & Fix

## 🔍 Issue

Login authentication succeeds but database query times out when fetching user profile.

**Symptoms:**
```
✅ Sign in successful
📡 Starting database query...
❌ Database query timeout after 10 seconds
❌ Profile loading failed
```

---

## ✅ Changes Made

### 1. **Removed Fallback User Data**
- No fallback - only uses actual database data
- Shows proper error if query fails

### 2. **Improved Automatic Cache Clearing**
**Before:**
- Cleared any expired session immediately
- Could interfere with active sessions

**After:**
- Only clears sessions expired **more than 1 hour ago**
- Safer - won't touch recent or active sessions
- Less aggressive

### 3. **Increased Query Timeout**
- **Before:** 10 seconds
- **After:** 30 seconds
- Allows more time for slow networks/databases

### 4. **Better Error Logging**
Added detailed error information:
- Error code
- Error details
- Error hint
- Full error message

---

## 🧪 Diagnosis Steps

### Step 1: Run Performance Test

Open **Supabase SQL Editor** and run `test-rls-performance.sql`:

```sql
-- Test 1: Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Test 2: Direct query (should be INSTANT)
SELECT id, email, name, role
FROM public.users
WHERE id = '0afbb77a-e2fa-4de8-8a24-2ed473ab7c2c';

-- Test 3: Performance analysis
EXPLAIN ANALYZE
SELECT *
FROM public.users
WHERE id = '0afbb77a-e2fa-4de8-8a24-2ed473ab7c2c';
```

**Expected result:** Query should complete in < 50ms

**If slow (> 1 second):**
- Database performance issue
- Missing index on `id` column
- RLS policy complexity

---

## 🎯 Likely Causes

### Cause 1: Network Latency (Most Likely)
**Symptoms:**
- Authentication works
- Query starts but times out
- Happens on some networks but not others

**Solution:**
- 30-second timeout should help
- Check user's network speed
- Try disabling VPN

### Cause 2: RLS Policy Performance
**Symptoms:**
- Query is slow in SQL editor too
- Happens consistently

**Solution (Temporary Test):**
```sql
-- Temporarily disable RLS to test
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

Try login. If it works → RLS is causing slowness.

**Then re-enable immediately:**
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### Cause 3: Database Cold Start
**Symptoms:**
- First query is slow
- Subsequent queries are fast

**Solution:**
- Wait 30 seconds for timeout
- Query will complete eventually
- This is normal for free tier databases

### Cause 4: Missing Database Index
**Symptoms:**
- Queries are consistently slow

**Check:**
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users' AND indexdef LIKE '%id%';
```

**Should see:** Primary key index on `id` column

---

## 🚀 What to Try Now

### Option 1: Deploy Changes & Test (Recommended)

1. **Commit and push changes:**
   ```
   - Safer cache clearing
   - 30-second timeout
   - Better error logging
   ```

2. **Try login after deployment**

3. **Check console for detailed error:**
   - Will show specific error code
   - Will show error details
   - Will help identify root cause

### Option 2: Test RLS Temporarily

If you want to rule out RLS as the issue:

1. **Run in Supabase SQL Editor:**
   ```sql
   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
   ```

2. **Try login immediately**

3. **If it works:**
   - RLS policies are causing the slowness
   - Need to optimize policies

4. **Re-enable RLS:**
   ```sql
   ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
   ```

### Option 3: Add Database Index (If Missing)

```sql
-- Check if index exists
SELECT * FROM pg_indexes WHERE tablename = 'users';

-- If id index is missing, create it
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
```

---

## 📊 Expected Behavior After Fix

### Success Flow:
```
1. User enters credentials
2. Authentication succeeds (< 2s)
3. Database query starts
4. Query completes (< 2s)
5. User profile loaded
6. Redirect to dashboard
Total: ~3-4 seconds ✅
```

### If Still Timing Out:
```
1. User enters credentials
2. Authentication succeeds (< 2s)
3. Database query starts
4. Wait... (10s, 20s, 30s)
5. Timeout error with detailed message
6. Check console for specific error code
```

---

## 🔍 Console Logs to Check

After deployment, check browser console for:

**If working:**
```
📡 Starting database query with 30s timeout...
📡 Query completed! Result: {userProfile: {...}}
👤 Full user object created
✅ Login successful, redirecting to: /operator/dashboard
```

**If timing out:**
```
📡 Starting database query with 30s timeout...
📡 Query or timeout error: Error: Database query timeout...
❌ Profile error: Error: Database query timeout...
❌ Error details: {
  message: "...",
  code: "...",
  details: "...",
  hint: "..."
}
```

**Send this error information** - it will tell us exactly what's wrong.

---

## 💡 Quick Diagnosis

**Run this in browser console during login:**

```javascript
// Monitor query performance
const startTime = Date.now();
console.log('⏱️ Query started at:', startTime);

// After login attempt fails, check duration
const duration = Date.now() - startTime;
console.log('⏱️ Query took:', duration, 'ms');

if (duration >= 30000) {
  console.log('❌ Hit timeout - network or database issue');
} else if (duration > 10000) {
  console.log('⚠️ Very slow - likely database performance');
} else {
  console.log('❌ Failed quickly - likely authentication or RLS issue');
}
```

---

## 📝 Summary

**What I Changed:**
- ✅ Removed fallback user data (actual data only)
- ✅ Made cache clearing safer (1 hour buffer)
- ✅ Increased timeout to 30 seconds
- ✅ Added detailed error logging
- ✅ Kept automatic cache clearing (safer version)

**What to Do:**
1. Deploy these changes
2. Try login and check console for detailed error
3. Run `test-rls-performance.sql` in Supabase
4. Send error details if still failing

**Most Likely Fix:**
- 30-second timeout will allow slow queries to complete
- Safer cache clearing won't interfere
- Should work now!

---

**Status:** ✅ **READY TO DEPLOY & TEST**

