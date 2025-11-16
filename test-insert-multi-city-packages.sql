-- ============================================================================
-- TEST DATA: MULTI-CITY AND MULTI-CITY HOTEL PACKAGES
-- This script inserts test packages for Thailand (Phuket, Krabi, Bangkok)
-- and Indonesia (Bali) to test the Insert Itinerary functionality
-- ============================================================================

-- ============================================================================
-- IMPORTANT INSTRUCTIONS:
-- 1. First, get an operator user ID by running:
--    SELECT id, name, email FROM users WHERE role = 'TOUR_OPERATOR' LIMIT 1;
-- 2. If you don't have a TOUR_OPERATOR user, create one first or the script
--    will fail. The script uses: (SELECT id FROM users WHERE role = 'TOUR_OPERATOR' LIMIT 1)
-- 3. Run this script in your Supabase SQL editor (entire script at once)
-- 4. After running, verify packages with the verification queries at the bottom
-- ============================================================================

-- ============================================================================
-- PACKAGES CREATED:
-- 
-- THAILAND (4 packages):
--   1. Multi-City: "Thailand Paradise" 
--      - Phuket (2N) → Krabi (2N) → Bangkok (3N) = 7 nights
--      - Price: $850 per person
--      - Includes intercity transport
--
--   2. Multi-City: "Thailand Highlights Express"
--      - Phuket (2N) → Bangkok (2N) = 4 nights  
--      - Price: $550 per person
--      - Includes intercity transport
--
--   3. Multi-City Hotel: "Luxury Thailand"
--      - Phuket (3N) → Krabi (2N) → Bangkok (3N) = 8 nights
--      - Price: $1200 per person
--      - 5-star hotels: The Westin Siray Bay, Rayavadee Resort, The Peninsula
--
--   4. Multi-City Hotel: "Thailand Beach & City"
--      - Phuket (3N) → Bangkok (2N) = 5 nights
--      - Price: $650 per person
--      - 3-4 star hotels: Casa Del M Resort, King Park Avenue Hotel
--
-- INDONESIA/BALI (2 packages):
--   5. Multi-City: "Bali Island Paradise"
--      - Ubud (3N) → Seminyak (2N) = 5 nights
--      - Price: $750 per person
--      - Includes intercity transport
--
--   6. Multi-City Hotel: "Bali Luxury Stay"
--      - Ubud (2N) → Seminyak (2N) = 4 nights
--      - Price: $950 per person
--      - 5-star resorts: The Hanging Gardens, The Legian Seminyak
--
-- All packages include:
--   ✓ City data with correct nights
--   ✓ Hotel options (for hotel packages)
--   ✓ Pricing packages with adult/child/infant pricing
--   ✓ Cover images (using Unsplash placeholder URLs)
--   ✓ Published status (ready to show in Insert Itinerary)
-- ============================================================================

-- ============================================================================
-- THAILAND PACKAGES
-- ============================================================================

-- 1. Multi-City Package: Phuket → Krabi → Bangkok (7 Nights)
INSERT INTO multi_city_packages (
  operator_id,
  title,
  short_description,
  full_description,
  destination_region,
  include_intercity_transport,
  pricing_mode,
  per_person_price,
  base_price,
  currency,
  total_nights,
  total_days,
  total_cities,
  status,
  published_at
) VALUES (
  (SELECT id FROM users WHERE role = 'TOUR_OPERATOR' LIMIT 1), -- Replace with actual operator ID
  'Thailand Paradise: Phuket, Krabi & Bangkok Adventure',
  'Experience the best of Thailand with this 7-night multi-city tour covering stunning beaches, limestone cliffs, and vibrant city life.',
  'Discover the beauty of Thailand on this comprehensive 7-night journey. Start in Phuket with its pristine beaches, move to Krabi for breathtaking limestone formations, and end in Bangkok for cultural immersion and shopping.',
  'Thailand',
  true,
  'PER_PERSON',
  850.00,
  850.00,
  'USD',
  7,
  8,
  3,
  'published',
  NOW()
);

-- Cities for Package 1
INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order, highlights, activities_included)
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure' LIMIT 1),
  'Phuket',
  'Thailand',
  2,
  1,
  ARRAY['Patong Beach', 'Big Buddha', 'Phi Phi Islands'],
  ARRAY['Beach activities', 'Island hopping', 'Temple visits']
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure' LIMIT 1),
  'Krabi',
  'Thailand',
  2,
  2,
  ARRAY['Railay Beach', 'Ao Nang', 'Emerald Pool'],
  ARRAY['Rock climbing', 'Kayaking', 'Hot springs']
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure' LIMIT 1),
  'Bangkok',
  'Thailand',
  3,
  3,
  ARRAY['Grand Palace', 'Wat Pho', 'Chatuchak Market'],
  ARRAY['City tours', 'Shopping', 'River cruises'];

-- Image for Package 1
INSERT INTO multi_city_package_images (package_id, file_name, storage_path, public_url, is_cover, display_order)
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure' LIMIT 1),
  'thailand-paradise-cover.jpg',
  'packages/thailand-paradise-cover.jpg',
  'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
  true,
  0;

-- Inclusions for Package 1
INSERT INTO multi_city_package_inclusions (package_id, category, text, display_order)
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure' LIMIT 1),
  'Transport'::inclusion_category,
  'Intercity Transportation',
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure' LIMIT 1),
  'Meals'::inclusion_category,
  'Daily Breakfast',
  2
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure' LIMIT 1),
  'Activities'::inclusion_category,
  'City Tours',
  3
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure' LIMIT 1),
  'Entry Fees'::inclusion_category,
  'Entry Fees to Attractions',
  4;

-- Exclusions for Package 1
INSERT INTO multi_city_package_exclusions (package_id, text, display_order)
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure' LIMIT 1),
  'International Flights',
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure' LIMIT 1),
  'Personal Expenses',
  2
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure' LIMIT 1),
  'Tips and Gratuities',
  3
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure' LIMIT 1),
  'Travel Insurance',
  4;

-- Cancellation tiers for Package 1
INSERT INTO multi_city_package_cancellation_tiers (package_id, days_before, refund_percent)
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure' LIMIT 1),
  30,
  100
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure' LIMIT 1),
  15,
  50
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure' LIMIT 1),
  7,
  25
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure' LIMIT 1),
  0,
  0;

-- Update policies for Package 1
UPDATE multi_city_packages
SET 
  deposit_percent = 30,
  balance_due_days = 7,
  payment_methods = ARRAY['Credit Card', 'Bank Transfer'],
  visa_requirements = 'Visa on arrival available for most nationalities',
  insurance_requirement = 'OPTIONAL',
  health_requirements = 'No special health requirements',
  terms_and_conditions = 'Standard cancellation policy applies. Prices subject to change based on availability.'
WHERE title = 'Thailand Paradise: Phuket, Krabi & Bangkok Adventure';

-- 2. Multi-City Package: Phuket → Bangkok (4 Nights)
INSERT INTO multi_city_packages (
  operator_id,
  title,
  short_description,
  full_description,
  destination_region,
  include_intercity_transport,
  pricing_mode,
  per_person_price,
  base_price,
  currency,
  total_nights,
  total_days,
  total_cities,
  status,
  published_at
) VALUES (
  (SELECT id FROM users WHERE role = 'TOUR_OPERATOR' LIMIT 1),
  'Thailand Highlights: Phuket & Bangkok Express',
  'A perfect 4-night getaway combining beach relaxation in Phuket with cultural exploration in Bangkok.',
  'This express tour takes you from the beautiful beaches of Phuket to the bustling streets of Bangkok. Perfect for travelers with limited time who want to experience both beach and city life.',
  'Thailand',
  true,
  'PER_PERSON',
  550.00,
  550.00,
  'USD',
  4,
  5,
  2,
  'published',
  NOW()
);

-- Cities for Package 2
INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order, highlights, activities_included)
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Highlights: Phuket & Bangkok Express' LIMIT 1),
  'Phuket',
  'Thailand',
  2,
  1,
  ARRAY['Patong Beach', 'Old Town'],
  ARRAY['Beach activities', 'Cultural tours']
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Highlights: Phuket & Bangkok Express' LIMIT 1),
  'Bangkok',
  'Thailand',
  2,
  2,
  ARRAY['Grand Palace', 'Floating Markets'],
  ARRAY['City tours', 'Shopping'];

-- Image for Package 2
INSERT INTO multi_city_package_images (package_id, file_name, storage_path, public_url, is_cover, display_order)
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Highlights: Phuket & Bangkok Express' LIMIT 1),
  'thailand-express-cover.jpg',
  'packages/thailand-express-cover.jpg',
  'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800',
  true,
  0;

-- Inclusions for Package 2
INSERT INTO multi_city_package_inclusions (package_id, category, text, display_order)
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Highlights: Phuket & Bangkok Express' LIMIT 1),
  'Transport'::inclusion_category,
  'Intercity Transportation',
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Highlights: Phuket & Bangkok Express' LIMIT 1),
  'Meals'::inclusion_category,
  'Daily Breakfast',
  2
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Highlights: Phuket & Bangkok Express' LIMIT 1),
  'Activities'::inclusion_category,
  'City Tours',
  3;

-- Exclusions for Package 2
INSERT INTO multi_city_package_exclusions (package_id, text, display_order)
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Highlights: Phuket & Bangkok Express' LIMIT 1),
  'International Flights',
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Highlights: Phuket & Bangkok Express' LIMIT 1),
  'Personal Expenses',
  2
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Highlights: Phuket & Bangkok Express' LIMIT 1),
  'Travel Insurance',
  3;

-- Cancellation tiers for Package 2
INSERT INTO multi_city_package_cancellation_tiers (package_id, days_before, refund_percent)
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Highlights: Phuket & Bangkok Express' LIMIT 1),
  21,
  100
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Highlights: Phuket & Bangkok Express' LIMIT 1),
  14,
  50
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Thailand Highlights: Phuket & Bangkok Express' LIMIT 1),
  0,
  0;

-- Update policies for Package 2
UPDATE multi_city_packages
SET 
  deposit_percent = 25,
  balance_due_days = 7,
  payment_methods = ARRAY['Credit Card', 'Bank Transfer'],
  visa_requirements = 'Visa on arrival available',
  insurance_requirement = 'OPTIONAL',
  terms_and_conditions = 'Standard cancellation policy applies.'
WHERE title = 'Thailand Highlights: Phuket & Bangkok Express';

-- 3. Multi-City Hotel Package: Phuket → Krabi → Bangkok (8 Nights)
-- Note: Adding adult_price and total_nights/total_cities as computed or direct values
-- If these columns don't exist, you may need to add them or update the query
INSERT INTO multi_city_hotel_packages (
  operator_id,
  title,
  short_description,
  destination_region,
  base_price,
  currency,
  status,
  published_at
) VALUES (
  (SELECT id FROM users WHERE role = 'TOUR_OPERATOR' LIMIT 1),
  'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok',
  'Experience Thailand in style with premium 4-5 star hotels across three stunning destinations.',
  'Thailand',
  1200.00,
  'USD',
  'published',
  NOW()
);

-- Add adult_price column if it doesn't exist (for compatibility with query)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'multi_city_hotel_packages' AND column_name = 'adult_price') THEN
    ALTER TABLE multi_city_hotel_packages ADD COLUMN adult_price DECIMAL(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'multi_city_hotel_packages' AND column_name = 'total_nights') THEN
    ALTER TABLE multi_city_hotel_packages ADD COLUMN total_nights INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'multi_city_hotel_packages' AND column_name = 'total_cities') THEN
    ALTER TABLE multi_city_hotel_packages ADD COLUMN total_cities INTEGER DEFAULT 0;
  END IF;
END $$;

-- Update the package with adult_price and calculated totals
UPDATE multi_city_hotel_packages
SET 
  adult_price = 1200.00,
  total_nights = 8,
  total_cities = 3
WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok';

-- Cities for Hotel Package 1
INSERT INTO multi_city_hotel_package_cities (package_id, name, country, nights, display_order)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  'Phuket',
  'Thailand',
  3,
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  'Krabi',
  'Thailand',
  2,
  2
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  'Bangkok',
  'Thailand',
  3,
  3;

-- Hotels for each city
INSERT INTO multi_city_hotel_package_city_hotels (city_id, hotel_name, hotel_type, room_type, display_order)
SELECT 
  (SELECT id FROM multi_city_hotel_package_cities WHERE name = 'Phuket' AND package_id = (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1) LIMIT 1),
  'The Westin Siray Bay Resort & Spa',
  '5 Star',
  'Deluxe Ocean View',
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_package_cities WHERE name = 'Krabi' AND package_id = (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1) LIMIT 1),
  'Rayavadee Resort',
  '5 Star',
  'Pavilion Room',
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_package_cities WHERE name = 'Bangkok' AND package_id = (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1) LIMIT 1),
  'The Peninsula Bangkok',
  '5 Star',
  'Deluxe Room',
  1;

-- Pricing for Hotel Package 1
INSERT INTO multi_city_hotel_pricing_packages (package_id, pricing_type, adult_price, child_price, child_min_age, child_max_age, infant_price, infant_max_age)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  'STANDARD',
  1200.00,
  600.00,
  3,
  12,
  0.00,
  2;

-- Create images table for hotel packages if it doesn't exist
CREATE TABLE IF NOT EXISTS multi_city_hotel_package_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES multi_city_hotel_packages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  is_cover BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Image for Hotel Package 1
INSERT INTO multi_city_hotel_package_images (package_id, file_name, storage_path, public_url, is_cover, display_order)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  'luxury-thailand-hotels-cover.jpg',
  'packages/luxury-thailand-hotels-cover.jpg',
  'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=800',
  true,
  0;

-- Inclusions for Hotel Package 1
INSERT INTO multi_city_hotel_package_inclusions (package_id, category, description, display_order)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  'Transport',
  'Airport Transfers',
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  'Meals',
  'Daily Breakfast',
  2
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  'Activities',
  'City Tours',
  3
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  'Transport',
  'Intercity Transportation',
  4;

-- Exclusions for Hotel Package 1
INSERT INTO multi_city_hotel_package_exclusions (package_id, description, display_order)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  'International Flights',
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  'Personal Expenses',
  2
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  'Tips and Gratuities',
  3
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  'Travel Insurance',
  4;

-- Cancellation tiers for Hotel Package 1
INSERT INTO multi_city_hotel_package_cancellation_tiers (package_id, days_before, refund_percent)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  30,
  100
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  15,
  50
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  7,
  25
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok' LIMIT 1),
  0,
  0;

-- Update policies for Hotel Package 1
UPDATE multi_city_hotel_packages
SET 
  deposit_percent = 30,
  balance_due_days = 7,
  payment_methods = ARRAY['Credit Card', 'Bank Transfer'],
  visa_requirements = 'Visa on arrival available for most nationalities',
  insurance_requirement = 'OPTIONAL',
  health_requirements = 'No special health requirements',
  terms_and_conditions = 'Standard cancellation policy applies. Prices subject to change based on availability.'
WHERE title = 'Luxury Thailand: Premium Hotels in Phuket, Krabi & Bangkok';

-- 4. Multi-City Hotel Package: Phuket → Bangkok (5 Nights)
INSERT INTO multi_city_hotel_packages (
  operator_id,
  title,
  short_description,
  destination_region,
  base_price,
  currency,
  status,
  published_at
) VALUES (
  (SELECT id FROM users WHERE role = 'TOUR_OPERATOR' LIMIT 1),
  'Thailand Beach & City: Phuket & Bangkok with Hotels',
  'Comfortable 3-4 star hotels in Phuket and Bangkok for a perfect beach and city combination.',
  'Thailand',
  650.00,
  'USD',
  'published',
  NOW()
);

-- Update with adult_price and calculated totals
UPDATE multi_city_hotel_packages
SET 
  adult_price = 650.00,
  total_nights = 5,
  total_cities = 2
WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels';

-- Cities for Hotel Package 2
INSERT INTO multi_city_hotel_package_cities (package_id, name, country, nights, display_order)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels' LIMIT 1),
  'Phuket',
  'Thailand',
  3,
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels' LIMIT 1),
  'Bangkok',
  'Thailand',
  2,
  2;

-- Hotels for Package 2
INSERT INTO multi_city_hotel_package_city_hotels (city_id, hotel_name, hotel_type, room_type, display_order)
SELECT 
  (SELECT id FROM multi_city_hotel_package_cities WHERE name = 'Phuket' AND package_id = (SELECT id FROM multi_city_hotel_packages WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels' LIMIT 1) LIMIT 1),
  'Casa Del M Resort',
  '3 Star',
  'Deluxe Double or Twin',
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_package_cities WHERE name = 'Bangkok' AND package_id = (SELECT id FROM multi_city_hotel_packages WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels' LIMIT 1) LIMIT 1),
  'King Park Avenue Hotel',
  '4 Star',
  'Superior Room',
  1;

-- Pricing for Hotel Package 2
INSERT INTO multi_city_hotel_pricing_packages (package_id, pricing_type, adult_price, child_price, child_min_age, child_max_age, infant_price, infant_max_age)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels' LIMIT 1),
  'STANDARD',
  650.00,
  325.00,
  3,
  12,
  0.00,
  2;

-- Image for Hotel Package 2
INSERT INTO multi_city_hotel_package_images (package_id, file_name, storage_path, public_url, is_cover, display_order)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels' LIMIT 1),
  'thailand-beach-city-hotels-cover.jpg',
  'packages/thailand-beach-city-hotels-cover.jpg',
  'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
  true,
  0;

-- Inclusions for Hotel Package 2
INSERT INTO multi_city_hotel_package_inclusions (package_id, category, description, display_order)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels' LIMIT 1),
  'Transport',
  'Airport Transfers',
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels' LIMIT 1),
  'Meals',
  'Daily Breakfast',
  2
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels' LIMIT 1),
  'Activities',
  'City Tours',
  3;

-- Exclusions for Hotel Package 2
INSERT INTO multi_city_hotel_package_exclusions (package_id, description, display_order)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels' LIMIT 1),
  'International Flights',
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels' LIMIT 1),
  'Personal Expenses',
  2
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels' LIMIT 1),
  'Travel Insurance',
  3;

-- Cancellation tiers for Hotel Package 2
INSERT INTO multi_city_hotel_package_cancellation_tiers (package_id, days_before, refund_percent)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels' LIMIT 1),
  21,
  100
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels' LIMIT 1),
  14,
  50
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels' LIMIT 1),
  0,
  0;

-- Update policies for Hotel Package 2
UPDATE multi_city_hotel_packages
SET 
  deposit_percent = 25,
  balance_due_days = 7,
  payment_methods = ARRAY['Credit Card', 'Bank Transfer'],
  visa_requirements = 'Visa on arrival available',
  insurance_requirement = 'OPTIONAL',
  terms_and_conditions = 'Standard cancellation policy applies.'
WHERE title = 'Thailand Beach & City: Phuket & Bangkok with Hotels';

-- ============================================================================
-- INDONESIA (BALI) PACKAGES
-- ============================================================================

-- 5. Multi-City Package: Bali (5 Nights)
INSERT INTO multi_city_packages (
  operator_id,
  title,
  short_description,
  full_description,
  destination_region,
  include_intercity_transport,
  pricing_mode,
  per_person_price,
  base_price,
  currency,
  total_nights,
  total_days,
  total_cities,
  status,
  published_at
) VALUES (
  (SELECT id FROM users WHERE role = 'TOUR_OPERATOR' LIMIT 1),
  'Bali Island Paradise: Ubud & Seminyak Experience',
  'Discover the cultural heart and beach paradise of Bali in this 5-night multi-location tour.',
  'Experience the best of both worlds in Bali - the cultural richness of Ubud with its rice terraces and temples, combined with the beach vibes of Seminyak. Perfect for those who want culture and relaxation.',
  'Indonesia',
  true,
  'PER_PERSON',
  750.00,
  750.00,
  'USD',
  5,
  6,
  2,
  'published',
  NOW()
);

-- Cities for Bali Package
INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order, highlights, activities_included)
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Bali Island Paradise: Ubud & Seminyak Experience' LIMIT 1),
  'Ubud',
  'Indonesia',
  3,
  1,
  ARRAY['Tegalalang Rice Terraces', 'Ubud Monkey Forest', 'Tegenungan Waterfall'],
  ARRAY['Temple visits', 'Rice terrace tours', 'Cooking classes']
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Bali Island Paradise: Ubud & Seminyak Experience' LIMIT 1),
  'Seminyak',
  'Indonesia',
  2,
  2,
  ARRAY['Seminyak Beach', 'Potato Head Beach Club', 'Sunset views'],
  ARRAY['Beach activities', 'Spa treatments', 'Beach clubs'];

-- Image for Bali Package
INSERT INTO multi_city_package_images (package_id, file_name, storage_path, public_url, is_cover, display_order)
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Bali Island Paradise: Ubud & Seminyak Experience' LIMIT 1),
  'bali-paradise-cover.jpg',
  'packages/bali-paradise-cover.jpg',
  'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800',
  true,
  0;

-- Inclusions for Bali Package
INSERT INTO multi_city_package_inclusions (package_id, category, text, display_order)
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Bali Island Paradise: Ubud & Seminyak Experience' LIMIT 1),
  'Transport'::inclusion_category,
  'Intercity Transportation',
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Bali Island Paradise: Ubud & Seminyak Experience' LIMIT 1),
  'Meals'::inclusion_category,
  'Daily Breakfast',
  2
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Bali Island Paradise: Ubud & Seminyak Experience' LIMIT 1),
  'Activities'::inclusion_category,
  'Temple Visits',
  3
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Bali Island Paradise: Ubud & Seminyak Experience' LIMIT 1),
  'Activities'::inclusion_category,
  'Rice Terrace Tours',
  4;

-- Exclusions for Bali Package
INSERT INTO multi_city_package_exclusions (package_id, text, display_order)
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Bali Island Paradise: Ubud & Seminyak Experience' LIMIT 1),
  'International Flights',
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Bali Island Paradise: Ubud & Seminyak Experience' LIMIT 1),
  'Personal Expenses',
  2
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Bali Island Paradise: Ubud & Seminyak Experience' LIMIT 1),
  'Tips and Gratuities',
  3
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Bali Island Paradise: Ubud & Seminyak Experience' LIMIT 1),
  'Travel Insurance',
  4;

-- Cancellation tiers for Bali Package
INSERT INTO multi_city_package_cancellation_tiers (package_id, days_before, refund_percent)
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Bali Island Paradise: Ubud & Seminyak Experience' LIMIT 1),
  30,
  100
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Bali Island Paradise: Ubud & Seminyak Experience' LIMIT 1),
  15,
  50
UNION ALL
SELECT 
  (SELECT id FROM multi_city_packages WHERE title = 'Bali Island Paradise: Ubud & Seminyak Experience' LIMIT 1),
  0,
  0;

-- Update policies for Bali Package
UPDATE multi_city_packages
SET 
  deposit_percent = 30,
  balance_due_days = 7,
  payment_methods = ARRAY['Credit Card', 'Bank Transfer'],
  visa_requirements = 'Visa on arrival available for most nationalities',
  insurance_requirement = 'OPTIONAL',
  terms_and_conditions = 'Standard cancellation policy applies.'
WHERE title = 'Bali Island Paradise: Ubud & Seminyak Experience';

-- 6. Multi-City Hotel Package: Bali (4 Nights)
INSERT INTO multi_city_hotel_packages (
  operator_id,
  title,
  short_description,
  destination_region,
  base_price,
  currency,
  status,
  published_at
) VALUES (
  (SELECT id FROM users WHERE role = 'TOUR_OPERATOR' LIMIT 1),
  'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak',
  'Luxury 5-star resort experience in Bali with stays in Ubud and Seminyak.',
  'Indonesia',
  950.00,
  'USD',
  'published',
  NOW()
);

-- Update with adult_price and calculated totals
UPDATE multi_city_hotel_packages
SET 
  adult_price = 950.00,
  total_nights = 4,
  total_cities = 2
WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak';

-- Cities for Bali Hotel Package
INSERT INTO multi_city_hotel_package_cities (package_id, name, country, nights, display_order)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1),
  'Ubud',
  'Indonesia',
  2,
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1),
  'Seminyak',
  'Indonesia',
  2,
  2;

-- Hotels for Bali Hotel Package
INSERT INTO multi_city_hotel_package_city_hotels (city_id, hotel_name, hotel_type, room_type, display_order)
SELECT 
  (SELECT id FROM multi_city_hotel_package_cities WHERE name = 'Ubud' AND package_id = (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1) LIMIT 1),
  'The Hanging Gardens of Bali',
  '5 Star',
  'Villa with Private Pool',
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_package_cities WHERE name = 'Seminyak' AND package_id = (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1) LIMIT 1),
  'The Legian Seminyak',
  '5 Star',
  'Ocean View Suite',
  1;

-- Pricing for Bali Hotel Package
INSERT INTO multi_city_hotel_pricing_packages (package_id, pricing_type, adult_price, child_price, child_min_age, child_max_age, infant_price, infant_max_age)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1),
  'STANDARD',
  950.00,
  475.00,
  3,
  12,
  0.00,
  2;

-- Image for Bali Hotel Package
INSERT INTO multi_city_hotel_package_images (package_id, file_name, storage_path, public_url, is_cover, display_order)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1),
  'bali-luxury-hotels-cover.jpg',
  'packages/bali-luxury-hotels-cover.jpg',
  'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800',
  true,
  0;

-- Inclusions for Bali Hotel Package
INSERT INTO multi_city_hotel_package_inclusions (package_id, category, description, display_order)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1),
  'Transport',
  'Airport Transfers',
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1),
  'Meals',
  'Daily Breakfast',
  2
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1),
  'Activities',
  'Temple Visits',
  3
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1),
  'Transport',
  'Intercity Transportation',
  4;

-- Exclusions for Bali Hotel Package
INSERT INTO multi_city_hotel_package_exclusions (package_id, description, display_order)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1),
  'International Flights',
  1
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1),
  'Personal Expenses',
  2
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1),
  'Tips and Gratuities',
  3
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1),
  'Travel Insurance',
  4;

-- Cancellation tiers for Bali Hotel Package
INSERT INTO multi_city_hotel_package_cancellation_tiers (package_id, days_before, refund_percent)
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1),
  30,
  100
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1),
  15,
  50
UNION ALL
SELECT 
  (SELECT id FROM multi_city_hotel_packages WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak' LIMIT 1),
  0,
  0;

-- Update policies for Bali Hotel Package
UPDATE multi_city_hotel_packages
SET 
  deposit_percent = 30,
  balance_due_days = 7,
  payment_methods = ARRAY['Credit Card', 'Bank Transfer'],
  visa_requirements = 'Visa on arrival available for most nationalities',
  insurance_requirement = 'OPTIONAL',
  terms_and_conditions = 'Standard cancellation policy applies.'
WHERE title = 'Bali Luxury Stay: Premium Resorts in Ubud & Seminyak';

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This script creates:
-- 
-- THAILAND PACKAGES:
-- 1. Multi-City: "Thailand Paradise" - Phuket (2N) → Krabi (2N) → Bangkok (3N) - $850
-- 2. Multi-City: "Thailand Highlights" - Phuket (2N) → Bangkok (2N) - $550
-- 3. Multi-City Hotel: "Luxury Thailand" - Phuket (3N) → Krabi (2N) → Bangkok (3N) - $1200
-- 4. Multi-City Hotel: "Thailand Beach & City" - Phuket (3N) → Bangkok (2N) - $650
--
-- INDONESIA (BALI) PACKAGES:
-- 5. Multi-City: "Bali Island Paradise" - Ubud (3N) → Seminyak (2N) - $750
-- 6. Multi-City Hotel: "Bali Luxury Stay" - Ubud (2N) → Seminyak (2N) - $950
--
-- All packages are set to 'published' status and include:
-- - City data with nights
-- - Hotel options (for hotel packages)
-- - Pricing information
-- - Cover images
--
-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check inserted packages
SELECT 
  'Multi-City Packages' as package_type,
  COUNT(*) as count
FROM multi_city_packages
WHERE status = 'published'
UNION ALL
SELECT 
  'Multi-City Hotel Packages' as package_type,
  COUNT(*) as count
FROM multi_city_hotel_packages
WHERE status = 'published';

-- List all packages with cities
SELECT 
  p.title,
  p.destination_region,
  p.total_nights,
  p.total_cities,
  p.base_price,
  p.currency,
  STRING_AGG(c.name || ' (' || c.nights || 'N)', ' → ') as cities
FROM multi_city_packages p
LEFT JOIN multi_city_package_cities c ON p.id = c.package_id
WHERE p.status = 'published'
GROUP BY p.id, p.title, p.destination_region, p.total_nights, p.total_cities, p.base_price, p.currency
ORDER BY p.destination_region, p.title;

-- List hotel packages with cities
SELECT 
  p.title,
  p.destination_region,
  p.base_price,
  p.currency,
  STRING_AGG(c.name || ' (' || c.nights || 'N)', ' → ') as cities,
  SUM(c.nights) as total_nights
FROM multi_city_hotel_packages p
LEFT JOIN multi_city_hotel_package_cities c ON p.id = c.package_id
WHERE p.status = 'published'
GROUP BY p.id, p.title, p.destination_region, p.base_price, p.currency
ORDER BY p.destination_region, p.title;

