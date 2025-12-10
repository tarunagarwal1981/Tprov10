/**
 * Profile Business Details API
 * GET, POST, PUT /api/profile/business
 * Handles business details (product, incorporation, city, employees, destinations)
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, transaction } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Get business details
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const businessDetails = await queryOne<{
      user_id: string;
      product_sold: string | null;
      company_incorporation_year: number | null;
      city: string | null;
      number_of_employees: number | null;
      customer_acquisition: any;
      international_destinations: any;
      domestic_destinations: any;
      updated_at: Date;
      created_at: Date;
    }>(
      `SELECT * FROM business_details WHERE user_id = $1`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      business: businessDetails || null,
    });
  } catch (error: any) {
    console.error('Get business details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business details', message: error.message },
      { status: 500 }
    );
  }
}

// Create or update business details
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const {
      productSold,
      companyIncorporationYear,
      city,
      numberOfEmployees,
      customerAcquisition, // Array of strings
      internationalDestinations, // Array of strings
      domesticDestinations, // Array of strings
    } = await request.json();

    await transaction(async (client) => {
      // Upsert business details
      await client.query(
        `INSERT INTO business_details 
         (user_id, product_sold, company_incorporation_year, city, number_of_employees,
          customer_acquisition, international_destinations, domestic_destinations,
          updated_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           product_sold = EXCLUDED.product_sold,
           company_incorporation_year = EXCLUDED.company_incorporation_year,
           city = EXCLUDED.city,
           number_of_employees = EXCLUDED.number_of_employees,
           customer_acquisition = EXCLUDED.customer_acquisition,
           international_destinations = EXCLUDED.international_destinations,
           domestic_destinations = EXCLUDED.domestic_destinations,
           updated_at = NOW()`,
        [
          userId,
          productSold || null,
          companyIncorporationYear || null,
          city || null,
          numberOfEmployees || null,
          customerAcquisition ? JSON.stringify(customerAcquisition) : '[]',
          internationalDestinations ? JSON.stringify(internationalDestinations) : '[]',
          domesticDestinations ? JSON.stringify(domesticDestinations) : '[]',
        ]
      );

      // Update profile completion percentage
      await client.query(
        `UPDATE users 
         SET profile_completion_percentage = calculate_profile_completion($1),
             updated_at = NOW()
         WHERE id = $1`,
        [userId]
      );
    });

    return NextResponse.json({
      success: true,
      message: 'Business details updated successfully',
    });
  } catch (error: any) {
    console.error('Update business details error:', error);
    return NextResponse.json(
      { error: 'Failed to update business details', message: error.message },
      { status: 500 }
    );
  }
}

// Alias for POST
export async function PUT(request: NextRequest) {
  return POST(request);
}
