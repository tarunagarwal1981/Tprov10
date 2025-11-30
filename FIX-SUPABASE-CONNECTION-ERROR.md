# Fix Supabase Connection Error (ERR_NAME_NOT_RESOLVED)

## Problem

```
megmjzszmqnmzdxwzigt.supabase.co/auth/v1/token: Failed to load resource: net::ERR_NAME_NOT_RESOLVED
```

This error means the Supabase project URL cannot be resolved by DNS, indicating the project doesn't exist or the URL is incorrect.

## Quick Fix Steps

### Step 1: Check Your Supabase Project

1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Look for a project with reference: `megmjzszmqnmzdxwzigt`
4. If it doesn't exist → **Create a new project** (see Step 3)
5. If it exists → **Get the correct URL** (see Step 2)

### Step 2: Get Correct Credentials (If Project Exists)

1. Open your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long JWT token starting with `eyJ...`
   - **service_role key**: Another JWT token (keep secret!)

### Step 3: Create New Supabase Project (If Needed)

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: TravelBusiness or Tprov10
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"** (takes 2-3 minutes)
5. After creation, go to **Settings** → **API** and copy the credentials

### Step 4: Create .env.local File

**IMPORTANT**: You need to create this file manually in your project root.

**Location**: `C:\Users\train\.cursor\Tprov10\.env.local`

**Contents**:
```env
# Supabase Configuration (replace with your actual values)
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-here

# File Upload
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=travel-business-uploads

# Development
NODE_ENV=development
```

**Replace**:
- `YOUR-PROJECT-REF` with your actual Supabase project reference
- The keys with your actual API keys from Supabase dashboard

### Step 5: Setup Database Tables (If New Project)

If you created a new Supabase project, you need to run the migrations:

1. In Supabase dashboard, go to **SQL Editor**
2. Run these migration files in order:
   - `supabase/migrations/001_*.sql`
   - `supabase/migrations/002_*.sql`
   - `supabase/migrations/003_*.sql`

Or use Supabase CLI:
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR-PROJECT-REF

# Push migrations
supabase db push
```

### Step 6: Restart Development Server

After creating `.env.local`:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## How to Create .env.local on Windows

### Method 1: Using VS Code / Cursor
1. In your IDE, right-click on project root
2. Select **"New File"**
3. Name it `.env.local` (with the dot at the start)
4. Paste the environment variables
5. Save

### Method 2: Using PowerShell
```powershell
# Navigate to project directory
cd C:\Users\train\.cursor\Tprov10\

# Create the file
New-Item -Path ".env.local" -ItemType File

# Then edit it in notepad or your IDE
notepad .env.local
```

### Method 3: Using Command Prompt
```cmd
cd C:\Users\train\.cursor\Tprov10\
type nul > .env.local
notepad .env.local
```

## Current State

Your `env_temp.txt` contains:
```
NEXT_PUBLIC_SUPABASE_URL=https://megmjzszmqnmzdxwzigt.supabase.co
```

**This URL is NOT working** - the DNS cannot resolve this domain.

## Verification

After creating `.env.local` and restarting the server:

1. Open browser console (F12)
2. Try to login again
3. You should see:
   - ✅ Connection successful
   - ✅ Login attempt proceeding
   - NOT ❌ ERR_NAME_NOT_RESOLVED

## Important Notes

- `.env.local` is gitignored (won't be committed to Git)
- Never share your `SUPABASE_SERVICE_ROLE_KEY` publicly
- The `NEXTAUTH_SECRET` should be a random 32+ character string
- Generate a secret: `openssl rand -base64 32` (in Git Bash or WSL)

## Need Help?

If you still have issues:
1. Share the error message from browser console
2. Verify you can access your Supabase dashboard
3. Check if the project is paused (unpause it in dashboard)
4. Try pinging the URL: `ping megmjzszmqnmzdxwzigt.supabase.co`

## Template .env.local

Here's a complete template you can copy:

```env
# ================================
# SUPABASE CONFIGURATION
# ================================
# Get these from: https://supabase.com/dashboard/project/YOUR-PROJECT/settings/api

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ================================
# AUTHENTICATION
# ================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-generate-with-openssl-rand-base64-32

# ================================
# FILE STORAGE
# ================================
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=travel-business-uploads

# ================================
# DEVELOPMENT
# ================================
NODE_ENV=development
```

Save this as `.env.local` in your project root, fill in the values, and restart your dev server!


