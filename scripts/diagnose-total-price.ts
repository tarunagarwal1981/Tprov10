/**
 * Diagnostic script to investigate total_price issue
 * Uses Lambda database service to query the database
 */

import { query } from '../src/lib/aws/lambda-database';

const LEAD_ID = '2b838a35-90ac-49fc-83cb-b3234b941501';
const ITINERARY_ID = '998b7096-c42b-40cf-8cdc-2098d55b42ea'; // The one with 7 items showing $1030

async function diagnoseTotalPrice() {
  console.log('🔍 Diagnosing total_price issue...\n');

  try {
    // 1. Check if items exist for the specific itinerary
    console.log('1️⃣ Checking items for itinerary:', ITINERARY_ID);
    const itemsResult = await query<{
      count: number;
      total_items_price: number;
    }>(
      `SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(total_price), 0) as total_items_price
      FROM itinerary_items 
      WHERE itinerary_id::text = $1`,
      [ITINERARY_ID]
    );
    
    console.log('   Items found:', itemsResult.rows[0]);
    console.log('');

    // 2. Check all items for this itinerary with details
    console.log('2️⃣ Item details for itinerary:', ITINERARY_ID);
    const itemDetails = await query<{
      id: string;
      package_title: string;
      total_price: number;
      unit_price: number;
      quantity: number;
    }>(
      `SELECT id, package_title, total_price, unit_price, quantity
       FROM itinerary_items 
       WHERE itinerary_id::text = $1
       ORDER BY created_at ASC`,
      [ITINERARY_ID]
    );
    
    console.log(`   Found ${itemDetails.rows.length} items:`);
    itemDetails.rows.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.package_title}: $${item.total_price} (unit: $${item.unit_price} x ${item.quantity})`);
    });
    console.log('');

    // 3. Check current total_price in itineraries table
    console.log('3️⃣ Current total_price in itineraries table for all lead itineraries:');
    const itinerariesResult = await query<{
      id: string;
      name: string;
      total_price: number;
      calculated_total: number;
    }>(
      `SELECT 
        i.id,
        i.name,
        i.total_price,
        COALESCE(SUM(ii.total_price), 0) as calculated_total
      FROM itineraries i
      LEFT JOIN itinerary_items ii ON i.id::text = ii.itinerary_id::text
      WHERE i.lead_id::text = $1
      GROUP BY i.id, i.name, i.total_price
      ORDER BY i.created_at DESC`,
      [LEAD_ID]
    );
    
    console.log(`   Found ${itinerariesResult.rows.length} itineraries:`);
    itinerariesResult.rows.forEach((it, index) => {
      const match = it.total_price === it.calculated_total ? '✅' : '❌';
      console.log(`   ${index + 1}. ${match} ${it.name}:`);
      console.log(`      Current total_price: $${it.total_price}`);
      console.log(`      Calculated from items: $${it.calculated_total}`);
      console.log(`      Difference: $${Math.abs(it.total_price - it.calculated_total)}`);
    });
    console.log('');

    // 4. Check if trigger exists
    console.log('4️⃣ Checking if trigger exists:');
    const triggerResult = await query<{
      tgname: string;
      tgenabled: string;
    }>(
      `SELECT tgname, tgenabled 
       FROM pg_trigger 
       WHERE tgname = 'recalculate_itinerary_price_on_item_change'`,
      []
    );
    
    if (triggerResult.rows.length > 0) {
      console.log('   ✅ Trigger exists:', triggerResult.rows[0]);
    } else {
      console.log('   ❌ Trigger NOT FOUND!');
    }
    console.log('');

    // 5. Check if function exists
    console.log('5️⃣ Checking if function exists:');
    const functionResult = await query<{
      proname: string;
    }>(
      `SELECT proname 
       FROM pg_proc 
       WHERE proname = 'recalculate_itinerary_total_price'`,
      []
    );
    
    if (functionResult.rows.length > 0) {
      console.log('   ✅ Function exists:', functionResult.rows[0]);
    } else {
      console.log('   ❌ Function NOT FOUND!');
    }
    console.log('');

    // 6. Summary
    console.log('📊 Summary:');
    const summary = itinerariesResult.rows.map(it => ({
      name: it.name,
      current: it.total_price,
      calculated: it.calculated_total,
      needsUpdate: it.total_price !== it.calculated_total,
    }));
    
    const needsUpdate = summary.filter(s => s.needsUpdate);
    if (needsUpdate.length > 0) {
      console.log(`   ⚠️  ${needsUpdate.length} itineraries need price updates:`);
      needsUpdate.forEach(it => {
        console.log(`      - ${it.name}: $${it.current} → $${it.calculated}`);
      });
    } else {
      console.log('   ✅ All itineraries have correct prices!');
    }

  } catch (error) {
    console.error('❌ Error running diagnostics:', error);
    throw error;
  }
}

// Run diagnostics
diagnoseTotalPrice()
  .then(() => {
    console.log('\n✅ Diagnostics complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnostics failed:', error);
    process.exit(1);
  });

