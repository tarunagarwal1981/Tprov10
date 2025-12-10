# Phase 4: Check Actual URLs in Database

## ⚠️ Issue Found

The `public_url` and `storage_path` columns are showing as empty/NULL. This could mean:

1. The URLs were already NULL before the update
2. The REPLACE didn't match because URLs were in a different format
3. The URLs are stored in a different column

---

## 🔍 Diagnostic Queries

Run these on your EC2 instance to understand what's happening:

### **Query 1: Check for any non-null URLs**

```bash
export PGPASSWORD='ju3vrLHJUW8PqDG4'
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     -c "SELECT COUNT(*) as total_rows, COUNT(public_url) as rows_with_public_url, COUNT(storage_path) as rows_with_storage_path FROM activity_package_images;"
```

### **Query 2: Check for any Supabase URLs (if they exist)**

```bash
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     -c "SELECT id, public_url, storage_path FROM activity_package_images WHERE public_url IS NOT NULL OR storage_path IS NOT NULL LIMIT 10;"
```

### **Query 3: Check table structure**

```bash
psql --host=travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com \
     --port=5432 \
     --username=postgres \
     --dbname=postgres \
     -c "\d activity_package_images"
```

---

## 🎯 What This Tells Us

- If all URLs are NULL: The migration might have already happened, or URLs were never populated
- If some URLs exist: We need to see their format to update them correctly
- If table structure is different: We might need to update a different column

---

**Run these queries and share the output!**

