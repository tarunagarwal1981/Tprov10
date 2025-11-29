import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/operators
 * Get all tour operators (users with TOUR_OPERATOR, ADMIN, or SUPER_ADMIN role)
 */
export async function GET(request: NextRequest) {
  try {
    const result = await query<{
      id: string;
      name: string | null;
      email: string | null;
    }>(
      `SELECT id, name, email FROM users 
       WHERE role IN ('TOUR_OPERATOR', 'ADMIN', 'SUPER_ADMIN')
       ORDER BY name ASC`
    );

    const operators = result.rows.map((op) => ({
      id: op.id,
      name: op.name || 'Unknown Operator',
      email: op.email || null,
    }));

    return NextResponse.json({ operators });
  } catch (error) {
    console.error('Error fetching operators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operators', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

