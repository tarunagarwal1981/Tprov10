# Step 3: Configure Google OAuth Only 🔐

## 🎯 Goal
Configure Google OAuth provider in AWS Cognito.

---

## Prerequisites

You'll need:
- **Google OAuth Client ID**
- **Google Client Secret**

**Don't have them?** See `GET_OAUTH_CREDENTIALS.md` (Google section only)

---

## Quick Setup via AWS Console

### Step 1: Open Cognito Console
👉 https://console.aws.amazon.com/cognito/v2/idp/user-pools/us-east-1_oF5qfa2IX

### Step 2: Add Google Provider

1. **Go to "Sign-in experience" tab**
   - Click on **"Sign-in experience"** in the left sidebar

2. **Scroll to "Federated identity provider sign-in"**
   - Find the section titled **"Federated identity provider sign-in"**

3. **Click "Add identity provider"**
   - Click the **"Add identity provider"** button
   - Select **"Google"**

4. **Enter Google Credentials**
   - **Client ID**: [Paste your Google Client ID]
   - **Client secret**: [Paste your Google Client Secret]
   - **Authorized scopes**: `email profile openid`

5. **Configure Attribute Mapping**
   - Click **"Add attribute mapping"**
   - **Email**: Select `email` → Map to `email`
   - Click **"Add attribute mapping"** again
   - **Name**: Select `name` → Map to `name`

6. **Save Changes**
   - Click **"Save changes"** at the bottom

---

### Step 3: Update App Client

1. **Go to "App integration" tab**
   - Click **"App integration"** in the left sidebar

2. **Find "App client: travel-app-client"**
   - Scroll to find the app client section

3. **Click "Edit"**
   - Click the **"Edit"** button next to the app client

4. **Enable Identity Providers**
   - Under **"Identity providers"**, check:
     - ✅ **Cognito User Pool**
     - ✅ **Google**

5. **Save Changes**
   - Click **"Save changes"**

---

## ✅ Done!

Google OAuth is now configured. Users can sign in with:
- Email/Password (Cognito)
- Google

---

## 🔗 Important: Add Redirect URI to Google

Make sure this redirect URI is added to your Google OAuth app:

```
https://travel-app-auth-2285.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
```

**Where to add it:**
- Google Cloud Console → APIs & Services → Credentials
- Edit your OAuth 2.0 Client ID
- Add to **"Authorized redirect URIs"**

---

**Ready?** Follow the steps above, then let me know when done!

