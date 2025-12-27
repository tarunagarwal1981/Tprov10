-- ============================================================================
-- SIMULATION DEMO SETUP - CONTINUATION
-- Run this after 008_simulation_demo_setup.sql
-- This file contains remaining packages and marketplace leads
-- ============================================================================

-- Continue Operator 2 packages
-- Package 6: Prambanan Temple Tour (Activity)
INSERT INTO activity_packages (
    operator_id, title, short_description, full_description, status,
    destination_name, destination_address, destination_city, destination_country,
    destination_coordinates, duration_hours, duration_minutes, difficulty_level,
    languages_supported, tags, meeting_point_name, meeting_point_address,
    meeting_point_coordinates, operating_days, whats_included, whats_not_included,
    base_price, currency, price_type, published_at
) VALUES (
    get_operator_id_by_email('java.cultural@touroperator.com'),
    'Prambanan Temple Complex Tour',
    'Explore the largest Hindu temple complex in Indonesia',
    'Discover the magnificent Prambanan Temple Complex, a UNESCO World Heritage Site and the largest Hindu temple site in Indonesia. Your expert guide will explain the intricate architecture, the temple''s history dating back to the 9th century, and the epic Ramayana stories carved in stone. Visit the main temples and the museum to learn about Javanese Hindu culture.',
    'published', 'Prambanan Temple', 'Prambanan Temple Complex, Yogyakarta', 'Yogyakarta', 'Indonesia',
    POINT(110.4944, -7.7520), 3, 0, 'EASY', ARRAY['EN']::language_code[],
    ARRAY['CULTURAL', 'EDUCATIONAL']::activity_tag[], 'Hotel Pickup', 'Your Hotel in Yogyakarta',
    POINT(110.3708, -7.7956), ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']::day_of_week[],
    ARRAY['Hotel pickup and drop-off', 'Professional guide', 'Entrance ticket', 'Bottled water'],
    ARRAY['Personal expenses', 'Gratuities'], 50.00, 'USD', 'PERSON', NOW()
) ON CONFLICT DO NOTHING;

-- Operator 2 Transfer Packages (using DO block for safety)
DO $$ DECLARE op2_uuid UUID;
BEGIN
    op2_uuid := get_operator_id_by_email('java.cultural@touroperator.com');
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transfer_packages') THEN
        -- Yogyakarta Airport Transfer
        INSERT INTO transfer_packages (
            operator_id, title, short_description, destination_name, destination_city,
            destination_country, destination_coordinates, transfer_type, estimated_duration_hours,
            estimated_duration_minutes, base_price, currency, status, published_at
        ) VALUES (
            op2_uuid, 'Yogyakarta Airport to Hotels Transfer',
            'Reliable transfer from Adisucipto Airport to Yogyakarta hotels',
            'Yogyakarta Hotels', 'Yogyakarta', 'Indonesia',
            '{"latitude": -7.7956, "longitude": 110.3708}'::jsonb, 'ONE_WAY', 0, 30,
            25.00, 'USD', 'published', NOW()
        ) ON CONFLICT DO NOTHING;
        
        -- Temple Circuit Transfer
        INSERT INTO transfer_packages (
            operator_id, title, short_description, destination_name, destination_city,
            destination_country, transfer_type, estimated_duration_hours,
            estimated_duration_minutes, base_price, currency, status, published_at
        ) VALUES (
            op2_uuid, 'Yogyakarta Temple Circuit Transfer',
            'Full day transfer service covering Borobudur and Prambanan temples',
            'Temple Circuit', 'Yogyakarta', 'Indonesia', 'MULTI_STOP', 8, 0,
            80.00, 'USD', 'published', NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- OPERATOR 3 PACKAGES: Island Paradise Transfers
-- ============================================================================

DO $$ DECLARE op3_uuid UUID;
BEGIN
    op3_uuid := get_operator_id_by_email('island.transfers@touroperator.com');
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transfer_packages') THEN
        -- Bali Airport VIP Transfer
        INSERT INTO transfer_packages (
            operator_id, title, short_description, destination_name, destination_city,
            destination_country, transfer_type, meet_and_greet, name_board, real_time_tracking,
            base_price, currency, status, published_at
        ) VALUES (
            op3_uuid, 'Bali Airport VIP Transfer Service',
            'Premium VIP transfer with meet and greet service from Ngurah Rai Airport',
            'Bali Hotels', 'Bali', 'Indonesia', 'ONE_WAY', TRUE, TRUE, TRUE,
            75.00, 'USD', 'published', NOW()
        ) ON CONFLICT DO NOTHING;
        
        -- Bali to Lombok Ferry Transfer
        INSERT INTO transfer_packages (
            operator_id, title, short_description, destination_name, destination_city,
            destination_country, transfer_type, total_distance, estimated_duration_hours,
            estimated_duration_minutes, base_price, currency, status, published_at
        ) VALUES (
            op3_uuid, 'Bali to Lombok Ferry Transfer',
            'Complete transfer service from Bali to Lombok via ferry',
            'Lombok Hotels', 'Lombok', 'Indonesia', 'ONE_WAY', 80.0, 4, 0,
            120.00, 'USD', 'published', NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Operator 3 Multi-City Package
DO $$ DECLARE op3_uuid UUID;
BEGIN
    op3_uuid := get_operator_id_by_email('island.transfers@touroperator.com');
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multi_city_packages') THEN
        INSERT INTO multi_city_packages (
            operator_id, title, short_description, destination_region,
            base_price, currency, status, total_days, total_nights, published_at
        ) VALUES (
            op3_uuid, 'Bali - Lombok - Gili Islands Adventure',
            'Complete island hopping package covering Bali, Lombok, and Gili Islands',
            'Indonesia', 850.00, 'USD', 'published', 5, 4, NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- OPERATOR 4 PACKAGES: Bali Beach Activities
-- ============================================================================

-- Surfing Lessons
INSERT INTO activity_packages (
    operator_id, title, short_description, full_description, status,
    destination_name, destination_city, destination_country, destination_coordinates,
    duration_hours, difficulty_level, languages_supported, tags,
    meeting_point_name, meeting_point_address, operating_days,
    whats_included, base_price, currency, price_type, published_at
) VALUES (
    get_operator_id_by_email('bali.beach@touroperator.com'),
    'Surfing Lessons in Canggu',
    'Learn to surf on Bali''s famous Canggu Beach with professional instructors',
    'Perfect for beginners and intermediate surfers. Learn from certified instructors on one of Bali''s most popular surf beaches. Equipment included. Small group lessons for personalized attention.',
    'published', 'Canggu Beach', 'Canggu', 'Indonesia', POINT(115.1424, -8.6482),
    2, 'EASY', ARRAY['EN']::language_code[], ARRAY['SPORTS', 'FAMILY_FRIENDLY']::activity_tag[],
    'Canggu Beach', 'Canggu Beach, Bali', ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']::day_of_week[],
    ARRAY['Professional instructor', 'Surfboard and equipment', 'Rash guard', 'Basic safety instruction'],
    45.00, 'USD', 'PERSON', NOW()
) ON CONFLICT DO NOTHING;

-- Snorkeling Nusa Penida
INSERT INTO activity_packages (
    operator_id, title, short_description, destination_name, destination_city, destination_country,
    duration_hours, difficulty_level, tags, whats_included, base_price, currency, price_type, published_at
) VALUES (
    get_operator_id_by_email('bali.beach@touroperator.com'),
    'Snorkeling Day Trip to Nusa Penida',
    'Full day snorkeling adventure exploring Nusa Penida''s crystal clear waters',
    'Nusa Penida', 'Nusa Penida', 'Indonesia', 8, 'EASY',
    ARRAY['NATURE', 'FAMILY_FRIENDLY']::activity_tag[],
    ARRAY['Boat transfer', 'Snorkeling equipment', 'Lunch', 'Guide', 'Hotel pickup'],
    95.00, 'USD', 'PERSON', NOW()
) ON CONFLICT DO NOTHING;

-- Beach Club Access
INSERT INTO activity_packages (
    operator_id, title, short_description, destination_name, destination_city, duration_hours,
    base_price, currency, price_type, published_at
) VALUES (
    get_operator_id_by_email('bali.beach@touroperator.com'),
    'Beach Club Access with Lunch',
    'Premium beach club access in Seminyak with welcome drink and lunch',
    'Seminyak Beach', 'Seminyak', 4, 65.00, 'USD', 'PERSON', NOW()
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- OPERATOR 5 PACKAGES: Premium Indonesia Tours
-- ============================================================================

-- Multi-City Package: Bali - Yogyakarta - Jakarta
DO $$ DECLARE op5_uuid UUID;
BEGIN
    op5_uuid := get_operator_id_by_email('premium.indonesia@touroperator.com');
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'multi_city_packages') THEN
        INSERT INTO multi_city_packages (
            operator_id, title, short_description, destination_region,
            base_price, currency, status, total_days, total_nights, published_at
        ) VALUES (
            op5_uuid, 'Premium Bali - Yogyakarta - Jakarta Discovery',
            'Luxury 4-day journey covering Bali beaches, Java culture, and Jakarta city',
            'Indonesia', 1200.00, 'USD', 'published', 4, 3, NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Cooking Class
INSERT INTO activity_packages (
    operator_id, title, short_description, destination_name, destination_city,
    duration_hours, tags, base_price, currency, price_type, published_at
) VALUES (
    get_operator_id_by_email('premium.indonesia@touroperator.com'),
    'Private Balinese Cooking Class in Ubud',
    'Learn to cook traditional Balinese dishes in a private setting',
    'Ubud', 'Ubud', 4, ARRAY['FOOD', 'CULTURAL', 'EDUCATIONAL']::activity_tag[],
    85.00, 'USD', 'PERSON', NOW()
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- MARKETPLACE LEADS WITH CUSTOMER DETAILS
-- ============================================================================
-- Note: Customer details are stored but not visible until purchase
-- ============================================================================

-- Lead 1: Bali Adventure & Culture - 4 Days
INSERT INTO lead_marketplace (
    title, destination, trip_type, budget_min, budget_max, duration_days,
    travelers_count, travel_date_start, travel_date_end, special_requirements,
    lead_quality_score, lead_price, status, expires_at,
    -- Hidden customer fields (visible only after purchase)
    customer_name, customer_email, customer_phone, detailed_requirements
) VALUES (
    'Bali Adventure & Culture - 4 Days',
    'Bali, Indonesia',
    'ADVENTURE',
    2500.00,
    3500.00,
    4,
    2,
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '120 days',
    'Interested in mountain trekking, water sports, and cultural temple visits. Prefer active experiences.',
    88,
    125.00,
    'AVAILABLE',
    CURRENT_DATE + INTERVAL '60 days',
    -- Customer details (hidden until purchase)
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
    1800.00,
    2500.00,
    3,
    1,
    'Focus on historical sites, temples, and local culture. Solo traveler, prefer small group tours.',
    82,
    95.00,
    'AVAILABLE',
    CURRENT_DATE + INTERVAL '45 days',
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
    3000.00,
    4000.00,
    4,
    3,
    CURRENT_DATE + INTERVAL '60 days',
    'Family vacation. Need child-friendly activities. Beach-focused but some cultural exposure. All transfers included.',
    92,
    150.00,
    'AVAILABLE',
    CURRENT_DATE + INTERVAL '75 days',
    'The Rodriguez Family',
    'maria.rodriguez@example.com',
    '+1-555-0789',
    'Traveling with 8-year-old child. Need family-friendly operators. Prefer morning activities (child''s energy levels). Vegetarian meal options required. Prefer beachfront accommodations.'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check operators
SELECT 
    'Operators Created' as check_type,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE raw_user_meta_data->>'role' = 'TOUR_OPERATOR') as operators
FROM users
WHERE email IN (
    'bali.adventure@touroperator.com',
    'java.cultural@touroperator.com',
    'island.transfers@touroperator.com',
    'bali.beach@touroperator.com',
    'premium.indonesia@touroperator.com'
);

-- Check packages per operator
SELECT 
    operator_id,
    COUNT(*) as package_count,
    status
FROM activity_packages
WHERE operator_id IN (
    SELECT id FROM users 
    WHERE email IN (
        'bali.adventure@touroperator.com',
        'java.cultural@touroperator.com',
        'bali.beach@touroperator.com',
        'premium.indonesia@touroperator.com'
    )
)
GROUP BY operator_id, status;

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

-- Verify lead-package match (packages available for lead destinations)
SELECT 
    lm.destination,
    COUNT(DISTINCT ap.id) as activity_packages,
    COUNT(DISTINCT tp.id) as transfer_packages,
    COUNT(DISTINCT mcp.id) as multi_city_packages
FROM lead_marketplace lm
LEFT JOIN activity_packages ap ON (
    ap.destination_country ILIKE '%Indonesia%' 
    OR ap.destination_city IN ('Bali', 'Ubud', 'Yogyakarta', 'Lombok')
    AND ap.status = 'published'
)
LEFT JOIN transfer_packages tp ON (
    tp.destination_country ILIKE '%Indonesia%'
    AND tp.status = 'published'
)
LEFT JOIN multi_city_packages mcp ON (
    mcp.destination_region ILIKE '%Indonesia%'
    AND mcp.status = 'published'
)
WHERE lm.status = 'AVAILABLE'
GROUP BY lm.destination;

