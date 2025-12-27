/**
 * Script to apply the trigger fix to the database
 */

import { query } from '../src/lib/aws/lambda-database';
import * as fs from 'fs';
import * as path from 'path';

async function applyTriggerFix() {
  console.log('🔧 Applying trigger fix...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-total-price-trigger.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip if statement is undefined or empty
      if (!statement) {
        continue;
      }
      
      // Skip the verification query for now (we'll run it separately)
      if (statement.includes('SELECT') && statement.includes('status')) {
        continue;
      }

      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      try {
        await query(statement, []);
        console.log(`✅ Statement ${i + 1} executed successfully\n`);
      } catch (error: any) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        // Continue with next statement
      }
    }

    // Run verification query
    console.log('🔍 Verifying the fix...\n');
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

