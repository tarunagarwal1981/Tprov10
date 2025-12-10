# Step 3: Configure OAuth via AWS Console 🖥️

## Alternative Method: Use AWS Console (Easier for First Time)

If you prefer using the AWS Console instead of CLI, follow these steps:

---

## Google OAuth Setup (Console)

### 1. Go to Cognito Console
👉 https://console.aws.amazon.com/cognito/

### 2. Select Your User Pool
- Click on **"travel-app-users"**

### 3. Add Google Provider
- Go to **"Sign-in experience"** tab
- Scroll to **"Federated identity provider sign-in"**
- Click **"Add identity provider"** → **"Google"**

### 4. Enter Google Credentials
- **Client ID**: [Your Google Client ID]
- **Client secret**: [Your Google Client Secret]
- **Authorized scopes**: `email profile openid`

### 5. Configure Attribute Mapping
- **Email**: `email` → `email`
- **Name**: `name` → `name`
- Click **"Add attribute mapping"** for each

### 6. Save
- Click **"Save changes"**

---

## GitHub OAuth Setup (Console)

### 1. In the Same User Pool
- Still in **"Sign-in experience"** tab

### 2. Add GitHub Provider
- Click **"Add identity provider"** → **"GitHub"**

### 3. Enter GitHub Credentials
- **Client ID**: [Your GitHub Client ID]
- **Client secret**: [Your GitHub Client Secret]

### 4. Configure Attribute Mapping
- **Email**: `email` → `email`
- **Username**: `login` → `name`
- Click **"Add attribute mapping"** for each

### 5. Save
- Click **"Save changes"**

---

## Update App Client

### 1. Go to App Integration Tab
- Click **"App integration"** tab
- Find **"App client: travel-app-client"**
- Click **"Edit"**

### 2. Enable Identity Providers
- Under **"Identity providers"**, check:
  - ✅ **Cognito User Pool**
  - ✅ **Google** (if configured)
  - ✅ **GitHub** (if configured)

### 3. Save Changes
- Click **"Save changes"**

---

## ✅ Done!

Your OAuth providers are now configured. Users can sign in with:
- Email/Password (Cognito)
- Google
- GitHub

---

**Ready to test?** Try logging in with one of the providers!

