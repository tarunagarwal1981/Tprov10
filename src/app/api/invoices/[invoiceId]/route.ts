import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/invoices/[invoiceId]
 * Get invoice details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch invoice with itinerary
    const invoice = await queryOne<{
      id: string;
      itinerary_id: string;
      invoice_number: string;
      total_amount: number;
      status: string;
      sent_at: string | null;
      paid_at: string | null;
      due_date: string | null;
      pdf_url: string | null;
      created_at: string;
      agent_id: string;
    }>(
      `SELECT i.*, it.agent_id 
       FROM invoices i
       JOIN itineraries it ON i.itinerary_id = it.id
       WHERE i.id = $1`,
      [invoiceId]
    );

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.agent_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/invoices/[invoiceId]
 * Update invoice (status, sent_at, paid_at, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const invoice = await queryOne<{ itinerary_id: string; agent_id: string }>(
      `SELECT i.itinerary_id, it.agent_id 
       FROM invoices i
       JOIN itineraries it ON i.itinerary_id = it.id
       WHERE i.id = $1`,
      [invoiceId]
    );

    if (!invoice || invoice.agent_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status, sent_at, paid_at, due_date, pdf_url } = body;

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (sent_at !== undefined) {
      updates.push(`sent_at = $${paramIndex++}`);
      values.push(sent_at ? new Date(sent_at).toISOString() : null);
    }
    if (paid_at !== undefined) {
      updates.push(`paid_at = $${paramIndex++}`);
      values.push(paid_at ? new Date(paid_at).toISOString() : null);
    }
    if (due_date !== undefined) {
      updates.push(`due_date = $${paramIndex++}`);
      values.push(due_date ? new Date(due_date).toISOString().split('T')[0] : null);
    }
    if (pdf_url !== undefined) {
      updates.push(`pdf_url = $${paramIndex++}`);
      values.push(pdf_url);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(invoiceId);

    const result = await query(
      `UPDATE invoices 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++}
       RETURNING *`,
      values
    );

    return NextResponse.json({ invoice: result.rows[0] });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

