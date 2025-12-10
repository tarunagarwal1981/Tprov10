/**
 * Create activity_pricing_packages table in RDS
 * Run this script to create the table if it doesn't exist
 */

import { query } from '../src/lib/aws/lambda-database.js';

async function createActivityPricingPackagesTable() {
  try {
    console.log('Creating activity_pricing_packages table...');

    // Create the table
    await query(`
      CREATE TABLE IF NOT EXISTS activity_pricing_packages (
        -- Primary fields
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        package_id UUID NOT NULL,
        
        -- Package Template Name
        package_name VARCHAR(100) NOT NULL,
        description TEXT,
        
        -- TICKET PRICING (Required)
        adult_price DECIMAL(10, 2) NOT NULL CHECK (adult_price >= 0),
        child_price DECIMAL(10, 2) NOT NULL CHECK (child_price >= 0),
        child_min_age INTEGER NOT NULL DEFAULT 3 CHECK (child_min_age >= 0),
        child_max_age INTEGER NOT NULL DEFAULT 12 CHECK (child_max_age > child_min_age),
        infant_price DECIMAL(10, 2) DEFAULT 0 CHECK (infant_price >= 0),
        infant_max_age INTEGER DEFAULT 2 CHECK (infant_max_age >= 0),
        
        -- OPTIONAL TRANSFER PRICING (Per Person)
        transfer_included BOOLEAN DEFAULT false,
        transfer_type VARCHAR(20) CHECK (transfer_type IN ('SHARED', 'PRIVATE') OR transfer_type IS NULL),
        transfer_price_adult DECIMAL(10, 2) CHECK (transfer_price_adult >= 0 OR transfer_price_adult IS NULL),
        transfer_price_child DECIMAL(10, 2) CHECK (transfer_price_child >= 0 OR transfer_price_child IS NULL),
        transfer_price_infant DECIMAL(10, 2) CHECK (transfer_price_infant >= 0 OR transfer_price_infant IS NULL),
        pickup_location VARCHAR(255),
        pickup_instructions TEXT,
        dropoff_location VARCHAR(255),
        dropoff_instructions TEXT,
        
        -- WHAT'S INCLUDED
        included_items TEXT[],
        excluded_items TEXT[],
        
        -- STATUS AND DISPLAY
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        display_order INTEGER DEFAULT 0,
        
        -- METADATA
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log('✅ Table created successfully');

    // Create indexes
    console.log('Creating indexes...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_activity_pricing_packages_package_id 
      ON activity_pricing_packages(package_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_activity_pricing_packages_active 
      ON activity_pricing_packages(package_id, is_active) 
      WHERE is_active = true
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_activity_pricing_packages_featured 
      ON activity_pricing_packages(package_id, is_featured) 
      WHERE is_featured = true
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_activity_pricing_packages_display_order 
      ON activity_pricing_packages(package_id, display_order)
    `);

    console.log('✅ Indexes created successfully');

    // Create trigger for updated_at
    console.log('Creating trigger for updated_at...');
    await query(`
      CREATE OR REPLACE FUNCTION update_activity_pricing_packages_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await query(`
      DROP TRIGGER IF EXISTS trigger_update_activity_pricing_packages_updated_at 
      ON activity_pricing_packages
    `);

    await query(`
      CREATE TRIGGER trigger_update_activity_pricing_packages_updated_at
      BEFORE UPDATE ON activity_pricing_packages
      FOR EACH ROW
      EXECUTE FUNCTION update_activity_pricing_packages_updated_at()
    `);

    console.log('✅ Trigger created successfully');

    // Verify table exists
    const verifyResult = await query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public' 
        AND table_name = 'activity_pricing_packages'
    `);

    if (verifyResult.rows && verifyResult.rows[0]?.count > 0) {
      console.log('✅ Table verified successfully');
    } else {
      throw new Error('Table verification failed');
    }

    console.log('\n🎉 Migration completed successfully!');
  } catch (error: any) {
    console.error('❌ Error creating table:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  createActivityPricingPackagesTable()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { createActivityPricingPackagesTable };

