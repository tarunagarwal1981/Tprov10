/**
 * Profile Account Details API
 * GET, POST, PUT /api/profile/account
 * Handles account details (name, email, phone, photo, about)
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, transaction } from '@/lib/aws/database';
import { getUser } from '@/lib/aws/cognito';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Get account details
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userInfo = await getUser(token);
    const userId = userInfo.username;

    const accountDetails = await queryOne<{
      user_id: string;
      first_name: string | null;
      last_name: string | null;
      profile_photo_url: string | null;
      about_me: string | null;
      updated_at: Date;
      created_at: Date;
    }>(
      `SELECT * FROM account_details WHERE user_id = $1`,
      [userId]
    );

    // Get user info from users table
    const user = await queryOne<{
      email: string;
      phone_number: string | null;
      country_code: string | null;
    }>(
      `SELECT email, phone_number, country_code FROM users WHERE id = $1`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      account: {
        ...accountDetails,
        email: user?.email,
        phoneNumber: user?.phone_number,
        countryCode: user?.country_code,
      },
    });
  } catch (error: any) {
    console.error('Get account details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account details', message: error.message },
      { status: 500 }
    );
  }
}

// Create or update account details
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userInfo = await getUser(token);
    const userId = userInfo.username;

    const { firstName, lastName, profilePhotoUrl, aboutMe } = await request.json();

    await transaction(async (client) => {
      // Upsert account details
      await client.query(
        `INSERT INTO account_details (user_id, first_name, last_name, profile_photo_url, about_me, updated_at, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           profile_photo_url = EXCLUDED.profile_photo_url,
           about_me = EXCLUDED.about_me,
           updated_at = NOW()`,
        [userId, firstName || null, lastName || null, profilePhotoUrl || null, aboutMe || null]
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
      message: 'Account details updated successfully',
    });
  } catch (error: any) {
    console.error('Update account details error:', error);
    return NextResponse.json(
      { error: 'Failed to update account details', message: error.message },
      { status: 500 }
    );
  }
}

// Alias for POST (for compatibility)
export async function PUT(request: NextRequest) {
  return POST(request);
}
