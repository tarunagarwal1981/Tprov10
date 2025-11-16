# ✅ Migration Complete - Next Steps

## 🎉 Congratulations!

Your simulation setup migration has run successfully! Now let's verify everything is working and test the complete workflow.

---

## 📋 Step 1: Verify Package Creation

Run this query in Supabase SQL Editor to verify all packages were created:

```sql
-- Verify packages per operator
SELECT 
    u.email as operator_email,
    COUNT(DISTINCT ap.id) as activity_packages,
    COUNT(DISTINCT tp.id) as transfer_packages
FROM auth.users u
LEFT JOIN activity_packages ap ON ap.operator_id = u.id AND ap.status = 'published'
LEFT JOIN transfer_packages tp ON tp.operator_id = u.id AND tp.status = 'published'
WHERE u.email IN (
    'bali.adventure@touroperator.com',
    'java.cultural@touroperator.com',
    'island.transfers@touroperator.com',
    'bali.beach@touroperator.com',
    'premium.indonesia@touroperator.com'
)
GROUP BY u.email
ORDER BY u.email;

-- Expected Results:
-- bali.adventure@touroperator.com: 2 activity, 2 transfer
-- bali.beach@touroperator.com: 2 activity, 0 transfer
-- island.transfers@touroperator.com: 0 activity, 2 transfer
-- java.cultural@touroperator.com: 2 activity, 1 transfer
-- premium.indonesia@touroperator.com: 1 activity, 0 transfer
```

**Expected Result**: ~7 activity packages + ~5 transfer packages = ~12 total packages

---

## 📋 Step 2: Verify Marketplace Leads Exist

If you haven't run the marketplace leads creation yet, check if leads exist:

```sql
-- Check marketplace leads
SELECT 
    id,
    title,
    destination,
    status,
    lead_price,
    expires_at > NOW() as not_expired
FROM lead_marketplace
WHERE status = 'AVAILABLE'
ORDER BY created_at DESC;

-- If no leads, you need to run the marketplace leads part from:
-- 008_simulation_demo_setup_continued.sql (the leads section)
```

If leads don't exist, run this to create them:

```sql
-- Lead 1: Bali Adventure & Culture - 4 Days
INSERT INTO lead_marketplace (
    title, destination, trip_type, budget_min, budget_max, duration_days,
    travelers_count, travel_date_start, travel_date_end, special_requirements,
    lead_quality_score, lead_price, status, expires_at,
    customer_name, customer_email, customer_phone, detailed_requirements
) VALUES (
    'Bali Adventure & Culture - 4 Days',
    'Bali, Indonesia',
    'ADVENTURE',
    2500.00, 3500.00, 4, 2,
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '120 days',
    'Interested in mountain trekking, water sports, and cultural temple visits. Prefer active experiences.',
    88, 125.00, 'AVAILABLE', CURRENT_DATE + INTERVAL '60 days',
    'Sarah & John Mitchell',
    'sarah.mitchell@example.com',
    '+1-555-0123',
    'We''re celebrating our anniversary. Want a mix of adventure and relaxation. Prefer eco-friendly operators. Vegetarian meal options preferred.'
) ON CONFLICT DO NOTHING;

-- Lead 2: Java Cultural Discovery - 3 Days
INSERT INTO lead_marketplace (
    title, destination, trip_type, budget_min, budget_max, duration_days,
    travelers_count, special_requirements, lead_quality_score, lead_price,
    status, expires_at, customer_name, customer_email, customer_phone, detailed_requirements
) VALUES (
    'Java Cultural Heritage Tour',
    'Yogyakarta, Central Java, Indonesia',
    'CULTURAL',
    1800.00, 2500.00, 3, 1,
    'Focus on historical sites, temples, and local culture. Solo traveler, prefer small group tours.',
    82, 95.00, 'AVAILABLE', CURRENT_DATE + INTERVAL '45 days',
    'Michael Chen',
    'michael.chen@example.com',
    '+1-555-0456',
    'First time in Indonesia. Interested in photography at historical sites. Comfortable with basic accommodations. Prefer morning tours for better lighting.'
) ON CONFLICT DO NOTHING;

-- Lead 3: Bali-Lombok Island Hopping - 4 Days
INSERT INTO lead_marketplace (
    title, destination, trip_type, budget_min, budget_max, duration_days,
    travelers_count, travel_date_start, special_requirements, lead_quality_score,
    lead_price, status, expires_at, customer_name, customer_email, customer_phone, detailed_requirements
) VALUES (
    'Island Hopping: Bali & Lombok Experience',
    'Bali & Lombok, Indonesia',
    'BEACH',
    3000.00, 4000.00, 4, 3,
    CURRENT_DATE + INTERVAL '60 days',
    'Family vacation. Need child-friendly activities. Beach-focused but some cultural exposure. All transfers included.',
    92, 150.00, 'AVAILABLE', CURRENT_DATE + INTERVAL '75 days',
    'The Rodriguez Family',
    'maria.rodriguez@example.com',
    '+1-555-0789',
    'Traveling with 8-year-old child. Need family-friendly operators. Prefer morning activities (child''s energy levels). Vegetarian meal options required. Prefer beachfront accommodations.'
) ON CONFLICT DO NOTHING;
```

---

## 📋 Step 3: Test the Complete Workflow

### A. Agent Browses Marketplace

1. **Login as Travel Agent** (or create an agent account)
2. Navigate to `/agent/marketplace`
3. **Verify**: You should see 3 available leads
4. **Check**: You can see public info (destination, budget, duration) but NOT customer details

### B. Agent Purchases Lead

1. **Click "Buy Lead"** on one of the leads (dummy button for now)
2. **Verify**: Backend should:
   - Create entry in `lead_purchases` table
   - Update `lead_marketplace.status = 'PURCHASED'`
   - Create entry in `leads` table with full customer details
   - Link via `marketplace_lead_id` and `purchase_id`

3. **Check Database**:
```sql
-- Verify purchase was created
SELECT * FROM lead_purchases ORDER BY created_at DESC LIMIT 1;

-- Verify lead was created in leads table
SELECT * FROM leads WHERE purchased_from_marketplace = TRUE ORDER BY created_at DESC LIMIT 1;

-- Should show customer_name, customer_email, customer_phone now visible
```

### C. Agent Views "My Leads"

1. Navigate to `/agent/leads`
2. **Verify**: Purchased lead appears in the list
3. **Verify**: Full customer details are visible
4. **Verify**: "Create Itinerary" button is visible

### D. Agent Creates Itinerary (If Implemented)

1. **Click "Create Itinerary"** from a lead
2. **Verify**: System extracts destination (e.g., "Bali, Indonesia")
3. **Verify**: System searches and displays packages from all 5 operators matching destination
4. **Verify**: Packages are properly categorized (Activities, Transfers)
5. **Build Itinerary**:
   - Day 1: Add airport transfer (Operator 3) + activity (Operator 1 or 4)
   - Day 2: Add adventure activity (Operator 1) + beach activity (Operator 4)
   - Day 3: Add cultural activity (Operator 2) + transfer (Operator 1 or 3)
   - Day 4: Add departure transfer (Operator 3)
6. **Save Itinerary** (if implementation exists)

### E. Agent Generates PDF (When Implemented)

1. **Click "Generate PDF"**
2. **Verify**: PDF is created with all itinerary details
3. **Verify**: PDF includes customer info, day-by-day breakdown, package details, pricing

---

## 📋 Step 4: Verify Package Search by Destination

Test that packages are searchable by destination:

```sql
-- Search for packages matching "Bali"
SELECT 
    'activity' as package_type,
    title,
    destination_city,
    destination_country,
    base_price,
    operator_id
FROM activity_packages
WHERE (destination_country ILIKE '%Indonesia%' 
   OR destination_city IN ('Bali', 'Ubud', 'Canggu'))
  AND status = 'published'

UNION ALL

SELECT 
    'transfer' as package_type,
    title,
    destination_city,
    destination_country,
    base_price,
    operator_id
FROM transfer_packages
WHERE (destination_country ILIKE '%Indonesia%'
   OR destination_city IN ('Bali', 'Ubud', 'Yogyakarta', 'Lombok'))
  AND status = 'published'
ORDER BY package_type, destination_city;
```

**Expected**: Should show all 12 packages matching Indonesia destinations

---

## 🐛 Troubleshooting

### Issue: Packages Not Visible

**Solution**: Check package status:
```sql
UPDATE activity_packages SET status = 'published' WHERE status = 'draft';
UPDATE transfer_packages SET status = 'published' WHERE status = 'draft';
```

### Issue: Marketplace Leads Not Visible

**Solution**: Check expiration and status:
```sql
-- Update expiration dates if needed
UPDATE lead_marketplace 
SET expires_at = CURRENT_DATE + INTERVAL '60 days'
WHERE status = 'AVAILABLE';

-- Verify they're not expired
SELECT * FROM lead_marketplace 
WHERE status = 'AVAILABLE' AND expires_at > NOW();
```

### Issue: Purchase Not Creating Lead

**Check**: Verify the purchase flow creates entry in `leads` table:
```sql
-- If purchase exists but lead doesn't, you may need to manually create it:
-- (This should be done automatically by backend)
```

---

## ✅ Success Checklist

- [ ] All 5 operators exist in auth.users
- [ ] ~12 packages created (7 activities + 5 transfers)
- [ ] All packages have status = 'published'
- [ ] 3 marketplace leads exist with status = 'AVAILABLE'
- [ ] Customer details exist in marketplace leads (hidden)
- [ ] Agent can browse marketplace and see leads
- [ ] Agent can purchase a lead (dummy button)
- [ ] Lead appears in "My Leads" with full customer details
- [ ] Packages are searchable by destination
- [ ] Ready for itinerary creation workflow

---

## 🚀 What's Next?

Now that your simulation data is set up:

1. **Test Marketplace Flow**: Browse and purchase leads
2. **Test My Leads Page**: View purchased leads with customer details
3. **Build Itinerary Builder**: When ready, implement the itinerary creation UI
4. **Implement Package Search**: Create service to search packages by destination
5. **Build Itinerary Builder UI**: Create day-wise itinerary builder
6. **Implement PDF Generation**: When ready, add PDF export functionality

---

## 📝 Notes

- All packages are linked to the 5 demo operators via email lookup
- All packages use only fields that frontend forms use
- Packages match Indonesia destinations (Bali, Java, Lombok)
- Marketplace leads are designed to match available packages
- Complete 3-4 day itineraries can be built using these packages

**You're now ready to test the complete workflow end-to-end!** 🎉

