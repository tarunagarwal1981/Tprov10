/**
 * Recreate Bali packages properly - delete old ones and create fresh with proper linking
 */

const { query } = require('../src/lib/aws/lambda-database');

async function recreatePackages() {
  try {
    console.log('Recreating Bali packages properly...\n');
    
    const operatorResult = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      ['operator@gmail.com']
    );
    
    const operatorId = operatorResult.rows[0].id;
    console.log(`Operator ID: ${operatorId}\n`);

    // Delete old packages
    console.log('Deleting old packages...');
    await query(
      `DELETE FROM multi_city_packages
       WHERE operator_id = $1 
       AND title IN (
         'Bali Beach & Culture: Kuta & Ubud',
         'Bali Extended Adventure: Kuta, Ubud & Legian',
         'Bali Cultural Journey: Ubud & Seminyak'
       )`,
      [operatorId]
    );
    console.log('✓ Old packages deleted\n');

    // Create packages with proper structure
    const packages = [
      {
        title: 'Bali Beach & Culture: Kuta & Ubud',
        shortDescription: 'Experience the best of Bali with beach vibes in Kuta and cultural immersion in Ubud',
        cities: [
          { name: 'Kuta', nights: 2, country: 'Indonesia' },
          { name: 'Ubud', nights: 2, country: 'Indonesia' }
        ],
        basePrice: 450
      },
      {
        title: 'Bali Extended Adventure: Kuta, Ubud & Legian',
        shortDescription: 'Comprehensive Bali tour covering beaches, culture, and relaxation',
        cities: [
          { name: 'Kuta', nights: 2, country: 'Indonesia' },
          { name: 'Ubud', nights: 2, country: 'Indonesia' },
          { name: 'Legian', nights: 2, country: 'Indonesia' }
        ],
        basePrice: 750
      },
      {
        title: 'Bali Cultural Journey: Ubud & Seminyak',
        shortDescription: 'Explore Balinese culture in Ubud and enjoy luxury in Seminyak',
        cities: [
          { name: 'Ubud', nights: 3, country: 'Indonesia' },
          { name: 'Seminyak', nights: 2, country: 'Indonesia' }
        ],
        basePrice: 650
      }
    ];

    for (const pkg of packages) {
      console.log(`Creating: ${pkg.title}`);
      
      const totalNights = pkg.cities.reduce((sum, c) => sum + c.nights, 0);
      const totalDays = totalNights + 1;
      
      // Insert package
      const pkgResult = await query(
        `INSERT INTO multi_city_packages (
          id, operator_id, title, short_description, destination_region,
          base_price, currency, total_nights, total_days, total_cities, status, published_at
        ) VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
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
          'published'
        ]
      );

      if (!pkgResult.rows || !pkgResult.rows[0] || !pkgResult.rows[0].id) {
        throw new Error(`Failed to create package: ${pkg.title}`);
      }

      const packageId = pkgResult.rows[0].id;
      console.log(`  Package ID: ${packageId}`);

      // Insert cities immediately
      for (const [index, city] of pkg.cities.entries()) {
        await query(
          `INSERT INTO multi_city_package_cities (
            id, package_id, name, country, nights, city_order
          ) VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)`,
          [packageId, city.name, city.country, city.nights, index + 1]
        );
        console.log(`  ✓ Added: ${city.name} (${city.nights} nights)`);
      }

      // Verify cities
      const verifyResult = await query(
        `SELECT COUNT(*) as count FROM multi_city_package_cities WHERE package_id = $1`,
        [packageId]
      );
      console.log(`  Verification: ${verifyResult.rows[0]?.count || 0} cities\n`);
    }

    console.log('✅ All packages recreated successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

if (require.main === module) {
  recreatePackages()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { recreatePackages };
