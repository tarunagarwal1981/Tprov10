# Google OAuth - Quick Reference 🚀

## Cognito Console
👉 https://console.aws.amazon.com/cognito/v2/idp/user-pools/us-east-1_oF5qfa2IX

## Quick Steps

1. **Sign-in experience** tab → **Add identity provider** → **Google**
2. Enter:
   - Client ID: `[Your Google Client ID]`
   - Client Secret: `[Your Google Client Secret]`
   - Scopes: `email profile openid`
3. Map attributes:
   - `email` → `email`
   - `name` → `name`
4. **App integration** tab → **Edit** app client → Enable **Google**
5. Add redirect URI to Google:
   ```
   https://travel-app-auth-2285.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
   ```

## Done! ✅

