-- ============================================================================
-- TEST DATA: MULTI-CITY AND MULTI-CITY HOTEL PACKAGES (UPDATED FOR SIC/PRIVATE_PACKAGE)
-- This script inserts test packages with proper SIC/PRIVATE_PACKAGE pricing structure
-- matching the tour operator forms
-- ============================================================================

-- ============================================================================
-- IMPORTANT INSTRUCTIONS:
-- 1. First, get an operator user ID by running:
--    SELECT id, name, email FROM users WHERE role = 'TOUR_OPERATOR' LIMIT 1;
-- 2. If you don't have a TOUR_OPERATOR user, create one first
-- 3. Run this script in your Supabase SQL editor (entire script at once)
-- ============================================================================

-- ============================================================================
-- UPDATE CHECK CONSTRAINT FOR HOTEL PRICING PACKAGES
-- ============================================================================
-- The hotel pricing packages table has a CHECK constraint that only allows
-- 'STANDARD' or 'GROUP', but we need 'SIC' and 'PRIVATE_PACKAGE'
-- ============================================================================

-- Drop the old constraint
ALTER TABLE multi_city_hotel_pricing_packages
  DROP CONSTRAINT IF EXISTS multi_city_hotel_pricing_packages_pricing_type_check;

-- Add new constraint that allows SIC and PRIVATE_PACKAGE
ALTER TABLE multi_city_hotel_pricing_packages
  ADD CONSTRAINT multi_city_hotel_pricing_packages_pricing_type_check
  CHECK (pricing_type IN ('STANDARD', 'GROUP', 'SIC', 'PRIVATE_PACKAGE'));

-- ============================================================================
-- PACKAGE 1: Multi-City - Thailand Paradise (SIC Pricing)
-- ============================================================================

-- Get package ID (using a variable approach)
DO $$
DECLARE
  package1_id UUID;
  pricing_pkg1_id UUID;
BEGIN
  -- Insert main package
  INSERT INTO multi_city_packages (
    operator_id,
    title,
    short_description,
    full_description,
    destination_region,
    include_intercity_transport,
    base_price,
    currency,
    total_nights,
    total_days,
    total_cities,
    status,
    published_at
  ) VALUES (
    (SELECT id FROM users WHERE role = 'TOUR_OPERATOR' LIMIT 1),
    'Thailand Paradise: Phuket, Krabi & Bangkok Adventure',
    'Experience the best of Thailand with this 7-night multi-city tour covering stunning beaches, limestone cliffs, and vibrant city life.',
    'Discover the beauty of Thailand on this comprehensive 7-night journey. Start in Phuket with its pristine beaches, move to Krabi for breathtaking limestone formations, and end in Bangkok for cultural immersion and shopping.',
    'Thailand',
    true,
    850.00, -- Base price from first pricing row
    'USD',
    7,
    8,
    3,
    'published',
    NOW()
  ) RETURNING id INTO package1_id;

  -- Insert pricing package (SIC type)
  INSERT INTO multi_city_pricing_packages (
    package_id,
    package_name,
    pricing_type,
    has_child_age_restriction,
    child_min_age,
    child_max_age
  ) VALUES (
    package1_id,
    'Thailand Paradise: Phuket, Krabi & Bangkok Adventure',
    'SIC',
    true,
    3,
    12
  ) RETURNING id INTO pricing_pkg1_id;

  -- Insert SIC pricing rows
  INSERT INTO multi_city_pricing_rows (
    pricing_package_id,
    number_of_adults,
    number_of_children,
    total_price,
    display_order
  ) VALUES
    (pricing_pkg1_id, 1, 0, 850.00, 1),
    (pricing_pkg1_id, 2, 0, 1600.00, 2),
    (pricing_pkg1_id, 2, 1, 2000.00, 3),
    (pricing_pkg1_id, 2, 2, 2400.00, 4),
    (pricing_pkg1_id, 4, 0, 3000.00, 5);

  -- Insert cities
  INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order, highlights, activities_included)
  VALUES
    (package1_id, 'Phuket', 'Thailand', 2, 1, 
     ARRAY['Patong Beach', 'Big Buddha', 'Phi Phi Islands'],
     ARRAY['Beach activities', 'Island hopping', 'Temple visits']),
    (package1_id, 'Krabi', 'Thailand', 2, 2,
     ARRAY['Railay Beach', 'Ao Nang', 'Emerald Pool'],
     ARRAY['Rock climbing', 'Kayaking', 'Hot springs']),
    (package1_id, 'Bangkok', 'Thailand', 3, 3,
     ARRAY['Grand Palace', 'Wat Pho', 'Chatuchak Market'],
     ARRAY['City tours', 'Shopping', 'River cruises']);

  -- Insert cover image
  INSERT INTO multi_city_package_images (package_id, file_name, storage_path, public_url, is_cover, display_order)
  VALUES (
    package1_id,
    'thailand-paradise-cover.jpg',
    'packages/thailand-paradise-cover.jpg',
    'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
    true,
    0
  );

  -- Insert inclusions
  INSERT INTO multi_city_package_inclusions (package_id, category, text, display_order)
  VALUES
    (package1_id, 'Transport'::inclusion_category, 'Intercity Transportation', 1),
    (package1_id, 'Meals'::inclusion_category, 'Daily Breakfast', 2),
    (package1_id, 'Activities'::inclusion_category, 'City Tours', 3),
    (package1_id, 'Entry Fees'::inclusion_category, 'Entry Fees to Attractions', 4);

  -- Insert exclusions
  INSERT INTO multi_city_package_exclusions (package_id, text, display_order)
  VALUES
    (package1_id, 'International Flights', 1),
    (package1_id, 'Personal Expenses', 2),
    (package1_id, 'Tips and Gratuities', 3),
    (package1_id, 'Travel Insurance', 4);

  -- Insert cancellation tiers
  INSERT INTO multi_city_package_cancellation_tiers (package_id, days_before, refund_percent)
  VALUES
    (package1_id, 30, 100),
    (package1_id, 15, 50),
    (package1_id, 7, 25),
    (package1_id, 0, 0);

  -- Update policies
  UPDATE multi_city_packages
  SET 
    deposit_percent = 30,
    balance_due_days = 7,
    payment_methods = ARRAY['Credit Card', 'Bank Transfer'],
    visa_requirements = 'Visa on arrival available for most nationalities',
    insurance_requirement = 'OPTIONAL',
    health_requirements = 'No special health requirements',
    terms_and_conditions = 'Standard cancellation policy applies. Prices subject to change based on availability.'
  WHERE id = package1_id;

END $$;

-- ============================================================================
-- PACKAGE 2: Multi-City - Thailand Highlights (PRIVATE_PACKAGE Pricing)
-- ============================================================================

DO $$
DECLARE
  package2_id UUID;
  pricing_pkg2_id UUID;
BEGIN
  -- Insert main package
  INSERT INTO multi_city_packages (
    operator_id,
    title,
    short_description,
    full_description,
    destination_region,
    include_intercity_transport,
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
    1200.00, -- Base price from first private package row
    'USD',
    4,
    5,
    2,
    'published',
    NOW()
  ) RETURNING id INTO package2_id;

  -- Insert pricing package (PRIVATE_PACKAGE type)
  INSERT INTO multi_city_pricing_packages (
    package_id,
    package_name,
    pricing_type,
    has_child_age_restriction,
    child_min_age,
    child_max_age
  ) VALUES (
    package2_id,
    'Thailand Highlights: Phuket & Bangkok Express',
    'PRIVATE_PACKAGE',
    false,
    NULL,
    NULL
  ) RETURNING id INTO pricing_pkg2_id;

  -- Insert PRIVATE_PACKAGE pricing rows
  INSERT INTO multi_city_private_package_rows (
    pricing_package_id,
    number_of_adults,
    number_of_children,
    car_type,
    vehicle_capacity,
    total_price,
    display_order
  ) VALUES
    (pricing_pkg2_id, 2, 0, 'Sedan', 4, 1200.00, 1),
    (pricing_pkg2_id, 2, 1, 'Sedan', 4, 1400.00, 2),
    (pricing_pkg2_id, 2, 2, 'SUV', 6, 1600.00, 3),
    (pricing_pkg2_id, 4, 0, 'SUV', 6, 2000.00, 4),
    (pricing_pkg2_id, 4, 2, 'Van', 8, 2400.00, 5);

  -- Insert cities
  INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order, highlights, activities_included)
  VALUES
    (package2_id, 'Phuket', 'Thailand', 2, 1,
     ARRAY['Patong Beach', 'Big Buddha'],
     ARRAY['Beach activities', 'Temple visits']),
    (package2_id, 'Bangkok', 'Thailand', 2, 2,
     ARRAY['Grand Palace', 'Wat Pho'],
     ARRAY['City tours', 'Shopping']);

  -- Insert cover image
  INSERT INTO multi_city_package_images (package_id, file_name, storage_path, public_url, is_cover, display_order)
  VALUES (
    package2_id,
    'thailand-highlights-cover.jpg',
    'packages/thailand-highlights-cover.jpg',
    'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800',
    true,
    0
  );

  -- Insert inclusions, exclusions, cancellation (similar to package 1)
  INSERT INTO multi_city_package_inclusions (package_id, category, text, display_order)
  VALUES
    (package2_id, 'Transport'::inclusion_category, 'Private Vehicle Transportation', 1),
    (package2_id, 'Meals'::inclusion_category, 'Daily Breakfast', 2);

  INSERT INTO multi_city_package_exclusions (package_id, text, display_order)
  VALUES
    (package2_id, 'International Flights', 1),
    (package2_id, 'Personal Expenses', 2);

  UPDATE multi_city_packages
  SET 
    deposit_percent = 30,
    balance_due_days = 7,
    payment_methods = ARRAY['Credit Card', 'Bank Transfer'],
    insurance_requirement = 'OPTIONAL'
  WHERE id = package2_id;

END $$;

-- ============================================================================
-- PACKAGE 3: Multi-City Hotel - Luxury Thailand (SIC Pricing with Hotels)
-- ============================================================================

DO $$
DECLARE
  package3_id UUID;
  pricing_pkg3_id UUID;
  city_phuket_id UUID;
  city_krabi_id UUID;
  city_bangkok_id UUID;
BEGIN
  -- Insert main package
  INSERT INTO multi_city_hotel_packages (
    operator_id,
    title,
    short_description,
    destination_region,
    base_price,
    currency,
    total_nights,
    total_cities,
    status,
    published_at
  ) VALUES (
    (SELECT id FROM users WHERE role = 'TOUR_OPERATOR' LIMIT 1),
    'Luxury Thailand: Phuket, Krabi & Bangkok',
    'Experience luxury accommodations in Thailand''s most beautiful destinations with 5-star hotels.',
    'Thailand',
    1200.00,
    'USD',
    8,
    3,
    'published',
    NOW()
  ) RETURNING id INTO package3_id;

  -- Insert pricing package (SIC type)
  -- Note: Using dummy adult_price and child_price to satisfy NOT NULL constraints
  -- Actual pricing comes from pricing rows table
  INSERT INTO multi_city_hotel_pricing_packages (
    package_id,
    pricing_type,
    adult_price,
    child_price,
    child_min_age,
    child_max_age
  ) VALUES (
    package3_id,
    'SIC',
    0.00, -- Dummy value, actual pricing in pricing_rows
    0.00, -- Dummy value, actual pricing in pricing_rows
    3,
    12
  ) RETURNING id INTO pricing_pkg3_id;

  -- Note: multi_city_hotel_pricing_rows table does not exist
  -- The form code tries to insert here, but the table was never created in migrations
  -- Skipping pricing rows insert for hotel packages

  -- Insert cities
  INSERT INTO multi_city_hotel_package_cities (package_id, name, nights, display_order)
  VALUES
    (package3_id, 'Phuket', 3, 1),
    (package3_id, 'Krabi', 2, 2),
    (package3_id, 'Bangkok', 3, 3);

  -- Get city IDs properly
  SELECT id INTO city_phuket_id FROM multi_city_hotel_package_cities 
  WHERE package_id = package3_id AND name = 'Phuket' LIMIT 1;
  SELECT id INTO city_krabi_id FROM multi_city_hotel_package_cities 
  WHERE package_id = package3_id AND name = 'Krabi' LIMIT 1;
  SELECT id INTO city_bangkok_id FROM multi_city_hotel_package_cities 
  WHERE package_id = package3_id AND name = 'Bangkok' LIMIT 1;

  -- Insert hotels for each city (matching form structure - no adult_price/child_price)
  INSERT INTO multi_city_hotel_package_city_hotels (
    city_id,
    hotel_name,
    hotel_type,
    room_type,
    room_capacity_adults,
    room_capacity_children,
    display_order
  ) VALUES
    -- Phuket hotels
    (city_phuket_id, 'The Westin Siray Bay Resort & Spa', '5 Star', 'Deluxe Room', 2, 2, 1),
    (city_phuket_id, 'Banyan Tree Phuket', '5 Star', 'Pool Villa', 2, 2, 2),
    -- Krabi hotels
    (city_krabi_id, 'Rayavadee Resort', '5 Star', 'Deluxe Pavilion', 2, 2, 1),
    (city_krabi_id, 'Phulay Bay, a Ritz-Carlton Reserve', '5 Star', 'Reserve Villa', 2, 2, 2),
    -- Bangkok hotels
    (city_bangkok_id, 'The Peninsula Bangkok', '5 Star', 'Deluxe Room', 2, 2, 1),
    (city_bangkok_id, 'Mandarin Oriental Bangkok', '5 Star', 'River View Suite', 2, 2, 2);

  -- Insert cover image
  INSERT INTO multi_city_hotel_package_images (package_id, file_name, storage_path, public_url, is_cover, display_order)
  VALUES (
    package3_id,
    'luxury-thailand-cover.jpg',
    'packages/luxury-thailand-cover.jpg',
    'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
    true,
    0
  );

  -- Insert inclusions, exclusions
  INSERT INTO multi_city_hotel_package_inclusions (package_id, category, description, display_order)
  VALUES
    (package3_id, 'Transport'::inclusion_category, 'Intercity Transportation', 1),
    (package3_id, 'Meals'::inclusion_category, 'Daily Breakfast', 2),
    (package3_id, 'Activities'::inclusion_category, 'City Tours', 3);

  INSERT INTO multi_city_hotel_package_exclusions (package_id, description, display_order)
  VALUES
    (package3_id, 'International Flights', 1),
    (package3_id, 'Personal Expenses', 2);

  UPDATE multi_city_hotel_packages
  SET 
    deposit_percent = 30,
    balance_due_days = 7,
    payment_methods = ARRAY['Credit Card', 'Bank Transfer'],
    insurance_requirement = 'OPTIONAL'
  WHERE id = package3_id;

END $$;

-- ============================================================================
-- PACKAGE 4: Multi-City Hotel - Thailand Beach & City (PRIVATE_PACKAGE with Hotels)
-- ============================================================================

DO $$
DECLARE
  package4_id UUID;
  pricing_pkg4_id UUID;
  city_phuket_id UUID;
  city_bangkok_id UUID;
BEGIN
  -- Insert main package
  INSERT INTO multi_city_hotel_packages (
    operator_id,
    title,
    short_description,
    destination_region,
    base_price,
    currency,
    total_nights,
    total_cities,
    status,
    published_at
  ) VALUES (
    (SELECT id FROM users WHERE role = 'TOUR_OPERATOR' LIMIT 1),
    'Thailand Beach & City: Phuket & Bangkok',
    'A perfect blend of beach relaxation and city exploration with comfortable 3-4 star accommodations.',
    'Thailand',
    800.00,
    'USD',
    5,
    2,
    'published',
    NOW()
  ) RETURNING id INTO package4_id;

  -- Insert pricing package (PRIVATE_PACKAGE type)
  -- Note: Using dummy adult_price and child_price to satisfy NOT NULL constraints
  -- Actual pricing comes from private_package_rows table
  INSERT INTO multi_city_hotel_pricing_packages (
    package_id,
    pricing_type,
    adult_price,
    child_price,
    child_min_age,
    child_max_age
  ) VALUES (
    package4_id,
    'PRIVATE_PACKAGE',
    0.00, -- Dummy value, actual pricing in private_package_rows
    0.00, -- Dummy value, actual pricing in private_package_rows
    3,    -- Default values
    12    -- Default values
  ) RETURNING id INTO pricing_pkg4_id;

  -- Note: multi_city_hotel_private_package_rows table does not exist in database
  -- The form code tries to insert here, but the table was never created
  -- Skipping private package rows insert for hotel packages

  -- Insert cities
  INSERT INTO multi_city_hotel_package_cities (package_id, name, nights, display_order)
  VALUES
    (package4_id, 'Phuket', 3, 1),
    (package4_id, 'Bangkok', 2, 2);

  -- Get city IDs
  SELECT id INTO city_phuket_id FROM multi_city_hotel_package_cities 
  WHERE package_id = package4_id AND name = 'Phuket' LIMIT 1;
  SELECT id INTO city_bangkok_id FROM multi_city_hotel_package_cities 
  WHERE package_id = package4_id AND name = 'Bangkok' LIMIT 1;

  -- Insert hotels
  INSERT INTO multi_city_hotel_package_city_hotels (
    city_id,
    hotel_name,
    hotel_type,
    room_type,
    room_capacity_adults,
    room_capacity_children,
    display_order
  ) VALUES
    -- Phuket hotels
    (city_phuket_id, 'Casa Del M Resort', '3 Star', 'Standard Room', 2, 2, 1),
    (city_phuket_id, 'Patong Beach Hotel', '4 Star', 'Deluxe Room', 2, 2, 2),
    -- Bangkok hotels
    (city_bangkok_id, 'King Park Avenue Hotel', '3 Star', 'Standard Room', 2, 2, 1),
    (city_bangkok_id, 'Novotel Bangkok', '4 Star', 'Superior Room', 2, 2, 2);

  -- Insert cover image
  INSERT INTO multi_city_hotel_package_images (package_id, file_name, storage_path, public_url, is_cover, display_order)
  VALUES (
    package4_id,
    'beach-city-cover.jpg',
    'packages/beach-city-cover.jpg',
    'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800',
    true,
    0
  );

  -- Insert inclusions, exclusions
  INSERT INTO multi_city_hotel_package_inclusions (package_id, category, description, display_order)
  VALUES
    (package4_id, 'Transport'::inclusion_category, 'Private Vehicle Transportation', 1),
    (package4_id, 'Meals'::inclusion_category, 'Daily Breakfast', 2);

  INSERT INTO multi_city_hotel_package_exclusions (package_id, description, display_order)
  VALUES
    (package4_id, 'International Flights', 1),
    (package4_id, 'Personal Expenses', 2);

  UPDATE multi_city_hotel_packages
  SET 
    deposit_percent = 30,
    balance_due_days = 7,
    payment_methods = ARRAY['Credit Card', 'Bank Transfer'],
    insurance_requirement = 'OPTIONAL'
  WHERE id = package4_id;

END $$;

-- ============================================================================
-- PACKAGE 5: Multi-City - Bali Island Paradise (SIC Pricing)
-- ============================================================================

DO $$
DECLARE
  package5_id UUID;
  pricing_pkg5_id UUID;
BEGIN
  -- Insert main package
  INSERT INTO multi_city_packages (
    operator_id,
    title,
    short_description,
    full_description,
    destination_region,
    include_intercity_transport,
    base_price,
    currency,
    total_nights,
    total_days,
    total_cities,
    status,
    published_at
  ) VALUES (
    (SELECT id FROM users WHERE role = 'TOUR_OPERATOR' LIMIT 1),
    'Bali Island Paradise: Ubud & Seminyak',
    'Experience the cultural heart and beach paradise of Bali in this 5-night journey.',
    'Discover the best of Bali with this 5-night tour. Start in Ubud for cultural immersion and rice terraces, then move to Seminyak for beach relaxation and vibrant nightlife.',
    'Bali, Indonesia',
    true,
    750.00,
    'USD',
    5,
    6,
    2,
    'published',
    NOW()
  ) RETURNING id INTO package5_id;

  -- Insert pricing package (SIC type)
  INSERT INTO multi_city_pricing_packages (
    package_id,
    package_name,
    pricing_type,
    has_child_age_restriction,
    child_min_age,
    child_max_age
  ) VALUES (
    package5_id,
    'Bali Island Paradise: Ubud & Seminyak',
    'SIC',
    true,
    3,
    12
  ) RETURNING id INTO pricing_pkg5_id;

  -- Insert SIC pricing rows
  INSERT INTO multi_city_pricing_rows (
    pricing_package_id,
    number_of_adults,
    number_of_children,
    total_price,
    display_order
  ) VALUES
    (pricing_pkg5_id, 1, 0, 750.00, 1),
    (pricing_pkg5_id, 2, 0, 1400.00, 2),
    (pricing_pkg5_id, 2, 1, 1750.00, 3),
    (pricing_pkg5_id, 2, 2, 2100.00, 4),
    (pricing_pkg5_id, 4, 0, 2600.00, 5);

  -- Insert cities
  INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order, highlights, activities_included)
  VALUES
    (package5_id, 'Ubud', 'Indonesia', 3, 1,
     ARRAY['Tegalalang Rice Terraces', 'Monkey Forest', 'Ubud Market'],
     ARRAY['Cultural tours', 'Rice terrace visits', 'Temple tours']),
    (package5_id, 'Seminyak', 'Indonesia', 2, 2,
     ARRAY['Seminyak Beach', 'Potato Head Beach Club', 'Sunset Point'],
     ARRAY['Beach activities', 'Water sports', 'Nightlife']);

  -- Insert cover image
  INSERT INTO multi_city_package_images (package_id, file_name, storage_path, public_url, is_cover, display_order)
  VALUES (
    package5_id,
    'bali-paradise-cover.jpg',
    'packages/bali-paradise-cover.jpg',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    true,
    0
  );

  -- Insert inclusions, exclusions
  INSERT INTO multi_city_package_inclusions (package_id, category, text, display_order)
  VALUES
    (package5_id, 'Transport'::inclusion_category, 'Intercity Transportation', 1),
    (package5_id, 'Meals'::inclusion_category, 'Daily Breakfast', 2),
    (package5_id, 'Activities'::inclusion_category, 'Cultural Tours', 3);

  INSERT INTO multi_city_package_exclusions (package_id, text, display_order)
  VALUES
    (package5_id, 'International Flights', 1),
    (package5_id, 'Personal Expenses', 2);

  UPDATE multi_city_packages
  SET 
    deposit_percent = 30,
    balance_due_days = 7,
    payment_methods = ARRAY['Credit Card', 'Bank Transfer'],
    insurance_requirement = 'OPTIONAL'
  WHERE id = package5_id;

END $$;

-- ============================================================================
-- PACKAGE 6: Multi-City Hotel - Bali Luxury Stay (SIC Pricing with Hotels)
-- ============================================================================

DO $$
DECLARE
  package6_id UUID;
  pricing_pkg6_id UUID;
  city_ubud_id UUID;
  city_seminyak_id UUID;
BEGIN
  -- Insert main package
  INSERT INTO multi_city_hotel_packages (
    operator_id,
    title,
    short_description,
    destination_region,
    base_price,
    currency,
    total_nights,
    total_cities,
    status,
    published_at
  ) VALUES (
    (SELECT id FROM users WHERE role = 'TOUR_OPERATOR' LIMIT 1),
    'Bali Luxury Stay: Ubud & Seminyak',
    'Experience luxury accommodations in Bali''s most beautiful destinations with 5-star resorts.',
    'Bali, Indonesia',
    950.00,
    'USD',
    4,
    2,
    'published',
    NOW()
  ) RETURNING id INTO package6_id;

  -- Insert pricing package (SIC type)
  -- Note: Using dummy adult_price and child_price to satisfy NOT NULL constraints
  -- Actual pricing comes from pricing_rows table
  INSERT INTO multi_city_hotel_pricing_packages (
    package_id,
    pricing_type,
    adult_price,
    child_price,
    child_min_age,
    child_max_age
  ) VALUES (
    package6_id,
    'SIC',
    0.00, -- Dummy value, actual pricing in pricing_rows
    0.00, -- Dummy value, actual pricing in pricing_rows
    3,
    12
  ) RETURNING id INTO pricing_pkg6_id;

  -- Note: multi_city_hotel_pricing_rows table does not exist
  -- The form code tries to insert here, but the table was never created in migrations
  -- Skipping pricing rows insert for hotel packages

  -- Insert cities
  INSERT INTO multi_city_hotel_package_cities (package_id, name, nights, display_order)
  VALUES
    (package6_id, 'Ubud', 2, 1),
    (package6_id, 'Seminyak', 2, 2);

  -- Get city IDs
  SELECT id INTO city_ubud_id FROM multi_city_hotel_package_cities 
  WHERE package_id = package6_id AND name = 'Ubud' LIMIT 1;
  SELECT id INTO city_seminyak_id FROM multi_city_hotel_package_cities 
  WHERE package_id = package6_id AND name = 'Seminyak' LIMIT 1;

  -- Insert hotels
  INSERT INTO multi_city_hotel_package_city_hotels (
    city_id,
    hotel_name,
    hotel_type,
    room_type,
    room_capacity_adults,
    room_capacity_children,
    display_order
  ) VALUES
    -- Ubud hotels
    (city_ubud_id, 'The Hanging Gardens of Bali', '5 Star', 'Pool Villa', 2, 2, 1),
    (city_ubud_id, 'Four Seasons Resort Bali at Sayan', '5 Star', 'River View Villa', 2, 2, 2),
    -- Seminyak hotels
    (city_seminyak_id, 'The Legian Seminyak', '5 Star', 'Ocean View Suite', 2, 2, 1),
    (city_seminyak_id, 'W Bali - Seminyak', '5 Star', 'Fabulous Suite', 2, 2, 2);

  -- Insert cover image
  INSERT INTO multi_city_hotel_package_images (package_id, file_name, storage_path, public_url, is_cover, display_order)
  VALUES (
    package6_id,
    'bali-luxury-cover.jpg',
    'packages/bali-luxury-cover.jpg',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    true,
    0
  );

  -- Insert inclusions, exclusions
  INSERT INTO multi_city_hotel_package_inclusions (package_id, category, description, display_order)
  VALUES
    (package6_id, 'Transport'::inclusion_category, 'Intercity Transportation', 1),
    (package6_id, 'Meals'::inclusion_category, 'Daily Breakfast', 2),
    (package6_id, 'Activities'::inclusion_category, 'Cultural Tours', 3);

  INSERT INTO multi_city_hotel_package_exclusions (package_id, description, display_order)
  VALUES
    (package6_id, 'International Flights', 1),
    (package6_id, 'Personal Expenses', 2);

  UPDATE multi_city_hotel_packages
  SET 
    deposit_percent = 30,
    balance_due_days = 7,
    payment_methods = ARRAY['Credit Card', 'Bank Transfer'],
    insurance_requirement = 'OPTIONAL'
  WHERE id = package6_id;

END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all packages
SELECT 
  'multi_city' as package_type,
  id,
  title,
  base_price,
  status::text as status
FROM multi_city_packages
WHERE status = 'published'
UNION ALL
SELECT 
  'multi_city_hotel' as package_type,
  id,
  title,
  base_price,
  status::text as status
FROM multi_city_hotel_packages
WHERE status = 'published'
ORDER BY package_type, title;

-- Check pricing packages
SELECT 
  'multi_city' as type,
  p.id as package_id,
  p.title,
  pp.pricing_type::text as pricing_type,
  COUNT(pr.id) as sic_rows,
  COUNT(ppr.id) as private_rows
FROM multi_city_packages p
LEFT JOIN multi_city_pricing_packages pp ON pp.package_id = p.id
LEFT JOIN multi_city_pricing_rows pr ON pr.pricing_package_id = pp.id
LEFT JOIN multi_city_private_package_rows ppr ON ppr.pricing_package_id = pp.id
WHERE p.status = 'published'
GROUP BY p.id, p.title, pp.pricing_type
UNION ALL
SELECT 
  'multi_city_hotel' as type,
  p.id as package_id,
  p.title,
  pp.pricing_type::text as pricing_type,
  0 as sic_rows,  -- multi_city_hotel_pricing_rows table does not exist
  0 as private_rows  -- multi_city_hotel_private_package_rows table does not exist
FROM multi_city_hotel_packages p
LEFT JOIN multi_city_hotel_pricing_packages pp ON pp.package_id = p.id
WHERE p.status = 'published'
GROUP BY p.id, p.title, pp.pricing_type;

-- Check hotels for hotel packages
SELECT 
  p.title as package_title,
  c.name as city_name,
  h.hotel_name,
  h.hotel_type,
  h.room_type,
  h.room_capacity_adults,
  h.room_capacity_children
FROM multi_city_hotel_packages p
JOIN multi_city_hotel_package_cities c ON c.package_id = p.id
JOIN multi_city_hotel_package_city_hotels h ON h.city_id = c.id
WHERE p.status::text = 'published'
ORDER BY p.title, c.display_order, h.display_order;

