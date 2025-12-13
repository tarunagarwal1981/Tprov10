/**
 * Verify Itinerary Tables in AWS RDS
 * 
 * This script checks if all required tables for the itinerary flow exist in AWS RDS.
 * Run this from an EC2 instance or Lambda function that has access to RDS.
 * 
 * Usage:
 *   node scripts/verify-itinerary-tables.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.RDS_HOSTNAME || process.env.RDS_HOST,
  port: parseInt(process.env.RDS_PORT || '5432'),
  database: process.env.RDS_DATABASE || process.env.RDS_DB || 'postgres',
  user: process.env.RDS_USERNAME || process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

async function verifyTables() {
  console.log('🔍 Verifying itinerary-related tables in AWS RDS...\n');

  const requiredTables = [
    // Itinerary tables
    'itineraries',
    'itinerary_days',
    'itinerary_items',
    
    // Multi-city package tables
    'multi_city_packages',
    'multi_city_hotel_packages',
    'multi_city_pricing_packages',
    'multi_city_hotel_pricing_packages',
    'multi_city_pricing_rows',
    'multi_city_hotel_pricing_rows',
    'multi_city_private_package_rows',
    'multi_city_hotel_private_package_rows',
    'multi_city_package_day_plans',
    'multi_city_hotel_package_day_plans',
    'multi_city_package_cities',
    'multi_city_hotel_package_cities',
    'multi_city_hotel_package_city_hotels',
    'multi_city_package_images',
    'multi_city_hotel_package_images',
  ];

  const results = {
    exists: [],
    missing: [],
    hasTimeSlots: [],
    missingTimeSlots: [],
  };

  for (const tableName of requiredTables) {
    try {
      // Check if table exists
      const tableCheck = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [tableName]
      );

      if (tableCheck.rows[0].exists) {
        results.exists.push(tableName);
        console.log(`✅ ${tableName} - EXISTS`);

        // Check for time_slots column if it's itinerary_days
        if (tableName === 'itinerary_days') {
          const columnCheck = await pool.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = $1 
              AND column_name = 'time_slots'
            )`,
            [tableName]
          );

          if (columnCheck.rows[0].exists) {
            results.hasTimeSlots.push(tableName);
            console.log(`   ✅ time_slots column exists`);
          } else {
            results.missingTimeSlots.push(tableName);
            console.log(`   ⚠️  time_slots column missing (backward compatible)`);
          }
        }
      } else {
        results.missing.push(tableName);
        console.log(`❌ ${tableName} - MISSING`);
      }
    } catch (error) {
      console.error(`❌ Error checking ${tableName}:`, error.message);
      results.missing.push(tableName);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Tables found: ${results.exists.length}/${requiredTables.length}`);
  console.log(`❌ Tables missing: ${results.missing.length}`);
  console.log(`✅ time_slots column: ${results.hasTimeSlots.length > 0 ? 'EXISTS' : 'MISSING (backward compatible)'}`);

  if (results.missing.length > 0) {
    console.log('\n⚠️  Missing tables:');
    results.missing.forEach(table => console.log(`   - ${table}`));
    console.log('\n💡 Run migrations to create missing tables.');
  }

  // Check for migration 017 (time_slots enhancement)
  if (results.missingTimeSlots.length > 0) {
    console.log('\n💡 Note: time_slots column is missing but code handles this gracefully.');
    console.log('   To add it, run migration: supabase/migrations/017_enhance_itinerary_days.sql');
  }

  await pool.end();
  return results;
}

// Run verification
verifyTables()
  .then((results) => {
    if (results.missing.length === 0) {
      console.log('\n✅ All required tables exist!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tables are missing. Please run migrations.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });

