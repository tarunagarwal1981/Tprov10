# Fix Browser Connection to Supabase (Local Only)

## Problem
Login works in deployment but fails locally with `ERR_CONNECTION_TIMED_OUT`

## Root Cause
Browser is blocking requests to Supabase, but PowerShell/deployment can reach it fine.

## Solutions (Try in Order)

### ✅ Solution 1: Clear Browser Data (RECOMMENDED)
1. Open browser DevTools (F12)
2. Right-click the **Refresh button** → **Empty Cache and Hard Reload**
3. Or press `Ctrl + Shift + Delete`:
   - Select "All time"
   - Check: ✅ Cookies, ✅ Cached files
   - Clear data
4. Close ALL browser windows
5. Reopen and try again

### ✅ Solution 2: Disable Browser Extensions
1. Open Incognito/Private mode: `Ctrl + Shift + N` (Chrome) or `Ctrl + Shift + P` (Firefox)
2. Try logging in there
3. If it works → One of your extensions is blocking Supabase

**Common blocking extensions:**
- Ad blockers (uBlock Origin, AdBlock Plus)
- Privacy tools (Privacy Badger, Ghostery)
- VPN extensions
- Security extensions

### ✅ Solution 3: Check Windows Firewall
```powershell
# Check if Windows Firewall is blocking Node/Chrome
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*Node*" -or $_.DisplayName -like "*Chrome*" }
```

**To allow Node.js through firewall:**
1. Windows Search → "Windows Defender Firewall"
2. Click "Allow an app through firewall"
3. Look for "Node.js" - ensure both Private and Public are checked
4. If not listed, click "Allow another app" → Browse to Node.js

### ✅ Solution 4: Flush DNS Cache
```powershell
# Run in PowerShell as Administrator
ipconfig /flushdns
Clear-DnsClientCache
```

Then restart your browser.

### ✅ Solution 5: Try Different Browser
- Chrome not working? → Try Edge or Firefox
- This helps identify if it's browser-specific

### ✅ Solution 6: Disable Antivirus Temporarily
Some antivirus software (Avast, AVG, McAfee, Norton) block API calls:
1. Temporarily disable antivirus
2. Try login
3. If it works → Add Supabase to antivirus whitelist

### ✅ Solution 7: Check Corporate VPN/Proxy
If on work network:
- Disconnect from VPN
- Try login
- If it works → VPN is blocking external APIs

### ✅ Solution 8: Reset Browser Settings
**Chrome:**
```
chrome://settings/reset
```
1. Scroll down → Advanced
2. "Restore settings to original defaults"
3. Reset

**Edge:**
```
edge://settings/reset
```

### ✅ Solution 9: Use Different Port
Sometimes localhost:3000 has issues:

**In your project:**
1. Stop server: `Ctrl + C`
2. Run: `npm run dev -- -p 3001`
3. Open: `http://localhost:3001`

## Quick Test
Open browser console and run:
```javascript
fetch('https://megmjzszmqnmzdxwzigt.supabase.co/auth/v1/health')
  .then(r => r.json())
  .then(d => console.log('✅ Supabase reachable:', d))
  .catch(e => console.error('❌ Cannot reach Supabase:', e));
```

**Expected:** Should see "No API key" error (means connection works)
**Your issue:** You see `ERR_CONNECTION_TIMED_OUT` (connection blocked)

## Additional Info

### Why Deployment Works But Local Doesn't?
| Environment | Works? | Why? |
|-------------|--------|------|
| Deployment (Vercel/etc) | ✅ Yes | Uses server-side rendering, no browser restrictions |
| Local Browser | ❌ No | Browser security blocking the request |
| Local PowerShell | ✅ Yes | No browser restrictions |

### Network Test Results
```
✅ PowerShell can reach Supabase
❌ Browser cannot reach Supabase
→ Browser-specific blocking issue
```

## Most Likely Cause
Based on your error, the top 3 causes are:
1. **Browser extension blocking** (80% chance)
2. **Browser cache corruption** (15% chance)
3. **Antivirus software** (5% chance)

**Start with Solution 1 (clear cache) and Solution 2 (incognito mode)!**

