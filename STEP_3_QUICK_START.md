# Step 3: OAuth Quick Start 🚀

## 🎯 Goal
Configure Google and GitHub OAuth in Cognito, then update application code.

---

## Part 1: Configure OAuth (5-10 minutes)

### Option A: AWS Console (Recommended)

1. **Open Cognito Console**
   👉 https://console.aws.amazon.com/cognito/v2/idp/user-pools/us-east-1_oF5qfa2IX

2. **Add Google Provider**
   - Go to **"Sign-in experience"** tab
   - Click **"Add identity provider"** → **"Google"**
   - Enter your Google Client ID and Secret
   - Map attributes: `email` → `email`, `name` → `name`
   - Click **"Save changes"**

3. **Add GitHub Provider**
   - Still in **"Sign-in experience"** tab
   - Click **"Add identity provider"** → **"GitHub"**
   - Enter your GitHub Client ID and Secret
   - Map attributes: `email` → `email`, `login` → `name`
   - Click **"Save changes"**

4. **Update App Client**
   - Go to **"App integration"** tab
   - Click **"Edit"** on `travel-app-client`
   - Under **"Identity providers"**, enable:
     - ✅ Cognito User Pool
     - ✅ Google
     - ✅ GitHub
   - Click **"Save changes"**

**Don't have OAuth credentials?** See `GET_OAUTH_CREDENTIALS.md`

---

## Part 2: Next Steps (After OAuth)

Once OAuth is configured, we'll:
1. ✅ Update application code to use Cognito
2. ✅ Replace Supabase Auth context
3. ✅ Update login/register components
4. ✅ Test authentication flow

---

**Ready?** Configure OAuth in AWS Console, then let me know when done!

