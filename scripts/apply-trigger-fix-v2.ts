/**
 * Script to apply the trigger fix to the database
 * Executes statements individually to handle dollar-quoted strings
 */

import { query } from '../src/lib/aws/lambda-database';

async function applyTriggerFix() {
  console.log('🔧 Applying trigger fix...\n');

  try {
    // 1. Create the function
    console.log('1️⃣ Creating function recalculate_itinerary_total_price...');
    await query(
      `CREATE OR REPLACE FUNCTION recalculate_itinerary_total_price()
       RETURNS TRIGGER AS $$
       DECLARE
           new_total DECIMAL(10,2);
       BEGIN
           SELECT COALESCE(SUM(total_price), 0) INTO new_total
           FROM itinerary_items
           WHERE itinerary_id = COALESCE(NEW.itinerary_id, OLD.itinerary_id);
           
           UPDATE itineraries
           SET total_price = new_total,
               updated_at = NOW()
           WHERE id = COALESCE(NEW.itinerary_id, OLD.itinerary_id);
           
           RETURN COALESCE(NEW, OLD);
       END;
       $$ LANGUAGE plpgsql`,
      []
    );
    console.log('✅ Function created successfully\n');

    // 2. Drop existing trigger if it exists
    console.log('2️⃣ Dropping existing trigger if it exists...');
    try {
      await query(
        `DROP TRIGGER IF EXISTS recalculate_itinerary_price_on_item_change ON itinerary_items`,
        []
      );
      console.log('✅ Trigger dropped (if it existed)\n');
    } catch (error: any) {
      console.log('ℹ️  No existing trigger to drop\n');
    }

    // 3. Create the trigger
    console.log('3️⃣ Creating trigger recalculate_itinerary_price_on_item_change...');
    await query(
      `CREATE TRIGGER recalculate_itinerary_price_on_item_change
       AFTER INSERT OR UPDATE OR DELETE ON itinerary_items
       FOR EACH ROW
       EXECUTE FUNCTION recalculate_itinerary_total_price()`,
      []
    );
    console.log('✅ Trigger created successfully\n');

    // 4. Manually update all existing itineraries with correct total_price
    console.log('4️⃣ Updating existing itineraries with correct total_price...');
    const updateResult = await query(
      `UPDATE itineraries i
       SET total_price = (
           SELECT COALESCE(SUM(total_price), 0)
           FROM itinerary_items ii
           WHERE ii.itinerary_id::text = i.id::text
       ),
       updated_at = NOW()
       WHERE EXISTS (
           SELECT 1 FROM itinerary_items ii WHERE ii.itinerary_id::text = i.id::text
       )`,
      []
    );
    console.log(`✅ Updated ${updateResult.rowCount} itineraries\n`);

    // 5. Verify the fix
    console.log('5️⃣ Verifying the fix...\n');
    const verifyResult = await query<{
      id: string;
      name: string;
      current_price: number;
      calculated_price: number;
      status: string;
    }>(
      `SELECT 
        i.id,
        i.name,
        i.total_price as current_price,
        COALESCE(SUM(ii.total_price), 0) as calculated_price,
        CASE 
          WHEN i.total_price = COALESCE(SUM(ii.total_price), 0) THEN '✅ Match'
          ELSE '❌ Mismatch'
        END as status
      FROM itineraries i
      LEFT JOIN itinerary_items ii ON i.id::text = ii.itinerary_id::text
      WHERE i.lead_id::text = $1
      GROUP BY i.id, i.name, i.total_price
      ORDER BY i.created_at DESC`,
      ['2b838a35-90ac-49fc-83cb-b3234b941501']
    );

    console.log('Verification results:');
    verifyResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.status} ${row.name}:`);
      console.log(`   Current: $${row.current_price}, Calculated: $${row.calculated_price}`);
    });

    const mismatches = verifyResult.rows.filter(r => r.status.includes('Mismatch'));
    if (mismatches.length === 0) {
      console.log('\n✅ All prices are correct!');
    } else {
      console.log(`\n⚠️  ${mismatches.length} itineraries still need updates`);
    }

    console.log('\n✅ Trigger fix applied!');
  } catch (error) {
    console.error('❌ Error applying trigger fix:', error);
    throw error;
  }
}

// Run the fix
applyTriggerFix()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fix failed:', error);
    process.exit(1);
  });

