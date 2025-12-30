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

    console.log('[Create Lead] User info:', { userId, userRole: user.role, agentId, createdBySubAgentId, parentAgentId: user.parent_agent_id });

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

    // Log lead data after all variables are defined
    console.log('[Create Lead] Lead data:', { 
      customer_name, 
      customer_email, 
      customer_phone,
      origin,
      destination,
      status, 
      stage: 'NEW',
      agentId,
      createdBySubAgentId,
      travelersCount,
      lead_source,
      services,
      tags: tags.length > 0 ? tags : null
    });

    // Insert lead into database
    const insertParams = [
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
      'NEW', // stage - default for new agent-created leads
      status,
      createdBySubAgentId,
    ];
    
    console.log('[Create Lead] 📝 About to execute INSERT');
    console.log('[Create Lead] Parameter count:', insertParams.length, '(expected: 19)');
    console.log('[Create Lead] Key parameters:', {
      agentId,
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim().toLowerCase(),
      origin: origin.trim(),
      destination,
      stage: 'NEW',
      status,
      createdBySubAgentId,
    });
    
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
        stage,
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
        $18,
        false,
        false,
        $19::uuid,
        NOW(),
        NOW()
      )
      RETURNING id`,
      insertParams
    );

    if (!result.rows || result.rows.length === 0 || !result.rows[0]) {
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    const leadId = result.rows[0].id;
    console.log('[Create Lead] Lead created successfully:', { 
      leadId, 
      agentId, 
      status, 
      stage: 'NEW',
      createdBySubAgentId,
      customer_name,
      customer_email
    });

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
    console.error('[Create Lead] ❌ ERROR CREATING LEAD:', error);
    
    // Log detailed error information
    let errorMessage = 'Unknown error';
    let errorName = 'Unknown';
    let errorDetails: any = {};
    
    if (error instanceof Error) {
      errorName = error.name;
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
      
      // Log full error object for debugging
      console.error('[Create Lead] Full error object:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error as any).code && { code: (error as any).code },
        ...(error as any).detail && { detail: (error as any).detail },
        ...(error as any).hint && { hint: (error as any).hint },
        ...(error as any).where && { where: (error as any).where },
      });
      
      // Handle database constraint violations
      if (error.message.includes('check_email_format')) {
        console.error('[Create Lead] Email format constraint violation');
        return NextResponse.json(
          { error: 'Invalid email format', details: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes('check_travel_dates')) {
        console.error('[Create Lead] Travel dates constraint violation');
        return NextResponse.json(
          { error: 'Invalid date range', details: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes('column') || error.message.includes('does not exist')) {
        console.error('[Create Lead] Database column error - possible schema mismatch');
        return NextResponse.json(
          { 
            error: 'Database schema error',
            details: error.message,
            hint: 'The database column may not exist. Please verify migrations were run.',
          },
          { status: 500 }
        );
      }
      if (error.message.includes('parameter') || error.message.includes('$')) {
        console.error('[Create Lead] SQL parameter error - parameter count mismatch');
        return NextResponse.json(
          { 
            error: 'Database query error',
            details: error.message,
            hint: 'There may be a mismatch between SQL parameters and values provided.',
          },
          { status: 500 }
        );
      }
      if ((error as any).code) {
        // PostgreSQL error codes
        const pgError = error as any;
        console.error('[Create Lead] PostgreSQL error code:', pgError.code);
        return NextResponse.json(
          {
            error: 'Database error',
            details: error.message,
            code: pgError.code,
            hint: pgError.hint || undefined,
            where: pgError.where || undefined,
          },
          { status: 500 }
        );
      }
    } else {
      // Non-Error object
      errorDetails = { raw: error };
      console.error('[Create Lead] Non-Error object caught:', error);
    }

    // Return detailed error information
    return NextResponse.json(
      {
        error: 'Failed to create lead',
        details: errorMessage,
        errorType: errorName,
        ...errorDetails,
      },
      { status: 500 }
    );
  }
}

