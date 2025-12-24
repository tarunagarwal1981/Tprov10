# Delete Itinerary Feature - Implementation Plan

## 🎯 Objective

Add a delete option for created and inserted itineraries on the lead detail page, next to the "View" button or in the action buttons area.

## 📋 Current State

### **Existing Delete Implementation:**
- **Location:** `src/app/agent/leads/[leadId]/itineraries/page.tsx` (lines 77-95)
- **Current Implementation:** Uses Supabase directly (needs migration to AWS API)
- **UI Pattern:** Delete button with trash icon, red styling, confirmation dialog

### **Current Button Layout on Lead Detail Page:**
```
[View] [Insert Packages] [View Days]
```
- All buttons are in a flex row with `flex-1` class
- Buttons are in the action area at the bottom of each itinerary card

### **API Routes Status:**
- ✅ DELETE for itinerary items: `/api/itineraries/[itineraryId]/items/[itemId]`
- ✅ DELETE for itinerary days: `/api/itineraries/[itineraryId]/days/[dayId]`
- ❌ DELETE for entire itinerary: **NOT FOUND** (needs to be created)

## 🎯 Target State

### **New Button Layout:**
```
[View] [Insert Packages/View Days] [Delete]
```
- Delete button should be separate, styled in red
- Should appear for both "Create Itinerary" and "Insert Itinerary" types
- Should have confirmation dialog before deletion

## 📐 Implementation Plan

### **Step 1: Create DELETE API Route for Entire Itinerary**

**File to Create/Update:** `src/app/api/itineraries/[itineraryId]/route.ts`

**Current Status:**
- Has GET and PATCH methods
- Missing DELETE method

**Implementation:**
```typescript
/**
 * DELETE /api/itineraries/[itineraryId]
 * Delete an entire itinerary (cascades to days and items)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;
    
    // Delete itinerary (CASCADE will handle days and items)
    const result = await query(
      `DELETE FROM itineraries 
       WHERE id::text = $1
       RETURNING id`,
      [itineraryId]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      deleted: true,
      itineraryId: result.rows[0].id 
    });
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to delete itinerary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

**Database Considerations:**
- Check if database has CASCADE delete configured for:
  - `itinerary_days` (foreign key: `itinerary_id`)
  - `itinerary_items` (foreign key: `itinerary_id`)
- If not, may need to delete days and items first, then itinerary

### **Step 2: Add Delete Handler to Lead Detail Page**

**File:** `src/app/agent/leads/[leadId]/page.tsx`

**Location:** After `handleQuerySave` function, around line 422

**Implementation:**
```typescript
const handleDeleteItinerary = async (itineraryId: string, itineraryName: string) => {
  // Confirmation dialog
  if (!confirm(`Are you sure you want to delete "${itineraryName}"?\n\nThis action cannot be undone and will delete all days and items in this itinerary.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/itineraries/${itineraryId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete itinerary');
    }

    toast.success('Itinerary deleted successfully');
    
    // Refresh the lead data to update the list
    await fetchLeadData();
  } catch (err) {
    console.error('Error deleting itinerary:', err);
    toast.error(err instanceof Error ? err.message : 'Failed to delete itinerary');
  }
};
```

### **Step 3: Add Delete Button to UI**

**File:** `src/app/agent/leads/[leadId]/page.tsx`

**Location:** In the action buttons area (around line 612-650)

**Current Structure:**
```typescript
<div className="flex gap-2 pt-2 border-t">
  <Button variant="ghost" size="sm" onClick={...}>View</Button>
  {isInsertItinerary && <Button>Insert Packages</Button>}
  {isCreateItinerary && <Button>View Days</Button>}
</div>
```

**New Structure:**
```typescript
<div className="flex gap-2 pt-2 border-t">
  <Button variant="ghost" size="sm" onClick={...} className="flex-1">
    <FiEye className="w-4 h-4 mr-1" />
    View
  </Button>
  {isInsertItinerary && (
    <Button variant="outline" size="sm" onClick={...} className="flex-1">
      <FiPackage className="w-4 h-4 mr-1" />
      Insert Packages
    </Button>
  )}
  {isCreateItinerary && (
    <Button variant="outline" size="sm" onClick={...} className="flex-1" disabled={...}>
      <FiEye className="w-4 h-4 mr-1" />
      View Days
    </Button>
  )}
  {/* NEW: Delete button for all itineraries */}
  <Button
    variant="ghost"
    size="sm"
    onClick={(e) => {
      e.stopPropagation(); // Prevent card click
      handleDeleteItinerary(itinerary.id, itinerary.name);
    }}
    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
    title="Delete itinerary"
  >
    <FiTrash2 className="w-4 h-4" />
  </Button>
</div>
```

**Button Styling:**
- Red text color: `text-red-600`
- Hover: `hover:text-red-700 hover:bg-red-50`
- Icon only (no text): `FiTrash2`
- `flex-shrink-0` to prevent button from shrinking
- Tooltip: `title="Delete itinerary"`

### **Step 4: Import FiTrash2 Icon**

**File:** `src/app/agent/leads/[leadId]/page.tsx`

**Location:** In the imports section (around line 6-20)

**Add:**
```typescript
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiEdit2,
  FiPackage,
  FiPlus,
  FiCopy,
  FiEye,
  FiTrash2, // ADD THIS
} from 'react-icons/fi';
```

### **Step 5: Handle Loading State (Optional)**

**Consideration:**
- Add a `deletingItineraryId` state to show loading state
- Disable delete button while deletion is in progress
- Show loading spinner or "Deleting..." text

**Implementation:**
```typescript
const [deletingItineraryId, setDeletingItineraryId] = useState<string | null>(null);

const handleDeleteItinerary = async (itineraryId: string, itineraryName: string) => {
  // ... confirmation ...
  
  setDeletingItineraryId(itineraryId);
  try {
    // ... delete logic ...
  } finally {
    setDeletingItineraryId(null);
  }
};

// In button:
<Button
  disabled={deletingItineraryId === itinerary.id}
  // ... other props ...
>
  {deletingItineraryId === itinerary.id ? (
    <FiLoader className="w-4 h-4 animate-spin" />
  ) : (
    <FiTrash2 className="w-4 h-4" />
  )}
</Button>
```

## 🎨 UI/UX Considerations

### **Button Placement Options:**

**Option 1: Separate Delete Button (Recommended)**
- Place delete button at the end of the button row
- Icon-only button (trash icon)
- Red styling to indicate destructive action
- Small size to not take too much space

**Option 2: Dropdown Menu**
- Three-dot menu button
- Dropdown with "Delete" option
- More space-efficient but requires extra click

**Option 3: Inline with Other Buttons**
- Delete button as part of the flex row
- Same size as other buttons
- May make the row too wide

**Recommendation:** Option 1 - Separate icon-only delete button

### **Confirmation Dialog:**

**Options:**
1. **Browser `confirm()` dialog** (Simple, quick)
   - Pros: No extra dependencies, works immediately
   - Cons: Not customizable, basic styling

2. **Custom Modal/Dialog** (Better UX)
   - Pros: Customizable, better styling, can show more details
   - Cons: Requires dialog component, more code

**Recommendation:** Start with `confirm()` for simplicity, can upgrade to custom dialog later

### **Error Handling:**
- Show toast error if deletion fails
- Log error to console for debugging
- Don't remove from UI if deletion fails

### **Success Feedback:**
- Show success toast
- Refresh itinerary list automatically
- Remove deleted itinerary from UI

## 🔍 Database Considerations

### **Cascade Delete:**
Check if database foreign keys have CASCADE delete:
- `itinerary_days.itinerary_id` → `itineraries.id`
- `itinerary_items.itinerary_id` → `itineraries.id`

**If CASCADE is enabled:**
- Simply delete the itinerary
- Database will automatically delete related days and items

**If CASCADE is NOT enabled:**
- Need to delete in order:
  1. Delete all itinerary items
  2. Delete all itinerary days
  3. Delete the itinerary

### **Query Deletion:**
- **Question:** Should deleting an itinerary also delete the associated query?
- **Current Behavior:** Queries are separate entities, not deleted with itinerary
- **Recommendation:** Keep query, only delete itinerary (queries can be reused)

## 📁 Files to Modify

1. **`src/app/api/itineraries/[itineraryId]/route.ts`**
   - Add DELETE method

2. **`src/app/agent/leads/[leadId]/page.tsx`**
   - Add `FiTrash2` import
   - Add `handleDeleteItinerary` function
   - Add delete button to UI
   - Optionally add `deletingItineraryId` state

## 🔄 Migration Note

**Existing Implementation:**
- `src/app/agent/leads/[leadId]/itineraries/page.tsx` uses Supabase directly
- Should be migrated to use the new DELETE API route
- Can be done in a separate task

## ✅ Implementation Checklist

- [ ] Create DELETE API route in `/api/itineraries/[itineraryId]/route.ts`
- [ ] Test API route with Postman/curl
- [ ] Verify database CASCADE delete behavior
- [ ] Add `FiTrash2` import to lead detail page
- [ ] Add `handleDeleteItinerary` function
- [ ] Add delete button to UI (icon-only, red styling)
- [ ] Add confirmation dialog
- [ ] Add error handling
- [ ] Add success toast
- [ ] Refresh itinerary list after deletion
- [ ] Test delete for "Create Itinerary"
- [ ] Test delete for "Insert Itinerary"
- [ ] Verify related days/items are deleted (or handle manually)
- [ ] Test error scenarios (network error, 404, etc.)

## 🎯 Button Layout Final Design

```
┌─────────────────────────────────────────┐
│  Itinerary Card                         │
│  ...                                    │
│  ┌─────────┬──────────┬──────────┬───┐ │
│  │  View   │ Insert/  │ View Days│ 🗑 │ │
│  │         │ Packages │          │   │ │
│  └─────────┴──────────┴──────────┴───┘ │
└─────────────────────────────────────────┘
```

**Button Sizes:**
- View: `flex-1` (takes available space)
- Insert Packages / View Days: `flex-1` (takes available space)
- Delete: `flex-shrink-0` (fixed size, icon only)

## 📝 Notes

- Delete button should be visible for all itinerary types
- Consider adding a tooltip: "Delete itinerary"
- Confirmation message should be clear about what will be deleted
- After deletion, the itinerary card should disappear from the list
- If deletion fails, show error but keep the itinerary visible

---

**This plan provides a clean, consistent delete functionality that matches the existing patterns in the codebase while ensuring proper error handling and user feedback.**

