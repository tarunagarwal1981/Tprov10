-- Direct SQL to fix packages by finding them and inserting cities
-- This uses a CTE to find the most recent package for each title and inserts cities

-- Fix Bali Beach & Culture: Kuta & Ubud
WITH package_to_fix AS (
  SELECT id
  FROM multi_city_packages
  WHERE operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
    AND title = 'Bali Beach & Culture: Kuta & Ubud'
    AND status = 'published'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order)
SELECT id, 'Kuta', 'Indonesia', 2, 1 FROM package_to_fix
WHERE NOT EXISTS (
  SELECT 1 FROM multi_city_package_cities c 
  WHERE c.package_id = package_to_fix.id AND c.city_order = 1
);

WITH package_to_fix AS (
  SELECT id
  FROM multi_city_packages
  WHERE operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
    AND title = 'Bali Beach & Culture: Kuta & Ubud'
    AND status = 'published'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order)
SELECT id, 'Ubud', 'Indonesia', 2, 2 FROM package_to_fix
WHERE NOT EXISTS (
  SELECT 1 FROM multi_city_package_cities c 
  WHERE c.package_id = package_to_fix.id AND c.city_order = 2
);

-- Fix Bali Extended Adventure: Kuta, Ubud & Legian
WITH package_to_fix AS (
  SELECT id
  FROM multi_city_packages
  WHERE operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
    AND title = 'Bali Extended Adventure: Kuta, Ubud & Legian'
    AND status = 'published'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order)
SELECT id, 'Kuta', 'Indonesia', 2, 1 FROM package_to_fix
WHERE NOT EXISTS (
  SELECT 1 FROM multi_city_package_cities c 
  WHERE c.package_id = package_to_fix.id AND c.city_order = 1
);

WITH package_to_fix AS (
  SELECT id
  FROM multi_city_packages
  WHERE operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
    AND title = 'Bali Extended Adventure: Kuta, Ubud & Legian'
    AND status = 'published'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order)
SELECT id, 'Ubud', 'Indonesia', 2, 2 FROM package_to_fix
WHERE NOT EXISTS (
  SELECT 1 FROM multi_city_package_cities c 
  WHERE c.package_id = package_to_fix.id AND c.city_order = 2
);

WITH package_to_fix AS (
  SELECT id
  FROM multi_city_packages
  WHERE operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
    AND title = 'Bali Extended Adventure: Kuta, Ubud & Legian'
    AND status = 'published'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order)
SELECT id, 'Legian', 'Indonesia', 2, 3 FROM package_to_fix
WHERE NOT EXISTS (
  SELECT 1 FROM multi_city_package_cities c 
  WHERE c.package_id = package_to_fix.id AND c.city_order = 3
);

-- Fix Bali Cultural Journey: Ubud & Seminyak
WITH package_to_fix AS (
  SELECT id
  FROM multi_city_packages
  WHERE operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
    AND title = 'Bali Cultural Journey: Ubud & Seminyak'
    AND status = 'published'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order)
SELECT id, 'Ubud', 'Indonesia', 3, 1 FROM package_to_fix
WHERE NOT EXISTS (
  SELECT 1 FROM multi_city_package_cities c 
  WHERE c.package_id = package_to_fix.id AND c.city_order = 1
);

WITH package_to_fix AS (
  SELECT id
  FROM multi_city_packages
  WHERE operator_id = (SELECT id FROM users WHERE email = 'operator@gmail.com')
    AND title = 'Bali Cultural Journey: Ubud & Seminyak'
    AND status = 'published'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO multi_city_package_cities (package_id, name, country, nights, city_order)
SELECT id, 'Seminyak', 'Indonesia', 2, 2 FROM package_to_fix
WHERE NOT EXISTS (
  SELECT 1 FROM multi_city_package_cities c 
  WHERE c.package_id = package_to_fix.id AND c.city_order = 2
);
