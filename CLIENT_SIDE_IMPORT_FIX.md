# Client-Side Import Fix

## ❌ Problem

The `pg` library (PostgreSQL client) cannot be imported in client components because it uses Node.js modules (`net`, `tls`) that don't exist in the browser.

**Error:**
```
Module not found: Can't resolve 'net'
Module not found: Can't resolve 'tls'
```

## ✅ Solution

Services that use the database (`pg` library) must only be called from:
- ✅ Server-side API routes
- ✅ Server components
- ❌ NOT from client components

## 🔧 Fix Applied

### **1. Created API Routes for Marketplace**

- ✅ `/api/marketplace/leads` - Get available leads
- ✅ `/api/marketplace/leads/[leadId]` - Get lead details
- ✅ `/api/marketplace/purchase` - Purchase lead
- ✅ `/api/marketplace/purchased` - Get purchased leads
- ✅ `/api/marketplace/stats` - Get marketplace stats
- ✅ `/api/marketplace/featured` - Get featured leads

### **2. Updated Client Components**

- ✅ `src/app/agent/page.tsx` - Uses API routes
- ✅ `src/app/agent/marketplace/page.tsx` - Uses API routes
- ✅ `src/app/agent/leads/page.tsx` - Uses API routes
- ⏳ `src/app/agent/leads/[leadId]/page.tsx` - Needs update

### **3. Remaining Issues**

Some components may still import services directly:
- `queryService` - Needs API routes if used in client components
- `itineraryService` - Needs API routes if used in client components

---

## 📝 Pattern for Client Components

**Before (❌ Wrong):**
```typescript
'use client';
import { MarketplaceService } from '@/lib/services/marketplaceService';

const data = await MarketplaceService.getAvailableLeads();
```

**After (✅ Correct):**
```typescript
'use client';

const response = await fetch('/api/marketplace/leads');
const { leads: data } = await response.json();
```

---

## 🚀 Next Steps

1. Update remaining client components to use API routes
2. Create API routes for `queryService` and `itineraryService` if needed
3. Test deployment

