# Step 3: Configure OAuth Providers 🔐

## 🎯 Goal

Configure Google and GitHub OAuth providers in AWS Cognito for social login.

---

## 📋 Prerequisites

You'll need OAuth credentials from:
- **Google Cloud Console** (for Google OAuth)
- **GitHub Developer Settings** (for GitHub OAuth)

---

## Step 3.1: Google OAuth Setup

### 1. Get Google OAuth Credentials

1. **Go to Google Cloud Console**
   - https://console.cloud.google.com/apis/credentials
   - Select your project (or create one)

2. **Create OAuth 2.0 Client ID**
   - Click **"Create Credentials"** → **"OAuth client ID"**
   - Application type: **"Web application"**
   - Name: **"Travel App"**
   - **Authorized redirect URIs**:
     ```
     https://travel-app-auth-2285.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
     http://localhost:3000/auth/callback
     ```
   - Click **"Create"**
   - **Copy Client ID and Client Secret** (save them!)

### 2. Add Google Provider in Cognito

I'll create a script to automate this, but you'll need to provide:
- Google Client ID
- Google Client Secret

---

## Step 3.2: GitHub OAuth Setup

### 1. Get GitHub OAuth Credentials

1. **Go to GitHub Developer Settings**
   - https://github.com/settings/developers
   - Click **"OAuth Apps"** → **"New OAuth App"**

2. **Create OAuth App**
   - Application name: **"Travel App"**
   - Homepage URL: `http://localhost:3000`
   - **Authorization callback URL**:
     ```
     https://travel-app-auth-2285.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
     ```
   - Click **"Register application"**
   - **Copy Client ID and Client Secret** (save them!)

### 2. Add GitHub Provider in Cognito

I'll create a script to automate this, but you'll need to provide:
- GitHub Client ID
- GitHub Client Secret

---

## 🚀 Quick Setup

**Do you have Google and GitHub OAuth credentials ready?**

If yes, I'll create a script to configure them automatically!

If no, follow the steps above to get them first.

---

**Ready?** Let me know when you have the credentials, or I can guide you through getting them!

