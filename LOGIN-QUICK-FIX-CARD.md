# 🔧 Login Quick Fix Card

> **Can't login to the system?** Follow these 3 simple steps:

---

## ⚡ Step 1: Clear Browser Cache (Fixes 90% of issues)

**Windows/Linux:**
```
Press: Ctrl + Shift + Delete
Select: "All time"
Check: ✅ Cookies  ✅ Cache
Click: "Clear data"
Close browser completely
Reopen and try login
```

**Mac:**
```
Press: Cmd + Shift + Delete
Select: "All time"
Check: ✅ Cookies  ✅ Cache
Click: "Clear data"
Close browser completely
Reopen and try login
```

---

## 🕵️ Step 2: Try Incognito Mode

**Why?** This tells us if browser extensions are blocking login.

**How:**
- Chrome/Edge: `Ctrl+Shift+N` (Windows) or `Cmd+Shift+N` (Mac)
- Firefox: `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
- Safari: File → New Private Window

**Then:** Try logging in

**Result:**
- ✅ Works in Incognito? → **Disable ad blocker/extensions**
- ❌ Still fails? → **Go to Step 3**

---

## 🌐 Step 3: Check Network

**If on VPN:** Disconnect it and try again

**If in office:** Ask IT to whitelist: `*.supabase.co`

**Quick test:** Try login using mobile hotspot

---

## ✅ Expected Behavior (When Working)

Login should take **less than 5 seconds** and show:

```
✅ Sign in successful
📡 Loading user profile...
✅ Login successful!
[Redirects to dashboard]
```

---

## 🆘 Still Not Working?

**Run this test in browser console (F12):**

```javascript
fetch('https://megmjzszmqnmzdxwzigt.supabase.co/rest/v1/')
  .then(r => console.log('✅ Connected'))
  .catch(e => console.log('❌ Blocked'));
```

**Contact:** [Your admin email/phone]

**Include:**
- Your browser name and version
- Whether Incognito mode worked
- Result of the test above
- Your network type (office/home/VPN)

---

**Remember:** Your credentials are correct! This is just a browser/network configuration issue. Step 1 alone fixes 90% of cases! 🎯

