# Database Tables Audit Report

## Overview
This document provides a comprehensive audit of all database tables for Activity and Transfer packages, identifying which tables are actively being used and which can potentially be cleaned up.

---

## 📊 ACTIVITY PACKAGE TABLES

### ✅ **CURRENTLY ACTIVE TABLES** (7 tables)

#### **1. Core Activity Tables**
These tables are actively used in the codebase:

| Table Name | Purpose | Status | Used In |
|------------|---------|--------|---------|
| `activity_packages` | Main activity package data | ✅ **ACTIVE** | `activity-packages.ts` |
| `activity_package_images` | Gallery images for activities | ✅ **ACTIVE** | `activity-packages.ts` |
| `activity_package_time_slots` | Available time slots | ✅ **ACTIVE** | `activity-packages.ts` |
| `activity_package_variants` | Package variants/options | ✅ **ACTIVE** | `activity-packages.ts` |
| `activity_package_faqs` | FAQ section | ✅ **ACTIVE** | `activity-packages.ts` |

#### **2. New Pricing Tables** (Recently Added)
| Table Name | Purpose | Status | Used In |
|------------|---------|--------|---------|
| `activity_ticket_only_pricing` | Ticket-only pricing options | ✅ **ACTIVE** | `activity-pricing-options.ts` |
| `activity_ticket_with_transfer_pricing` | Ticket + Transfer pricing | ✅ **ACTIVE** | `activity-pricing-options.ts` |

---

## 🚗 TRANSFER PACKAGE TABLES

### ✅ **CURRENTLY ACTIVE TABLES** (7 tables)

#### **1. Core Transfer Tables**
These tables are actively used in the codebase:

| Table Name | Purpose | Status | Used In |
|------------|---------|--------|---------|
| `transfer_packages` | Main transfer package data | ✅ **ACTIVE** | `transfer-packages.ts` |
| `transfer_package_images` | Gallery images for transfers | ✅ **ACTIVE** | `transfer-packages.ts` |
| `transfer_package_vehicles` | Vehicle configurations | ✅ **ACTIVE** | `transfer-packages.ts` |
| `transfer_package_stops` | Multi-stop route points | ✅ **ACTIVE** | `transfer-packages.ts` |
| `transfer_additional_services` | Add-on services | ✅ **ACTIVE** | `transfer-packages.ts` |
| `transfer_hourly_pricing` | Hourly rental pricing | ✅ **ACTIVE** | `transfer-packages.ts` |
| `transfer_point_to_point_pricing` | Point-to-point pricing | ✅ **ACTIVE** | `transfer-packages.ts` |

### ⚠️ **POTENTIALLY UNUSED TABLES** (4 tables)

These tables were created in the schema but are **NOT actively used** in the codebase:

| Table Name | Purpose | Status | Recommendation |
|------------|---------|--------|----------------|
| `transfer_vehicle_images` | Images for individual vehicles | ⚠️ **UNUSED** | Consider removing |
| `transfer_pricing_rules` | Complex pricing rules | ⚠️ **UNUSED** | Consider removing |
| `transfer_time_slots` | Booking time slots | ⚠️ **UNUSED** | Consider removing |
| `transfer_booking_restrictions` | Date-based restrictions | ⚠️ **UNUSED** | Consider removing |

---

## 🧹 CLEANUP RECOMMENDATIONS

### **High Priority - Safe to Remove**

#### **Transfer Package Tables to Remove:**

1. **`transfer_vehicle_images`**
   - **Why:** Vehicle images are not being managed separately. Main transfer package images are sufficient.
   - **Impact:** None - not used in code
   - **Action:** DROP TABLE

2. **`transfer_pricing_rules`**
   - **Why:** Complex pricing rules (distance-based, time-based) are not implemented in the UI/service layer.
   - **Impact:** None - not used in code
   - **Action:** DROP TABLE

3. **`transfer_time_slots`**
   - **Why:** Time slots are not being used for transfers (different from activity time slots).
   - **Impact:** None - not used in code
   - **Action:** DROP TABLE

4. **`transfer_booking_restrictions`**
   - **Why:** Booking restrictions are not implemented in the current system.
   - **Impact:** None - not used in code
   - **Action:** DROP TABLE

---

## 📋 SUMMARY

### **Activity Packages**
- **Total Tables:** 7
- **Active Tables:** 7
- **Unused Tables:** 0
- **Status:** ✅ Clean - All tables are being used

### **Transfer Packages**
- **Total Tables:** 11
- **Active Tables:** 7
- **Unused Tables:** 4
- **Status:** ⚠️ Needs Cleanup - 4 tables can be removed

### **Overall Database Health**
- **Total Tables:** 18
- **Active Tables:** 14 (77.8%)
- **Unused Tables:** 4 (22.2%)

---

## 🛠️ CLEANUP SCRIPT

Here's a SQL script to remove the unused tables:

```sql
-- ========================================
-- DROP UNUSED TRANSFER TABLES
-- ========================================

-- Drop tables in correct order (child tables first due to foreign key constraints)
DROP TABLE IF EXISTS transfer_pricing_rules CASCADE;
DROP TABLE IF EXISTS transfer_vehicle_images CASCADE;
DROP TABLE IF EXISTS transfer_time_slots CASCADE;
DROP TABLE IF EXISTS transfer_booking_restrictions CASCADE;

-- Verify cleanup
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'transfer_%'
ORDER BY table_name;

-- Expected remaining transfer tables:
-- 1. transfer_additional_services
-- 2. transfer_hourly_pricing
-- 3. transfer_package_images
-- 4. transfer_package_stops
-- 5. transfer_package_vehicles
-- 6. transfer_packages
-- 7. transfer_point_to_point_pricing

SELECT 'Cleanup complete! 4 unused tables removed.' as status;
```

---

## ⚡ NEXT STEPS

1. **Review this report** to ensure the unused tables are indeed not needed
2. **Backup your database** before running cleanup
3. **Run the cleanup script** in Supabase SQL Editor
4. **Update documentation** to reflect the cleaned-up schema
5. **Remove corresponding SQL files** that create these unused tables

---

## 📁 RELATED FILES TO CLEAN UP

After removing the database tables, consider removing or updating these files:

1. **`create-transfer-packages-schema.sql`** - Contains definitions for unused tables
2. Any documentation referencing the removed tables

---

## ✅ VERIFICATION CHECKLIST

After cleanup, verify:

- [ ] All active services still work correctly
- [ ] No broken references in the codebase
- [ ] Database migrations are updated
- [ ] Documentation is up to date
- [ ] Backup is available for rollback if needed

---

**Generated:** ${new Date().toISOString()}
**Status:** Ready for cleanup

