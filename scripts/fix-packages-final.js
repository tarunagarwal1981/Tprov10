/**
 * Final fix: Use a subquery to get package IDs and insert cities
 */

const { query } = require('../src/lib/aws/lambda-database');

async function fixPackagesFinal() {
  try {
    console.log('Fixing packages with subquery approach...\n');
    
    const operatorResult = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      ['operator@gmail.com']
    );
    
    const operatorId = operatorResult.rows[0].id;

    // Use a single query to insert cities for packages that don't have them
    const fixes = [
      {
        title: 'Bali Beach & Culture: Kuta & Ubud',
        cities: [
          { name: 'Kuta', nights: 2, order: 1 },
          { name: 'Ubud', nights: 2, order: 2 }
        ]
      },
      {
        title: 'Bali Extended Adventure: Kuta, Ubud & Legian',
        cities: [
          { name: 'Kuta', nights: 2, order: 1 },
          { name: 'Ubud', nights: 2, order: 2 },
          { name: 'Legian', nights: 2, order: 3 }
        ]
      },
      {
        title: 'Bali Cultural Journey: Ubud & Seminyak',
        cities: [
          { name: 'Ubud', nights: 3, order: 1 },
          { name: 'Seminyak', nights: 2, order: 2 }
        ]
      }
    ];

    for (const fix of fixes) {
      console.log(`\nFixing: ${fix.title}`);
      
      // Delete any existing cities for this package (in case they're orphaned)
      await query(
        `DELETE FROM multi_city_package_cities
         WHERE package_id IN (
           SELECT id FROM multi_city_packages
           WHERE operator_id = $1 AND title = $2 AND status = 'published'
         )`,
        [operatorId, fix.title]
      );

      // Insert cities using a subquery to get the package ID
      for (const city of fix.cities) {
        try {
          await query(
            `INSERT INTO multi_city_package_cities (
              package_id, name, country, nights, city_order
            )
            SELECT id, $3, 'Indonesia', $4, $5
            FROM multi_city_packages
            WHERE operator_id = $1 AND title = $2 AND status = 'published'
            AND NOT EXISTS (
              SELECT 1 FROM multi_city_package_cities c
              WHERE c.package_id = multi_city_packages.id AND c.city_order = $5
            )
            ORDER BY created_at DESC
            LIMIT 1`,
            [operatorId, fix.title, city.name, city.nights, city.order]
          );
          console.log(`  ✓ Added: ${city.name} (${city.nights} nights)`);
        } catch (error) {
          console.error(`  ✗ Failed: ${error.message}`);
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
  fixPackagesFinal()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { fixPackagesFinal };
