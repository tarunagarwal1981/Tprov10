-- ============================================================================
-- CREATE BALI PACKAGES FOR operator@gmail.com
-- This script creates multi-city and multi-city hotel packages with:
-- - Kuta, Ubud, Legian combinations
-- - Transport connections between cities
-- - Pricing for multiple people
-- ============================================================================
-- 
-- Usage: Execute this SQL script in your database
-- Make sure operator@gmail.com exists in the users table first
-- ============================================================================

-- Get operator ID
DO $$
DECLARE
    operator_id_val UUID;
    package_id_val UUID;
    city_id_map UUID[];
    city_id_val UUID;
    pricing_package_id_val UUID;
    i INTEGER;
    conn_record RECORD;
BEGIN
    -- Get operator ID
    SELECT id INTO operator_id_val
    FROM users
    WHERE email = 'operator@gmail.com'
    LIMIT 1;
    
    IF operator_id_val IS NULL THEN
        RAISE EXCEPTION 'Operator with email operator@gmail.com not found. Please create the operator first.';
    END IF;
    
    RAISE NOTICE 'Found operator ID: %', operator_id_val;
    
    -- ============================================================================
    -- PACKAGE 1: Multi-City - Kuta & Ubud (2 nights each)
    -- ============================================================================
    INSERT INTO multi_city_packages (
        operator_id, title, short_description, destination_region,
        base_price, currency, total_nights, total_days, total_cities, status, published_at
    ) VALUES (
        operator_id_val,
        'Bali Beach & Culture: Kuta & Ubud',
        'Experience the best of Bali with beach vibes in Kuta and cultural immersion in Ubud',
        'Bali, Indonesia',
        450.00,
        'USD',
        4,  -- total_nights
        5,  -- total_days
        2,  -- total_cities
        'published',
        NOW()
    ) RETURNING id INTO package_id_val;
    
    RAISE NOTICE 'Created package 1: %', package_id_val;
    
    -- Insert cities
    city_id_map := ARRAY[]::UUID[];
    
    INSERT INTO multi_city_package_cities (package_id, name, country, nights, highlights, city_order)
    VALUES (package_id_val, 'Kuta', 'Indonesia', 2, ARRAY['Beach activities', 'Surfing', 'Nightlife'], 1)
    RETURNING id INTO city_id_val;
    city_id_map := array_append(city_id_map, city_id_val);
    
    INSERT INTO multi_city_package_cities (package_id, name, country, nights, highlights, city_order)
    VALUES (package_id_val, 'Ubud', 'Indonesia', 2, ARRAY['Rice terraces', 'Monkey Forest', 'Traditional markets'], 2)
    RETURNING id INTO city_id_val;
    city_id_map := array_append(city_id_map, city_id_val);
    
    -- Insert transport connection
    INSERT INTO multi_city_package_connections (
        package_id, from_city_id, to_city_id, transport_type, transport_class,
        provider, duration_hours, price_included
    ) VALUES (
        package_id_val,
        city_id_map[1],
        city_id_map[2],
        'CAR',
        'STANDARD',
        'Private Transfer',
        1.5,
        true
    );
    
    -- Insert pricing package
    INSERT INTO multi_city_pricing_packages (package_id, package_name, pricing_type, has_child_age_restriction)
    VALUES (package_id_val, 'Bali Beach & Culture: Kuta & Ubud', 'SIC', false)
    RETURNING id INTO pricing_package_id_val;
    
    -- Insert pricing rows
    INSERT INTO multi_city_pricing_rows (pricing_package_id, number_of_adults, number_of_children, total_price, display_order) VALUES
        (pricing_package_id_val, 1, 0, 450.00, 1),
        (pricing_package_id_val, 2, 0, 800.00, 2),
        (pricing_package_id_val, 2, 1, 950.00, 3),
        (pricing_package_id_val, 4, 0, 1500.00, 4),
        (pricing_package_id_val, 4, 2, 1800.00, 5);
    
    -- ============================================================================
    -- PACKAGE 2: Multi-City - Kuta, Ubud & Legian (2 nights each)
    -- ============================================================================
    INSERT INTO multi_city_packages (
        operator_id, title, short_description, destination_region,
        base_price, currency, total_nights, total_days, total_cities, status, published_at
    ) VALUES (
        operator_id_val,
        'Bali Extended Adventure: Kuta, Ubud & Legian',
        'Comprehensive Bali tour covering beaches, culture, and relaxation',
        'Bali, Indonesia',
        750.00,
        'USD',
        6,  -- total_nights
        7,  -- total_days
        3,  -- total_cities
        'published',
        NOW()
    ) RETURNING id INTO package_id_val;
    
    RAISE NOTICE 'Created package 2: %', package_id_val;
    
    -- Insert cities
    city_id_map := ARRAY[]::UUID[];
    
    INSERT INTO multi_city_package_cities (package_id, name, country, nights, highlights, city_order)
    VALUES (package_id_val, 'Kuta', 'Indonesia', 2, ARRAY['Beach activities', 'Surfing', 'Shopping'], 1)
    RETURNING id INTO city_id_val;
    city_id_map := array_append(city_id_map, city_id_val);
    
    INSERT INTO multi_city_package_cities (package_id, name, country, nights, highlights, city_order)
    VALUES (package_id_val, 'Ubud', 'Indonesia', 2, ARRAY['Rice terraces', 'Monkey Forest', 'Art galleries'], 2)
    RETURNING id INTO city_id_val;
    city_id_map := array_append(city_id_map, city_id_val);
    
    INSERT INTO multi_city_package_cities (package_id, name, country, nights, highlights, city_order)
    VALUES (package_id_val, 'Legian', 'Indonesia', 2, ARRAY['Beach relaxation', 'Sunset views', 'Dining'], 3)
    RETURNING id INTO city_id_val;
    city_id_map := array_append(city_id_map, city_id_val);
    
    -- Insert transport connections
    INSERT INTO multi_city_package_connections (
        package_id, from_city_id, to_city_id, transport_type, transport_class,
        provider, duration_hours, price_included
    ) VALUES (
        package_id_val, city_id_map[1], city_id_map[2], 'CAR', 'STANDARD', 'Private Transfer', 1.5, true
    );
    
    INSERT INTO multi_city_package_connections (
        package_id, from_city_id, to_city_id, transport_type, transport_class,
        provider, duration_hours, price_included
    ) VALUES (
        package_id_val, city_id_map[2], city_id_map[3], 'CAR', 'STANDARD', 'Private Transfer', 1.0, true
    );
    
    -- Insert pricing package
    INSERT INTO multi_city_pricing_packages (package_id, package_name, pricing_type, has_child_age_restriction)
    VALUES (package_id_val, 'Bali Extended Adventure: Kuta, Ubud & Legian', 'SIC', false)
    RETURNING id INTO pricing_package_id_val;
    
    -- Insert pricing rows
    INSERT INTO multi_city_pricing_rows (pricing_package_id, number_of_adults, number_of_children, total_price, display_order) VALUES
        (pricing_package_id_val, 1, 0, 750.00, 1),
        (pricing_package_id_val, 2, 0, 1400.00, 2),
        (pricing_package_id_val, 2, 1, 1650.00, 3),
        (pricing_package_id_val, 4, 0, 2600.00, 4),
        (pricing_package_id_val, 4, 2, 3100.00, 5);
    
    -- ============================================================================
    -- PACKAGE 3: Multi-City - Ubud & Seminyak
    -- ============================================================================
    INSERT INTO multi_city_packages (
        operator_id, title, short_description, destination_region,
        base_price, currency, total_nights, total_days, total_cities, status, published_at
    ) VALUES (
        operator_id_val,
        'Bali Cultural Journey: Ubud & Seminyak',
        'Explore Balinese culture in Ubud and enjoy luxury in Seminyak',
        'Bali, Indonesia',
        650.00,
        'USD',
        5,  -- total_nights
        6,  -- total_days
        2,  -- total_cities
        'published',
        NOW()
    ) RETURNING id INTO package_id_val;
    
    RAISE NOTICE 'Created package 3: %', package_id_val;
    
    -- Insert cities
    city_id_map := ARRAY[]::UUID[];
    
    INSERT INTO multi_city_package_cities (package_id, name, country, nights, highlights, city_order)
    VALUES (package_id_val, 'Ubud', 'Indonesia', 3, ARRAY['Rice terraces', 'Traditional dance', 'Art villages'], 1)
    RETURNING id INTO city_id_val;
    city_id_map := array_append(city_id_map, city_id_val);
    
    INSERT INTO multi_city_package_cities (package_id, name, country, nights, highlights, city_order)
    VALUES (package_id_val, 'Seminyak', 'Indonesia', 2, ARRAY['Luxury resorts', 'Fine dining', 'Beach clubs'], 2)
    RETURNING id INTO city_id_val;
    city_id_map := array_append(city_id_map, city_id_val);
    
    -- Insert transport connection
    INSERT INTO multi_city_package_connections (
        package_id, from_city_id, to_city_id, transport_type, transport_class,
        provider, duration_hours, price_included
    ) VALUES (
        package_id_val, city_id_map[1], city_id_map[2], 'CAR', 'BUSINESS', 'Premium Transfer', 1.0, true
    );
    
    -- Insert pricing package
    INSERT INTO multi_city_pricing_packages (package_id, package_name, pricing_type, has_child_age_restriction)
    VALUES (package_id_val, 'Bali Cultural Journey: Ubud & Seminyak', 'SIC', false)
    RETURNING id INTO pricing_package_id_val;
    
    -- Insert pricing rows
    INSERT INTO multi_city_pricing_rows (pricing_package_id, number_of_adults, number_of_children, total_price, display_order) VALUES
        (pricing_package_id_val, 1, 0, 650.00, 1),
        (pricing_package_id_val, 2, 0, 1200.00, 2),
        (pricing_package_id_val, 2, 1, 1420.00, 3),
        (pricing_package_id_val, 4, 0, 2200.00, 4);
    
    -- ============================================================================
    -- PACKAGE 4: Multi-City Hotel - Kuta & Ubud
    -- ============================================================================
    INSERT INTO multi_city_hotel_packages (
        operator_id, title, short_description, destination_region,
        adult_price, currency, total_nights, total_cities, status, published_at
    ) VALUES (
        operator_id_val,
        'Bali Beach Hotels: Kuta & Ubud Stay',
        'Comfortable hotel stays in Kuta and Ubud with included breakfast',
        'Bali, Indonesia',
        120.00,
        'USD',
        4,  -- total_nights
        2,  -- total_cities
        'published',
        NOW()
    ) RETURNING id INTO package_id_val;
    
    RAISE NOTICE 'Created package 4 (hotel): %', package_id_val;
    
    -- Insert cities with hotels
    city_id_map := ARRAY[]::TEXT[];
    
    INSERT INTO multi_city_hotel_package_cities (package_id, name, country, nights, highlights, city_order)
    VALUES (package_id_val, 'Kuta', 'Indonesia', 2, ARRAY['Beachfront location', 'Swimming pool', 'Restaurants'], 1)
    RETURNING id INTO city_id_val;
    city_id_map := array_append(city_id_map, city_id_val);
    
    -- Insert hotels for Kuta
    INSERT INTO multi_city_hotel_package_city_hotels (city_id, hotel_name, hotel_type, room_type, room_capacity_adults, room_capacity_children, display_order) VALUES
        (city_id_map[1], 'Kuta Beach Hotel', '3 Star', 'Standard Double', 2, 1, 1),
        (city_id_map[1], 'Ocean View Resort', '4 Star', 'Deluxe Room', 2, 2, 2);
    
    INSERT INTO multi_city_hotel_package_cities (package_id, name, country, nights, highlights, city_order)
    VALUES (package_id_val, 'Ubud', 'Indonesia', 2, ARRAY['Rice field views', 'Spa facilities', 'Cultural tours'], 2)
    RETURNING id INTO city_id_val;
    city_id_map := array_append(city_id_map, city_id_val);
    
    -- Insert hotels for Ubud
    INSERT INTO multi_city_hotel_package_city_hotels (city_id, hotel_name, hotel_type, room_type, room_capacity_adults, room_capacity_children, display_order) VALUES
        (city_id_map[2], 'Ubud Valley Resort', '4 Star', 'Villa', 2, 1, 1),
        (city_id_map[2], 'Green Valley Hotel', '3 Star', 'Standard Room', 2, 1, 2);
    
    -- Insert pricing package
    INSERT INTO multi_city_hotel_pricing_packages (package_id, pricing_type, has_child_age_restriction)
    VALUES (package_id_val, 'SIC', false)
    RETURNING id INTO pricing_package_id_val;
    
    -- Insert pricing rows
    INSERT INTO multi_city_hotel_pricing_rows (pricing_package_id, number_of_adults, number_of_children, total_price, display_order) VALUES
        (pricing_package_id_val, 1, 0, 120.00, 1),
        (pricing_package_id_val, 2, 0, 220.00, 2),
        (pricing_package_id_val, 2, 1, 280.00, 3),
        (pricing_package_id_val, 4, 0, 420.00, 4);
    
    -- ============================================================================
    -- PACKAGE 5: Multi-City Hotel - Kuta, Ubud & Legian
    -- ============================================================================
    INSERT INTO multi_city_hotel_packages (
        operator_id, title, short_description, destination_region,
        adult_price, currency, total_nights, total_cities, status, published_at
    ) VALUES (
        operator_id_val,
        'Bali Extended Stay: Kuta, Ubud & Legian Hotels',
        'Multi-city hotel package with transfers between destinations',
        'Bali, Indonesia',
        180.00,
        'USD',
        6,  -- total_nights
        3,  -- total_cities
        'published',
        NOW()
    ) RETURNING id INTO package_id_val;
    
    RAISE NOTICE 'Created package 5 (hotel): %', package_id_val;
    
    -- Insert cities with hotels
    city_id_map := ARRAY[]::TEXT[];
    
    INSERT INTO multi_city_hotel_package_cities (package_id, name, country, nights, highlights, city_order)
    VALUES (package_id_val, 'Kuta', 'Indonesia', 2, ARRAY['Beach access', 'Pool facilities'], 1)
    RETURNING id INTO city_id_val;
    city_id_map := array_append(city_id_map, city_id_val);
    
    INSERT INTO multi_city_hotel_package_city_hotels (city_id, hotel_name, hotel_type, room_type, room_capacity_adults, room_capacity_children, display_order) VALUES
        (city_id_map[1], 'Kuta Paradise Hotel', '3 Star', 'Standard Double', 2, 1, 1);
    
    INSERT INTO multi_city_hotel_package_cities (package_id, name, country, nights, highlights, city_order)
    VALUES (package_id_val, 'Ubud', 'Indonesia', 2, ARRAY['Mountain views', 'Cultural activities'], 2)
    RETURNING id INTO city_id_val;
    city_id_map := array_append(city_id_map, city_id_val);
    
    INSERT INTO multi_city_hotel_package_city_hotels (city_id, hotel_name, hotel_type, room_type, room_capacity_adults, room_capacity_children, display_order) VALUES
        (city_id_map[2], 'Ubud Heritage Hotel', '4 Star', 'Deluxe Room', 2, 2, 1);
    
    INSERT INTO multi_city_hotel_package_cities (package_id, name, country, nights, highlights, city_order)
    VALUES (package_id_val, 'Legian', 'Indonesia', 2, ARRAY['Beachfront', 'Sunset views'], 3)
    RETURNING id INTO city_id_val;
    city_id_map := array_append(city_id_map, city_id_val);
    
    INSERT INTO multi_city_hotel_package_city_hotels (city_id, hotel_name, hotel_type, room_type, room_capacity_adults, room_capacity_children, display_order) VALUES
        (city_id_map[3], 'Legian Beach Resort', '4 Star', 'Ocean View Room', 2, 1, 1);
    
    -- Insert pricing package
    INSERT INTO multi_city_hotel_pricing_packages (package_id, pricing_type, has_child_age_restriction)
    VALUES (package_id_val, 'SIC', false)
    RETURNING id INTO pricing_package_id_val;
    
    -- Insert pricing rows
    INSERT INTO multi_city_hotel_pricing_rows (pricing_package_id, number_of_adults, number_of_children, total_price, display_order) VALUES
        (pricing_package_id_val, 1, 0, 180.00, 1),
        (pricing_package_id_val, 2, 0, 340.00, 2),
        (pricing_package_id_val, 2, 1, 420.00, 3),
        (pricing_package_id_val, 4, 0, 640.00, 4);
    
    RAISE NOTICE 'All packages created successfully!';
END $$;
