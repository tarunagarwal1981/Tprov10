# Fix Supabase Project API Connection Issue

## Problem
The Supabase Auth works (login successful), but REST API queries to the `users` table timeout.

## Diagnostic Steps

### 1. Check Supabase Project Status

Go to **Supabase Dashboard** → **Home**

- Check if project shows "**Paused**" or "**Active**"
- If paused, click "**Restore project**" or "**Resume**"
- Free tier projects auto-pause after 7 days of inactivity

### 2. Check API Settings

Go to **Supabase Dashboard** → **Settings** → **API**

#### Verify URLs:
- **Project URL**: Should be `https://[project-ref].supabase.co`
- **API URL**: Should be `https://[project-ref].supabase.co/rest/v1`
- **Anon key**: Should be a long JWT token

#### Check in your code:
Your `NEXT_PUBLIC_SUPABASE_URL` should match the **Project URL**

### 3. Check Database Connection

Go to **Supabase Dashboard** → **Database** → **Connection**

- Check "**Connection pooling**" status
- Verify "**Direct connection**" is available
- Check if there are any connection limits reached

### 4. Check PostgREST Status

Go to **Supabase Dashboard** → **Database** → **Tables**

- Click on the `users` table
- Try to **browse data** in the UI
- If the UI can't load data, PostgREST service might be down

### 5. Restart Services

Go to **Supabase Dashboard** → **Settings** → **General**

Try restarting the project:
1. Look for "**Restart project**" or "**Pause/Resume**" options
2. Pause the project
3. Wait 30 seconds
4. Resume the project

### 6. Check API Rate Limits

Go to **Supabase Dashboard** → **Settings** → **Billing**

- Check if you've exceeded free tier limits:
  - **Database size**: 500 MB limit
  - **API requests**: Check current usage
  - **Bandwidth**: Check if exceeded

### 7. Verify Environment Variables

Create/check your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

**Important:**
- URL should NOT end with `/rest/v1` or `/auth/v1`
- Anon key should be the "**anon/public**" key, NOT the service role key
- Restart your dev server after changing env vars

### 8. Test REST API Directly

Open this URL in your browser (replace values):

```
https://[your-project-ref].supabase.co/rest/v1/users?select=*&id=eq.[user-id]
```

Add header: `apikey: [your-anon-key]`

Or use curl:

```bash
curl "https://[your-project-ref].supabase.co/rest/v1/users?select=*&id=eq.[user-id]" \
  -H "apikey: [your-anon-key]" \
  -H "Authorization: Bearer [your-anon-key]"
```

**Expected result:** JSON response with user data
**If fails:** PostgREST service is not responding

### 9. Check Browser Network Tab

1. Open browser DevTools → **Network** tab
2. Try to login
3. Look for requests to `https://[project-ref].supabase.co/rest/v1/users`
4. Check:
   - **Status**: Should be 200
   - **Response time**: Should be < 1 second
   - **Response**: Should have user data
   - **Headers**: Check if `apikey` header is present

### 10. Common Fixes

#### Fix 1: Project Region Issue
- Free tier might have region-specific issues
- Check **Settings** → **General** for region
- Some regions may have degraded performance

#### Fix 2: API Key Regeneration
1. Go to **Settings** → **API**
2. Click "**Regenerate**" on anon key
3. Update your `.env.local` with new key
4. Restart dev server

#### Fix 3: Database Connection Pooler
1. Go to **Database** → **Connection**
2. Enable "**Connection Pooling**" if not enabled
3. Try using the pooler connection string

#### Fix 4: Create New Project
If all else fails:
1. Export your database schema
2. Export your data
3. Create a new Supabase project
4. Import schema and data
5. Update credentials in `.env.local`

## Quick Test After Fix

After making changes:

1. **Restart your dev server**
2. **Hard refresh browser** (Ctrl+Shift+R)
3. **Try login**
4. **Check console** for:
   ```
   📡 Query result: { userProfile: {...}, profileError: null }
   ✅ Login successful
   ```

## If Still Not Working

Share these details:

1. **Supabase project status** (Active/Paused)
2. **Supabase region** (from Settings → General)
3. **Network tab screenshot** showing the failed request
4. **Console error messages**
5. **Result of direct REST API test** (curl command above)

---

**Most Likely Causes:**
1. ✅ Project is paused (free tier auto-pause)
2. ✅ PostgREST service needs restart
3. ✅ Wrong API endpoint in environment variables
4. ✅ API rate limits exceeded

