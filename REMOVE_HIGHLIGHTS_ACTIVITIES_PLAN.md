# Plan: Remove Highlights & Activities Included from Multi-City Package Forms

## Overview
Remove "Highlights" and "Activities Included" fields from the UI in:
1. Multi-City Package Form (`MultiCityPackageForm.tsx`)
2. Multi-City with Hotel Package Form (`MultiCityHotelPackageForm.tsx`)

**Important**: Database tables will NOT be modified. Fields will be marked as deprecated in code but remain in DB for backward compatibility.

---

## Files to Modify

### 1. Form Components (Remove UI Elements)

#### `src/components/packages/forms/MultiCityPackageForm.tsx`
- **Lines 464-474**: Remove the "Highlights Section" and "Activities Included Section" from `BasicInformationTab`
- **Lines 495-515**: Remove `HighlightsEditor` component (entire component)
- **Lines 517-537**: Remove `ActivitiesIncludedEditor` component (entire component)
- **Line 61-62**: Keep `highlights` and `activitiesIncluded` in `CityStop` type but add `@deprecated` JSDoc comment
- **Line 251**: Update `addCity` to still initialize with empty arrays (for backward compatibility)

#### `src/components/packages/forms/MultiCityHotelPackageForm.tsx`
- **Lines 650-660**: Remove the "Highlights Section" and "Activities Included Section" from `BasicInformationTab`
- **Lines 681-701**: Remove `HighlightsEditor` component (entire component)
- **Lines 703-723**: Remove `ActivitiesIncludedEditor` component (entire component)
- **Line 70-71**: Keep `highlights` and `activitiesIncluded` in `CityStop` type but add `@deprecated` JSDoc comment
- **Line 394**: Update `addCity` to still initialize with empty arrays (for backward compatibility)

---

### 2. API Routes (No Changes Required - Already Handle Null/Empty)

The following API routes already handle these fields gracefully:
- ✅ `src/app/api/operator/packages/multi-city/create/route.ts` - Already handles null/empty arrays
- ✅ `src/app/api/operator/packages/multi-city/update/route.ts` - Already handles null/empty arrays
- ✅ `src/app/api/operator/packages/multi-city-hotel/create/route.ts` - Already handles null/empty arrays
- ✅ `src/app/api/operator/packages/multi-city-hotel/update/route.ts` - Already handles null/empty arrays

**Action**: No changes needed. These routes will continue to save empty arrays to DB, which is fine.

---

### 3. Package Edit Pages (No Changes Required)

The following pages load existing data and map DB fields to form:
- ✅ `src/app/operator/packages/create/multi-city/page.tsx` - Lines 54-55 already handle empty/null
- ✅ `src/app/operator/packages/create/multi-city-hotel/page.tsx` - Lines 52-53 already handle empty/null

**Action**: No changes needed. These will continue to load existing data (if any) but won't display it in UI.

---

### 4. Type Definitions (Mark as Deprecated)

#### `src/components/packages/forms/MultiCityPackageForm.tsx`
```typescript
type CityStop = {
  id: string;
  name: string;
  country?: string;
  nights: number;
  /** @deprecated This field is no longer used in the UI. Kept for backward compatibility. */
  highlights: string[];
  /** @deprecated This field is no longer used in the UI. Kept for backward compatibility. */
  activitiesIncluded: string[];
  expanded?: boolean;
};
```

#### `src/components/packages/forms/MultiCityHotelPackageForm.tsx`
```typescript
type CityStop = {
  id: string;
  name: string;
  country?: string;
  nights: number;
  /** @deprecated This field is no longer used in the UI. Kept for backward compatibility. */
  highlights: string[];
  /** @deprecated This field is no longer used in the UI. Kept for backward compatibility. */
  activitiesIncluded: string[];
  expanded?: boolean;
  hotels: HotelOption[];
};
```

---

## Implementation Steps

### Step 1: Update MultiCityPackageForm.tsx
1. Remove Highlights Section (lines 464-468)
2. Remove Activities Included Section (lines 470-474)
3. Remove `HighlightsEditor` component (lines 495-515)
4. Remove `ActivitiesIncludedEditor` component (lines 517-537)
5. Add `@deprecated` JSDoc comments to type definition (lines 61-62)
6. Keep `addCity` initialization with empty arrays (line 251)

### Step 2: Update MultiCityHotelPackageForm.tsx
1. Remove Highlights Section (lines 650-654)
2. Remove Activities Included Section (lines 656-660)
3. Remove `HighlightsEditor` component (lines 681-701)
4. Remove `ActivitiesIncludedEditor` component (lines 703-723)
5. Add `@deprecated` JSDoc comments to type definition (lines 70-71)
6. Keep `addCity` initialization with empty arrays (line 394)

### Step 3: Verify No Breaking Changes
- ✅ API routes already handle null/empty gracefully
- ✅ Edit pages already handle empty/null gracefully
- ✅ Database fields remain untouched
- ✅ Existing packages with data will still load (data just won't be displayed/editable)

---

## Testing Checklist

After implementation, verify:
- [ ] Multi-city package form loads without errors
- [ ] Multi-city with hotel package form loads without errors
- [ ] Can create new packages without highlights/activities fields
- [ ] Can edit existing packages (even if they have highlights/activities data)
- [ ] Form validation still works
- [ ] Package save/publish still works
- [ ] No console errors
- [ ] No TypeScript errors

---

## Impact Analysis

### ✅ Safe to Remove (No Breaking Changes)
- UI components are self-contained
- API routes already handle null/empty values
- Database fields remain (backward compatible)
- Type definitions kept (with deprecation notice)

### ⚠️ Things to Watch
- If any external code directly accesses `city.highlights` or `city.activitiesIncluded` in the form data, it will still work (just empty arrays)
- Database queries that filter/search by these fields will continue to work
- Any display components that show these fields will need separate updates (not in scope)

---

## Notes
- Database tables (`multi_city_package_cities` and `multi_city_hotel_package_cities`) are NOT modified
- Fields remain in database schema for backward compatibility
- Existing data in database is preserved but not editable through UI
- Future cleanup can remove database columns after confirming no external dependencies
