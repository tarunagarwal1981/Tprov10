# Plan: Operator Multi-City Package Day-by-Day Itinerary UI Consistency

## Objective
Make the operator's day-by-day itinerary UI in multi-city and multi-city hotel package forms match the agent's UI when they insert packages and create itineraries.

---

## Current State Analysis

### Agent UI (Reference - `/agent/itineraries/[itineraryId]/configure/[itemId]/page.tsx`)
**Location:** Lines 1934-2129

**Features:**
1. **Visual Design:**
   - Colored backgrounds for each time slot:
     - Morning: `bg-orange-50/30` with 🌅 emoji
     - Afternoon: `bg-yellow-50/30` with ☀️ emoji
     - Evening: `bg-purple-50/30` with 🌙 emoji
   - Border: `border rounded-lg p-4`
   - Clean card-based layout

2. **Time Display:**
   - Shows default times as text (not editable input):
     - Morning: "08:00 AM"
     - Afternoon: "12:30 PM"
     - Evening: "05:00 PM"
   - Displayed as: `<span className="text-xs text-gray-600">08:00 AM</span>`

3. **Header Layout:**
   - Time slot name with emoji on left
   - Default time displayed next to name
   - "Add Activity" and "Add Transfer" buttons side by side on right
   - Structure:
     ```tsx
     <div className="flex items-center justify-between mb-3">
       <div className="flex items-center gap-2">
         <span>🌅 Morning</span>
         <span>08:00 AM</span>
       </div>
       <div className="flex gap-2">
         <Button>Add Activity</Button>
         <Button>Add Transfer</Button>
       </div>
     </div>
     ```

4. **Empty State:**
   - Shows: `<p className="text-xs text-gray-500 italic">No items scheduled</p>`
   - Only shown when both activities and transfers are empty

5. **Item Display:**
   - White background cards: `bg-white rounded border`
   - Shows "Activity: {title}" or "Transfer: {title}"
   - Shows price if available
   - "Remove" button on right
   - Badge for package items: `<Badge variant="outline">Package</Badge>`

6. **Button Styling:**
   - Small buttons: `size="sm"`, `className="text-xs h-7"`
   - Icons: `<FiPlus className="w-3 h-3 mr-1" />`
   - Outline variant: `variant="outline"`

---

### Operator UI (Current - `TimeSlotEditor` component)
**Location:** 
- `src/components/packages/forms/MultiCityPackageForm.tsx` (lines 535-703)
- `src/components/packages/forms/MultiCityHotelPackageForm.tsx` (lines 722-890)

**Current Features:**
1. **Visual Design:**
   - Gray background: `bg-gray-50 dark:bg-gray-800/50`
   - No emojis
   - Same border style: `border border-gray-200 rounded-lg p-4`

2. **Time Input:**
   - Editable time input field: `<Input type="time" />`
   - No default times displayed
   - Placeholder: "HH:MM"
   - User mentioned: "all 12:30 time for morning afternoon and evening" - likely means default times are not set or all show 12:30

3. **Header Layout:**
   - Time slot name only (no emoji)
   - Time input field next to name
   - No "Add Activity/Transfer" buttons in header

4. **Input Method:**
   - Text input fields for adding activities/transfers
   - Separate sections for Activities and Transfers
   - Plus button next to input field
   - Structure:
     ```tsx
     <div className="mb-3">
       <label>Activities</label>
       <div className="flex gap-2">
         <Input placeholder="Add activity..." />
         <Button><FaPlus /></Button>
       </div>
     </div>
     ```

5. **Empty State:**
   - No empty state message
   - Just shows empty list

6. **Item Display:**
   - White/dark background: `bg-white dark:bg-gray-900`
   - Shows activity/transfer text only
   - Trash icon button: `<FaTrash />`
   - No "Activity:" or "Transfer:" prefix
   - No price display

---

## Required Changes

### 1. Visual Design Updates
- [ ] Change background colors to match agent UI:
  - Morning: `bg-orange-50/30`
  - Afternoon: `bg-yellow-50/30`
  - Evening: `bg-purple-50/30`
- [ ] Add emojis to time slot names:
  - Morning: 🌅
  - Afternoon: ☀️
  - Evening: 🌙

### 2. Time Display Updates
- [ ] Replace editable time input with display-only default times
- [ ] Set default times:
  - Morning: "08:00 AM" (or "08:00" in 24h format for storage)
  - Afternoon: "12:30 PM" (or "12:30" in 24h format)
  - Evening: "05:00 PM" (or "17:00" in 24h format)
- [ ] Initialize time slots with these default times when creating days
- [ ] Keep time editable (maybe add edit icon to change time if needed, or keep input but show default)

**Note:** Need to decide if time should be:
- **Option A:** Display-only with default times (like agent UI)
- **Option B:** Editable input with default values pre-filled
- **Option C:** Display default time, but allow editing via icon/button

### 3. Header Layout Updates
- [ ] Restructure header to match agent layout:
  - Left side: Emoji + time slot name + default time
  - Right side: "Add Activity" and "Add Transfer" buttons side by side
- [ ] Update button styling to match agent:
  - `size="sm"`
  - `variant="outline"`
  - `className="text-xs h-7"`
  - Icons: `<FiPlus className="w-3 h-3 mr-1" />`
  - Text: "Activity" and "Transfer"

### 4. Input Method Updates
- [ ] Remove text input fields from main body
- [ ] Add modal/dialog for adding activities and transfers (when clicking "Add Activity/Transfer" buttons)
- [ ] OR keep inline input but move to header area
- [ ] Match agent's approach: buttons trigger add functionality

### 5. Empty State Updates
- [ ] Add empty state message: "No items scheduled"
- [ ] Show only when both activities and transfers are empty
- [ ] Style: `text-xs text-gray-500 italic`

### 6. Item Display Updates
- [ ] Update item cards to match agent style:
  - Add "Activity: " or "Transfer: " prefix to title
  - Show price if available (for operator packages, might not have price in same format)
  - Update remove button: "Remove" text button instead of trash icon
  - Style: `variant="ghost" size="sm" className="h-6 text-xs"`
- [ ] Keep white background: `bg-white rounded border`

### 7. Default Time Initialization
- [ ] Update time slot initialization in both forms:
  - `MultiCityPackageForm.tsx` - line ~730
  - `MultiCityHotelPackageForm.tsx` - line ~918
- [ ] Set default times when creating new days:
  ```typescript
  morning: { time: "08:00", activities: [], transfers: [] },
  afternoon: { time: "12:30", activities: [], transfers: [] },
  evening: { time: "17:00", activities: [], transfers: [] }
  ```

---

## Implementation Plan

### Phase 1: Update TimeSlotEditor Component
**Files to modify:**
1. `src/components/packages/forms/MultiCityPackageForm.tsx`
2. `src/components/packages/forms/MultiCityHotelPackageForm.tsx`

**Steps:**
1. Update `TimeSlotEditor` component styling:
   - Add conditional background colors based on `slotName`
   - Add emojis to slot labels
   - Update header layout structure

2. Update time display:
   - Replace time input with display text showing default time
   - OR keep input but pre-fill with default values
   - Format time for display (convert 24h to 12h with AM/PM)

3. Restructure header:
   - Move "Add Activity" and "Add Transfer" buttons to header
   - Update button styling to match agent UI

4. Update input method:
   - Decide on approach (modal vs inline)
   - If keeping inline, move inputs to be triggered by buttons
   - Update add functionality

5. Add empty state:
   - Check if both activities and transfers are empty
   - Display message

6. Update item display:
   - Add prefixes to item titles
   - Update remove button styling
   - Format item cards to match agent

### Phase 2: Update Default Time Initialization
**Files to modify:**
1. `src/components/packages/forms/MultiCityPackageForm.tsx` (line ~730)
2. `src/components/packages/forms/MultiCityHotelPackageForm.tsx` (line ~918)

**Steps:**
1. Update time slot initialization in `useEffect`:
   - Set default times: "08:00", "12:30", "17:00"
   - Ensure all new days get these defaults

2. Update day creation logic:
   - When auto-generating days, include default times
   - When manually adding days, include default times

### Phase 3: Testing
1. Test multi-city package form:
   - Create new package
   - Add cities and nights
   - Verify day-by-day itinerary shows correct UI
   - Verify default times are set
   - Test adding/removing activities and transfers

2. Test multi-city hotel package form:
   - Same as above

3. Compare with agent UI:
   - Side-by-side comparison
   - Verify visual consistency
   - Verify functionality matches

---

## Design Decisions Needed

### 1. Time Input Approach
**Question:** Should time be editable or display-only?

**Recommendation:** 
- Display default time as text (like agent)
- Add edit icon/button to allow editing if needed
- OR keep input but pre-fill with defaults and style it better

### 2. Add Activity/Transfer Method
**Question:** How should adding activities/transfers work?

**Options:**
- **A:** Modal/dialog opens when clicking button (like agent might do)
- **B:** Inline input appears when clicking button
- **C:** Keep current text input but move to header area

**Current agent UI:** Buttons trigger add functionality (likely opens modal or inline input)

**Recommendation:** Check agent implementation to see exact flow, then match it.

### 3. Price Display
**Question:** Should operator packages show prices in same format as agent?

**Note:** Operator packages might store prices differently. Need to check data structure.

---

## Files to Modify

1. `src/components/packages/forms/MultiCityPackageForm.tsx`
   - `TimeSlotEditor` component (lines 535-703)
   - Time slot initialization (line ~730)
   - ItineraryTab component (lines 706-867)

2. `src/components/packages/forms/MultiCityHotelPackageForm.tsx`
   - `TimeSlotEditor` component (lines 722-890)
   - Time slot initialization (line ~918)
   - ItineraryTab component (lines 893-1054)

---

## Expected Outcome

After implementation:
- Operator's day-by-day itinerary UI will match agent's UI
- Consistent visual design (colored backgrounds, emojis)
- Default times displayed (08:00 AM, 12:30 PM, 05:00 PM)
- Same button layout and styling
- Same empty state messaging
- Same item display format
- Better user experience and consistency across the platform

---

## Notes

- User mentioned "all 12:30 time for morning afternoon and evening" - this suggests current implementation might have wrong defaults or no defaults
- Need to ensure backward compatibility with existing packages that might have different time formats
- Consider dark mode support (agent UI might not have dark mode, but operator forms do)
