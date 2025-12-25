/**
 * Script to regenerate all customer_ids properly
 */

import { query } from '../src/lib/aws/lambda-database';

async function regenerateAll() {
  console.log('🔧 Regenerating all customer_ids...\n');

  try {
    // 1. Clear all existing customer_ids
    console.log('1️⃣ Clearing all existing customer_ids...');
    await query(
      `UPDATE itineraries SET customer_id = NULL`,
      []
    );
    console.log('✅ Cleared\n');

    // 2. Get all itineraries ordered by creation date
    console.log('2️⃣ Fetching all itineraries...');
    const allItineraries = await query<{
      id: string;
      created_at: string;
    }>(
      `SELECT id, created_at FROM itineraries ORDER BY created_at ASC`,
      []
    );
    console.log(`Found ${allItineraries.rows.length} itineraries\n`);

    // 3. Regenerate customer_ids one by one
    console.log('3️⃣ Regenerating customer_ids...');
    let currentYear = '';
    let sequence = 0;

    for (const itinerary of allItineraries.rows) {
      const itineraryYear = new Date(itinerary.created_at).getFullYear().toString().slice(-2);
      
      // If year changed, reset sequence
      if (itineraryYear !== currentYear) {
        currentYear = itineraryYear;
        sequence = 0;
      }
      
      sequence++;
      const customerId = `IT${currentYear}${sequence.toString().padStart(4, '0')}`;
      
      await query(
        `UPDATE itineraries SET customer_id = $1 WHERE id::text = $2`,
        [customerId, itinerary.id]
      );
      
      if (allItineraries.rows.indexOf(itinerary) < 5 || allItineraries.rows.indexOf(itinerary) >= allItineraries.rows.length - 2) {
        console.log(`  ${itinerary.id.substring(0, 8)}... → ${customerId}`);
      }
    }
    console.log(`✅ Regenerated ${allItineraries.rows.length} customer_ids\n`);

    // 4. Add unique constraint
    console.log('4️⃣ Adding UNIQUE constraint...');
    try {
      // Drop if exists first
      await query(
        `ALTER TABLE itineraries DROP CONSTRAINT IF EXISTS itineraries_customer_id_unique`,
        []
      );
      
      await query(
        `ALTER TABLE itineraries 
         ADD CONSTRAINT itineraries_customer_id_unique UNIQUE (customer_id)`,
        []
      );
      console.log('✅ Unique constraint added\n');
    } catch (error: any) {
      console.error('❌ Could not add unique constraint:', error.message);
      throw error;
    }

    // 5. Verify
    console.log('5️⃣ Verifying...');
    const verifyResult = await query<{
      total: number;
      with_customer_id: number;
      unique_count: number;
    }>(
      `SELECT 
        COUNT(*) as total,
        COUNT(customer_id) as with_customer_id,
        COUNT(DISTINCT customer_id) as unique_count
       FROM itineraries`,
      []
    );

    const stats = verifyResult.rows[0];
    if (!stats) {
      console.log('⚠️  Could not fetch statistics');
      return;
    }
    
    console.log(`Total: ${stats.total}`);
    console.log(`With customer_id: ${stats.with_customer_id}`);
    console.log(`Unique: ${stats.unique_count}`);

    if (stats.total === stats.with_customer_id && stats.total === stats.unique_count) {
      console.log('\n✅ All customer_ids are unique and assigned!');
    } else {
      console.log(`\n⚠️  Mismatch detected`);
    }

    // Show sample
    const sampleResult = await query<{
      customer_id: string;
      name: string;
    }>(
      `SELECT customer_id, name FROM itineraries ORDER BY created_at DESC LIMIT 10`,
      []
    );
    console.log('\nSample customer_ids:');
    sampleResult.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.customer_id} - ${row.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run
regenerateAll()
  .then(() => {
    console.log('\n✅ Complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });

