import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/leads/[leadId]?agentId=xxx
 * Get lead details (either from marketplace or regular leads table)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    // First, check if it's a purchased marketplace lead
    const purchase = await queryOne<{ lead_id: string }>(
      'SELECT lead_id FROM lead_purchases WHERE lead_id::text = $1 AND agent_id::text = $2 LIMIT 1',
      [leadId, agentId]
    );

    let leadData: any = null;

    if (purchase) {
      // Fetch from marketplace
      const marketplaceLead = await queryOne<{
        id: string;
        destination: string;
        customer_name?: string | null;
        customer_email?: string | null;
        customer_phone?: string | null;
        budget_min?: number | null;
        budget_max?: number | null;
        duration_days?: number | null;
        travelers_count?: number | null;
      }>(
        `SELECT id, destination, customer_name, customer_email, customer_phone, 
         budget_min, budget_max, duration_days, travelers_count
         FROM lead_marketplace WHERE id::text = $1 LIMIT 1`,
        [leadId]
      );

      if (marketplaceLead) {
        leadData = {
          id: marketplaceLead.id,
          destination: marketplaceLead.destination,
          customerName: marketplaceLead.customer_name || undefined,
          customerEmail: marketplaceLead.customer_email || undefined,
          customerPhone: marketplaceLead.customer_phone || undefined,
          budgetMin: marketplaceLead.budget_min || undefined,
          budgetMax: marketplaceLead.budget_max || undefined,
          durationDays: marketplaceLead.duration_days || undefined,
          travelersCount: marketplaceLead.travelers_count || undefined,
        };
      }
    } else {
      // Fetch from regular leads table
      const regularLead = await queryOne<{
        id: string;
        customer_id: string | null;
        destination: string;
        customer_name?: string | null;
        customer_email?: string | null;
        customer_phone?: string | null;
        budget_min?: number | null;
        budget_max?: number | null;
        duration_days?: number | null;
        travelers_count?: number | null;
        stage?: string | null;
        priority?: string | null;
        notes?: string | null;
        requirements?: string | null;
        next_follow_up_date?: string | null;
      }>(
        `SELECT id, customer_id, destination, customer_name, customer_email, customer_phone, 
         budget_min, budget_max, duration_days, travelers_count,
         stage, priority, notes, requirements, next_follow_up_date
         FROM leads WHERE id::text = $1 AND agent_id::text = $2 LIMIT 1`,
        [leadId, agentId]
      );

      if (regularLead) {
        leadData = {
          id: regularLead.id,
          customer_id: regularLead.customer_id,
          destination: regularLead.destination,
          customerName: regularLead.customer_name || undefined,
          customerEmail: regularLead.customer_email || undefined,
          customerPhone: regularLead.customer_phone || undefined,
          budgetMin: regularLead.budget_min || undefined,
          budgetMax: regularLead.budget_max || undefined,
          durationDays: regularLead.duration_days || undefined,
          travelersCount: regularLead.travelers_count || undefined,
          stage: regularLead.stage || 'NEW',
          priority: regularLead.priority || 'MEDIUM',
          notes: regularLead.notes,
          requirements: regularLead.requirements,
          next_follow_up_date: regularLead.next_follow_up_date,
        };
      }
    }

    if (!leadData) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ lead: leadData });
  } catch (error) {
    console.error('Error fetching lead details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/leads/[leadId]
 * Update lead fields (stage, priority, next_follow_up_date, notes, requirements, assigned_to)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      stage,
      priority,
      next_follow_up_date,
      notes,
      requirements,
      assigned_to,
    } = body;

    // Verify lead ownership
    const lead = await queryOne<{ agent_id: string }>(
      'SELECT agent_id FROM leads WHERE id = $1',
      [leadId]
    );

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.agent_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (stage !== undefined) {
      // Validate stage enum
      const validStages = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST', 'ARCHIVED'];
      if (!validStages.includes(stage)) {
        return NextResponse.json({ error: 'Invalid stage value' }, { status: 400 });
      }
      updates.push(`stage = $${paramIndex++}`);
      values.push(stage);
    }

    if (priority !== undefined) {
      // Validate priority enum
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 });
      }
      updates.push(`priority = $${paramIndex++}`);
      values.push(priority);
    }

    if (next_follow_up_date !== undefined) {
      updates.push(`next_follow_up_date = $${paramIndex++}`);
      values.push(next_follow_up_date ? new Date(next_follow_up_date).toISOString() : null);
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }

    if (requirements !== undefined) {
      updates.push(`requirements = $${paramIndex++}`);
      values.push(requirements);
    }

    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${paramIndex++}`);
      values.push(assigned_to || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`);
    
    // Add WHERE clause params
    values.push(leadId);

    const result = await query(
      `UPDATE leads 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }

    return NextResponse.json({ lead: result.rows[0] });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

