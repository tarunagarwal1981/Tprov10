/**
 * Script to create dummy multi-city and multi-city hotel packages for testing
 * Usage: node scripts/create-dummy-packages-aws.js
 * 
 * This script creates 5 dummy packages (3 multi-city, 2 multi-city hotel)
 * for operator@gmail.com to test the itinerary insertion flow
 */

const { query } = require('../src/lib/aws/lambda-database');

async function createDummyPackages() {
  try {
    console.log('Fetching operator ID...');
    
    // Get operator ID by email
    const operatorResult = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      ['operator@gmail.com']
    );
    
    if (!operatorResult.rows || operatorResult.rows.length === 0) {
      throw new Error('Operator with email operator@gmail.com not found. Please create the operator first.');
    }
    
    const operatorId = operatorResult.rows[0].id;
    console.log(`✓ Found operator ID: ${operatorId}`);
    
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
        type: 'multi_city',
        title: 'Philippines Island Explorer',
        cities: [
          { name: 'Manila', nights: 2, country: 'Philippines' },
          { name: 'Cebu', nights: 4, country: 'Philippines' },
          { name: 'Boracay', nights: 3, country: 'Philippines' }
        ],
        base_price: 1100
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
      }
    ];
    
    console.log(`\nCreating ${packages.length} packages...\n`);
    
    for (const pkg of packages) {
      try {
        if (pkg.type === 'multi_city') {
          const totalNights = pkg.cities.reduce((sum, c) => sum + c.nights, 0);
          
          // Insert main package
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
          
          if (!result.rows || !result.rows[0]) {
            throw new Error('Failed to create package');
          }
          
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
          
          console.log(`✓ Created multi-city package: ${pkg.title} (${totalNights} nights, ${pkg.cities.length} cities)`);
        } else if (pkg.type === 'multi_city_hotel') {
          const totalNights = pkg.cities.reduce((sum, c) => sum + c.nights, 0);
          
          // Insert main package
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
          
          if (!result.rows || !result.rows[0]) {
            throw new Error('Failed to create package');
          }
          
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
          
          console.log(`✓ Created multi-city hotel package: ${pkg.title} (${totalNights} nights, ${pkg.cities.length} cities)`);
        }
      } catch (error) {
        console.error(`✗ Failed to create package "${pkg.title}":`, error.message);
      }
    }
    
    console.log('\n✓ All packages created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating packages:', error);
    process.exit(1);
  }
}

// Run the script
createDummyPackages();
