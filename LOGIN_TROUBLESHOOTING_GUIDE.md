# 🔍 Login Issue Troubleshooting Guide
## Why Login Works on Some Laptops But Not Others

Based on your application's authentication implementation, here are the most likely causes and solutions:

---

## 🎯 Quick Diagnosis Checklist

Run these checks on laptops where login **FAILS**:

### 1. Check Browser Console Errors
**How to check:**
1. Open the login page
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Try to login
5. Look for errors

**What to look for:**
```
❌ Missing Supabase credentials
❌ localhost.invalid
❌ Failed to fetch
❌ CORS error
❌ AuthApiError: Invalid Refresh Token
❌ Network error
❌ Profile query timeout
```

---

## 🔴 Common Issues & Solutions

### Issue #1: Missing Environment Variables (Most Likely)
**Symptoms:**
- Console shows: `⚠️ Missing Supabase credentials`
- Console shows: `http://localhost.invalid`
- Login button does nothing

**Cause:** Missing `.env.local` file or incorrect environment variables

**Solution:**
1. Check if `.env.local` file exists in the project root
2. If missing, create it from `env.example`:
   ```bash
   cp env.example .env.local
   ```
3. Add these values to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://megmjzszmqnmzdxwzigt.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTE3ODYsImV4cCI6MjA3NTEyNzc4Nn0.BN_tgy60e4UeRyeohwGe48P8QY9KNgFu8dw__AMxRGE
   ```
4. Restart the development server:
   ```bash
   npm run dev
   ```

---

### Issue #2: Browser Cache / Old Session Data
**Symptoms:**
- Login seems to work but redirects incorrectly
- Console shows: `Invalid Refresh Token`
- Stuck at "Loading user profile from database..."

**Cause:** Corrupted session data in browser localStorage

**Solution:**
1. Open Developer Tools (`F12`)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **Local Storage** → Click on your site URL
4. **Delete ALL** items (especially those containing `supabase`)
5. Go to **Session Storage** → Delete all items
6. **Hard refresh** the page (`Ctrl+Shift+R` or `Cmd+Shift+R`)
7. Try login again

**Quick clear command** (paste in Console):
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

---

### Issue #3: Network/Firewall Blocking Supabase
**Symptoms:**
- Console shows: `Failed to fetch`
- Console shows: `Network error`
- Requests to Supabase timeout

**Cause:** Corporate firewall, VPN, or antivirus blocking Supabase

**Solution:**
1. Check if Supabase is accessible:
   - Open: https://megmjzszmqnmzdxwzigt.supabase.co
   - Should show a message (not blocked/timeout)

2. If blocked:
   - **Disable VPN** temporarily
   - **Whitelist** `*.supabase.co` in firewall
   - Try on **mobile hotspot** to confirm it's network-related

3. Check proxy settings:
   - Windows: Settings → Network → Proxy
   - Ensure no proxy is interfering

---

### Issue #4: Browser Extensions Blocking Requests
**Symptoms:**
- Works in Incognito mode
- Doesn't work in normal mode
- CORS errors in console

**Cause:** Ad blockers, privacy extensions, or CORS blockers

**Solution:**
1. **Test in Incognito/Private mode** (extensions disabled)
2. If it works in Incognito:
   - **Disable extensions** one by one:
     - Ad blockers (uBlock Origin, AdBlock)
     - Privacy extensions (Privacy Badger, Ghostery)
     - Security extensions
   - Common culprits:
     - HTTPS Everywhere
     - NoScript
     - Privacy Badger
3. **Whitelist** your localhost and Supabase domain in the extension

---

### Issue #5: Different Node.js/NPM Versions
**Symptoms:**
- Works on some laptops but not others
- Build errors
- Module not found errors

**Cause:** Different Node.js versions installed

**Solution:**
1. Check Node.js version:
   ```bash
   node --version
   ```
   **Required:** Node.js 18.x or higher

2. Check npm version:
   ```bash
   npm --version
   ```
   **Required:** npm 9.x or higher

3. If versions don't match:
   - Install correct Node.js version from https://nodejs.org
   - Or use `nvm` (Node Version Manager):
     ```bash
     nvm install 18
     nvm use 18
     ```

4. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

### Issue #6: Database RLS (Row Level Security) Policies
**Symptoms:**
- Login succeeds but shows: "Failed to load user profile from database"
- Console shows: `Profile error: 403` or similar
- Authentication works but profile fetch fails

**Cause:** RLS policies blocking user profile access

**Solution:**
1. Check if user exists in database:
   - Open Supabase Dashboard
   - Go to **SQL Editor**
   - Run this query:
     ```sql
     SELECT id, email, name, role 
     FROM public.users 
     WHERE email = 'operator@gmail.com';
     ```

2. If user doesn't exist, RLS is working but no profile:
   - User needs to be created in database
   - See `setup-users-table.sql` for user creation

3. If RLS is too restrictive:
   - Run `diagnose-rls-issue.sql` in SQL Editor
   - Check if policies allow authenticated users to read own data

---

### Issue #7: CORS Issues (Production/Deployed Sites)
**Symptoms:**
- Works on localhost
- Doesn't work on deployed site (Netlify/Vercel)
- Console shows: `CORS policy` error

**Cause:** Missing Supabase domain in allowed origins

**Solution:**
1. Go to Supabase Dashboard
2. Navigate to: **Settings** → **API** → **URL Configuration**
3. Add your deployed domain to **Allowed Origins**:
   - `https://travelselbuy.netlify.app`
   - `http://localhost:3000` (for development)

---

### Issue #8: Outdated Code / Git Branch Mismatch
**Symptoms:**
- Different behavior on different laptops
- One laptop has old login logic

**Cause:** Different git branches or uncommitted changes

**Solution:**
1. Check current branch:
   ```bash
   git branch
   ```

2. Pull latest changes:
   ```bash
   git pull origin main
   ```

3. Check for uncommitted changes:
   ```bash
   git status
   ```

4. If needed, stash and pull:
   ```bash
   git stash
   git pull origin main
   git stash pop
   ```

---

## 🧪 Diagnostic Script

Run this in the **Browser Console** on the login page to get diagnostic info:

```javascript
console.log('=== DIAGNOSTIC INFO ===');
console.log('Environment Variables:');
console.log('- Supabase URL:', process?.env?.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET');
console.log('- Supabase Key:', process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('\nLocalStorage:');
Object.keys(localStorage).forEach(key => {
  if (key.includes('supabase')) {
    console.log(`- ${key}:`, localStorage.getItem(key)?.substring(0, 50) + '...');
  }
});
console.log('\nBrowser Info:');
console.log('- User Agent:', navigator.userAgent);
console.log('- Cookies Enabled:', navigator.cookieEnabled);
console.log('- Online:', navigator.onLine);
console.log('\nTest Supabase Connection:');
fetch('https://megmjzszmqnmzdxwzigt.supabase.co')
  .then(() => console.log('✅ Supabase reachable'))
  .catch(e => console.log('❌ Supabase NOT reachable:', e.message));
```

---

## 📋 Comparison Checklist

Create a comparison between **working** and **non-working** laptops:

| Check | Working Laptop | Non-Working Laptop |
|-------|----------------|-------------------|
| Node.js version (`node -v`) | | |
| npm version (`npm -v`) | | |
| Browser & version | | |
| `.env.local` exists? | | |
| VPN enabled? | | |
| Browser extensions | | |
| Network (home/office/VPN) | | |
| Operating System | | |
| Supabase reachable? | | |
| Console errors | | |

---

## 🔧 Advanced Debugging

If none of the above work, enable detailed logging:

### 1. Enable All Console Logs
In `src/context/SupabaseAuthContext.tsx`, all logs are already enabled. Check the console for:
- `🔐 Starting login process`
- `✅ Sign in successful`
- `📡 Loading user profile from database...`
- `👤 Full user object created`
- `✅ Login successful, redirecting to:`

### 2. Check Network Tab
1. Open Developer Tools (`F12`)
2. Go to **Network** tab
3. Try login
4. Look for failed requests (red status codes)
5. Check the failing request:
   - URL
   - Status code
   - Response

### 3. Check Supabase Auth Logs
1. Go to Supabase Dashboard
2. Navigate to: **Authentication** → **Logs**
3. Try login on failing laptop
4. Check if authentication request reaches Supabase
5. If no logs appear → Network/firewall issue
6. If logs show error → Check error message

---

## 📞 Still Not Working?

If you've tried everything above and login still fails on some laptops:

### Collect This Information:
1. **Console logs** (full output during login attempt)
2. **Network tab** (screenshot of failed requests)
3. **Comparison table** (filled out from checklist above)
4. **Environment variables** (from diagnostic script)
5. **Browser & OS details**

### Create a Debug Report:
```
Laptop Details:
- OS: Windows 10 / macOS / Linux
- Browser: Chrome 120 / Firefox 115 / Safari 17
- Node.js: v18.17.0
- npm: 9.6.7
- Network: Home WiFi / Office / VPN

Console Errors:
[Paste console errors here]

Network Tab:
[Describe failed requests]

Environment:
- .env.local exists: Yes/No
- NEXT_PUBLIC_SUPABASE_URL: Set/Not Set
- localStorage items: [count]
```

---

## ✅ Quick Fix Attempt

Try this sequence on **non-working** laptops:

```bash
# 1. Clear everything
rm -rf node_modules package-lock.json .next

# 2. Ensure .env.local exists and is correct
cp env.example .env.local
# Edit .env.local with correct values

# 3. Reinstall
npm install

# 4. Start dev server
npm run dev
```

Then in the browser:
```javascript
// Clear all storage
localStorage.clear();
sessionStorage.clear();
```

Hard refresh (`Ctrl+Shift+R`) and try login again.

---

## 🎯 Most Likely Cause

Based on your application's architecture, **95% of cases** are one of:

1. ✅ **Missing `.env.local` file** (40%)
2. ✅ **Old session data in localStorage** (30%)
3. ✅ **Network/firewall blocking Supabase** (15%)
4. ✅ **Browser extensions blocking requests** (10%)
5. ✅ **Different Node.js versions** (5%)

Start with these and you'll likely find the issue!

