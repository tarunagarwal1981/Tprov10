# Multiple Itineraries with Individual Queries - Setup Complete

## Overview
This update allows agents to create multiple itineraries for a single purchased lead, with each itinerary having its own editable query. Previously, there was only one query per lead, which limited flexibility.

## Changes Made

### 1. Database Schema Updates
**File:** `supabase/migrations/019_update_itinerary_queries_for_multiple.sql`

- ✅ Removed unique constraint on `itinerary_queries` (allows multiple queries per lead)
- ✅ Added `query_id` column to `itineraries` table (links itinerary to its query)
- ✅ Added `itinerary_id` column to `itinerary_queries` table (reverse lookup)
- ✅ Added indexes for performance

### 2. API Updates

#### Itinerary Creation
**File:** `src/app/api/itineraries/create/route.ts`
- ✅ Now accepts `queryId` parameter
- ✅ Removed check that prevented multiple itineraries per lead
- ✅ Links query to itinerary on creation

#### Itinerary Update
**File:** `src/app/api/itineraries/[itineraryId]/route.ts`
- ✅ Added support for updating `query_id`

#### Query Service
**File:** `src/lib/services/queryService.ts`
- ✅ Added `getQueryById()` method

#### New API Route
**File:** `src/app/api/queries/by-id/[queryId]/route.ts`
- ✅ New endpoint to fetch query by ID

### 3. UI Updates

#### Lead Detail Page
**File:** `src/app/agent/leads/[leadId]/page.tsx`

**Key Changes:**
- ✅ Shows each itinerary with its own query card
- ✅ Each itinerary displays its query details inline
- ✅ "Edit Query" button on each itinerary card
- ✅ Separate "Insert Itinerary" and "Create Itinerary" cards (always visible)
- ✅ Clicking either card opens query form to create new itinerary + query
- ✅ Queries are editable per itinerary

**Flow:**
1. Agent clicks "Insert Itinerary" or "Create Itinerary" card
2. Query form opens
3. Agent fills query and saves
4. New itinerary is created with new query linked
5. Agent can edit query for any existing itinerary
6. Each itinerary maintains its own query independently

### 4. Dummy Packages Script

**File:** `scripts/create-dummy-packages-aws.js`

Creates 5 dummy packages for `operator@gmail.com`:
- 3 Multi-city packages:
  - Bali-Jakarta Adventure (7 nights, 3 cities)
  - Singapore-Malaysia Discovery (5 nights, 2 cities)
  - Philippines Island Explorer (9 nights, 3 cities)
- 2 Multi-city hotel packages:
  - Thailand Beach Paradise (8 nights, 3 cities)
  - Vietnam Heritage Journey (10 nights, 4 cities)

**Usage:**
```bash
node scripts/create-dummy-packages-aws.js
```

## Testing Instructions

### 1. Run Migration
Execute the migration to update the database schema:
```sql
-- Run via your database client or AWS CLI
-- File: supabase/migrations/019_update_itinerary_queries_for_multiple.sql
```

### 2. Create Dummy Packages
```bash
node scripts/create-dummy-packages-aws.js
```

### 3. Test Flow
1. Login as `agent@gmail.com`
2. Navigate to a purchased lead
3. Click "Insert Itinerary" card
4. Fill query form (destinations, travelers, etc.)
5. Save query → New itinerary created
6. Click "Create Itinerary" card
7. Fill another query form
8. Save → Another itinerary created
9. Edit query for any itinerary using "Edit Query" button
10. Each itinerary maintains its own query

## Database Schema

### itineraries table
```sql
ALTER TABLE itineraries ADD COLUMN query_id UUID REFERENCES itinerary_queries(id);
```

### itinerary_queries table
```sql
-- Removed: CONSTRAINT unique_lead_query UNIQUE (lead_id, agent_id)
ALTER TABLE itinerary_queries ADD COLUMN itinerary_id UUID REFERENCES itineraries(id);
```

## Notes

- Each itinerary can have its own query
- Queries are editable per itinerary
- Multiple "Insert" and "Create" itineraries can exist for the same lead
- Query form is shown when creating new itinerary
- Query can be edited after itinerary creation
