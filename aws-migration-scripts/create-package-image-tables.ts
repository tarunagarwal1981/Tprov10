/**
 * Create package image tables in RDS
 * Creates: transfer_package_images, activity_package_images, multi_city_package_images
 */

import { query } from '../src/lib/aws/lambda-database.js';

async function createPackageImageTables() {
  try {
    console.log('Creating package image tables...');

    // 1. Create transfer_package_images table
    console.log('Creating transfer_package_images table...');
    await query(`
      CREATE TABLE IF NOT EXISTS transfer_package_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        package_id UUID NOT NULL,
        
        -- Image details
        file_name VARCHAR(255) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        storage_path TEXT NOT NULL,
        public_url TEXT,
        
        -- Metadata
        alt_text TEXT,
        is_cover BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        display_order INTEGER DEFAULT 0,
        
        -- Timestamps
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_transfer_package_images_package_id 
      ON transfer_package_images(package_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_transfer_package_images_is_cover 
      ON transfer_package_images(is_cover)
    `);

    console.log('✅ transfer_package_images table created');

    // 2. Create activity_package_images table
    console.log('Creating activity_package_images table...');
    await query(`
      CREATE TABLE IF NOT EXISTS activity_package_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        package_id UUID NOT NULL,
        
        -- Image details
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT,
        mime_type VARCHAR(100),
        storage_path VARCHAR(500) NOT NULL,
        public_url VARCHAR(500),
        
        -- Image Metadata (optional)
        width INTEGER,
        height INTEGER,
        alt_text VARCHAR(255),
        caption TEXT,
        
        -- Gallery Management
        is_cover BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        display_order INTEGER DEFAULT 0,
        
        -- Timestamps
        uploaded_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_activity_package_images_package_id 
      ON activity_package_images(package_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_activity_package_images_is_cover 
      ON activity_package_images(is_cover)
    `);

    console.log('✅ activity_package_images table created');

    // 3. Create multi_city_package_images table
    console.log('Creating multi_city_package_images table...');
    await query(`
      CREATE TABLE IF NOT EXISTS multi_city_package_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        package_id UUID NOT NULL,
        
        file_name VARCHAR(255) NOT NULL,
        storage_path TEXT NOT NULL,
        public_url TEXT NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        
        is_cover BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        display_order INTEGER DEFAULT 0,
        
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_multi_city_package_images_package_id 
      ON multi_city_package_images(package_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_multi_city_package_images_is_cover 
      ON multi_city_package_images(is_cover)
    `);

    console.log('✅ multi_city_package_images table created');

    // Create triggers for updated_at on tables that have it
    console.log('Creating triggers for updated_at...');
    
    // Transfer package images trigger
    await query(`
      CREATE OR REPLACE FUNCTION update_transfer_package_images_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await query(`
      DROP TRIGGER IF EXISTS trigger_update_transfer_package_images_updated_at 
      ON transfer_package_images
    `);

    await query(`
      CREATE TRIGGER trigger_update_transfer_package_images_updated_at
      BEFORE UPDATE ON transfer_package_images
      FOR EACH ROW
      EXECUTE FUNCTION update_transfer_package_images_updated_at()
    `);

    // Activity package images trigger
    await query(`
      CREATE OR REPLACE FUNCTION update_activity_package_images_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await query(`
      DROP TRIGGER IF EXISTS trigger_update_activity_package_images_updated_at 
      ON activity_package_images
    `);

    await query(`
      CREATE TRIGGER trigger_update_activity_package_images_updated_at
      BEFORE UPDATE ON activity_package_images
      FOR EACH ROW
      EXECUTE FUNCTION update_activity_package_images_updated_at()
    `);

    console.log('✅ Triggers created');

    // Verify tables exist
    const verifyResult = await query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns 
              WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_name IN ('transfer_package_images', 'activity_package_images', 'multi_city_package_images')
      ORDER BY table_name
    `);

    if (verifyResult.rows && verifyResult.rows.length === 3) {
      console.log('\n✅ All tables verified successfully:');
      verifyResult.rows.forEach((row: any) => {
        console.log(`   - ${row.table_name}: ${row.column_count} columns`);
      });
    } else {
      throw new Error('Table verification failed - not all tables were created');
    }

    console.log('\n🎉 Migration completed successfully!');
  } catch (error: any) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  createPackageImageTables()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { createPackageImageTables };

