# 🛠️ Local Development Setup Guide

## ✅ Current Status

| Item | Status | Notes |
|------|--------|-------|
| `.env.local` file | ✅ EXISTS | For local development |
| `.env` file | ✅ NOT EXISTS | Correct - should not exist |
| `env_temp.txt` | ✅ EXISTS | Contains Supabase credentials |
| `env.example` | ✅ EXISTS | Template file |
| Supabase URL | ✅ Configured | `https://megmjzszmqnmzdxwzigt.supabase.co` |
| Supabase Anon Key | ✅ Configured | Valid key present |
| Service Role Key | ✅ Configured | Valid key present |

---

## 🔍 Issue Analysis

### Your `.env.local` File Status: ✅ **EXISTS**

Good news! You already have a `.env.local` file, which is the correct file for Next.js local development.

### To Verify Local Configuration

Run this command in your project root:

```powershell
# Windows PowerShell
Get-Content .env.local
```

Or on Mac/Linux:

```bash
cat .env.local
```

---

## 📝 Required Environment Variables for Local Login

Your `.env.local` file **MUST** contain these exact variables:

```env
# Supabase Configuration (REQUIRED for login - replace with your actual values)
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]

# Optional - Only needed for OAuth
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
# GITHUB_CLIENT_ID=your_github_client_id
# GITHUB_CLIENT_SECRET=your_github_client_secret
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Missing Supabase credentials" Warning

**Symptom:**
```javascript
console.warn('⚠️  Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL...')
```

**Solution:**
1. Make sure `.env.local` exists in your project root (same level as `package.json`)
2. Verify it contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **IMPORTANT**: Restart your dev server after adding/changing env variables

```powershell
# Stop the dev server (Ctrl+C)
# Then restart:
npm run dev
```

### Issue 2: Login Connects to `localhost.invalid`

**Symptom:**
```javascript
console.error('❌ CRITICAL: Supabase environment variables are missing...')
// Tries to connect to: http://localhost.invalid
```

**Solution:**
1. Check if `.env.local` exists: `Test-Path .env.local`
2. Check if it has the correct variables
3. **Restart the dev server** - env variables only load on server start

### Issue 3: Variables Not Loading

**Symptom:**
- Login doesn't work
- Console shows "undefined" for Supabase URL
- No connection to database

**Causes & Solutions:**

#### Cause A: Variable Names Wrong
```env
# ❌ WRONG - Missing NEXT_PUBLIC_ prefix
SUPABASE_URL=https://...

# ✅ CORRECT - Must have NEXT_PUBLIC_ for client-side
NEXT_PUBLIC_SUPABASE_URL=https://...
```

#### Cause B: Extra Spaces/Newlines
```env
# ❌ WRONG - Trailing space
NEXT_PUBLIC_SUPABASE_URL=https://megmjzszmqnmzdxwzigt.supabase.co 

# ✅ CORRECT - No trailing space
NEXT_PUBLIC_SUPABASE_URL=https://megmjzszmqnmzdxwzigt.supabase.co
```

#### Cause C: Wrong File Location
```
❌ WRONG locations:
- src/.env.local
- public/.env.local
- .env (without .local)

✅ CORRECT location:
- .env.local (in project root, same level as package.json)
```

#### Cause D: Server Not Restarted
```powershell
# Must restart dev server after changing .env files
# Stop with Ctrl+C, then:
npm run dev
```

---

## ✅ Quick Fix - Copy Configuration

If your `.env.local` is missing or incorrect, run this:

### Windows PowerShell:
```powershell
# Create/overwrite .env.local with correct configuration
@"
NEXT_PUBLIC_SUPABASE_URL=https://megmjzszmqnmzdxwzigt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTE3ODYsImV4cCI6MjA3NTEyNzc4Nn0.BN_tgy60e4UeRyeohwGe48P8QY9KNgFu8dw__AMxRGE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MTc4NiwiZXhwIjoyMDc1MTI3Nzg2fQ.i2kYiW0n-1uuJuTK5HH6sc0W7Vpjrl4SEXBq8TwL-KA
"@ | Set-Content -Path .env.local

Write-Host "✅ .env.local created successfully!"
Write-Host "⚠️  Now restart your dev server: npm run dev"
```

### Mac/Linux:
```bash
# Create/overwrite .env.local with correct configuration
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://megmjzszmqnmzdxwzigt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTE3ODYsImV4cCI6MjA3NTEyNzc4Nn0.BN_tgy60e4UeRyeohwGe48P8QY9KNgFu8dw__AMxRGE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZ21qenN6bXFubXpkeHd6aWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MTc4NiwiZXhwIjoyMDc1MTI3Nzg2fQ.i2kYiW0n-1uuJuTK5HH6sc0W7Vpjrl4SEXBq8TwL-KA
EOF

echo "✅ .env.local created successfully!"
echo "⚠️  Now restart your dev server: npm run dev"
```

### Or Manually:
1. Copy from `env_temp.txt` to `.env.local`
2. Restart dev server

```powershell
# Windows
Copy-Item env_temp.txt .env.local
npm run dev

# Mac/Linux
cp env_temp.txt .env.local
npm run dev
```

---

## 🧪 Verify Configuration

### Step 1: Check File Exists
```powershell
# Windows PowerShell
Test-Path .env.local
# Should return: True

# Mac/Linux
ls -la .env.local
# Should show file details
```

### Step 2: Check File Contents
```powershell
# Windows
Get-Content .env.local | Select-String "NEXT_PUBLIC"

# Mac/Linux
cat .env.local | grep "NEXT_PUBLIC"
```

Should show:
```
NEXT_PUBLIC_SUPABASE_URL=https://megmjzszmqnmzdxwzigt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

### Step 3: Restart Dev Server
```bash
# Stop server with Ctrl+C
# Then restart
npm run dev
```

### Step 4: Check Console for Confirmation
After restarting, check your terminal output:

```
✅ Good - Should see:
[Supabase][env] URL: https://megmjzszmqnmzdxwzigt.supabase.co
[Supabase][env] ANON key (masked): eyJhbG...len:212

❌ Bad - Should NOT see:
⚠️  Missing Supabase credentials
⚠️  Supabase credentials missing at init time
```

### Step 5: Test Login
1. Open http://localhost:3000/login
2. Open browser console (F12)
3. Try to login
4. Check console - should NOT see `localhost.invalid`

---

## 🎯 Development Workflow

### Starting Development
```bash
# 1. Make sure .env.local exists and has correct values
cat .env.local  # or Get-Content .env.local

# 2. Install dependencies (if needed)
npm install

# 3. Start dev server
npm run dev

# 4. Open browser
# http://localhost:3000
```

### If Login Doesn't Work
```bash
# 1. Check environment variables are loaded
# Look for this in terminal output:
# [Supabase][env] URL: https://megmjzszmqnmzdxwzigt.supabase.co

# 2. Check browser console (F12)
# Should NOT see: localhost.invalid
# Should see: megmjzszmqnmzdxwzigt.supabase.co

# 3. If still issues, restart with clean cache:
npm run dev -- --reset-cache
```

---

## 📊 Environment Files Explained

| File | Purpose | Git Status | Local/Production |
|------|---------|------------|-----------------|
| `.env.local` | **Local development** | ❌ Ignored | Local only |
| `.env` | Not used (Next.js uses .env.local) | ❌ Ignored | - |
| `env.example` | **Template** for others | ✅ Committed | Both |
| `env_temp.txt` | Backup of your credentials | ✅ Committed | Both |

### Next.js Environment File Priority
```
Next.js loads in this order (highest priority first):
1. .env.local          ← Local development (USE THIS)
2. .env.development    ← Not used in this project
3. .env                ← Not used (Next.js prefers .env.local)
```

---

## 🔐 Security Notes

### ⚠️ Important
- `.env.local` is git-ignored (✅ correct)
- Never commit `.env.local` to git
- `env_temp.txt` is committed (for team reference)
- Production uses Netlify environment variables

### Production vs Local
```
Local Development:
✅ .env.local file
✅ Loaded from filesystem
✅ Not in git

Production (Netlify):
✅ Netlify dashboard env vars
✅ Set in Netlify UI
✅ Not in codebase
```

---

## ✅ Checklist for Local Login

- [ ] `.env.local` file exists in project root
- [ ] File contains `NEXT_PUBLIC_SUPABASE_URL`
- [ ] File contains `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] File contains `SUPABASE_SERVICE_ROLE_KEY`
- [ ] No trailing spaces in values
- [ ] Variable names have `NEXT_PUBLIC_` prefix (for client-side)
- [ ] Dev server restarted after env changes
- [ ] Console shows correct Supabase URL
- [ ] Browser console doesn't show `localhost.invalid`
- [ ] Login page loads without errors

---

## 🆘 Still Having Issues?

### Debug Steps:

1. **Check if env variables are loaded:**
```javascript
// Add this to your login page temporarily
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

2. **Check terminal output when starting dev server:**
```bash
npm run dev

# Should see:
# [Supabase][env] URL: https://megmjzszmqnmzdxwzigt.supabase.co
# [Supabase][env] ANON key (masked): eyJhbG...len:212
```

3. **Check browser console (F12):**
```javascript
// Should see these logs when loading the app:
// [Supabase][init] Creating client for URL: https://megmjzszmqnmzdxwzigt.supabase.co
// 🔄 Initializing authentication...
```

4. **If still issues, create new .env.local:**
```powershell
# Delete old file
Remove-Item .env.local -Force

# Copy from template
Copy-Item env_temp.txt .env.local

# Restart server
npm run dev
```

---

## 📞 Support

If login still doesn't work after following this guide:

1. Check the console output (both terminal and browser)
2. Verify Supabase URL is correct (should be `megmjzszmqnmzdxwzigt.supabase.co`)
3. Make sure dev server was restarted
4. Try in incognito mode to rule out browser cache

---

## 🎉 Success Indicators

You know it's working when:

✅ Dev server starts without env warnings
✅ Console shows correct Supabase URL
✅ Login page loads without errors
✅ Can see login form
✅ No `localhost.invalid` in console
✅ Login attempts connect to Supabase
✅ Can login successfully

**Your local development environment is ready!** 🚀

