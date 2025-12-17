/**
 * Script to create transfer_vehicle_images table in AWS RDS PostgreSQL
 * Run with: node scripts/create-transfer-vehicle-images-table.js
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createTable() {
  const client = new Client({
    host: process.env.RDS_HOST || process.env.RDS_HOSTNAME,
    port: parseInt(process.env.RDS_PORT || '5432'),
    database: process.env.RDS_DB || 'postgres',
    user: process.env.RDS_USER || 'postgres',
    password: process.env.RDS_PASSWORD,
    ssl: {
      rejectUnauthorized: false // RDS requires SSL but we can skip cert verification for now
    }
  });

  try {
    console.log('🔌 Connecting to RDS database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Check if table already exists
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transfer_vehicle_images'
      );
    `);

    if (checkTable.rows[0].exists) {
      console.log('⚠️  Table transfer_vehicle_images already exists');
      await client.end();
      return;
    }

    console.log('📝 Creating transfer_vehicle_images table...');

    // Create the table
    await client.query(`
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
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transfer_vehicle_images_vehicle_id 
      ON transfer_vehicle_images(vehicle_id);
    `);

    console.log('✅ Index created successfully');

    // Verify table was created
    const verifyTable = await client.query(`
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
  } finally {
    await client.end();
    console.log('🔌 Disconnected from database');
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
