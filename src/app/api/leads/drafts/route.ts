import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/leads/drafts
 * Get all draft leads for the authenticated agent
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role and parent_agent_id to determine visibility
    const user = await queryOne<{ role: string; parent_agent_id: string | null }>(
      'SELECT role, parent_agent_id FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine agent_id based on role
    let agentId: string;
    if (user.role === 'SUB_AGENT' && user.parent_agent_id) {
      agentId = user.parent_agent_id;
    } else {
      agentId = userId;
    }

    // Fetch draft leads
    const result = await query<{
      id: string;
      customer_name: string;
      customer_email: string;
      customer_phone: string | null;
      destination: string | null;
      origin: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT 
        id,
        customer_name,
        customer_email,
        customer_phone,
        destination,
        origin,
        created_at,
        updated_at
      FROM leads
      WHERE agent_id::text = $1 
        AND status = 'draft'
      ORDER BY updated_at DESC`,
      [agentId]
    );

    return NextResponse.json({ drafts: result.rows });
  } catch (error) {
    console.error('Error fetching draft leads:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch draft leads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

