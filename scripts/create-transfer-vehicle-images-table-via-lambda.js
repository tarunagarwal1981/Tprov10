/**
 * Script to create transfer_vehicle_images table using Lambda database connection
 * This uses the same connection method as the app
 * Run with: node scripts/create-transfer-vehicle-images-table-via-lambda.js
 */

const { query } = require('../src/lib/aws/lambda-database');

async function createTable() {
  try {
    console.log('🔌 Connecting via Lambda...');
    
    // Check if table already exists
    console.log('📝 Checking if table exists...');
    const checkTable = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transfer_vehicle_images'
      ) as exists;
    `);

    if (checkTable.rows && checkTable.rows[0] && checkTable.rows[0].exists) {
      console.log('⚠️  Table transfer_vehicle_images already exists');
      return;
    }

    console.log('📝 Creating transfer_vehicle_images table...');

    // Create the table
    await query(`
      CREATE TABLE IF NOT EXISTS transfer_vehicle_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID NOT NULL REFERENCES transfer_package_vehicles(id) ON DELETE CASCADE,
        
        -- Image details
        file_name VARCHAR(255) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        storage_path TEXT NOT NULL,
        public_url TEXT,
        
        -- Metadata
        alt_text TEXT,
        display_order INTEGER DEFAULT 0,
        
        -- Timestamps
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('✅ Table created successfully');

    // Create index
    console.log('📝 Creating index...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_transfer_vehicle_images_vehicle_id 
      ON transfer_vehicle_images(vehicle_id);
    `);

    console.log('✅ Index created successfully');

    // Verify table was created
    const verifyTable = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'transfer_vehicle_images'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Table structure:');
    console.table(verifyTable.rows);

    console.log('\n✅ All done! transfer_vehicle_images table is ready to use.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    throw error;
  }
}

// Run the script
createTable()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
