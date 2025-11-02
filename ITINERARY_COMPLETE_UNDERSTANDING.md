# 🗺️ Itinerary Creation - Complete Understanding & Agreement

## ✅ Confirmed Understanding

---

## 📦 **1. Package Types & Options Available to Agent**

### **A. Activity Packages**
**Configuration Options:**
- **Ticket Only** (No Transfer)
  - Adult price (per person)
  - Child price (per person) - with age range (childMinAge to childMaxAge)
  - Infant price (per person) - with max age (infantMaxAge)
  
- **Ticket with Transfer** (Has Transfer)
  - All above pricing options PLUS:
  - Vehicle Type selection:
    - SEDAN, SUV, VAN, BUS, LUXURY, MINIBUS
  - Transfer price is added to base ticket price

**Pricing Calculation:**
```
Ticket Only:
  Total = (adultPrice × adults) + (childPrice × children) + (infantPrice × infants)

Ticket with Transfer:
  Total = (adultPrice × adults) + (childPrice × children) + (infantPrice × infants) + Transfer Cost
```

### **B. Transfer Packages**
**Configuration Options:**
- **Hourly Pricing Options**:
  - Select vehicle type and number of hours
  - Rate per hour based on vehicle type
  
- **Point-to-Point Pricing Options**:
  - Fixed route pricing
  - Vehicle type selection
  - Distance-based pricing

**Pricing Calculation:**
```
Hourly: rateUSD × hours
Point-to-Point: fixed costUSD based on route and vehicle
```

### **C. Multi-City Packages**
**Configuration Options:**
- **Pricing Model Selection**:
  - **STANDARD**: Per person pricing
    - Adult price
    - Child price (with age range)
    - Infant price (with max age)
  - **GROUP**: Per person + Vehicle options
    - All STANDARD pricing options PLUS
    - Vehicle selection (vehicle_type, max_capacity, price)

- **Hotel Selection** (per city):
  - Each city has multiple hotel options
  - Hotel options come from `multi_city_package_city_hotels` table
  - Agent selects hotel per city night
  - Hotel pricing affects total package cost

**Pricing Calculation:**
```
STANDARD:
  Base = (adultPrice × adults) + (childPrice × children) + (infantPrice × infants)

GROUP:
  Base = (adultPrice × adults) + (childPrice × children) + (infantPrice × infants)
  Vehicle = selected vehicle price
  Hotels = sum of selected hotel prices per night

Total = Base + Vehicle (if GROUP) + Hotels
```

### **D. Multi-City Hotel Packages**
**Configuration Options:**
- **Same as Multi-City Packages**:
  - STANDARD or GROUP pricing model
  - Adult/Child/Infant pricing
  - Vehicle options (if GROUP)
  - **Hotel selection per city**:
    - Each city has hotel options
    - Hotel options from `multi_city_hotel_package_city_hotels` table
    - Agent selects hotel per city night

**Pricing Calculation:** Same as Multi-City Packages

### **E. Fixed Departure Flight Packages**
**Configuration Options:**
- **Same as Multi-City Packages**:
  - STANDARD or GROUP pricing model
  - Adult/Child/Infant pricing
  - Vehicle options (if GROUP)
  - Hotel selection per city
  - **Additional**: Fixed departure dates

**Pricing Calculation:** Same as Multi-City Packages

---

## 🎯 **2. Package Filtering by Country**

### **Requirement**
- Filter packages **by destination country** of the lead
- Support 1000+ operators with multiple packages
- Efficient country-based filtering

### **Implementation**
```typescript
// Extract country from lead destination
const country = extractCountry(lead.destination); // "Indonesia" from "Bali, Indonesia"

// Search all 5 package types for that country
searchPackages(country) → {
  activities: searchActivityPackages({ country }),
  transfers: searchTransferPackages({ country }),
  multiCity: searchMultiCityPackages({ country }),
  multiCityHotels: searchMultiCityHotelPackages({ country }),
  fixedDeparture: searchFixedDeparturePackages({ country })
}
```

---

## 👥 **3. Adult/Child Input at Start**

### **Requirement**
- Agent inputs **adults and children count** at itinerary creation start
- This count is used for **all pricing calculations**
- All packages calculate based on this input

### **Flow**
1. Agent clicks "Create Itinerary" from lead
2. **Input Form** appears:
   ```
   Adults: [2]
   Children: [1] (with age inputs if needed)
   Start Date: [Date Picker]
   End Date: [Date Picker]
   Notes: [Optional]
   ```
3. Agent clicks "Continue"
4. Pricing calculations use these numbers throughout

---

## 💰 **4. Real-Time Pricing Calculation**

### **Requirement**
- **Total itinerary cost updates in real-time** as agent:
  - Adds packages
  - Removes packages
  - Changes package options (transfer type, hotels, vehicles)
  - Modifies configurations

### **Calculation Logic**
```typescript
function calculateItineraryTotal(itineraryItems, adults, children, infants) {
  let total = 0;
  
  for (item of itineraryItems) {
    switch (item.packageType) {
      case 'activity':
        if (item.config.ticketOnly) {
          total += (item.package.adultPrice × adults) + 
                   (item.package.childPrice × children) + 
                   (item.package.infantPrice × infants);
        } else {
          // Ticket with transfer
          total += (item.package.adultPrice × adults) + 
                   (item.package.childPrice × children) + 
                   (item.package.infantPrice × infants) + 
                   item.config.transferPrice;
        }
        break;
        
      case 'transfer':
        if (item.config.hourly) {
          total += item.package.rateUSD × item.config.hours;
        } else {
          total += item.package.costUSD;
        }
        break;
        
      case 'multi_city':
      case 'multi_city_hotel':
      case 'fixed_departure':
        let basePrice = (item.package.adultPrice × adults) + 
                        (item.package.childPrice × children) + 
                        (item.package.infantPrice × infants);
        
        if (item.config.pricingType === 'GROUP') {
          basePrice += item.config.vehiclePrice;
        }
        
        // Add selected hotel prices
        basePrice += sum(item.config.selectedHotels.map(h => h.price));
        
        total += basePrice;
        break;
    }
  }
  
  return total;
}
```

### **Display**
- Show total in right panel (Summary)
- Update immediately on any change
- Show breakdown per day
- Compare against customer budget with status indicator

---

## 🏨 **5. Hotel Selection**

### **Current Implementation**
- Hotels **only from packages** (multi-city, multi-city hotel, fixed departure)
- Hotels are options **within the package structure**
- Each city in package has hotel options
- Agent selects hotel per city night

### **Future Enhancement**
- Custom hotel selection (standalone hotels) - **to be implemented later**

### **How It Works**
1. Agent adds multi-city package to itinerary
2. System shows all cities in that package
3. For each city, system shows available hotel options
4. Agent selects hotel for each night
5. Total pricing includes selected hotel costs

---

## 📝 **6. Multiple Itineraries Per Lead**

### **Requirement**
- Agent can create **multiple itineraries** for same lead
- **No auto-save** - agent creates complete itinerary, then generates PDF
- Each itinerary can have:
  - Different hotel selections
  - Different package combinations
  - Different pricing options
- Purpose: Send multiple PDFs to customer for comparison

### **Itinerary Naming**
- **Default**: "Itinerary #1", "Itinerary #2", "Itinerary #3"
- **Customizable**: Agent can edit name
- Example: "Budget Option", "Luxury Option", "Family-Friendly"

### **Database Structure**
```sql
itineraries table:
  - id
  - lead_id (FK to leads)
  - name (default: "Itinerary #X", editable)
  - status: 'draft', 'completed', 'sent', 'archived'
  - created_at, updated_at
```

### **UI Flow**
```
My Leads Page
  → Lead Card
    → [Create Itinerary] button
    → Existing Itineraries: (2)
      ▼ Show
        • Budget Option - $1,250
        • Luxury Option - $2,100

Itinerary List Page
  → All itineraries for this lead
  → [View] [Edit] [PDF] [Delete] actions
```

---

## 👥 **7. Operator Information & Contact**

### **Requirement**
- **Operator info is very important** for every package
- After itinerary creation: **Consolidated view** showing:
  - All unique operators used
  - All packages from each operator
  - Operator contact details (email, phone, WhatsApp, website)
- Future: Individual operator-agent chat per package

### **Display Locations**

#### **A. In Package Cards (Search Panel)**
```
┌─────────────────────────────────────┐
│ 🏔️ Mount Batur Trek                 │
│ Operator: Bali Adventure Tours      │
│ [View Operator →]                    │
│ Price: $75/person                    │
└─────────────────────────────────────┘
```

#### **B. After Adding to Itinerary**
- Show operator badge on package card in itinerary
- Click to view operator details modal

#### **C. Consolidated Operator View (Post-Creation)**
```
Modal or Dedicated Section:

Operators in This Itinerary
────────────────────────────

1. Bali Adventure Tours
   Packages:
   • Mount Batur Trek
   • White Water Rafting
   Contact:
   • Email: info@baliadventure.com
   • Phone: +62-361-123-456
   • WhatsApp: +62-812-345-678
   • Website: www.baliadventure.com
   [Chat] [Copy Details]

2. Island Transfers Co.
   Packages:
   • Airport Transfer
   Contact:
   • Email: bookings@island.co
   • Phone: +62-361-789-012
   [Chat] [Copy Details]

[Export All Contacts]
```

#### **D. In PDF**
- Separate section at end of PDF
- Lists all operators with contact details

### **Operator Contact Fields**
- Business Email
- Business Phone
- WhatsApp Number
- Website URL
- Business Address (optional)

---

## 💱 **8. Currency Handling**

### **Current Requirement**
- **Single currency** support (USD as default)
- All pricing in one currency
- Real-time conversion not needed

### **Future Enhancement**
- Multi-currency support - **to be implemented later**

---

## 🎨 **9. UI Layout - Most Intuitive**

### **Recommended: Responsive 3-Column → 2-Column → Stacked**

#### **Desktop (1920px+): 3-Column Layout**
```
┌──────────┬───────────────────┬─────────┐
│ Packages │   Itinerary        │ Summary │
│ (30%)    │   (50%)            │ (20%)   │
│          │                    │         │
│ Search   │   Day 1            │ Total:  │
│ Filters  │   Day 2            │ $1,250  │
│ Package  │   Day 3            │ Budget: │
│ List     │   [+ Add Day]      │ ✅ OK   │
│          │                    │         │
│          │                    │ Actions │
└──────────┴───────────────────┴─────────┘
```

#### **Medium Screens (1024-1920px): 2-Column with Bottom Bar**
```
┌──────────────┬──────────────────┐
│ Packages     │   Itinerary      │
│ (40%)        │   (60%)          │
│              │                  │
└──────────────┴──────────────────┘
┌──────────────────────────────────┐
│ Summary: Total $1,250 | Actions  │
└──────────────────────────────────┘
```

#### **Mobile/Tablet (<1024px): Stacked with Tabs**
```
┌──────────────────────────┐
│ [Packages] [Itinerary]   │ ← Tabs
│                          │
│ Itinerary Builder        │
│                          │
│ [+ Add Package]          │
└──────────────────────────┘
[Summary: Expandable Panel]
```

---

## 📋 **10. Package Configuration Modal**

### **When Agent Clicks "Add Package"**

Show modal with:
1. **Package Details**:
   - Title, description
   - Operator name
   - Base pricing info

2. **Configuration Options** (based on package type):
   - **Activity**: Ticket Only vs Ticket with Transfer
     - If Transfer: Vehicle type selection
   - **Transfer**: Hourly vs Point-to-Point, Vehicle selection
   - **Multi-City**: STANDARD vs GROUP, Hotel selection per city, Vehicle (if GROUP)
   - **Multi-City Hotel**: Same as Multi-City
   - **Fixed Departure**: Same as Multi-City + Date selection

3. **Real-Time Price Calculation**:
   - Shows breakdown
   - Updates as agent changes options
   - Shows final total

4. **Actions**:
   - [Add to Itinerary] (confirms and adds)
   - [Cancel]

---

## ✅ **Agreed Points Summary**

1. ✅ **Package Options**: Use all options from 5 package forms (activity, transfer, multi-city, multi-city hotel, fixed departure)
2. ✅ **Hotel Selection**: Only from packages for now, custom hotels later
3. ✅ **Pricing**: All 5 package types support adult/child/infant pricing - nothing missing
4. ✅ **Itinerary Naming**: Default "Itinerary #1, #2, #3" but editable by user
5. ✅ **UI Layout**: Responsive 3-column → 2-column → stacked
6. ✅ **Package Configuration**: Modal with all options
7. ✅ **Operator Contact**: Consolidated view modal/section after itinerary creation
8. ✅ **Currency**: Single currency (USD) for now, multi-currency later

---

## 🎯 **Implementation Checklist**

### **Phase 1: Foundation**
- [ ] Database schema for itineraries, itinerary_days, itinerary_items
- [ ] Input form (adults/children/dates)
- [ ] Package search by country for all 5 types
- [ ] Basic itinerary builder UI

### **Phase 2: Package Configuration**
- [ ] Configuration modal for all 5 package types
- [ ] Option selection (transfer types, hotels, vehicles)
- [ ] Pricing calculation based on selections
- [ ] Add packages to itinerary days

### **Phase 3: Real-Time Pricing**
- [ ] Total calculation service
- [ ] Real-time updates in summary panel
- [ ] Budget comparison and status indicator

### **Phase 4: Multiple Itineraries**
- [ ] Itinerary list view
- [ ] Create/edit multiple versions
- [ ] Itinerary naming (default + editable)

### **Phase 5: Operator Information**
- [ ] Operator details modal
- [ ] Consolidated operator view
- [ ] Export contacts functionality

### **Phase 6: PDF & Email**
- [ ] PDF generation with itinerary details
- [ ] Operator contact section in PDF
- [ ] Email sending functionality
- [ ] Multiple PDF management

---

## ❓ **Final Confirmations Needed**

1. **Hotel Selection UI**: When agent selects multi-city package, how should hotel selection be presented?
   - Separate modal per city?
   - Inline selection in itinerary builder?
   - Collapsible section per city?

2. **Package Variants**: Activity packages have "Package Variants" - should agents see these as additional options?

3. **Group Discounts**: Activity packages have group discounts - should these auto-apply if group size matches?

4. **Itinerary Status Flow**: 
   - Draft → Completed (after adding packages)
   - Completed → Sent (after generating PDF)
   - Can agent go back and edit after "Sent"?

---

## 🚀 **Ready for Implementation**

Once above questions are answered, we're ready to:
1. Finalize database schema
2. Start building components
3. Implement step by step

**All core requirements are understood and agreed upon!** ✅

