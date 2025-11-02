-- ============================================================================
-- SIMULATION DEMO SETUP - FIXED VERSION
-- Uses ONLY fields that frontend actually uses
-- All packages properly linked to 5 demo operators
-- ============================================================================
-- 
-- IMPORTANT: This replaces the broken packages from the previous migrations
-- Run this AFTER operators are created in auth.users
-- See: OPERATOR_SETUP_INSTRUCTIONS.md
-- ============================================================================

-- Helper function to get operator UUID by email (already created in previous migration)
-- If not exists, create it:
CREATE OR REPLACE FUNCTION get_operator_id_by_email(operator_email TEXT)
RETURNS UUID AS $$
DECLARE
    operator_uuid UUID;
BEGIN
    SELECT id INTO operator_uuid
    FROM auth.users
    WHERE email = operator_email
    LIMIT 1;
    
    IF operator_uuid IS NULL THEN
        RAISE EXCEPTION 'Operator with email % not found. Please create in auth.users first.', operator_email;
    END IF;
    
    RETURN operator_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLEAN UP: Remove any incomplete packages (optional - comment out if not needed)
-- ============================================================================
-- DELETE FROM activity_packages WHERE status = 'draft' OR title LIKE '%Surfing%' OR title LIKE '%Snorkeling%';
-- DELETE FROM transfer_packages WHERE status = 'draft';

-- ============================================================================
-- OPERATOR 1: Bali Adventure Tours (bali.adventure@touroperator.com)
-- ============================================================================

-- Package 1: Mount Batur Sunrise Trekking
INSERT INTO activity_packages (
    operator_id, title, short_description, full_description, status,
    destination_name, destination_address, destination_city, destination_country,
    destination_coordinates, duration_hours, duration_minutes, difficulty_level,
    languages_supported, tags, meeting_point_name, meeting_point_address,
    meeting_point_coordinates, operating_days, whats_included, whats_not_included,
    what_to_bring, important_information, minimum_age, cancellation_policy_type,
    cancellation_refund_percentage, cancellation_deadline_hours, base_price, currency,
    price_type, published_at
) VALUES (
    get_operator_id_by_email('bali.adventure@touroperator.com'),
    'Mount Batur Sunrise Trekking Experience',
    'Witness breathtaking sunrise from Mount Batur summit with guided trekking tour',
    'Start your day early with a pick-up from your hotel and journey to Mount Batur base camp. Begin your trek in the darkness of early morning with an experienced local guide. The moderate difficulty trek takes approximately 2 hours to reach the summit at 1,717 meters. Arrive just before sunrise to witness one of the most spectacular views in Bali.',
    'published',
    'Mount Batur',
    'Mount Batur Base Camp, Kintamani, Bali',
    'Kintamani',
    'Indonesia',
    POINT(115.3777, -8.2415),
    6, 0, 'CHALLENGING',
    ARRAY['EN']::language_code[],
    ARRAY['ADVENTURE', 'NATURE']::activity_tag[],
    'Hotel Pickup',
    'Your Hotel Lobby - Ubud Area',
    POINT(115.3138, -8.5069),
    ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']::day_of_week[],
    ARRAY['Professional local guide', 'Hotel pickup and drop-off', 'Breakfast at summit', 'Bottled water'],
    ARRAY['Personal expenses', 'Gratuities'],
    ARRAY['Comfortable hiking shoes', 'Warm clothing', 'Camera'],
    'Physical fitness required. Not suitable for children under 10.',
    10,
    'MODERATE', 70, 48,
    75.00, 'USD', 'PERSON', NOW()
) ON CONFLICT DO NOTHING;

-- Package 2: White Water Rafting
INSERT INTO activity_packages (
    operator_id, title, short_description, full_description, status,
    destination_name, destination_address, destination_city, destination_country,
    destination_coordinates, duration_hours, duration_minutes, difficulty_level,
    languages_supported, tags, meeting_point_name, meeting_point_address,
    meeting_point_coordinates, operating_days, whats_included, whats_not_included,
    what_to_bring, important_information, minimum_age, cancellation_policy_type,
    cancellation_refund_percentage, cancellation_deadline_hours, base_price, currency,
    price_type, published_at
) VALUES (
    get_operator_id_by_email('bali.adventure@touroperator.com'),
    'White Water Rafting on Ayung River',
    'Thrilling 2-hour rafting adventure through Bali''s scenic Ayung River',
    'Experience the thrill of white water rafting on Bali''s most famous river. The Ayung River offers Class II and III rapids perfect for beginners and intermediate rafters. Navigate through lush rainforest canyons, past cascading waterfalls and traditional Balinese villages.',
    'published',
    'Ayung River',
    'Ayung River Rafting Base, Ubud, Bali',
    'Ubud',
    'Indonesia',
    POINT(115.3138, -8.5069),
    2, 0, 'MODERATE',
    ARRAY['EN']::language_code[],
    ARRAY['ADVENTURE', 'FAMILY_FRIENDLY', 'NATURE']::activity_tag[],
    'Rafting Base Camp',
    'Ayung River Rafting Base, Ubud, Bali',
    POINT(115.3138, -8.5069),
    ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']::day_of_week[],
    ARRAY['Professional rafting guide', 'All safety equipment', 'Buffet lunch'],
    ARRAY['Personal expenses', 'Gratuities'],
    ARRAY['Swimwear', 'Change of clothes', 'Waterproof camera'],
    'Swimming skills required. Minimum age 7 years.',
    7,
    'FLEXIBLE', 90, 24,
    65.00, 'USD', 'PERSON', NOW()
) ON CONFLICT DO NOTHING;

-- Package 3: Airport to Ubud Transfer
DO $$ DECLARE op1_uuid UUID;
BEGIN
    op1_uuid := get_operator_id_by_email('bali.adventure@touroperator.com');
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transfer_packages') THEN
        INSERT INTO transfer_packages (
            operator_id, title, short_description, full_description,
            destination_name, destination_address, destination_city, destination_country,
            destination_coordinates, transfer_type, total_distance, distance_unit,
            estimated_duration_hours, estimated_duration_minutes,
            meet_and_greet, name_board, luggage_assistance, door_to_door_service,
            base_price, currency, status, published_at
        ) VALUES (
            op1_uuid,
            'Bali Airport to Ubud Hotels Transfer',
            'Comfortable one-way transfer from Ngurah Rai Airport to Ubud area hotels',
            'Professional transfer service from Bali''s Ngurah Rai International Airport (DPS) to hotels in Ubud area.',
            'Ubud Hotels',
            'Ubud Area, Gianyar Regency, Bali',
            'Ubud',
            'Indonesia',
            '{"latitude": -8.5069, "longitude": 115.3138}'::jsonb,
            'ONE_WAY', 40.0, 'KM', 1, 30,
            TRUE, TRUE, TRUE, TRUE,
            35.00, 'USD', 'published', NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Package 4: Ubud to Tanah Lot Transfer
DO $$ DECLARE op1_uuid UUID;
BEGIN
    op1_uuid := get_operator_id_by_email('bali.adventure@touroperator.com');
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transfer_packages') THEN
        INSERT INTO transfer_packages (
            operator_id, title, short_description, full_description,
            destination_name, destination_address, destination_city, destination_country,
            destination_coordinates, transfer_type, total_distance, distance_unit,
            estimated_duration_hours, estimated_duration_minutes,
            meet_and_greet, luggage_assistance, door_to_door_service,
            base_price, currency, status, published_at
        ) VALUES (
            op1_uuid,
            'Ubud to Tanah Lot Temple Transfer',
            'Reliable transfer service from Ubud area to Tanah Lot Temple',
            'Transfer service from Ubud hotels to Tanah Lot Temple - one of Bali''s most iconic sea temples.',
            'Tanah Lot Temple',
            'Tanah Lot Temple, Tabanan Regency, Bali',
            'Tabanan',
            'Indonesia',
            '{"latitude": -8.6221, "longitude": 115.0859}'::jsonb,
            'ONE_WAY', 35.0, 'KM', 1, 15,
            TRUE, FALSE, TRUE,
            30.00, 'USD', 'published', NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- OPERATOR 2: Java Cultural Experiences (java.cultural@touroperator.com)
-- ============================================================================

-- Package 5: Borobudur Sunrise Tour
INSERT INTO activity_packages (
    operator_id, title, short_description, full_description, status,
    destination_name, destination_address, destination_city, destination_country,
    destination_coordinates, duration_hours, duration_minutes, difficulty_level,
    languages_supported, tags, meeting_point_name, meeting_point_address,
    meeting_point_coordinates, operating_days, whats_included, whats_not_included,
    what_to_bring, important_information, minimum_age, cancellation_policy_type,
    cancellation_refund_percentage, cancellation_deadline_hours, base_price, currency,
    price_type, published_at
) VALUES (
    get_operator_id_by_email('java.cultural@touroperator.com'),
    'Borobudur Temple Sunrise Tour',
    'Magical sunrise experience at the world''s largest Buddhist temple',
    'Wake up early for an unforgettable sunrise experience at Borobudur Temple, a UNESCO World Heritage Site.',
    'published',
    'Borobudur Temple',
    'Borobudur Temple Complex, Magelang Regency, Central Java',
    'Magelang',
    'Indonesia',
    POINT(110.2014, -7.6079),
    4, 0, 'EASY',
    ARRAY['EN']::language_code[],
    ARRAY['CULTURAL', 'NATURE', 'EDUCATIONAL']::activity_tag[],
    'Hotel Pickup',
    'Your Hotel in Yogyakarta',
    POINT(110.3708, -7.7956),
    ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']::day_of_week[],
    ARRAY['Hotel pickup and drop-off', 'Professional guide', 'Entrance ticket', 'Breakfast'],
    ARRAY['Personal expenses', 'Gratuities'],
    ARRAY['Comfortable walking shoes', 'Camera', 'Light jacket'],
    'Early morning pickup around 4:00 AM.',
    0,
    'MODERATE', 80, 24,
    85.00, 'USD', 'PERSON', NOW()
) ON CONFLICT DO NOTHING;

-- Package 6: Prambanan Temple Tour
INSERT INTO activity_packages (
    operator_id, title, short_description, full_description, status,
    destination_name, destination_address, destination_city, destination_country,
    destination_coordinates, duration_hours, duration_minutes, difficulty_level,
    languages_supported, tags, meeting_point_name, meeting_point_address,
    meeting_point_coordinates, operating_days, whats_included, whats_not_included,
    what_to_bring, important_information, minimum_age, cancellation_policy_type,
    cancellation_refund_percentage, cancellation_deadline_hours, base_price, currency,
    price_type, published_at
) VALUES (
    get_operator_id_by_email('java.cultural@touroperator.com'),
    'Prambanan Temple Complex Tour',
    'Explore the largest Hindu temple complex in Indonesia',
    'Discover the magnificent Prambanan Temple Complex, a UNESCO World Heritage Site and the largest Hindu temple site in Indonesia.',
    'published',
    'Prambanan Temple',
    'Prambanan Temple Complex, Sleman Regency, Yogyakarta',
    'Yogyakarta',
    'Indonesia',
    POINT(110.4944, -7.7520),
    3, 0, 'EASY',
    ARRAY['EN']::language_code[],
    ARRAY['CULTURAL', 'EDUCATIONAL']::activity_tag[],
    'Hotel Pickup',
    'Your Hotel in Yogyakarta',
    POINT(110.3708, -7.7956),
    ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']::day_of_week[],
    ARRAY['Hotel pickup and drop-off', 'Professional guide', 'Entrance ticket'],
    ARRAY['Personal expenses', 'Gratuities'],
    ARRAY['Comfortable walking shoes', 'Camera'],
    'Sunrise access requires special ticket.',
    0,
    'MODERATE', 80, 24,
    50.00, 'USD', 'PERSON', NOW()
) ON CONFLICT DO NOTHING;

-- Package 7: Yogyakarta Airport Transfer
DO $$ DECLARE op2_uuid UUID;
BEGIN
    op2_uuid := get_operator_id_by_email('java.cultural@touroperator.com');
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transfer_packages') THEN
        INSERT INTO transfer_packages (
            operator_id, title, short_description, full_description,
            destination_name, destination_address, destination_city, destination_country,
            destination_coordinates, transfer_type, estimated_duration_hours,
            estimated_duration_minutes, base_price, currency, status, published_at
        ) VALUES (
            op2_uuid,
            'Yogyakarta Airport to Hotels Transfer',
            'Reliable transfer from Adisucipto Airport to Yogyakarta hotels',
            'Comfortable transfer service from Yogyakarta Adisucipto International Airport to hotels in Yogyakarta city.',
            'Yogyakarta Hotels',
            'Yogyakarta City Hotels',
            'Yogyakarta',
            'Indonesia',
            '{"latitude": -7.7956, "longitude": 110.3708}'::jsonb,
            'ONE_WAY', 0, 30,
            25.00, 'USD', 'published', NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- OPERATOR 3: Island Paradise Transfers (island.transfers@touroperator.com)
-- ============================================================================

-- Package 8: Bali Airport VIP Transfer
DO $$ DECLARE op3_uuid UUID;
BEGIN
    op3_uuid := get_operator_id_by_email('island.transfers@touroperator.com');
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transfer_packages') THEN
        INSERT INTO transfer_packages (
            operator_id, title, short_description, full_description,
            destination_name, destination_address, destination_city, destination_country,
            destination_coordinates, transfer_type, meet_and_greet, name_board,
            real_time_tracking, base_price, currency, status, published_at
        ) VALUES (
            op3_uuid,
            'Bali Airport VIP Transfer Service',
            'Premium VIP transfer with meet and greet service from Ngurah Rai Airport',
            'Premium VIP transfer service from Bali''s Ngurah Rai International Airport to hotels throughout Bali.',
            'Bali Hotels',
            'Bali Hotels - Various Locations',
            'Bali',
            'Indonesia',
            '{"latitude": -8.6482, "longitude": 115.1424}'::jsonb,
            'ONE_WAY', TRUE, TRUE, TRUE,
            75.00, 'USD', 'published', NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Package 9: Bali to Lombok Ferry Transfer
DO $$ DECLARE op3_uuid UUID;
BEGIN
    op3_uuid := get_operator_id_by_email('island.transfers@touroperator.com');
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transfer_packages') THEN
        INSERT INTO transfer_packages (
            operator_id, title, short_description, full_description,
            destination_name, destination_address, destination_city, destination_country,
            destination_coordinates, transfer_type, total_distance, distance_unit,
            estimated_duration_hours, estimated_duration_minutes,
            base_price, currency, status, published_at
        ) VALUES (
            op3_uuid,
            'Bali to Lombok Ferry Transfer',
            'Complete transfer service from Bali to Lombok via ferry',
            'Complete transfer service from Bali to Lombok via ferry, including all transfers and ferry tickets.',
            'Lombok Hotels',
            'Lombok Hotels - Various Locations',
            'Lombok',
            'Indonesia',
            '{"latitude": -8.5833, "longitude": 116.1167}'::jsonb,
            'ONE_WAY', 80.0, 'KM', 4, 0,
            120.00, 'USD', 'published', NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- OPERATOR 4: Bali Beach Activities (bali.beach@touroperator.com)
-- ============================================================================

-- Package 10: Surfing Lessons
INSERT INTO activity_packages (
    operator_id, title, short_description, full_description, status,
    destination_name, destination_address, destination_city, destination_country,
    destination_coordinates, duration_hours, duration_minutes, difficulty_level,
    languages_supported, tags, meeting_point_name, meeting_point_address,
    meeting_point_coordinates, operating_days, whats_included, whats_not_included,
    what_to_bring, important_information, minimum_age, cancellation_policy_type,
    cancellation_refund_percentage, cancellation_deadline_hours, base_price, currency,
    price_type, published_at
) VALUES (
    get_operator_id_by_email('bali.beach@touroperator.com'),
    'Surfing Lessons in Canggu',
    'Learn to surf on Bali''s famous Canggu Beach with professional instructors',
    'Perfect for beginners and intermediate surfers. Learn from certified instructors on one of Bali''s most popular surf beaches.',
    'published',
    'Canggu Beach',
    'Canggu Beach, North Kuta, Badung Regency, Bali',
    'Canggu',
    'Indonesia',
    POINT(115.1424, -8.6482),
    2, 0, 'EASY',
    ARRAY['EN']::language_code[],
    ARRAY['SPORTS', 'FAMILY_FRIENDLY']::activity_tag[],
    'Canggu Beach',
    'Canggu Beach, Bali',
    POINT(115.1424, -8.6482),
    ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']::day_of_week[],
    ARRAY['Professional instructor', 'Surfboard and equipment', 'Rash guard'],
    ARRAY['Personal expenses', 'Gratuities'],
    ARRAY['Swimwear', 'Sunscreen', 'Towel'],
    'Swimming skills required. Suitable for ages 8 and above.',
    8,
    'MODERATE', 80, 24,
    45.00, 'USD', 'PERSON', NOW()
) ON CONFLICT DO NOTHING;

-- Package 11: Snorkeling Nusa Penida
INSERT INTO activity_packages (
    operator_id, title, short_description, full_description, status,
    destination_name, destination_address, destination_city, destination_country,
    destination_coordinates, duration_hours, duration_minutes, difficulty_level,
    languages_supported, tags, meeting_point_name, meeting_point_address,
    meeting_point_coordinates, operating_days, whats_included, whats_not_included,
    what_to_bring, important_information, minimum_age, cancellation_policy_type,
    cancellation_refund_percentage, cancellation_deadline_hours, base_price, currency,
    price_type, published_at
) VALUES (
    get_operator_id_by_email('bali.beach@touroperator.com'),
    'Snorkeling Day Trip to Nusa Penida',
    'Full day snorkeling adventure exploring Nusa Penida''s crystal clear waters',
    'Full day snorkeling adventure exploring the crystal clear waters around Nusa Penida island, home to diverse marine life.',
    'published',
    'Nusa Penida',
    'Nusa Penida Island, Klungkung Regency, Bali',
    'Nusa Penida',
    'Indonesia',
    POINT(115.5400, -8.7250),
    8, 0, 'EASY',
    ARRAY['EN']::language_code[],
    ARRAY['NATURE', 'FAMILY_FRIENDLY']::activity_tag[],
    'Sanur Harbor',
    'Sanur Harbor, Sanur, Bali',
    POINT(115.2622, -8.6844),
    ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']::day_of_week[],
    ARRAY['Boat transfer', 'Snorkeling equipment', 'Lunch', 'Guide', 'Hotel pickup'],
    ARRAY['Personal expenses', 'Gratuities'],
    ARRAY['Swimwear', 'Sunscreen', 'Towels', 'Camera'],
    'Swimming skills required. Suitable for ages 6 and above.',
    6,
    'MODERATE', 80, 48,
    95.00, 'USD', 'PERSON', NOW()
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- OPERATOR 5: Premium Indonesia Tours (premium.indonesia@touroperator.com)
-- ============================================================================

-- Package 12: Cooking Class
INSERT INTO activity_packages (
    operator_id, title, short_description, full_description, status,
    destination_name, destination_address, destination_city, destination_country,
    destination_coordinates, duration_hours, duration_minutes, difficulty_level,
    languages_supported, tags, meeting_point_name, meeting_point_address,
    meeting_point_coordinates, operating_days, whats_included, whats_not_included,
    what_to_bring, important_information, minimum_age, cancellation_policy_type,
    cancellation_refund_percentage, cancellation_deadline_hours, base_price, currency,
    price_type, published_at
) VALUES (
    get_operator_id_by_email('premium.indonesia@touroperator.com'),
    'Private Balinese Cooking Class in Ubud',
    'Learn to cook traditional Balinese dishes in a private setting',
    'Private cooking class experience in Ubud where you''ll learn to prepare authentic Balinese dishes using traditional methods and local ingredients.',
    'published',
    'Ubud',
    'Ubud Cooking School, Ubud, Gianyar Regency, Bali',
    'Ubud',
    'Indonesia',
    POINT(115.3138, -8.5069),
    4, 0, 'EASY',
    ARRAY['EN']::language_code[],
    ARRAY['FOOD', 'CULTURAL', 'EDUCATIONAL']::activity_tag[],
    'Cooking School',
    'Ubud Cooking School, Ubud, Bali',
    POINT(115.3138, -8.5069),
    ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']::day_of_week[],
    ARRAY['Professional chef instructor', 'All ingredients', 'Recipe cards', 'Meal included'],
    ARRAY['Personal expenses', 'Gratuities'],
    ARRAY['Comfortable clothing', 'Apron provided'],
    'Private class for up to 6 people. Vegetarian options available.',
    0,
    'FLEXIBLE', 90, 24,
    85.00, 'USD', 'PERSON', NOW()
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count packages per operator
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

-- Total packages
SELECT 
    (SELECT COUNT(*) FROM activity_packages WHERE status = 'published') as total_activity_packages,
    (SELECT COUNT(*) FROM transfer_packages WHERE status = 'published') as total_transfer_packages;

