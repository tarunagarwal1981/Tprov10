/**
 * Script to add customer_id field to itineraries table
 * Format: IT250001 (IT + YY + NNNN = 8 characters)
 */

import { query } from '../src/lib/aws/lambda-database';

async function addCustomerId() {
  console.log('🔧 Adding customer_id to itineraries table...\n');

  try {
    // 1. Add customer_id column
    console.log('1️⃣ Adding customer_id column...');
    await query(
      `ALTER TABLE itineraries 
       ADD COLUMN IF NOT EXISTS customer_id TEXT`,
      []
    );
    console.log('✅ Column added\n');

    // 2. Create index
    console.log('2️⃣ Creating index on customer_id...');
    await query(
      `CREATE INDEX IF NOT EXISTS idx_itineraries_customer_id ON itineraries(customer_id)`,
      []
    );
    console.log('✅ Index created\n');

    // 3. Create function to generate customer_id
    console.log('3️⃣ Creating function to generate customer_id...');
    await query(
      `CREATE OR REPLACE FUNCTION generate_itinerary_customer_id()
       RETURNS TEXT AS $$
       DECLARE
           year_suffix TEXT;
           next_number INTEGER;
           new_customer_id TEXT;
       BEGIN
           -- Get last 2 digits of current year
           year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
           
           -- Get the highest number for this year (extract 4 digits after ITYY)
           SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id FROM 4) AS INTEGER)), 0) + 1
           INTO next_number
           FROM itineraries
           WHERE customer_id LIKE 'IT' || year_suffix || '%'
             AND LENGTH(customer_id) = 8; -- Ensure format matches ITYYNNNN
           
           -- Format: IT + YY + NNNN (8 characters total)
           new_customer_id := 'IT' || year_suffix || LPAD(next_number::TEXT, 4, '0');
           
           RETURN new_customer_id;
       END;
       $$ LANGUAGE plpgsql`,
      []
    );
    console.log('✅ Function created\n');

    // 4. Backfill existing itineraries
    console.log('4️⃣ Backfilling existing itineraries...');
    const backfillResult = await query(
      `UPDATE itineraries
       SET customer_id = generate_itinerary_customer_id()
       WHERE customer_id IS NULL
       RETURNING id, customer_id`,
      []
    );
    console.log(`✅ Backfilled ${backfillResult.rowCount} itineraries\n`);

    // 5. Add UNIQUE constraint
    console.log('5️⃣ Adding UNIQUE constraint...');
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
        throw error;
      }
    }

    // 6. Verify
    console.log('6️⃣ Verifying customer_id generation...');
    const verifyResult = await query<{
      id: string;
      name: string;
      customer_id: string;
    }>(
      `SELECT id, name, customer_id 
       FROM itineraries 
       WHERE customer_id IS NOT NULL 
       ORDER BY created_at DESC 
       LIMIT 10`,
      []
    );

    console.log('Sample customer_ids:');
    verifyResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.name}: ${row.customer_id}`);
    });

    console.log('\n✅ Customer ID setup complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the migration
addCustomerId()
  .then(() => {
    console.log('\n✅ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

