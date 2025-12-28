import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface LeadWithAggregates {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  destination: string;
  stage: string;
  priority: string;
  next_follow_up_date: string | null;
  last_contacted_at: string | null;
  created_at: string;
  itinerary_count: number;
  total_value: number;
  total_paid: number;
  last_communication_at: string | null;
  last_communication_type: string | null;
  assigned_to: string | null;
}

/**
 * GET /api/leads/manage
 * Get leads with aggregated data for management table
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Build WHERE clause
    // Cast userId to UUID for comparison with agent_id (which is UUID type)
    const whereConditions: string[] = ['l.agent_id::text = $1'];
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    console.log('[Leads Manage] Query params:', { userId, status, search, page, limit, sortBy, sortOrder });

    if (status) {
      whereConditions.push(`l.stage = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(
        l.customer_name ILIKE $${paramIndex} OR 
        l.customer_email ILIKE $${paramIndex} OR
        l.destination ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Build ORDER BY clause
    let orderByClause = 'l.created_at DESC';
    if (sortBy === 'value') {
      orderByClause = `total_value ${sortOrder.toUpperCase()}`;
    } else if (sortBy === 'last_communication') {
      orderByClause = `last_communication_at ${sortOrder.toUpperCase()} NULLS LAST`;
    } else if (sortBy === 'follow_up') {
      orderByClause = `next_follow_up_date ${sortOrder.toUpperCase()} NULLS LAST`;
    } else if (sortBy === 'created_at') {
      orderByClause = `l.created_at ${sortOrder.toUpperCase()}`;
    }

    // Main query with aggregations
    const sqlQuery = `
      SELECT 
        l.id,
        l.customer_id,
        l.customer_name,
        l.customer_email,
        l.customer_phone,
        l.destination,
        l.stage,
        l.priority,
        l.next_follow_up_date,
        l.last_contacted_at,
        l.created_at,
        l.assigned_to,
        COALESCE(COUNT(DISTINCT i.id), 0)::integer as itinerary_count,
        COALESCE(SUM(i.total_price), 0)::decimal as total_value,
        COALESCE(SUM(ip.amount) FILTER (WHERE ip.payment_type != 'refund'), 0)::decimal as total_paid,
        MAX(lc.created_at) as last_communication_at,
        MAX(lc.communication_type) as last_communication_type
      FROM leads l
      LEFT JOIN itineraries i ON i.lead_id::text = l.id::text
      LEFT JOIN itinerary_payments ip ON ip.itinerary_id::text = i.id::text
      LEFT JOIN lead_communications lc ON lc.lead_id::text = l.id::text
      WHERE ${whereClause}
      GROUP BY l.id
      ORDER BY ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    console.log('[Leads Manage] Executing query with params:', queryParams);
    const result = await query<LeadWithAggregates>(sqlQuery, queryParams);
    console.log('[Leads Manage] Result count:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('[Leads Manage] Sample lead IDs:', result.rows.slice(0, 3).map(r => r.id));
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT l.id) as total
      FROM leads l
      WHERE ${whereClause}
    `;
    const countParams = queryParams.slice(0, -2); // Remove limit and offset
    const countResult = await query<{ total: number }>(countQuery, countParams);
    const total = countResult.rows[0]?.total || 0;

    console.log('[Leads Manage] Total leads count:', total);

    return NextResponse.json({
      leads: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching leads for management:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as any)?.code;
    const errorDetail = (error as any)?.detail;
    
    console.error('Error details:', {
      message: errorMessage,
      code: errorCode,
      detail: errorDetail,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch leads', 
        details: errorMessage,
        code: errorCode,
        detail: errorDetail,
      },
      { status: 500 }
    );
  }
}

