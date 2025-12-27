import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PATCH /api/leads/[leadId]/communications/[commId]
 * Update a communication record
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string; commId: string }> }
) {
  try {
    const { leadId, commId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      subject,
      content,
      sent_at,
      received_at,
      customer_response,
      response_notes,
      attachments,
    } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (subject !== undefined) {
      updates.push(`subject = $${paramIndex++}`);
      values.push(subject);
    }
    if (content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(content);
    }
    if (sent_at !== undefined) {
      updates.push(`sent_at = $${paramIndex++}`);
      values.push(sent_at ? new Date(sent_at).toISOString() : null);
    }
    if (received_at !== undefined) {
      updates.push(`received_at = $${paramIndex++}`);
      values.push(received_at ? new Date(received_at).toISOString() : null);
    }
    if (customer_response !== undefined) {
      updates.push(`customer_response = $${paramIndex++}`);
      values.push(customer_response);
    }
    if (response_notes !== undefined) {
      updates.push(`response_notes = $${paramIndex++}`);
      values.push(response_notes);
    }
    if (attachments !== undefined) {
      updates.push(`attachments = $${paramIndex++}`);
      values.push(JSON.stringify(attachments));
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`);
    
    // Add WHERE clause params
    values.push(commId, leadId);

    const result = await query(
      `UPDATE lead_communications 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND lead_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Communication not found' }, { status: 404 });
    }

    return NextResponse.json({ communication: result.rows[0] });
  } catch (error) {
    console.error('Error updating lead communication:', error);
    return NextResponse.json(
      { error: 'Failed to update communication', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leads/[leadId]/communications/[commId]
 * Delete a communication record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string; commId: string }> }
) {
  try {
    const { leadId, commId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `DELETE FROM lead_communications 
       WHERE id = $1 AND lead_id = $2
       RETURNING id`,
      [commId, leadId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Communication not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: commId });
  } catch (error) {
    console.error('Error deleting lead communication:', error);
    return NextResponse.json(
      { error: 'Failed to delete communication', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

