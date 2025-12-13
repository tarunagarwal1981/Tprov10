#!/bin/bash

# Script to create dummy multi-city and multi-city hotel packages for testing
# Usage: ./scripts/create-dummy-packages.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Creating dummy packages for operator@gmail.com...${NC}"

# Get operator ID by email
echo -e "${YELLOW}Fetching operator ID...${NC}"
OPERATOR_ID=$(aws lambda invoke \
  --function-name database-query \
  --payload '{"query": "SELECT id FROM users WHERE email = $1 LIMIT 1", "params": ["operator@gmail.com"]}' \
  --cli-binary-format raw-in-base64-out \
  /dev/stdout | jq -r '.body | fromjson | .rows[0].id // empty')

if [ -z "$OPERATOR_ID" ]; then
  echo -e "${RED}Error: Could not find operator@gmail.com in users table${NC}"
  exit 1
fi

echo -e "${GREEN}Found operator ID: $OPERATOR_ID${NC}"

# Function to create a multi-city package
create_multi_city_package() {
  local title=$1
  local cities=$2
  local base_price=$3
  
  echo -e "${YELLOW}Creating multi-city package: $title${NC}"
  
  # Prepare cities data
  local cities_json=$(echo "$cities" | jq -c '.')
  
  # Create package via API (we'll use curl to call the API route)
  # For now, we'll create a SQL script that can be executed
  cat >> /tmp/create_packages.sql <<EOF
-- Package: $title
INSERT INTO multi_city_packages (
  operator_id, title, short_description, destination_region,
  base_price, currency, total_nights, total_cities, status, published_at
) VALUES (
  '$OPERATOR_ID',
  '$title',
  'Dummy package for testing itinerary insertion',
  'Southeast Asia',
  $base_price,
  'USD',
  $(echo "$cities" | jq '[.[].nights] | add'),
  $(echo "$cities" | jq 'length'),
  'published',
  NOW()
) RETURNING id;
EOF
}

# Function to create a multi-city hotel package
create_multi_city_hotel_package() {
  local title=$1
  local cities=$2
  local adult_price=$3
  
  echo -e "${YELLOW}Creating multi-city hotel package: $title${NC}"
  
  cat >> /tmp/create_packages.sql <<EOF
-- Hotel Package: $title
INSERT INTO multi_city_hotel_packages (
  operator_id, title, short_description, destination_region,
  adult_price, currency, total_nights, total_cities, status, published_at
) VALUES (
  '$OPERATOR_ID',
  '$title',
  'Dummy hotel package for testing itinerary insertion',
  'Southeast Asia',
  $adult_price,
  'USD',
  $(echo "$cities" | jq '[.[].nights] | add'),
  $(echo "$cities" | jq 'length'),
  'published',
  NOW()
) RETURNING id;
EOF
}

# Clear previous SQL file
rm -f /tmp/create_packages.sql

# Create packages
echo -e "${BLUE}Preparing package data...${NC}"

# Package 1: Multi-city - Bali to Jakarta (3 cities, 7 nights)
create_multi_city_package \
  "Bali-Jakarta Adventure" \
  '[{"name": "Bali", "nights": 3, "country": "Indonesia"}, {"name": "Yogyakarta", "nights": 2, "country": "Indonesia"}, {"name": "Jakarta", "nights": 2, "country": "Indonesia"}]' \
  1200

# Package 2: Multi-city - Singapore to Malaysia (2 cities, 5 nights)
create_multi_city_package \
  "Singapore-Malaysia Discovery" \
  '[{"name": "Singapore", "nights": 3, "country": "Singapore"}, {"name": "Kuala Lumpur", "nights": 2, "country": "Malaysia"}]' \
  900

# Package 3: Multi-city Hotel - Thailand Beach Hopping (3 cities, 8 nights)
create_multi_city_hotel_package \
  "Thailand Beach Paradise" \
  '[{"name": "Bangkok", "nights": 2, "country": "Thailand"}, {"name": "Phuket", "nights": 4, "country": "Thailand"}, {"name": "Krabi", "nights": 2, "country": "Thailand"}]' \
  150

# Package 4: Multi-city Hotel - Vietnam Heritage Tour (4 cities, 10 nights)
create_multi_city_hotel_package \
  "Vietnam Heritage Journey" \
  '[{"name": "Hanoi", "nights": 2, "country": "Vietnam"}, {"name": "Halong Bay", "nights": 2, "country": "Vietnam"}, {"name": "Hue", "nights": 3, "country": "Vietnam"}, {"name": "Ho Chi Minh City", "nights": 3, "country": "Vietnam"}]' \
  180

# Package 5: Multi-city - Philippines Island Hopping (3 cities, 9 nights)
create_multi_city_package \
  "Philippines Island Explorer" \
  '[{"name": "Manila", "nights": 2, "country": "Philippines"}, {"name": "Cebu", "nights": 4, "country": "Philippines"}, {"name": "Boracay", "nights": 3, "country": "Philippines"}]' \
  1100

echo -e "${GREEN}Package SQL script created at /tmp/create_packages.sql${NC}"
echo -e "${BLUE}To execute, run the SQL commands via AWS CLI or your database client${NC}"

# For now, we'll create a Node.js script that uses the API routes
cat > scripts/create-dummy-packages.js <<'NODE_SCRIPT'
const { query } = require('../src/lib/aws/lambda-database');

async function createDummyPackages() {
  try {
    // Get operator ID
    const operatorResult = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      ['operator@gmail.com']
    );
    
    if (!operatorResult.rows || operatorResult.rows.length === 0) {
      throw new Error('Operator not found');
    }
    
    const operatorId = operatorResult.rows[0].id;
    console.log('Found operator ID:', operatorId);
    
    // Packages to create
    const packages = [
      {
        type: 'multi_city',
        title: 'Bali-Jakarta Adventure',
        cities: [
          { name: 'Bali', nights: 3, country: 'Indonesia' },
          { name: 'Yogyakarta', nights: 2, country: 'Indonesia' },
          { name: 'Jakarta', nights: 2, country: 'Indonesia' }
        ],
        base_price: 1200
      },
      {
        type: 'multi_city',
        title: 'Singapore-Malaysia Discovery',
        cities: [
          { name: 'Singapore', nights: 3, country: 'Singapore' },
          { name: 'Kuala Lumpur', nights: 2, country: 'Malaysia' }
        ],
        base_price: 900
      },
      {
        type: 'multi_city_hotel',
        title: 'Thailand Beach Paradise',
        cities: [
          { name: 'Bangkok', nights: 2, country: 'Thailand' },
          { name: 'Phuket', nights: 4, country: 'Thailand' },
          { name: 'Krabi', nights: 2, country: 'Thailand' }
        ],
        adult_price: 150
      },
      {
        type: 'multi_city_hotel',
        title: 'Vietnam Heritage Journey',
        cities: [
          { name: 'Hanoi', nights: 2, country: 'Vietnam' },
          { name: 'Halong Bay', nights: 2, country: 'Vietnam' },
          { name: 'Hue', nights: 3, country: 'Vietnam' },
          { name: 'Ho Chi Minh City', nights: 3, country: 'Vietnam' }
        ],
        adult_price: 180
      },
      {
        type: 'multi_city',
        title: 'Philippines Island Explorer',
        cities: [
          { name: 'Manila', nights: 2, country: 'Philippines' },
          { name: 'Cebu', nights: 4, country: 'Philippines' },
          { name: 'Boracay', nights: 3, country: 'Philippines' }
        ],
        base_price: 1100
      }
    ];
    
    console.log(`Creating ${packages.length} packages...`);
    
    for (const pkg of packages) {
      if (pkg.type === 'multi_city') {
        const totalNights = pkg.cities.reduce((sum, c) => sum + c.nights, 0);
        const result = await query(
          `INSERT INTO multi_city_packages (
            operator_id, title, short_description, destination_region,
            base_price, currency, total_nights, total_cities, status, published_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id`,
          [
            operatorId,
            pkg.title,
            'Dummy package for testing itinerary insertion',
            'Southeast Asia',
            pkg.base_price,
            'USD',
            totalNights,
            pkg.cities.length,
            'published',
            new Date().toISOString()
          ]
        );
        
        const packageId = result.rows[0].id;
        
        // Insert cities
        for (const [index, city] of pkg.cities.entries()) {
          await query(
            `INSERT INTO multi_city_package_cities (
              package_id, name, country, nights, city_order
            ) VALUES ($1, $2, $3, $4, $5)`,
            [packageId, city.name, city.country, city.nights, index + 1]
          );
        }
        
        console.log(`✓ Created multi-city package: ${pkg.title}`);
      } else if (pkg.type === 'multi_city_hotel') {
        const totalNights = pkg.cities.reduce((sum, c) => sum + c.nights, 0);
        const result = await query(
          `INSERT INTO multi_city_hotel_packages (
            operator_id, title, short_description, destination_region,
            adult_price, currency, total_nights, total_cities, status, published_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id`,
          [
            operatorId,
            pkg.title,
            'Dummy hotel package for testing itinerary insertion',
            'Southeast Asia',
            pkg.adult_price,
            'USD',
            totalNights,
            pkg.cities.length,
            'published',
            new Date().toISOString()
          ]
        );
        
        const packageId = result.rows[0].id;
        
        // Insert cities
        for (const [index, city] of pkg.cities.entries()) {
          await query(
            `INSERT INTO multi_city_hotel_package_cities (
              package_id, name, country, nights, display_order
            ) VALUES ($1, $2, $3, $4, $5)`,
            [packageId, city.name, city.country, city.nights, index + 1]
          );
        }
        
        console.log(`✓ Created multi-city hotel package: ${pkg.title}`);
      }
    }
    
    console.log('All packages created successfully!');
  } catch (error) {
    console.error('Error creating packages:', error);
    process.exit(1);
  }
}

createDummyPackages();
NODE_SCRIPT

echo -e "${GREEN}Created Node.js script at scripts/create-dummy-packages.js${NC}"
echo -e "${BLUE}To run: node scripts/create-dummy-packages.js${NC}"
