import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/create-transfer-vehicle-images-table
 * Create the transfer_vehicle_images table if it doesn't exist
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔌 Checking if transfer_vehicle_images table exists...');
    
    // Check if table already exists
    const checkTable = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transfer_vehicle_images'
      ) as exists;
    `);

    if (checkTable.rows && checkTable.rows[0] && checkTable.rows[0].exists) {
      return NextResponse.json({
        success: true,
        message: 'Table transfer_vehicle_images already exists',
        alreadyExists: true,
      });
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

    return NextResponse.json({
      success: true,
      message: 'transfer_vehicle_images table created successfully',
      tableStructure: verifyTable.rows,
    });

  } catch (error: any) {
    console.error('❌ Error creating table:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create table',
        details: error.detail || error.code,
      },
      { status: 500 }
    );
  }
}
