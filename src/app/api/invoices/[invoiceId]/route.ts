import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Invoice {
  id: string;
  itinerary_id: string;
  lead_id: string | null;
  invoice_number: string;
  total_amount: number;
  subtotal: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  sent_at: string | null;
  paid_at: string | null;
  due_date: string | null;
  pdf_url: string | null;
  billing_address: any | null;
  payment_terms: string | null;
  notes: string | null;
  currency: string | null;
  line_items: any | null;
  created_at: string;
  updated_at: string;
}

/**
 * PATCH /api/invoices/[invoiceId]
 * Update an existing invoice
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

    // Verify invoice exists and user owns it
    const existingInvoice = await queryOne<{ itinerary_id: string; lead_id: string | null }>(
      'SELECT itinerary_id, lead_id FROM invoices WHERE id = $1',
      [invoiceId]
    );

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify ownership through itinerary or lead
    if (existingInvoice.itinerary_id) {
      const itinerary = await queryOne<{ agent_id: string }>(
        'SELECT agent_id FROM itineraries WHERE id = $1',
        [existingInvoice.itinerary_id]
      );

      if (!itinerary || itinerary.agent_id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (existingInvoice.lead_id) {
      const lead = await queryOne<{ agent_id: string }>(
        'SELECT agent_id FROM leads WHERE id = $1',
        [existingInvoice.lead_id]
      );

      if (!lead || lead.agent_id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await request.json();
    const {
      total_amount,
      subtotal,
      tax_rate,
      tax_amount,
      status,
      due_date,
      billing_address,
      payment_terms,
      notes,
      currency,
      line_items,
      sent_at,
      paid_at,
    } = body;

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (total_amount !== undefined) {
      updates.push(`total_amount = $${paramIndex++}`);
      values.push(total_amount);
    }

    if (subtotal !== undefined) {
      updates.push(`subtotal = $${paramIndex++}`);
      values.push(subtotal);
    }

    if (tax_rate !== undefined) {
      updates.push(`tax_rate = $${paramIndex++}`);
      values.push(tax_rate);
    }

    if (tax_amount !== undefined) {
      updates.push(`tax_amount = $${paramIndex++}`);
      values.push(tax_amount);
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (due_date !== undefined) {
      updates.push(`due_date = $${paramIndex++}`);
      values.push(due_date ? new Date(due_date).toISOString().split('T')[0] : null);
    }

    if (billing_address !== undefined) {
      updates.push(`billing_address = $${paramIndex++}`);
      values.push(billing_address ? JSON.stringify(billing_address) : null);
    }

    if (payment_terms !== undefined) {
      updates.push(`payment_terms = $${paramIndex++}`);
      values.push(payment_terms || null);
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes || null);
    }

    if (currency !== undefined) {
      updates.push(`currency = $${paramIndex++}`);
      values.push(currency || 'USD');
    }

    if (line_items !== undefined) {
      updates.push(`line_items = $${paramIndex++}`);
      values.push(line_items ? JSON.stringify(line_items) : null);
    }

    if (sent_at !== undefined) {
      updates.push(`sent_at = $${paramIndex++}`);
      values.push(sent_at ? new Date(sent_at).toISOString() : null);
    }

    if (paid_at !== undefined) {
      updates.push(`paid_at = $${paramIndex++}`);
      values.push(paid_at ? new Date(paid_at).toISOString() : null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`);

    // Add invoiceId as last parameter
    values.push(invoiceId);

    const updateQuery = `
      UPDATE invoices 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query<Invoice>(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }

    return NextResponse.json({ invoice: result.rows[0] });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoices/[invoiceId]
 * Get a single invoice by ID
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

    // Fetch invoice
    const invoice = await queryOne<Invoice>(
      'SELECT * FROM invoices WHERE id = $1',
      [invoiceId]
    );

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify ownership
    if (invoice.itinerary_id) {
      const itinerary = await queryOne<{ agent_id: string }>(
        'SELECT agent_id FROM itineraries WHERE id = $1',
        [invoice.itinerary_id]
      );

      if (!itinerary || itinerary.agent_id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (invoice.lead_id) {
      const lead = await queryOne<{ agent_id: string }>(
        'SELECT agent_id FROM leads WHERE id = $1',
        [invoice.lead_id]
      );

      if (!lead || lead.agent_id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
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
