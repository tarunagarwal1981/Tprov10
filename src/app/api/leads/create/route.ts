import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/leads/create
 * Create a new lead (agent-created, not from marketplace)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role and parent_agent_id to determine ownership
    const user = await queryOne<{ id: string; role: string; parent_agent_id: string | null }>(
      'SELECT id, role, parent_agent_id FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine agent_id based on user role
    let agentId: string;
    let createdBySubAgentId: string | null = null;

    if (user.role === 'SUB_AGENT') {
      // Sub-agent creates lead: parent agent owns it
      if (!user.parent_agent_id) {
        return NextResponse.json(
          { error: 'Sub-agent must have a parent agent' },
          { status: 400 }
        );
      }
      agentId = user.parent_agent_id;
      createdBySubAgentId = userId;
    } else {
      // Main agent creates lead: they own it
      agentId = userId;
    }

    const body = await request.json();
    const {
      customer_name,
      customer_email,
      customer_phone,
      origin,
      adults,
      travel_month,
      destinations,
      is_hot,
      child = 0,
      from_date,
      to_date,
      lead_source,
      assign_to,
      services,
      remarks,
      status = 'published',
    } = body;

    // Validation
    if (!customer_name || !customer_email || !customer_phone || !origin || !adults) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, customer_email, customer_phone, origin, adults' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i;
    if (!emailRegex.test(customer_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Phone number validation removed - allowing any format for international compatibility
    // Phone numbers can be in any format depending on the country

    // Date validation
    if (from_date && to_date) {
      const from = new Date(from_date);
      const to = new Date(to_date);
      if (to < from) {
        return NextResponse.json(
          { error: 'To date must be after or equal to from date' },
          { status: 400 }
        );
      }
    }

    // Build tags array
    const tags: string[] = [];
    if (is_hot) {
      tags.push('hot');
    }

    // Calculate travelers_count
    const travelersCount = adults + (child || 0);

    // Determine destination (handle array or string)
    // Destination is required in the database (NOT NULL), so we need a value
    let destination = '';
    if (Array.isArray(destinations) && destinations.length > 0) {
      destination = destinations.join(', ');
    } else if (typeof destinations === 'string' && destinations.trim()) {
      destination = destinations.trim();
    }
    
    // If no destination provided, use origin as fallback (since origin is required)
    if (!destination && origin) {
      destination = origin;
    } else if (!destination) {
      // Last resort: use a default (should not happen due to validation, but safety check)
      destination = 'Not specified';
    }

    // Insert lead into database
    const result = await query<{ id: string }>(
      `INSERT INTO leads (
        id,
        agent_id,
        customer_name,
        customer_email,
        customer_phone,
        origin,
        destination,
        travelers_count,
        travel_date_start,
        travel_date_end,
        travel_month,
        source,
        source_custom,
        assigned_to,
        services,
        notes,
        tags,
        status,
        purchased_from_marketplace,
        is_purchased,
        created_by_sub_agent_id,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1::uuid,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13::uuid,
        $14::text[],
        $15,
        $16::text[],
        $17,
        false,
        false,
        $18::uuid,
        NOW(),
        NOW()
      )
      RETURNING id`,
      [
        agentId,
        customer_name.trim(),
        customer_email.trim().toLowerCase(),
        customer_phone.trim(),
        origin.trim(),
        destination,
        travelersCount,
        from_date || null,
        to_date || null,
        travel_month || null,
        lead_source ? 'OTHER' : 'MANUAL',
        lead_source || null,
        assign_to || null,
        services || null,
        remarks || null,
        tags.length > 0 ? tags : null,
        status,
        createdBySubAgentId,
      ]
    );

    if (!result.rows || result.rows.length === 0 || !result.rows[0]) {
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    const leadId = result.rows[0].id;

    // Fetch the created lead to return
    const createdLead = await queryOne<{
      id: string;
      agent_id: string;
      customer_name: string;
      customer_email: string;
      status: string;
      created_at: string;
    }>(
      'SELECT id, agent_id, customer_name, customer_email, status, created_at FROM leads WHERE id = $1',
      [leadId]
    );

    return NextResponse.json(
      {
        lead: createdLead,
        message: status === 'draft' ? 'Lead saved as draft' : 'Lead created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating lead:', error);
    
    // Handle database constraint violations
    if (error instanceof Error) {
      if (error.message.includes('check_email_format')) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
      if (error.message.includes('check_travel_dates')) {
        return NextResponse.json(
          { error: 'Invalid date range' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to create lead',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

