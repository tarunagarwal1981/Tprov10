# Phase 5: Backend Code Migration Guide

## 🎯 Objective

Replace all remaining Supabase client calls with AWS SDK/PostgreSQL direct database access.

---

## 📊 Current Status

### ✅ Already Migrated
- **Authentication**: `CognitoAuthContext` replaces `SupabaseAuthContext`
- **Storage**: `src/lib/aws/file-upload.ts` replaces Supabase Storage
- **Database**: `src/lib/aws/database.ts` provides PostgreSQL connection pool
- **Activity Packages**: Updated to use S3
- **Transfer Packages**: Updated to use S3

### ⏳ Needs Migration

#### **1. Service Files**
- `src/lib/services/queryService.ts` - Uses Supabase client
- `src/lib/services/marketplaceService.ts` - Uses Supabase client
- `src/lib/services/itineraryService.ts` - Uses Supabase client
- `src/lib/services/smartItineraryFilter.ts` - Uses Supabase client

#### **2. Component Files**
- `src/components/shared/LoginDebugger.tsx` - Uses Supabase client
- `src/components/shared/DatabaseChecker.tsx` - Uses Supabase client
- Various operator/agent pages that directly query Supabase

#### **3. Legacy Files (Can be removed)**
- `src/lib/supabase/client.ts` - Legacy client (keep for now, mark deprecated)
- `src/lib/supabase/server.ts` - Legacy server client (keep for now, mark deprecated)
- `src/context/SupabaseAuthContext.tsx` - Legacy auth context (can be removed)
- `src/lib/supabase.ts` - Legacy exports

---

## 🔄 Migration Strategy

### **Step 1: Update Service Files**

Replace Supabase client with direct PostgreSQL queries using `src/lib/aws/database.ts`:

**Before:**
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase
  .from('table_name')
  .select('*');
```

**After:**
```typescript
import { query, queryOne } from '@/lib/aws/database';

const result = await query('SELECT * FROM table_name');
// or
const row = await queryOne('SELECT * FROM table_name WHERE id = $1', [id]);
```

---

### **Step 2: Update Components**

Replace Supabase client calls with API routes that use PostgreSQL:

**Before:**
```typescript
const supabase = createSupabaseBrowserClient();
const { data } = await supabase.from('table').select('*');
```

**After:**
```typescript
const response = await fetch('/api/table');
const data = await response.json();
```

---

### **Step 3: Create API Routes**

For each service that needs client-side access, create an API route:

- `/api/queries` - For query service
- `/api/marketplace` - For marketplace service
- `/api/itineraries` - For itinerary service

---

### **Step 4: Remove Legacy Code**

After migration is complete:
- Remove `src/context/SupabaseAuthContext.tsx`
- Mark `src/lib/supabase/*` as deprecated
- Remove Supabase dependencies from `package.json`

---

## 📝 Migration Checklist

- [ ] Update `src/lib/services/queryService.ts`
- [ ] Update `src/lib/services/marketplaceService.ts`
- [ ] Update `src/lib/services/itineraryService.ts`
- [ ] Update `src/lib/services/smartItineraryFilter.ts`
- [ ] Create API routes for client-side access
- [ ] Update components to use API routes
- [ ] Remove legacy Supabase auth context
- [ ] Test all functionality
- [ ] Remove Supabase dependencies

---

## 🚀 Let's Start!

We'll begin by updating the service files, starting with `queryService.ts`.

