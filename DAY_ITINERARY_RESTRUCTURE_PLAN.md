# Plan: Restructure Day-by-Day Itinerary Time Slots

## Overview
Change the time slot structure from arrays of activities/transfers to structured fields:
- **Current**: Each slot has `activities: string[]` and `transfers: string[]`
- **New**: Each slot has `title: string`, `activityDescription: string`, and `transfer: string`

This applies to **each time slot** (morning, afternoon, evening) for **each day** in:
1. Multi-City Package Form
2. Multi-City with Hotel Package Form

---

## Current Structure

### Frontend Type Definition
```typescript
type TimeSlot = {
  time: string; // HH:MM format
  activities: string[];  // Array of activity strings
  transfers: string[];   // Array of transfer strings
};

type DayPlan = {
  cityId: string;
  cityName?: string;
  title?: string;
  description?: string;
  photoUrl?: string;
  hasFlights?: boolean;
  flights?: Flight[];
  timeSlots?: {
    morning: TimeSlot;
    afternoon: TimeSlot;
    evening: TimeSlot;
  };
};
```

### Database Structure
- **Table**: `multi_city_package_day_plans` and `multi_city_hotel_package_day_plans`
- **Column**: `time_slots` (JSONB)
- **Current Format**:
```json
{
  "morning": {
    "time": "08:00",
    "activities": ["Activity 1", "Activity 2"],
    "transfers": ["Transfer 1"]
  },
  "afternoon": {
    "time": "12:30",
    "activities": ["Activity 3"],
    "transfers": []
  },
  "evening": {
    "time": "17:00",
    "activities": [],
    "transfers": ["Transfer 2"]
  }
}
```

---

## New Structure

### Frontend Type Definition (New)
```typescript
type TimeSlot = {
  time: string; // HH:MM format
  title: string; // Title for this time slot
  activityDescription: string; // Description of activities
  transfer: string; // Transfer information
};

type DayPlan = {
  cityId: string;
  cityName?: string;
  title?: string;
  description?: string;
  photoUrl?: string;
  hasFlights?: boolean;
  flights?: Flight[];
  timeSlots?: {
    morning: TimeSlot;
    afternoon: TimeSlot;
    evening: TimeSlot;
  };
};
```

### Database Structure (New)
- **Table**: `multi_city_package_day_plans` and `multi_city_hotel_package_day_plans`
- **Column**: `time_slots` (JSONB) - **UPDATE FORMAT**
- **New Format**:
```json
{
  "morning": {
    "time": "08:00",
    "title": "Morning Exploration",
    "activityDescription": "Visit historical sites and local markets",
    "transfer": "Hotel pickup at 8:00 AM"
  },
  "afternoon": {
    "time": "12:30",
    "title": "Afternoon Activities",
    "activityDescription": "Lunch and cultural tour",
    "transfer": "Transfer to restaurant"
  },
  "evening": {
    "time": "17:00",
    "title": "Evening Experience",
    "activityDescription": "Dinner and entertainment",
    "transfer": "Return to hotel"
  }
}
```

---

## Implementation Plan

### 1. Database Migration

#### File: `supabase/migrations/016_restructure_time_slots_schema.sql` (NEW)

**Purpose**: Update the `time_slots` JSONB column structure and default value

**Changes**:
1. Update default value for `time_slots` column
2. Update column comments
3. Add migration notes

```sql
-- ============================================================================
-- RESTRUCTURE TIME SLOTS SCHEMA
-- Migration to change time_slots from arrays to structured fields
-- ============================================================================

-- Update default value for multi_city_package_day_plans
ALTER TABLE multi_city_package_day_plans
ALTER COLUMN time_slots SET DEFAULT '{
  "morning": {"time": "08:00", "title": "", "activityDescription": "", "transfer": ""},
  "afternoon": {"time": "12:30", "title": "", "activityDescription": "", "transfer": ""},
  "evening": {"time": "17:00", "title": "", "activityDescription": "", "transfer": ""}
}'::jsonb;

-- Update default value for multi_city_hotel_package_day_plans
ALTER TABLE multi_city_hotel_package_day_plans
ALTER COLUMN time_slots SET DEFAULT '{
  "morning": {"time": "08:00", "title": "", "activityDescription": "", "transfer": ""},
  "afternoon": {"time": "12:30", "title": "", "activityDescription": "", "transfer": ""},
  "evening": {"time": "17:00", "title": "", "activityDescription": "", "transfer": ""}
}'::jsonb;

-- Update column comments
COMMENT ON COLUMN multi_city_package_day_plans.time_slots IS 'Structured time slots with title, activity description, and transfer for morning, afternoon, and evening. Format: {"morning": {"time": "HH:MM", "title": "...", "activityDescription": "...", "transfer": "..."}, ...}';

COMMENT ON COLUMN multi_city_hotel_package_day_plans.time_slots IS 'Structured time slots with title, activity description, and transfer for morning, afternoon, and evening. Format: {"morning": {"time": "HH:MM", "title": "...", "activityDescription": "...", "transfer": "..."}, ...}';

-- Note: Existing data migration should be handled in application code
-- Old format: {"morning": {"time": "...", "activities": [...], "transfers": [...]}}
-- New format: {"morning": {"time": "...", "title": "...", "activityDescription": "...", "transfer": "..."}}
```

**Note**: This migration updates the schema but doesn't migrate existing data. Data migration should be handled in the API routes (see Backend section).

---

### 2. Frontend Changes

#### File: `src/components/packages/forms/MultiCityPackageForm.tsx`

##### 2.1 Update Type Definitions (Lines 35-39)
```typescript
// OLD:
type TimeSlot = {
  time: string;
  activities: string[];
  transfers: string[];
};

// NEW:
type TimeSlot = {
  time: string; // HH:MM format
  title: string; // Title for this time slot
  activityDescription: string; // Description of activities
  transfer: string; // Transfer information
};
```

##### 2.2 Update TimeSlotEditor Component (Lines 485-673)

**Complete Replacement Required**:

**Current Structure**:
- Input for adding activities (array)
- Input for adding transfers (array)
- Display lists of activities and transfers
- Remove buttons for each item

**New Structure**:
- Input field for "Title"
- Textarea for "Activity Description"
- Input field for "Transfer"
- Time picker (keep existing)

**New Component Structure**:
```typescript
const TimeSlotEditor: React.FC<{ 
  dayIndex: number; 
  slotName: "morning" | "afternoon" | "evening";
  slot: TimeSlot;
  days: DayPlan[];
  setValue: any;
}> = ({ dayIndex, slotName, slot, days, setValue }) => {
  const updateTimeSlot = (updates: Partial<TimeSlot>) => {
    const d = [...days];
    if (!d[dayIndex]) return;
    if (!d[dayIndex]!.timeSlots) {
      d[dayIndex]!.timeSlots = {
        morning: { time: "08:00", title: "", activityDescription: "", transfer: "" },
        afternoon: { time: "12:30", title: "", activityDescription: "", transfer: "" },
        evening: { time: "17:00", title: "", activityDescription: "", transfer: "" },
      };
    }
    d[dayIndex]!.timeSlots![slotName] = { ...d[dayIndex]!.timeSlots![slotName], ...updates };
    setValue("days", d);
  };

  // ... rest of component with new UI fields
};
```

**UI Changes**:
- Remove: Activity list input and display
- Remove: Transfer list input and display
- Add: Title input field
- Add: Activity Description textarea
- Add: Transfer input field
- Keep: Time picker

##### 2.3 Update Day Initialization (Lines 693-726)

**Current**:
```typescript
d[idx]!.timeSlots = {
  morning: { time: "08:00", activities: [], transfers: [] },
  afternoon: { time: "12:30", activities: [], transfers: [] },
  evening: { time: "17:00", activities: [], transfers: [] },
};
```

**New**:
```typescript
d[idx]!.timeSlots = {
  morning: { time: "08:00", title: "", activityDescription: "", transfer: "" },
  afternoon: { time: "12:30", title: "", activityDescription: "", transfer: "" },
  evening: { time: "17:00", title: "", activityDescription: "", transfer: "" },
};
```

##### 2.4 Update BasicInformationTab Day Generation (Lines 258-346)

**Current**:
```typescript
timeSlots: {
  morning: { time: "08:00", activities: [], transfers: [] },
  afternoon: { time: "12:30", activities: [], transfers: [] },
  evening: { time: "17:00", activities: [], transfers: [] },
},
```

**New**:
```typescript
timeSlots: {
  morning: { time: "08:00", title: "", activityDescription: "", transfer: "" },
  afternoon: { time: "12:30", title: "", activityDescription: "", transfer: "" },
  evening: { time: "17:00", title: "", activityDescription: "", transfer: "" },
},
```

#### File: `src/components/packages/forms/MultiCityHotelPackageForm.tsx`

**Same changes as MultiCityPackageForm.tsx**:
- Update type definitions (Lines 35-39)
- Update TimeSlotEditor component (Lines 727-915)
- Update day initialization (Lines 936-968)
- Update BasicInformationTab day generation (Lines 401-479)

---

### 3. Backend API Changes

#### File: `src/app/api/operator/packages/multi-city/create/route.ts`

##### 3.1 Update Day Plans Insertion (Lines 178-204)

**Current**:
```typescript
const timeSlots = day.timeSlots || {
  morning: { time: '', activities: [], transfers: [] },
  afternoon: { time: '', activities: [], transfers: [] },
  evening: { time: '', activities: [], transfers: [] },
};

await query(
  `INSERT INTO multi_city_package_day_plans (
    package_id, city_id, day_number, city_name, title, description,
    photo_url, has_flights, time_slots
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
  [
    packageId,
    dbCityId,
    dayIndex + 1,
    day.cityName || null,
    day.title || null,
    day.description || null,
    day.photoUrl || null,
    false,
    JSON.stringify(timeSlots),
  ]
);
```

**New**:
```typescript
// Helper function to migrate old format to new format
const migrateTimeSlots = (timeSlots: any) => {
  const slots = ['morning', 'afternoon', 'evening'];
  const defaultTimes = { morning: '08:00', afternoon: '12:30', evening: '17:00' };
  
  const migrated: any = {};
  slots.forEach(slot => {
    const oldSlot = timeSlots?.[slot] || {};
    // If old format (has activities/transfers arrays)
    if (oldSlot.activities || oldSlot.transfers) {
      migrated[slot] = {
        time: oldSlot.time || defaultTimes[slot],
        title: '',
        activityDescription: oldSlot.activities?.join('. ') || '',
        transfer: oldSlot.transfers?.join('. ') || '',
      };
    } else {
      // New format or default
      migrated[slot] = {
        time: oldSlot.time || defaultTimes[slot],
        title: oldSlot.title || '',
        activityDescription: oldSlot.activityDescription || '',
        transfer: oldSlot.transfer || '',
      };
    }
  });
  return migrated;
};

const timeSlots = migrateTimeSlots(day.timeSlots);

await query(
  `INSERT INTO multi_city_package_day_plans (
    package_id, city_id, day_number, city_name, title, description,
    photo_url, has_flights, time_slots
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
  [
    packageId,
    dbCityId,
    dayIndex + 1,
    day.cityName || null,
    day.title || null,
    day.description || null,
    day.photoUrl || null,
    false,
    JSON.stringify(timeSlots),
  ]
);
```

#### File: `src/app/api/operator/packages/multi-city/update/route.ts`

**Same changes as create route** (Lines 230-256):
- Add `migrateTimeSlots` helper function
- Use migrated time slots in INSERT

#### File: `src/app/api/operator/packages/multi-city-hotel/create/route.ts`

**Same changes as multi-city create route** (Lines 176-203):
- Add `migrateTimeSlots` helper function
- Use migrated time slots in INSERT
- Update table name to `multi_city_hotel_package_day_plans`

#### File: `src/app/api/operator/packages/multi-city-hotel/update/route.ts`

**Same changes as multi-city-hotel create route** (Lines 239-264):
- Add `migrateTimeSlots` helper function
- Use migrated time slots in INSERT

---

### 4. Data Loading (Edit Pages)

#### File: `src/app/operator/packages/create/multi-city/page.tsx`

**Update Day Plans Loading** (Lines 58-80):

**Current**: Loads `time_slots` JSONB as-is

**New**: Add migration helper when loading existing data

```typescript
// Add migration helper
const migrateTimeSlotsForLoad = (timeSlots: any) => {
  if (!timeSlots) {
    return {
      morning: { time: "08:00", title: "", activityDescription: "", transfer: "" },
      afternoon: { time: "12:30", title: "", activityDescription: "", transfer: "" },
      evening: { time: "17:00", title: "", activityDescription: "", transfer: "" },
    };
  }
  
  const slots = ['morning', 'afternoon', 'evening'];
  const defaultTimes = { morning: '08:00', afternoon: '12:30', evening: '17:00' };
  
  const migrated: any = {};
  slots.forEach(slot => {
    const oldSlot = timeSlots[slot] || {};
    if (oldSlot.activities || oldSlot.transfers) {
      // Old format - migrate
      migrated[slot] = {
        time: oldSlot.time || defaultTimes[slot],
        title: '',
        activityDescription: oldSlot.activities?.join('. ') || '',
        transfer: oldSlot.transfers?.join('. ') || '',
      };
    } else {
      // New format
      migrated[slot] = {
        time: oldSlot.time || defaultTimes[slot],
        title: oldSlot.title || '',
        activityDescription: oldSlot.activityDescription || '',
        transfer: oldSlot.transfer || '',
      };
    }
  });
  return migrated;
};

// Use in day plans mapping:
days: (pkg.day_plans || []).map((d: any) => ({
  cityId: d.city_id || '',
  cityName: d.city_name || '',
  title: d.title || '',
  description: d.description || '',
  photoUrl: d.photo_url || '',
  hasFlights: d.has_flights || false,
  flights: [],
  timeSlots: migrateTimeSlotsForLoad(d.time_slots),
})),
```

#### File: `src/app/operator/packages/create/multi-city-hotel/page.tsx`

**Same changes as multi-city page**:
- Add `migrateTimeSlotsForLoad` helper
- Use in day plans mapping (Lines 58-80)

---

## Summary of Changes

### Database
- ✅ Migration file to update `time_slots` default value and comments
- ✅ No table structure changes (still JSONB column)
- ✅ Backward compatible (migration handled in code)

### Frontend
- ✅ Update `TimeSlot` type definition (2 files)
- ✅ Completely rewrite `TimeSlotEditor` component (2 files)
- ✅ Update day initialization logic (2 files)
- ✅ Update day generation in BasicInformationTab (2 files)

### Backend
- ✅ Add `migrateTimeSlots` helper function (4 API route files)
- ✅ Update create routes to use new format (2 files)
- ✅ Update update routes to use new format (2 files)
- ✅ Handle backward compatibility (migrate old format to new)

### Data Loading
- ✅ Add `migrateTimeSlotsForLoad` helper (2 page files)
- ✅ Update day plans loading to migrate old data (2 files)

---

## Migration Strategy

### For Existing Data
1. **Old Format**: `{"morning": {"time": "...", "activities": [...], "transfers": [...]}}`
2. **Migration**: Convert arrays to strings
   - `activities` array → join with ". " → `activityDescription`
   - `transfers` array → join with ". " → `transfer`
   - `title` → empty string (no equivalent in old format)

### For New Data
- Use new format directly: `{"morning": {"time": "...", "title": "...", "activityDescription": "...", "transfer": "..."}}`

---

## Testing Checklist

- [ ] Create new multi-city package with new time slot format
- [ ] Edit existing package with old time slot format (should migrate)
- [ ] Edit existing package with new time slot format (should work)
- [ ] Create new multi-city-hotel package with new format
- [ ] Edit existing multi-city-hotel package (should migrate)
- [ ] Verify all three time slots (morning, afternoon, evening) work correctly
- [ ] Verify time picker still works
- [ ] Verify data saves correctly to database
- [ ] Verify data loads correctly from database
- [ ] Test with empty/null values
- [ ] Test with long text in activityDescription

---

## Files to Modify

### Database
1. `supabase/migrations/016_restructure_time_slots_schema.sql` (NEW)

### Frontend
2. `src/components/packages/forms/MultiCityPackageForm.tsx`
3. `src/components/packages/forms/MultiCityHotelPackageForm.tsx`

### Backend API
4. `src/app/api/operator/packages/multi-city/create/route.ts`
5. `src/app/api/operator/packages/multi-city/update/route.ts`
6. `src/app/api/operator/packages/multi-city-hotel/create/route.ts`
7. `src/app/api/operator/packages/multi-city-hotel/update/route.ts`

### Data Loading
8. `src/app/operator/packages/create/multi-city/page.tsx`
9. `src/app/operator/packages/create/multi-city-hotel/page.tsx`

**Total: 9 files (1 new, 8 modified)**
