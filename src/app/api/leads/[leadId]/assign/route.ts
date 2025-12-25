import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/leads/[leadId]/assign
 * Assign a lead to a sub-agent
 */
export async function POST(
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
    const { sub_agent_id, notes } = body;

    if (!sub_agent_id) {
      return NextResponse.json(
        { error: 'sub_agent_id is required' },
        { status: 400 }
      );
    }

    // Verify lead belongs to this agent
    const lead = await queryOne<{ agent_id: string }>(
      'SELECT agent_id FROM leads WHERE id = $1',
      [leadId]
    );

    if (!lead || lead.agent_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify sub-agent belongs to this agent
    const subAgent = await queryOne<{ id: string; parent_agent_id: string }>(
      'SELECT id, parent_agent_id FROM users WHERE id = $1',
      [sub_agent_id]
    );

    if (!subAgent || subAgent.parent_agent_id !== userId) {
      return NextResponse.json({ error: 'Invalid sub-agent' }, { status: 400 });
    }

    // Check if assignment already exists
    const existingAssignment = await queryOne<{ id: string }>(
      'SELECT id FROM sub_agent_assignments WHERE lead_id = $1 AND sub_agent_id = $2',
      [leadId, sub_agent_id]
    );

    if (existingAssignment) {
      return NextResponse.json({ error: 'Lead is already assigned to this sub-agent' }, { status: 400 });
    }

    // Create assignment
    const assignmentResult = await query<{
      id: string;
      agent_id: string;
      sub_agent_id: string;
      lead_id: string;
      assigned_at: string;
      assigned_by: string;
      notes: string | null;
    }>(
      `INSERT INTO sub_agent_assignments (agent_id, sub_agent_id, lead_id, assigned_by, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, sub_agent_id, leadId, userId, notes || null]
    );

    return NextResponse.json({ assignment: assignmentResult.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error assigning lead:', error);
    return NextResponse.json(
      { error: 'Failed to assign lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leads/[leadId]/assign?subAgentId=xxx
 * Unassign a lead from a sub-agent
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const subAgentId = searchParams.get('subAgentId');
    
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!subAgentId) {
      return NextResponse.json(
        { error: 'subAgentId is required' },
        { status: 400 }
      );
    }

    // Verify assignment belongs to this agent
    const assignment = await queryOne<{ agent_id: string }>(
      'SELECT agent_id FROM sub_agent_assignments WHERE lead_id = $1 AND sub_agent_id = $2',
      [leadId, subAgentId]
    );

    if (!assignment || assignment.agent_id !== userId) {
      return NextResponse.json({ error: 'Assignment not found or forbidden' }, { status: 404 });
    }

    // Delete assignment
    await query(
      'DELETE FROM sub_agent_assignments WHERE lead_id = $1 AND sub_agent_id = $2',
      [leadId, subAgentId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unassigning lead:', error);
    return NextResponse.json(
      { error: 'Failed to unassign lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

