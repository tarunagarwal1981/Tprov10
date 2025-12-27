import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';
import { queryOne } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/itineraries/confirmed
 * Get all confirmed itineraries (for Operations role)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has OPERATIONS role
    const user = await queryOne<{ role: string }>(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );

    if (!user || (user.role !== 'OPERATIONS' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden - Operations role required' }, { status: 403 });
    }

    // Fetch confirmed itineraries
    const result = await query<{
      id: string;
      name: string;
      customer_id: string | null;
      status: string;
      total_price: number;
      confirmed_at: string | null;
      is_locked: boolean;
      created_at: string;
    }>(
      `SELECT id, name, customer_id, status, total_price, confirmed_at, is_locked, created_at
       FROM itineraries
       WHERE confirmed_at IS NOT NULL
       ORDER BY confirmed_at DESC`,
      []
    );

    return NextResponse.json({ itineraries: result.rows });
  } catch (error) {
    console.error('Error fetching confirmed itineraries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch confirmed itineraries', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

