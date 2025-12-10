# How to Get Supabase Database Connection String

## 🔗 Get Connection Details

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/megmjzszmqnmzdxwzigt/settings/database

2. **Find Connection String**
   - Look for **"Connection string"** section
   - Click on **"URI"** tab
   - Copy the connection string
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.megmjzszmqnmzdxwzigt.supabase.co:5432/postgres`

3. **Or Get Individual Parameters**
   - **Host**: `db.megmjzszmqnmzdxwzigt.supabase.co` (or check "Direct connection")
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: `Travelselbuy@1` (you already have this)

---

## 🚀 Alternative: Use Supabase CLI

If direct connection doesn't work, you can use Supabase CLI to export:

```powershell
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref megmjzszmqnmzdxwzigt

# Export database
supabase db dump -f supabase_backup.sql
```

---

## 📝 Update Migration Script

Once you have the connection string, set it as environment variable:

```powershell
$env:SUPABASE_DB_CONNECTION_STRING="postgresql://postgres:Travelselbuy@1@db.megmjzszmqnmzdxwzigt.supabase.co:5432/postgres"
```

Or set individual parameters:

```powershell
$env:SUPABASE_DB_HOST="db.megmjzszmqnmzdxwzigt.supabase.co"
$env:SUPABASE_DB_PORT="5432"
```

---

## ⚠️ Important Notes

- **Free tier projects** may be paused - check project status first
- **Connection pooling** might have different hostname
- **Direct connection** is required for pg_dump/psql
- Check **Settings → Database → Connection** for correct hostname

---

**Get the connection details and we'll continue the migration!**

