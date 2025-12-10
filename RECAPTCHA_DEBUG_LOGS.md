# reCAPTCHA Debug Logs Guide 🔍

## Enhanced Logging Added

I've added comprehensive logging throughout the reCAPTCHA verification flow to help identify where the issue is occurring.

---

## Client-Side Logs (Browser Console)

### When Token is Received:
```
✅ reCAPTCHA token received: {
  tokenLength: 1234,
  tokenPrefix: "03AGdBq27...",
  siteKey: "6Ld33CIsAA..."
}
```

### When Sending Request:
```
📤 Sending phone init request: {
  countryCode: "+91",
  phoneNumber: "1234567890",
  hasRecaptchaToken: true,
  tokenLength: 1234,
  tokenPrefix: "03AGdBq27...",
  siteKey: "6Ld33CIsAA..."
}
```

### When Receiving Response:
```
📥 Response status: 400 Bad Request
📥 Response data: {
  mode: undefined,
  userExists: undefined,
  error: "reCAPTCHA verification failed",
  details: "..."
}
❌ Request failed: {
  status: 400,
  error: "reCAPTCHA verification failed",
  details: "..."
}
```

---

## Server-Side Logs (Amplify/CloudWatch)

### When Request is Received:
```
📥 Received phone init request: {
  countryCode: "+91",
  phoneNumber: "123***",
  hasRecaptchaToken: true,
  tokenLength: 1234,
  tokenPrefix: "03AGdBq27...",
  hasSecretKey: true,
  secretKeyLength: 40,
  secretKeyPrefix: "6Ld33CIsAA..."
}
```

### When Verifying with Google:
```
🔍 Verifying reCAPTCHA token...
🔍 Sending reCAPTCHA verification to Google: {
  url: "https://www.google.com/recaptcha/api/siteverify",
  hasSecretKey: true,
  secretKeyLength: 40,
  secretKeyPrefix: "6Ld33CIsAA...",
  tokenLength: 1234,
  tokenPrefix: "03AGdBq27...",
  remoteip: "123.45.67.89"
}
```

### Google API Response:
```
📥 Google reCAPTCHA API response status: 200 OK
📥 Google reCAPTCHA API response: {
  success: false,
  score: undefined,
  hostname: "dev.travelselbuy.com",
  challenge_ts: "2025-12-07T...",
  errorCodes: ["invalid-input-secret", "invalid-input-response"]
}
❌ reCAPTCHA verification failed: {
  errorCodes: ["invalid-input-secret"],
  hostname: "dev.travelselbuy.com",
  challenge_ts: "2025-12-07T...",
  hasSecretKey: true,
  secretKeyLength: 40
}
```

---

## What to Look For

### ✅ Good Signs:
- `hasSecretKey: true` - Secret key is set
- `secretKeyLength: 40` - Key has correct length (usually 40 chars)
- `hasRecaptchaToken: true` - Token is being sent
- `tokenLength: 1234` - Token has reasonable length
- `success: true` in Google's response

### ❌ Problem Signs:

#### 1. Secret Key Not Set:
```
hasSecretKey: false
secretKeyLength: 0
secretKeyPrefix: "not set"
```
**Fix**: Add `RECAPTCHA_SECRET_KEY` to Amplify environment variables

---

#### 2. Wrong Secret Key:
```
📥 Google reCAPTCHA API response: {
  success: false,
  errorCodes: ["invalid-input-secret"]
}
```
**Fix**: Verify the secret key matches the site key (same reCAPTCHA site)

---

#### 3. Token Issues:
```
📥 Google reCAPTCHA API response: {
  success: false,
  errorCodes: ["invalid-input-response"]
}
```
**Possible causes**:
- Token expired (normal - user needs to complete again)
- Token already used
- Token format issue

---

#### 4. Key Mismatch:
```
📥 Google reCAPTCHA API response: {
  success: false,
  errorCodes: ["invalid-input-secret", "invalid-input-response"]
}
```
**Fix**: Both keys must be from the same reCAPTCHA site

---

#### 5. Domain Mismatch:
```
📥 Google reCAPTCHA API response: {
  success: false,
  errorCodes: ["invalid-input-response"]
}
hostname: "dev.travelselbuy.com"
```
**Fix**: Add the domain to reCAPTCHA admin site settings

---

## Error Codes Reference

| Error Code | Meaning | Fix |
|------------|---------|-----|
| `invalid-input-secret` | Secret key is wrong | Check `RECAPTCHA_SECRET_KEY` in Amplify |
| `invalid-input-response` | Token is invalid/expired | User needs to complete reCAPTCHA again |
| `missing-input-secret` | Secret key not set | Add `RECAPTCHA_SECRET_KEY` to Amplify |
| `missing-input-response` | Token not sent | Check client-side code |
| `timeout-or-duplicate` | Token already used/expired | Normal - widget will reset |
| `bad-request` | Request format issue | Check API call format |

---

## How to Check Logs

### 1. Browser Console (Client-Side)
- Open DevTools (F12)
- Go to Console tab
- Look for logs starting with: `📤`, `📥`, `✅`, `❌`

### 2. Amplify Build Logs (Server-Side)
- Go to AWS Amplify Console
- Your App → Build history
- Click on latest build
- Look for logs with: `📥`, `🔍`, `✅`, `❌`

### 3. CloudWatch Logs (If Configured)
- Go to AWS CloudWatch
- Log groups → `/aws/amplify/your-app`
- Filter for: `reCAPTCHA` or `phone init`

---

## Next Steps

1. **Test the flow again** after redeploying
2. **Check browser console** for client-side logs
3. **Check Amplify/CloudWatch** for server-side logs
4. **Look for error codes** in Google's response
5. **Share the logs** if you need help interpreting them

---

## Summary

The enhanced logging will show:
- ✅ What token is being sent
- ✅ What secret key is being used (prefix only, not full key)
- ✅ What Google's API returns
- ✅ Specific error codes from Google
- ✅ Where exactly the verification fails

This will help identify if the issue is:
- Missing secret key
- Wrong secret key
- Token issues
- Domain mismatch
- Network problems

---

**After redeploying, test again and check both browser console and server logs for detailed information.**
