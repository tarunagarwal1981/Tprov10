/**
 * Script to verify package cities are correctly stored
 */

const { query } = require('../src/lib/aws/lambda-database');

async function verifyPackageCities() {
  try {
    console.log('Verifying package cities...\n');
    
    // Get operator ID
    const operatorResult = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      ['operator@gmail.com']
    );
    
    const operatorId = operatorResult.rows[0].id;

    // Check multi-city packages
    console.log('Multi-City Packages:');
    const multiCityResult = await query(
      `SELECT p.id, p.title, p.status, c.name as city_name, c.nights, c.city_order
       FROM multi_city_packages p
       LEFT JOIN multi_city_package_cities c ON c.package_id = p.id
       WHERE p.operator_id = $1 AND p.status = 'published'
       ORDER BY p.title, c.city_order`,
      [operatorId]
    );

    let currentPackage = null;
    multiCityResult.rows.forEach((row) => {
      if (currentPackage !== row.title) {
        if (currentPackage !== null) console.log('');
        console.log(`  ${row.title} (${row.status}):`);
        currentPackage = row.title;
      }
      if (row.city_name) {
        console.log(`    - ${row.city_name} (${row.nights} nights)`);
      }
    });

    console.log('\n\nMulti-City Hotel Packages:');
    const hotelResult = await query(
      `SELECT p.id, p.title, p.status, c.name as city_name, c.nights, c.display_order
       FROM multi_city_hotel_packages p
       LEFT JOIN multi_city_hotel_package_cities c ON c.package_id = p.id
       WHERE p.operator_id = $1 AND p.status = 'published'
       ORDER BY p.title, c.display_order`,
      [operatorId]
    );

    currentPackage = null;
    hotelResult.rows.forEach((row) => {
      if (currentPackage !== row.title) {
        if (currentPackage !== null) console.log('');
        console.log(`  ${row.title} (${row.status}):`);
        currentPackage = row.title;
      }
      if (row.city_name) {
        console.log(`    - ${row.city_name} (${row.nights} nights)`);
      }
    });

    console.log('\n✅ Verification complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

if (require.main === module) {
  verifyPackageCities()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { verifyPackageCities };
