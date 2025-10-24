# Activity Package Pricing Options - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Run Database Migration (1 minute)

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `create-activity-pricing-options-schema.sql`
4. Click "Run"

✅ You should see: "Success. No rows returned"

### Step 2: Integrate into Your Activity Form (3 minutes)

Update `src/components/packages/forms/ActivityPackageForm.tsx`:

```typescript
// 1. Import the new tab component
import { ActivityPricingOptionsTab } from "./tabs/ActivityPricingOptionsTab";

// 2. Add to tabs configuration (around line 233)
const tabs: TabInfo[] = [
  // ... existing tabs ...
  {
    id: 'pricing',
    label: 'Pricing',
    icon: <FaDollarSign className="h-4 w-4" />,
    badge: 0,
    isComplete: false,
    hasErrors: false,
  },
  {
    id: 'pricing-options',  // Add this new tab
    label: 'Pricing Options',
    icon: <FaTicketAlt className="h-4 w-4" />,
    badge: 0,
    isComplete: (pricingOptions?.ticketOnlyOptions?.length || 0) > 0 || 
                (pricingOptions?.ticketWithTransferOptions?.length || 0) > 0,
    hasErrors: false,
  },
  // ... other tabs ...
];

// 3. Add to tab content (around line 351)
const tabContent = {
  // ... existing content ...
  'pricing': <PricingTab />,
  'pricing-options': <ActivityPricingOptionsTab />,  // Add this line
  'review': <ReviewPublishActivityTab validation={validation} onPreview={handlePreview} />,
};
```

### Step 3: Update Save Logic (1 minute)

Add pricing options save to your `handleSave` function:

```typescript
import { savePricingOptions } from '@/lib/supabase/activity-pricing-options';

// In handleSave function
const handleSave = async (data: ActivityPackageFormData) => {
  // ... existing save logic ...
  
  // Add this after main package save
  if (packageId && data.pricingOptions) {
    await savePricingOptions(
      packageId,
      data.pricingOptions.ticketOnlyOptions || [],
      data.pricingOptions.ticketWithTransferOptions || []
    );
  }
};
```

## ✅ That's it! Test it out:

1. Create or edit an activity package
2. Navigate to the "Pricing Options" tab
3. Click "Add Ticket Option" or "Add Transfer Option"
4. Fill in the details and save

## 📖 Example Usage

### Add a Simple Ticket Option:
1. Click "Add Ticket Option"
2. Fill in:
   - Option Name: "Standard Admission"
   - Adult Price: 50
   - Child Price: 25
   - Child Age Range: 3 to 12
   - Add included items
3. Toggle "Active" on
4. Click "Save Option"

### Add a Transfer Package:
1. Click "Add Transfer Option"
2. Fill in:
   - Option Name: "Premium with Hotel Transfer"
   - Vehicle Type: Sedan
   - Vehicle Name: "Mercedes E-Class"
   - Max Capacity: 4
   - Adult Price: 75
   - Child Price: 40
   - Add vehicle features (AC, WiFi, etc.)
   - Add included items
3. Toggle "Active" and "Featured" on
4. Click "Save Option"

## 🎯 Common Questions

**Q: Can I have both ticket-only and ticket-with-transfer options?**  
A: Yes! You can offer multiple options of both types.

**Q: What happens when I mark an option as "Featured"?**  
A: Featured options can be displayed prominently in your public listings (frontend implementation needed).

**Q: Can I edit an option after creating it?**  
A: Yes! Click the edit icon on any option card.

**Q: How do I temporarily hide an option without deleting it?**  
A: Toggle the "Active" switch off. Inactive options are saved but not shown publicly.

**Q: What if I want to offer different prices for different seasons?**  
A: Create separate pricing options for each season, or use the existing seasonal pricing in the "Pricing" tab.

## 🔧 Troubleshooting

**Issue:** Tab doesn't appear  
**Fix:** Make sure you imported `ActivityPricingOptionsTab` and added it to both `tabs` array and `tabContent` object.

**Issue:** Save doesn't work  
**Fix:** Ensure `packageId` exists and the pricing options are being passed to `savePricingOptions`.

**Issue:** Permission errors  
**Fix:** Make sure you're logged in as a tour operator and the package belongs to you.

## 📚 Need More Details?

See `ACTIVITY-PRICING-OPTIONS-IMPLEMENTATION.md` for:
- Complete API reference
- Database schema details
- Advanced customization
- Best practices
- Full examples

## 🎉 Ready to Go!

You now have a complete pricing options system for your activity packages. Start creating pricing options and watch your packages come to life!

