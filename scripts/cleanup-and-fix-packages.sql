-- Clean up duplicate packages and add cities
-- Step 1: Delete all duplicate packages except the most recent one for each title

-- Delete duplicates for "Bali Beach & Culture: Kuta & Ubud"
DELETE FROM multi_city_packages
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at DESC) as rn
    FROM multi_city_packages
    WHERE operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
      AND title = 'Bali Beach & Culture: Kuta & Ubud'
      AND status = 'published'
  ) t WHERE rn > 1
);

-- Delete duplicates for "Bali Extended Adventure: Kuta, Ubud & Legian"
DELETE FROM multi_city_packages
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at DESC) as rn
    FROM multi_city_packages
    WHERE operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
      AND title = 'Bali Extended Adventure: Kuta, Ubud & Legian'
      AND status = 'published'
  ) t WHERE rn > 1
);

-- Delete duplicates for "Bali Cultural Journey: Ubud & Seminyak"
DELETE FROM multi_city_packages
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at DESC) as rn
    FROM multi_city_packages
    WHERE operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
      AND title = 'Bali Cultural Journey: Ubud & Seminyak'
      AND status = 'published'
  ) t WHERE rn > 1
);

-- Step 2: Add cities to the remaining packages
-- Bali Beach & Culture: Kuta & Ubud
INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order)
SELECT p.id, 'Kuta', 'Indonesia', 2, 1
FROM multi_city_packages p
WHERE p.operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
  AND p.title = 'Bali Beach & Culture: Kuta & Ubud'
  AND p.status = 'published'
  AND NOT EXISTS (SELECT 1 FROM multi_city_package_cities c WHERE c.package_id = p.id AND c.city_order = 1)
ORDER BY p.created_at DESC
LIMIT 1;

INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order)
SELECT p.id, 'Ubud', 'Indonesia', 2, 2
FROM multi_city_packages p
WHERE p.operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
  AND p.title = 'Bali Beach & Culture: Kuta & Ubud'
  AND p.status = 'published'
  AND NOT EXISTS (SELECT 1 FROM multi_city_package_cities c WHERE c.package_id = p.id AND c.city_order = 2)
ORDER BY p.created_at DESC
LIMIT 1;

-- Bali Extended Adventure: Kuta, Ubud & Legian
INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order)
SELECT p.id, 'Kuta', 'Indonesia', 2, 1
FROM multi_city_packages p
WHERE p.operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
  AND p.title = 'Bali Extended Adventure: Kuta, Ubud & Legian'
  AND p.status = 'published'
  AND NOT EXISTS (SELECT 1 FROM multi_city_package_cities c WHERE c.package_id = p.id AND c.city_order = 1)
ORDER BY p.created_at DESC
LIMIT 1;

INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order)
SELECT p.id, 'Ubud', 'Indonesia', 2, 2
FROM multi_city_packages p
WHERE p.operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
  AND p.title = 'Bali Extended Adventure: Kuta, Ubud & Legian'
  AND p.status = 'published'
  AND NOT EXISTS (SELECT 1 FROM multi_city_package_cities c WHERE c.package_id = p.id AND c.city_order = 2)
ORDER BY p.created_at DESC
LIMIT 1;

INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order)
SELECT p.id, 'Legian', 'Indonesia', 2, 3
FROM multi_city_packages p
WHERE p.operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
  AND p.title = 'Bali Extended Adventure: Kuta, Ubud & Legian'
  AND p.status = 'published'
  AND NOT EXISTS (SELECT 1 FROM multi_city_package_cities c WHERE c.package_id = p.id AND c.city_order = 3)
ORDER BY p.created_at DESC
LIMIT 1;

-- Bali Cultural Journey: Ubud & Seminyak
INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order)
SELECT p.id, 'Ubud', 'Indonesia', 3, 1
FROM multi_city_packages p
WHERE p.operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
  AND p.title = 'Bali Cultural Journey: Ubud & Seminyak'
  AND p.status = 'published'
  AND NOT EXISTS (SELECT 1 FROM multi_city_package_cities c WHERE c.package_id = p.id AND c.city_order = 1)
ORDER BY p.created_at DESC
LIMIT 1;

INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order)
SELECT p.id, 'Seminyak', 'Indonesia', 2, 2
FROM multi_city_packages p
WHERE p.operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
  AND p.title = 'Bali Cultural Journey: Ubud & Seminyak'
  AND p.status = 'published'
  AND NOT EXISTS (SELECT 1 FROM multi_city_package_cities c WHERE c.package_id = p.id AND c.city_order = 2)
ORDER BY p.created_at DESC
LIMIT 1;
