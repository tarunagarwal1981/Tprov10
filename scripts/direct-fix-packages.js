/**
 * Direct fix: Get package IDs and insert cities using raw SQL
 */

const { query } = require('../src/lib/aws/lambda-database');

async function directFixPackages() {
  try {
    console.log('Directly fixing packages...\n');
    
    const operatorResult = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      ['operator@gmail.com']
    );
    
    const operatorId = operatorResult.rows[0].id;
    console.log(`Operator ID: ${operatorId}\n`);

    // Get the most recent package for each title
    const packagesToFix = [
      {
        title: 'Bali Beach & Culture: Kuta & Ubud',
        cities: [
          { name: 'Kuta', nights: 2, country: 'Indonesia', order: 1 },
          { name: 'Ubud', nights: 2, country: 'Indonesia', order: 2 }
        ]
      },
      {
        title: 'Bali Extended Adventure: Kuta, Ubud & Legian',
        cities: [
          { name: 'Kuta', nights: 2, country: 'Indonesia', order: 1 },
          { name: 'Ubud', nights: 2, country: 'Indonesia', order: 2 },
          { name: 'Legian', nights: 2, country: 'Indonesia', order: 3 }
        ]
      },
      {
        title: 'Bali Cultural Journey: Ubud & Seminyak',
        cities: [
          { name: 'Ubud', nights: 3, country: 'Indonesia', order: 1 },
          { name: 'Seminyak', nights: 2, country: 'Indonesia', order: 2 }
        ]
      }
    ];

    for (const pkgDef of packagesToFix) {
      console.log(`\nProcessing: ${pkgDef.title}`);
      
      // Get the package ID using a direct query that should return the ID properly
      const pkgResult = await query(
        `SELECT id::text as package_id_text, id
         FROM multi_city_packages
         WHERE operator_id = $1 AND title = $2 AND status = 'published'
         ORDER BY created_at DESC
         LIMIT 1`,
        [operatorId, pkgDef.title]
      );

      if (!pkgResult.rows || pkgResult.rows.length === 0) {
        console.log(`  ⚠️  Package not found`);
        continue;
      }

      const pkg = pkgResult.rows[0];
      const packageId = pkg.id || pkg.package_id_text;
      
      console.log(`  Package ID: ${packageId} (type: ${typeof packageId})`);

      // Check current cities
      const cityCheck = await query(
        `SELECT COUNT(*) as count FROM multi_city_package_cities WHERE package_id = $1`,
        [packageId]
      );
      const currentCount = parseInt(cityCheck.rows[0]?.count || '0');
      console.log(`  Current cities: ${currentCount}`);

      if (currentCount > 0) {
        console.log(`  ✓ Package already has cities, skipping`);
        continue;
      }

      // Delete any orphaned cities first
      await query(
        `DELETE FROM multi_city_package_cities WHERE package_id = $1`,
        [packageId]
      );

      // Insert cities one by one
      for (const city of pkgDef.cities) {
        try {
          const insertResult = await query(
            `INSERT INTO multi_city_package_cities (
              id, package_id, name, country, nights, city_order
            ) VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)
            RETURNING id, name`,
            [packageId, city.name, city.country, city.nights, city.order]
          );
          
          if (insertResult.rows && insertResult.rows[0]) {
            console.log(`    ✓ Added: ${city.name} (${city.nights} nights)`);
          } else {
            console.log(`    ⚠️  Insert returned no rows for ${city.name}`);
          }
        } catch (error) {
          console.error(`    ✗ Failed to add ${city.name}:`, error.message);
          // Try without explicit ID
          try {
            await query(
              `INSERT INTO multi_city_package_cities (
                package_id, name, country, nights, city_order
              ) VALUES ($1, $2, $3, $4, $5)`,
              [packageId, city.name, city.country, city.nights, city.order]
            );
            console.log(`    ✓ Added (retry): ${city.name} (${city.nights} nights)`);
          } catch (retryError) {
            console.error(`    ✗ Retry also failed:`, retryError.message);
          }
        }
      }

      // Verify cities were added
      const verifyResult = await query(
        `SELECT name, nights, city_order 
         FROM multi_city_package_cities 
         WHERE package_id = $1 
         ORDER BY city_order`,
        [packageId]
      );
      console.log(`  Verification: ${verifyResult.rows.length} cities found`);
      verifyResult.rows.forEach((r) => {
        console.log(`    - ${r.name} (${r.nights} nights)`);
      });
    }

    console.log('\n✅ Direct fix complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

if (require.main === module) {
  directFixPackages()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { directFixPackages };
