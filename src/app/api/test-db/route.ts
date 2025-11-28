/**
 * Test Database Connection API Route
 * 
 * This endpoint tests the RDS connection from Amplify
 * Visit: https://your-app.amplifyapp.com/api/test-db
 */

import { NextResponse } from 'next/server';
// Use Lambda database service for reliable VPC access
import { query } from '@/lib/aws/lambda-database';

export async function GET() {
  try {
    // Test database connection
    const result = await query('SELECT NOW() as current_time, version() as postgres_version');
    
    return NextResponse.json({ 
      success: true,
      message: 'RDS connection successful!',
      data: {
        currentTime: result.rows[0].current_time,
        postgresVersion: result.rows[0].postgres_version,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('RDS connection test failed:', error);
    
    return NextResponse.json({ 
      success: false,
      message: 'RDS connection failed',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

