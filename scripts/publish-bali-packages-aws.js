/**
 * Script to publish the Bali packages we created
 * Usage: npx ts-node scripts/publish-bali-packages-aws.js
 */

const { query } = require('../src/lib/aws/lambda-database');

async function publishBaliPackages() {
  try {
    console.log('Fetching operator ID...');
    
    // Get operator ID by email
    const operatorResult = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      ['operator@gmail.com']
    );
    
    if (!operatorResult.rows || operatorResult.rows.length === 0) {
      throw new Error('Operator with email operator@gmail.com not found.');
    }
    
    const operatorId = operatorResult.rows[0].id;
    console.log(`✓ Found operator ID: ${operatorId}\n`);

    // Update multi-city packages
    console.log('Publishing multi-city packages...');
    const multiCityResult = await query(
      `UPDATE multi_city_packages 
       SET status = 'published', published_at = NOW()
       WHERE operator_id = $1 AND status != 'published'`,
      [operatorId]
    );
    console.log(`✓ Updated ${multiCityResult.rowCount || 0} multi-city packages\n`);

    // Update multi-city hotel packages
    console.log('Publishing multi-city hotel packages...');
    const multiCityHotelResult = await query(
      `UPDATE multi_city_hotel_packages 
       SET status = 'published', published_at = NOW()
       WHERE operator_id = $1 AND status != 'published'`,
      [operatorId]
    );
    console.log(`✓ Updated ${multiCityHotelResult.rowCount || 0} multi-city hotel packages\n`);

    // Verify published packages
    console.log('Verifying published packages...');
    const verifyMultiCity = await query(
      `SELECT COUNT(*) as count FROM multi_city_packages 
       WHERE operator_id = $1 AND status = 'published'`,
      [operatorId]
    );
    const verifyMultiCityHotel = await query(
      `SELECT COUNT(*) as count FROM multi_city_hotel_packages 
       WHERE operator_id = $1 AND status = 'published'`,
      [operatorId]
    );

    console.log(`✓ Published multi-city packages: ${verifyMultiCity.rows[0]?.count || 0}`);
    console.log(`✓ Published multi-city hotel packages: ${verifyMultiCityHotel.rows[0]?.count || 0}\n`);

    // Show package details
    console.log('Package details:');
    const packageDetails = await query(
      `SELECT p.id, p.title, p.status, 
              array_agg(c.name ORDER BY c.city_order) as cities,
              array_agg(c.nights ORDER BY c.city_order) as nights
       FROM multi_city_packages p
       LEFT JOIN multi_city_package_cities c ON c.package_id = p.id
       WHERE p.operator_id = $1 AND p.status = 'published'
       GROUP BY p.id, p.title, p.status
       ORDER BY p.title`,
      [operatorId]
    );

    packageDetails.rows.forEach((pkg) => {
      console.log(`  - ${pkg.title}: ${pkg.cities.filter((c) => c).join(' → ')}`);
    });

    const hotelPackageDetails = await query(
      `SELECT p.id, p.title, p.status, 
              array_agg(c.name ORDER BY c.display_order) as cities,
              array_agg(c.nights ORDER BY c.display_order) as nights
       FROM multi_city_hotel_packages p
       LEFT JOIN multi_city_hotel_package_cities c ON c.package_id = p.id
       WHERE p.operator_id = $1 AND p.status = 'published'
       GROUP BY p.id, p.title, p.status
       ORDER BY p.title`,
      [operatorId]
    );

    hotelPackageDetails.rows.forEach((pkg) => {
      console.log(`  - ${pkg.title}: ${pkg.cities.filter((c) => c).join(' → ')}`);
    });

    console.log('\n✅ All packages published successfully!');
  } catch (error) {
    console.error('❌ Error publishing packages:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  publishBaliPackages()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { publishBaliPackages };
