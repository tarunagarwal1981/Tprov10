# How to Get OAuth Credentials 🔐

## Google OAuth Setup

### Step 1: Go to Google Cloud Console
👉 https://console.cloud.google.com/apis/credentials

### Step 2: Create OAuth 2.0 Client ID

1. **Select or Create Project**
   - If you don't have a project, click **"Create Project"**
   - Name it: **"Travel App"**

2. **Enable Google+ API** (if needed)
   - Go to **"APIs & Services"** → **"Library"**
   - Search for **"Google+ API"** and enable it

3. **Create OAuth Credentials**
   - Go to **"APIs & Services"** → **"Credentials"**
   - Click **"Create Credentials"** → **"OAuth client ID"**
   - If prompted, configure OAuth consent screen first:
     - User Type: **External**
     - App name: **Travel App**
     - User support email: Your email
     - Developer contact: Your email
     - Click **"Save and Continue"** through the steps

4. **Create OAuth Client ID**
   - Application type: **"Web application"**
   - Name: **"Travel App"**
   - **Authorized redirect URIs** (add both):
     ```
     https://travel-app-auth-2285.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
     http://localhost:3000/auth/callback
     ```
   - Click **"Create"**

5. **Copy Credentials**
   - **Client ID**: Copy this (looks like: `123456789-abc...googleusercontent.com`)
   - **Client Secret**: Click "Show" and copy this

---

## GitHub OAuth Setup

### Step 1: Go to GitHub Developer Settings
👉 https://github.com/settings/developers

### Step 2: Create OAuth App

1. **Click "OAuth Apps"** → **"New OAuth App"**

2. **Fill in the form:**
   - **Application name**: `Travel App`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**:
     ```
     https://travel-app-auth-2285.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
     ```
   - Click **"Register application"**

3. **Copy Credentials**
   - **Client ID**: Copy this
   - **Client Secret**: Click "Generate a new client secret" and copy it

---

## ✅ After Getting Credentials

Run this command with your credentials:

```powershell
.\aws-migration-scripts\phase3-configure-oauth.ps1 `
    -GoogleClientId "your-google-client-id" `
    -GoogleClientSecret "your-google-secret" `
    -GitHubClientId "your-github-client-id" `
    -GitHubClientSecret "your-github-secret"
```

---

**Need help?** Let me know if you get stuck on any step!

