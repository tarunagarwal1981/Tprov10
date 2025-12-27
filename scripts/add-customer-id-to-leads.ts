/**
 * Script to add customer_id field to leads table
 * Format: LD250001 (LD + YY + NNNN = 8 characters)
 */

import { query } from '../src/lib/aws/lambda-database';

async function addCustomerId() {
  console.log('🔧 Adding customer_id to leads table...\n');

  try {
    // 1. Add customer_id column
    console.log('1️⃣ Adding customer_id column...');
    await query(
      `ALTER TABLE leads 
       ADD COLUMN IF NOT EXISTS customer_id TEXT`,
      []
    );
    console.log('✅ Column added\n');

    // 2. Create index
    console.log('2️⃣ Creating index on customer_id...');
    await query(
      `CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON leads(customer_id)`,
      []
    );
    console.log('✅ Index created\n');

    // 3. Create function to generate customer_id
    console.log('3️⃣ Creating function to generate customer_id...');
    await query(
      `CREATE OR REPLACE FUNCTION generate_lead_customer_id()
       RETURNS TEXT AS $$
       DECLARE
           year_suffix TEXT;
           next_number INTEGER;
           new_customer_id TEXT;
       BEGIN
           -- Get last 2 digits of current year
           year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
           
           -- Get the highest number for this year (extract 4 digits after LDYY)
           SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id FROM 4) AS INTEGER)), 0) + 1
           INTO next_number
           FROM leads
           WHERE customer_id LIKE 'LD' || year_suffix || '%'
             AND LENGTH(customer_id) = 8; -- Ensure format matches LDYYNNNN
           
           -- Format: LD + YY + NNNN (8 characters total)
           new_customer_id := 'LD' || year_suffix || LPAD(next_number::TEXT, 4, '0');
           
           RETURN new_customer_id;
       END;
       $$ LANGUAGE plpgsql`,
      []
    );
    console.log('✅ Function created\n');

    // 4. Backfill existing leads
    console.log('4️⃣ Backfilling existing leads...');
    const allLeads = await query<{
      id: string;
      created_at: string;
    }>(
      `SELECT id, created_at FROM leads ORDER BY created_at ASC`,
      []
    );
    console.log(`Found ${allLeads.rows.length} leads to backfill\n`);

    // Regenerate customer_ids one by one
    let currentYear = '';
    let sequence = 0;

    for (const lead of allLeads.rows) {
      const leadYear = new Date(lead.created_at).getFullYear().toString().slice(-2);
      
      // If year changed, reset sequence
      if (leadYear !== currentYear) {
        currentYear = leadYear;
        sequence = 0;
      }
      
      sequence++;
      const customerId = `LD${currentYear}${sequence.toString().padStart(4, '0')}`;
      
      await query(
        `UPDATE leads SET customer_id = $1 WHERE id::text = $2`,
        [customerId, lead.id]
      );
      
      if (allLeads.rows.indexOf(lead) < 5 || allLeads.rows.indexOf(lead) >= allLeads.rows.length - 2) {
        console.log(`  ${lead.id.substring(0, 8)}... → ${customerId}`);
      }
    }
    console.log(`✅ Backfilled ${allLeads.rows.length} leads\n`);

    // 5. Add UNIQUE constraint
    console.log('5️⃣ Adding UNIQUE constraint...');
    try {
      // Drop if exists first
      await query(
        `ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_customer_id_unique`,
        []
      );
      
      await query(
        `ALTER TABLE leads 
         ADD CONSTRAINT leads_customer_id_unique UNIQUE (customer_id)`,
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
      total: number;
      with_customer_id: number;
      unique_count: number;
    }>(
      `SELECT 
        COUNT(*) as total,
        COUNT(customer_id) as with_customer_id,
        COUNT(DISTINCT customer_id) as unique_count
       FROM leads`,
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
      customer_name: string;
    }>(
      `SELECT customer_id, customer_name FROM leads ORDER BY created_at DESC LIMIT 10`,
      []
    );
    console.log('\nSample customer_ids:');
    sampleResult.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.customer_id} - ${row.customer_name || 'N/A'}`);
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

