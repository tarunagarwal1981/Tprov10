/**
 * Script to fix duplicate customer_ids
 */

import { query } from '../src/lib/aws/lambda-database';

async function fixDuplicates() {
  console.log('🔧 Fixing duplicate customer_ids...\n');

  try {
    // 1. Find duplicates
    console.log('1️⃣ Finding duplicate customer_ids...');
    const duplicatesResult = await query<{
      customer_id: string;
      count: number;
    }>(
      `SELECT customer_id, COUNT(*) as count
       FROM itineraries
       WHERE customer_id IS NOT NULL
       GROUP BY customer_id
       HAVING COUNT(*) > 1`,
      []
    );

    if (duplicatesResult.rows.length === 0) {
      console.log('✅ No duplicates found\n');
    } else {
      console.log(`Found ${duplicatesResult.rows.length} duplicate customer_ids\n`);
      
      // 2. Fix duplicates by regenerating
      for (const dup of duplicatesResult.rows) {
        console.log(`Fixing duplicate: ${dup.customer_id} (${dup.count} occurrences)`);
        
        // Get all IDs with this customer_id
        const idsResult = await query<{ id: string }>(
          `SELECT id FROM itineraries WHERE customer_id = $1 ORDER BY created_at ASC`,
          [dup.customer_id]
        );
        
        // Keep the first one, regenerate the rest
        const idsToFix = idsResult.rows.slice(1);
        
        for (const row of idsToFix) {
          const newIdResult = await query<{ customer_id: string }>(
            `SELECT generate_itinerary_customer_id() as customer_id`,
            []
          );
          const newId = newIdResult.rows[0]?.customer_id;
          
          await query(
            `UPDATE itineraries SET customer_id = $1 WHERE id::text = $2`,
            [newId, row.id]
          );
          console.log(`  Updated ${row.id.substring(0, 8)}... to ${newId}`);
        }
      }
      console.log('\n✅ Duplicates fixed\n');
    }

    // 3. Now add unique constraint
    console.log('2️⃣ Adding UNIQUE constraint...');
    try {
      await query(
        `ALTER TABLE itineraries 
         ADD CONSTRAINT itineraries_customer_id_unique UNIQUE (customer_id)`,
        []
      );
      console.log('✅ Unique constraint added\n');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('ℹ️  Unique constraint already exists\n');
      } else {
        // Try to drop and recreate
        try {
          await query(`ALTER TABLE itineraries DROP CONSTRAINT IF EXISTS itineraries_customer_id_unique`, []);
          await query(
            `ALTER TABLE itineraries 
             ADD CONSTRAINT itineraries_customer_id_unique UNIQUE (customer_id)`,
            []
          );
          console.log('✅ Unique constraint recreated\n');
        } catch (e) {
          console.error('❌ Could not add unique constraint:', e);
          throw e;
        }
      }
    }

    // 4. Verify
    console.log('3️⃣ Verifying...');
    const verifyResult = await query<{
      total: number;
      with_customer_id: number;
      duplicates: number;
    }>(
      `SELECT 
        COUNT(*) as total,
        COUNT(customer_id) as with_customer_id,
        COUNT(*) - COUNT(DISTINCT customer_id) as duplicates
       FROM itineraries`,
      []
    );

    const stats = verifyResult.rows[0];
    console.log(`Total itineraries: ${stats.total}`);
    console.log(`With customer_id: ${stats.with_customer_id}`);
    console.log(`Duplicates: ${stats.duplicates}`);

    if (stats.duplicates === 0) {
      console.log('\n✅ All customer_ids are unique!');
    } else {
      console.log(`\n⚠️  Still have ${stats.duplicates} duplicates - need to fix manually`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the fix
fixDuplicates()
  .then(() => {
    console.log('\n✅ Fix complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fix failed:', error);
    process.exit(1);
  });

