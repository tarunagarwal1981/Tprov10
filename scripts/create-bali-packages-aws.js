/**
 * Script to create dummy multi-city and multi-city hotel packages for Bali destinations
 * Usage: node scripts/create-bali-packages-aws.js
 * 
 * This script creates packages for operator@gmail.com with:
 * - 2 nights Kuta, 2 nights Ubud
 * - 2 nights Kuta, 2 nights Ubud, 2 nights Legian
 * - And more combinations
 * - Includes transport options between cities
 * - Includes pricing for multiple people
 */

const { query } = require('../src/lib/aws/lambda-database');

async function createBaliPackages() {
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
        title: 'Bali Beach & Culture: Kuta & Ubud',
        shortDescription: 'Experience the best of Bali with beach vibes in Kuta and cultural immersion in Ubud',
        cities: [
          { name: 'Kuta', nights: 2, country: 'Indonesia', highlights: ['Beach activities', 'Surfing', 'Nightlife'], activities: ['Beach day', 'Surfing lesson'] },
          { name: 'Ubud', nights: 2, country: 'Indonesia', highlights: ['Rice terraces', 'Monkey Forest', 'Traditional markets'], activities: ['Temple visit', 'Cooking class'] }
        ],
        connections: [
          { from: 0, to: 1, transportType: 'CAR', transportClass: 'STANDARD', provider: 'Private Transfer', durationHours: 1.5, priceIncluded: true }
        ],
        basePrice: 450,
        pricingRows: [
          { adults: 1, children: 0, price: 450 },
          { adults: 2, children: 0, price: 800 },
          { adults: 2, children: 1, price: 950 },
          { adults: 4, children: 0, price: 1500 },
          { adults: 4, children: 2, price: 1800 }
        ]
      },
      {
        type: 'multi_city',
        title: 'Bali Extended Adventure: Kuta, Ubud & Legian',
        shortDescription: 'Comprehensive Bali tour covering beaches, culture, and relaxation',
        cities: [
          { name: 'Kuta', nights: 2, country: 'Indonesia', highlights: ['Beach activities', 'Surfing', 'Shopping'], activities: ['Beach day', 'Water sports'] },
          { name: 'Ubud', nights: 2, country: 'Indonesia', highlights: ['Rice terraces', 'Monkey Forest', 'Art galleries'], activities: ['Temple tour', 'Spa treatment'] },
          { name: 'Legian', nights: 2, country: 'Indonesia', highlights: ['Beach relaxation', 'Sunset views', 'Dining'], activities: ['Beach day', 'Sunset dinner'] }
        ],
        connections: [
          { from: 0, to: 1, transportType: 'CAR', transportClass: 'STANDARD', provider: 'Private Transfer', durationHours: 1.5, priceIncluded: true },
          { from: 1, to: 2, transportType: 'CAR', transportClass: 'STANDARD', provider: 'Private Transfer', durationHours: 1, priceIncluded: true }
        ],
        basePrice: 750,
        pricingRows: [
          { adults: 1, children: 0, price: 750 },
          { adults: 2, children: 0, price: 1400 },
          { adults: 2, children: 1, price: 1650 },
          { adults: 4, children: 0, price: 2600 },
          { adults: 4, children: 2, price: 3100 }
        ]
      },
      {
        type: 'multi_city',
        title: 'Bali Cultural Journey: Ubud & Seminyak',
        shortDescription: 'Explore Balinese culture in Ubud and enjoy luxury in Seminyak',
        cities: [
          { name: 'Ubud', nights: 3, country: 'Indonesia', highlights: ['Rice terraces', 'Traditional dance', 'Art villages'], activities: ['Temple tour', 'Cooking class', 'Yoga session'] },
          { name: 'Seminyak', nights: 2, country: 'Indonesia', highlights: ['Luxury resorts', 'Fine dining', 'Beach clubs'], activities: ['Beach day', 'Spa day'] }
        ],
        connections: [
          { from: 0, to: 1, transportType: 'CAR', transportClass: 'BUSINESS', provider: 'Premium Transfer', durationHours: 1, priceIncluded: true }
        ],
        basePrice: 650,
        pricingRows: [
          { adults: 1, children: 0, price: 650 },
          { adults: 2, children: 0, price: 1200 },
          { adults: 2, children: 1, price: 1420 },
          { adults: 4, children: 0, price: 2200 }
        ]
      },
      {
        type: 'multi_city_hotel',
        title: 'Bali Beach Hotels: Kuta & Ubud Stay',
        shortDescription: 'Comfortable hotel stays in Kuta and Ubud with included breakfast',
        cities: [
          { 
            name: 'Kuta', 
            nights: 2, 
            country: 'Indonesia', 
            highlights: ['Beachfront location', 'Swimming pool', 'Restaurants'],
            hotels: [
              { hotelName: 'Kuta Beach Hotel', hotelType: '3 Star', roomType: 'Standard Double', roomCapacityAdults: 2, roomCapacityChildren: 1 },
              { hotelName: 'Ocean View Resort', hotelType: '4 Star', roomType: 'Deluxe Room', roomCapacityAdults: 2, roomCapacityChildren: 2 }
            ]
          },
          { 
            name: 'Ubud', 
            nights: 2, 
            country: 'Indonesia', 
            highlights: ['Rice field views', 'Spa facilities', 'Cultural tours'],
            hotels: [
              { hotelName: 'Ubud Valley Resort', hotelType: '4 Star', roomType: 'Villa', roomCapacityAdults: 2, roomCapacityChildren: 1 },
              { hotelName: 'Green Valley Hotel', hotelType: '3 Star', roomType: 'Standard Room', roomCapacityAdults: 2, roomCapacityChildren: 1 }
            ]
          }
        ],
        connections: [
          { from: 0, to: 1, transportType: 'CAR', transportClass: 'STANDARD', provider: 'Hotel Transfer', durationHours: 1.5, priceIncluded: true }
        ],
        adultPrice: 120,
        pricingRows: [
          { adults: 1, children: 0, price: 120 },
          { adults: 2, children: 0, price: 220 },
          { adults: 2, children: 1, price: 280 },
          { adults: 4, children: 0, price: 420 }
        ]
      },
      {
        type: 'multi_city_hotel',
        title: 'Bali Extended Stay: Kuta, Ubud & Legian Hotels',
        shortDescription: 'Multi-city hotel package with transfers between destinations',
        cities: [
          { 
            name: 'Kuta', 
            nights: 2, 
            country: 'Indonesia',
            highlights: ['Beach access', 'Pool facilities'],
            hotels: [
              { hotelName: 'Kuta Paradise Hotel', hotelType: '3 Star', roomType: 'Standard Double', roomCapacityAdults: 2, roomCapacityChildren: 1 }
            ]
          },
          { 
            name: 'Ubud', 
            nights: 2, 
            country: 'Indonesia',
            highlights: ['Mountain views', 'Cultural activities'],
            hotels: [
              { hotelName: 'Ubud Heritage Hotel', hotelType: '4 Star', roomType: 'Deluxe Room', roomCapacityAdults: 2, roomCapacityChildren: 2 }
            ]
          },
          { 
            name: 'Legian', 
            nights: 2, 
            country: 'Indonesia',
            highlights: ['Beachfront', 'Sunset views'],
            hotels: [
              { hotelName: 'Legian Beach Resort', hotelType: '4 Star', roomType: 'Ocean View Room', roomCapacityAdults: 2, roomCapacityChildren: 1 }
            ]
          }
        ],
        connections: [
          { from: 0, to: 1, transportType: 'CAR', transportClass: 'STANDARD', provider: 'Hotel Transfer', durationHours: 1.5, priceIncluded: true },
          { from: 1, to: 2, transportType: 'CAR', transportClass: 'STANDARD', provider: 'Hotel Transfer', durationHours: 1, priceIncluded: true }
        ],
        adultPrice: 180,
        pricingRows: [
          { adults: 1, children: 0, price: 180 },
          { adults: 2, children: 0, price: 340 },
          { adults: 2, children: 1, price: 420 },
          { adults: 4, children: 0, price: 640 }
        ]
      }
    ];
    
    console.log(`\nCreating ${packages.length} packages...\n`);
    
    for (const pkg of packages) {
      try {
        if (pkg.type === 'multi_city') {
          const totalNights = pkg.cities.reduce((sum, c) => sum + c.nights, 0);
          const totalDays = totalNights + 1; // Add travel day
          
          // Insert main package
          const result = await query(
            `INSERT INTO multi_city_packages (
              operator_id, title, short_description, destination_region,
              base_price, currency, total_nights, total_days, total_cities, status, published_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id`,
            [
              operatorId,
              pkg.title,
              pkg.shortDescription,
              'Bali, Indonesia',
              pkg.basePrice,
              'USD',
              totalNights,
              totalDays,
              pkg.cities.length,
              'published',
              new Date().toISOString()
            ]
          );
          
          if (!result.rows || !result.rows[0]) {
            throw new Error('Failed to create package');
          }
          
          const packageId = result.rows[0].id;
          const cityIdMap = {};
          
          // Insert cities
          for (const [index, city] of pkg.cities.entries()) {
            const cityResult = await query(
              `INSERT INTO multi_city_package_cities (
                package_id, name, country, nights, highlights, activities_included, city_order
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING id`,
              [
                packageId,
                city.name,
                city.country,
                city.nights,
                city.highlights ? JSON.stringify(city.highlights) : null,
                city.activities ? JSON.stringify(city.activities) : null,
                index + 1
              ]
            );
            
            if (cityResult.rows && cityResult.rows[0]) {
              cityIdMap[index] = cityResult.rows[0].id;
            }
          }
          
          // Insert transport connections
          if (pkg.connections && pkg.connections.length > 0) {
            for (const conn of pkg.connections) {
              const fromCityId = cityIdMap[conn.from];
              const toCityId = cityIdMap[conn.to];
              
              if (fromCityId && toCityId) {
                await query(
                  `INSERT INTO multi_city_package_connections (
                    package_id, from_city_id, to_city_id, transport_type, transport_class,
                    provider, duration_hours, price_included
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                  [
                    packageId,
                    fromCityId,
                    toCityId,
                    conn.transportType,
                    conn.transportClass || 'STANDARD',
                    conn.provider || null,
                    conn.durationHours || 0,
                    conn.priceIncluded !== undefined ? conn.priceIncluded : true
                  ]
                );
              }
            }
          }
          
          // Insert pricing package
          const pricingResult = await query(
            `INSERT INTO multi_city_pricing_packages (
              package_id, package_name, pricing_type, has_child_age_restriction
            ) VALUES ($1, $2, $3, $4)
            RETURNING id`,
            [
              packageId,
              pkg.title,
              'SIC',
              false
            ]
          );
          
          if (pricingResult.rows && pricingResult.rows[0]) {
            const pricingPackageId = pricingResult.rows[0].id;
            
            // Insert pricing rows
            if (pkg.pricingRows && pkg.pricingRows.length > 0) {
              for (const [index, row] of pkg.pricingRows.entries()) {
                await query(
                  `INSERT INTO multi_city_pricing_rows (
                    pricing_package_id, number_of_adults, number_of_children, total_price, display_order
                  ) VALUES ($1, $2, $3, $4, $5)`,
                  [
                    pricingPackageId,
                    row.adults,
                    row.children || 0,
                    row.price,
                    index + 1
                  ]
                );
              }
            }
          }
          
          console.log(`✓ Created multi-city package: ${pkg.title} (${totalNights} nights, ${pkg.cities.length} cities, ${pkg.connections?.length || 0} connections)`);
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
              pkg.shortDescription,
              'Bali, Indonesia',
              pkg.adultPrice,
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
          const cityIdMap = {};
          
          // Insert cities with hotels
          for (const [index, city] of pkg.cities.entries()) {
            const cityResult = await query(
              `INSERT INTO multi_city_hotel_package_cities (
                package_id, name, country, nights, display_order
              ) VALUES ($1, $2, $3, $4, $5)
              RETURNING id`,
              [
                packageId,
                city.name,
                city.country,
                city.nights,
                index + 1
              ]
            );
            
            if (cityResult.rows && cityResult.rows[0]) {
              const cityId = cityResult.rows[0].id;
              cityIdMap[index] = cityId;
              
              // Insert hotels for this city
              if (city.hotels && city.hotels.length > 0) {
                for (const [hotelIndex, hotel] of city.hotels.entries()) {
                  await query(
                    `INSERT INTO multi_city_hotel_package_city_hotels (
                      city_id, hotel_name, hotel_type, room_type, room_capacity_adults, room_capacity_children, display_order
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                      cityId,
                      hotel.hotelName,
                      hotel.hotelType || null,
                      hotel.roomType,
                      hotel.roomCapacityAdults !== undefined ? hotel.roomCapacityAdults : null,
                      hotel.roomCapacityChildren !== undefined ? hotel.roomCapacityChildren : null,
                      hotelIndex + 1
                    ]
                  );
                }
              }
            }
          }
          
          // Note: Multi-city hotel packages don't have a separate connections table
          // Transport is typically handled through inclusions or day plans
          
          // Insert pricing package
          const pricingResult = await query(
            `INSERT INTO multi_city_hotel_pricing_packages (
              id, package_id, pricing_type
            ) VALUES (gen_random_uuid()::text, $1, $2)
            RETURNING id`,
            [
              packageId,
              'SIC'
            ]
          );
          
          if (pricingResult.rows && pricingResult.rows[0] && pricingResult.rows[0].id) {
            const pricingPackageId = pricingResult.rows[0].id;
            
            // Insert pricing rows
            if (pkg.pricingRows && pkg.pricingRows.length > 0) {
              for (const [index, row] of pkg.pricingRows.entries()) {
                await query(
                  `INSERT INTO multi_city_hotel_pricing_rows (
                    id, pricing_package_id, number_of_adults, number_of_children, total_price, display_order
                  ) VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)`,
                  [
                    pricingPackageId,
                    row.adults,
                    row.children || 0,
                    row.price,
                    index + 1
                  ]
                );
              }
            }
          } else {
            console.error('Failed to get pricing package ID for hotel package:', pkg.title);
          }
          
          console.log(`✓ Created multi-city hotel package: ${pkg.title} (${totalNights} nights, ${pkg.cities.length} cities, ${pkg.connections?.length || 0} connections)`);
        }
      } catch (error) {
        console.error(`✗ Failed to create package "${pkg.title}":`, error.message);
        console.error('Error details:', error);
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
createBaliPackages();
