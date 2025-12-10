# ✅ Quick Fix Checklist - Production Login

## The Problem
```
❌ https://travelselbuy.netlify.app → Can't login
✅ Local (localhost:3000) → Works fine
```

**Cause:** Missing environment variables in Netlify

---

## 5-Minute Fix

### □ Step 1: Open Netlify
- Go to: https://app.netlify.com/sites/travelselbuy/configuration/env
- Or navigate: Dashboard → Sites → travelselbuy → Site configuration → Environment variables

### □ Step 2: Add Variable #1
```
Name:  NEXT_PUBLIC_SUPABASE_URL
Value: https://megmjzszmqnmzdxwzigt.supabase.co
Scope: All
```

### □ Step 3: Add Variable #2
```
Name:  NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [YOUR_SUPABASE_ANON_KEY]
Scope: All
```

### □ Step 4: Add Variable #3
```
Name:  SUPABASE_SERVICE_ROLE_KEY
Value: [YOUR_SUPABASE_SERVICE_ROLE_KEY]
Scope: All
```

### □ Step 5: Redeploy
- Go to: **Deploys** tab in Netlify
- Click: **Trigger deploy** → **Clear cache and deploy site**
- Wait: ~3 minutes

### □ Step 6: Test
- Open: https://travelselbuy.netlify.app/login
- Login with: `operator@gmail.com`
- Should work! 🎉

---

## What You'll See When Fixed

**Before (Current):**
```javascript
// Browser console shows:
POST http://localhost.invalid/auth/v1/token ❌
Mixed Content error ❌
```

**After (Fixed):**
```javascript
// Browser console shows:
POST https://megmjzszmqnmzdxwzigt.supabase.co/auth/v1/token ✅
Login successful ✅
```

---

## Quick Links

- 📖 Detailed Guide: `NETLIFY-SETUP-GUIDE.md`
- 📋 Summary: `PRODUCTION-FIX-SUMMARY.md`
- 🌐 Netlify Dashboard: https://app.netlify.com/

---

**⏱️ Time Required: 5 minutes**  
**💰 Cost: $0 (free tier)**  
**🔧 Technical Difficulty: Easy (copy/paste)**

**DO THIS NOW!** Your production site is broken until you complete these steps. 🚨

