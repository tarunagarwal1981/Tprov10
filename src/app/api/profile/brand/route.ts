/**
 * Profile Brand Details API
 * GET, POST, PUT /api/profile/brand
 * Handles brand details (company, contact, website, logo, Google Business)
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, transaction } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Get brand details
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

    const brandDetails = await queryOne<{
      user_id: string;
      company_name: string | null;
      contact_person: string | null;
      contact_number: string | null;
      contact_email: string | null;
      organisation_website: string | null;
      google_business_profile_id: string | null;
      google_business_profile_url: string | null;
      logo_url: string | null;
      updated_at: Date;
      created_at: Date;
    }>(
      `SELECT * FROM brand_details WHERE user_id = $1`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      brand: brandDetails || null,
    });
  } catch (error: any) {
    console.error('Get brand details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand details', message: error.message },
      { status: 500 }
    );
  }
}

// Create or update brand details
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
      companyName,
      contactPerson,
      contactNumber,
      contactEmail,
      organisationWebsite,
      googleBusinessProfileId,
      googleBusinessProfileUrl,
      logoUrl,
    } = await request.json();

    await transaction(async (client) => {
      // Upsert brand details
      await client.query(
        `INSERT INTO brand_details 
         (user_id, company_name, contact_person, contact_number, contact_email, 
          organisation_website, google_business_profile_id, google_business_profile_url, logo_url, 
          updated_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           company_name = EXCLUDED.company_name,
           contact_person = EXCLUDED.contact_person,
           contact_number = EXCLUDED.contact_number,
           contact_email = EXCLUDED.contact_email,
           organisation_website = EXCLUDED.organisation_website,
           google_business_profile_id = EXCLUDED.google_business_profile_id,
           google_business_profile_url = EXCLUDED.google_business_profile_url,
           logo_url = EXCLUDED.logo_url,
           updated_at = NOW()`,
        [
          userId,
          companyName || null,
          contactPerson || null,
          contactNumber || null,
          contactEmail || null,
          organisationWebsite || null,
          googleBusinessProfileId || null,
          googleBusinessProfileUrl || null,
          logoUrl || null,
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
      message: 'Brand details updated successfully',
    });
  } catch (error: any) {
    console.error('Update brand details error:', error);
    return NextResponse.json(
      { error: 'Failed to update brand details', message: error.message },
      { status: 500 }
    );
  }
}

// Alias for POST
export async function PUT(request: NextRequest) {
  return POST(request);
}
