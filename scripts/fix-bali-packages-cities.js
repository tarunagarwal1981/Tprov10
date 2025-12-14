/**
 * Script to fix the Bali packages by adding missing cities
 */

const { query } = require('../src/lib/aws/lambda-database');

async function fixBaliPackages() {
  try {
    console.log('Finding Bali packages without cities...\n');
    
    // Get operator ID
    const operatorResult = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      ['operator@gmail.com']
    );
    
    const operatorId = operatorResult.rows[0].id;

    // Find packages without cities
    const packagesWithoutCities = await query(
      `SELECT p.id, p.title
       FROM multi_city_packages p
       WHERE p.operator_id = $1 
       AND p.title LIKE 'Bali%'
       AND NOT EXISTS (
         SELECT 1 FROM multi_city_package_cities c WHERE c.package_id = p.id
       )
       ORDER BY p.title`,
      [operatorId]
    );

    console.log(`Found ${packagesWithoutCities.rows.length} packages without cities\n`);

    // Package definitions to match
    const packageDefinitions = {
      'Bali Beach & Culture: Kuta & Ubud': {
        cities: [
          { name: 'Kuta', nights: 2, country: 'Indonesia' },
          { name: 'Ubud', nights: 2, country: 'Indonesia' }
        ]
      },
      'Bali Extended Adventure: Kuta, Ubud & Legian': {
        cities: [
          { name: 'Kuta', nights: 2, country: 'Indonesia' },
          { name: 'Ubud', nights: 2, country: 'Indonesia' },
          { name: 'Legian', nights: 2, country: 'Indonesia' }
        ]
      },
      'Bali Cultural Journey: Ubud & Seminyak': {
        cities: [
          { name: 'Ubud', nights: 3, country: 'Indonesia' },
          { name: 'Seminyak', nights: 2, country: 'Indonesia' }
        ]
      }
    };

    for (const pkg of packagesWithoutCities.rows) {
      const definition = packageDefinitions[pkg.title];
      if (!definition) {
        console.log(`⚠️  No definition found for: ${pkg.title}`);
        continue;
      }

      console.log(`Adding cities to: ${pkg.title}`);
      
      for (const [index, city] of definition.cities.entries()) {
        try {
          await query(
            `INSERT INTO multi_city_package_cities (
              package_id, name, country, nights, city_order
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING id`,
            [
              pkg.id,
              city.name,
              city.country,
              city.nights,
              index + 1
            ]
          );
          console.log(`  ✓ Added: ${city.name} (${city.nights} nights)`);
        } catch (error) {
          console.error(`  ✗ Failed to add ${city.name}:`, error.message);
        }
      }
      console.log('');
    }

    // Fix hotel packages
    const hotelPackagesWithoutCities = await query(
      `SELECT p.id, p.title
       FROM multi_city_hotel_packages p
       WHERE p.operator_id = $1 
       AND p.title LIKE 'Bali%'
       AND NOT EXISTS (
         SELECT 1 FROM multi_city_hotel_package_cities c WHERE c.package_id = p.id
       )
       ORDER BY p.title`,
      [operatorId]
    );

    console.log(`Found ${hotelPackagesWithoutCities.rows.length} hotel packages without cities\n`);

    const hotelPackageDefinitions = {
      'Bali Beach Hotels: Kuta & Ubud Stay': {
        cities: [
          { name: 'Kuta', nights: 2, country: 'Indonesia' },
          { name: 'Ubud', nights: 2, country: 'Indonesia' }
        ]
      },
      'Bali Extended Stay: Kuta, Ubud & Legian Hotels': {
        cities: [
          { name: 'Kuta', nights: 2, country: 'Indonesia' },
          { name: 'Ubud', nights: 2, country: 'Indonesia' },
          { name: 'Legian', nights: 2, country: 'Indonesia' }
        ]
      }
    };

    for (const pkg of hotelPackagesWithoutCities.rows) {
      const definition = hotelPackageDefinitions[pkg.title];
      if (!definition) {
        console.log(`⚠️  No definition found for: ${pkg.title}`);
        continue;
      }

      console.log(`Adding cities to: ${pkg.title}`);
      
      for (const [index, city] of definition.cities.entries()) {
        try {
          await query(
            `INSERT INTO multi_city_hotel_package_cities (
              package_id, name, country, nights, display_order
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING id`,
            [
              pkg.id,
              city.name,
              city.country,
              city.nights,
              index + 1
            ]
          );
          console.log(`  ✓ Added: ${city.name} (${city.nights} nights)`);
        } catch (error) {
          console.error(`  ✗ Failed to add ${city.name}:`, error.message);
        }
      }
      console.log('');
    }

    console.log('✅ Fix complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

if (require.main === module) {
  fixBaliPackages()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { fixBaliPackages };
