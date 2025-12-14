/**
 * Script to properly link cities to packages by finding the actual package IDs
 */

const { query } = require('../src/lib/aws/lambda-database');

async function fixPackageCities() {
  try {
    console.log('Finding packages and linking cities...\n');
    
    // Get operator ID
    const operatorResult = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      ['operator@gmail.com']
    );
    
    const operatorId = operatorResult.rows[0].id;
    console.log(`Operator ID: ${operatorId}\n`);

    // Get the most recent Bali packages (by title, we'll match them)
    const packageTitles = [
      'Bali Beach & Culture: Kuta & Ubud',
      'Bali Extended Adventure: Kuta, Ubud & Legian',
      'Bali Cultural Journey: Ubud & Seminyak'
    ];

    const cityDefinitions = {
      'Bali Beach & Culture: Kuta & Ubud': [
        { name: 'Kuta', nights: 2, country: 'Indonesia' },
        { name: 'Ubud', nights: 2, country: 'Indonesia' }
      ],
      'Bali Extended Adventure: Kuta, Ubud & Legian': [
        { name: 'Kuta', nights: 2, country: 'Indonesia' },
        { name: 'Ubud', nights: 2, country: 'Indonesia' },
        { name: 'Legian', nights: 2, country: 'Indonesia' }
      ],
      'Bali Cultural Journey: Ubud & Seminyak': [
        { name: 'Ubud', nights: 3, country: 'Indonesia' },
        { name: 'Seminyak', nights: 2, country: 'Indonesia' }
      ]
    };

    for (const title of packageTitles) {
      console.log(`\nProcessing: ${title}`);
      
      // Get the package - try to get the actual ID by using a subquery
      const pkgResult = await query(
        `SELECT id, title, status
         FROM multi_city_packages
         WHERE operator_id = $1 AND title = $2 AND status = 'published'
         ORDER BY created_at DESC
         LIMIT 1`,
        [operatorId, title]
      );

      if (!pkgResult.rows || pkgResult.rows.length === 0) {
        console.log(`  ⚠️  Package not found`);
        continue;
      }

      // The ID might be in a different format, let's try to get it
      const pkg = pkgResult.rows[0];
      console.log(`  Package found:`, {
        id: pkg.id,
        idType: typeof pkg.id,
        title: pkg.title,
        status: pkg.status
      });

      // Try to get cities count
      const cityCountResult = await query(
        `SELECT COUNT(*) as count
         FROM multi_city_package_cities
         WHERE package_id = $1`,
        [pkg.id]
      );

      const cityCount = parseInt(cityCountResult.rows[0]?.count || '0');
      console.log(`  Current city count: ${cityCount}`);

      if (cityCount > 0) {
        console.log(`  ✓ Package already has cities`);
        continue;
      }

      // If no cities, add them
      const cities = cityDefinitions[title];
      if (!cities) {
        console.log(`  ⚠️  No city definition found`);
        continue;
      }

      console.log(`  Adding ${cities.length} cities...`);
      for (const [index, city] of cities.entries()) {
        try {
          const insertResult = await query(
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
          console.log(`    ✓ Added: ${city.name} (${city.nights} nights)`);
        } catch (error) {
          console.error(`    ✗ Failed to add ${city.name}:`, error.message);
        }
      }
    }

    console.log('\n✅ Fix complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

if (require.main === module) {
  fixPackageCities()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { fixPackageCities };
