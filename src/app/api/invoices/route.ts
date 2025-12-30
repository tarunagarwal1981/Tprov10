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
 * POST /api/invoices
 * Create a new invoice for an itinerary
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      itinerary_id, 
      lead_id,
      total_amount, 
      subtotal,
      tax_rate,
      tax_amount,
      due_date,
      billing_address,
      payment_terms,
      notes,
      currency,
      line_items
    } = body;

    if (!itinerary_id) {
      return NextResponse.json(
        { error: 'itinerary_id is required' },
        { status: 400 }
      );
    }

    // Verify itinerary ownership and get lead_id if not provided
    const itinerary = await queryOne<{ agent_id: string; lead_id: string; total_price: number }>(
      'SELECT agent_id, lead_id, total_price FROM itineraries WHERE id = $1',
      [itinerary_id]
    );

    if (!itinerary || itinerary.agent_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use provided lead_id or derive from itinerary
    const finalLeadId = lead_id || itinerary.lead_id;

    // Calculate totals if not provided
    let finalSubtotal = subtotal;
    let finalTaxAmount = tax_amount;
    let finalTotalAmount = total_amount;

    if (line_items && Array.isArray(line_items) && line_items.length > 0) {
      // Calculate subtotal from line items
      finalSubtotal = line_items.reduce((sum: number, item: any) => {
        return sum + (item.total || (item.unit_price || 0) * (item.quantity || 1));
      }, 0);
    }

    if (finalSubtotal !== null && finalSubtotal !== undefined) {
      // Calculate tax if tax_rate is provided
      if (tax_rate !== null && tax_rate !== undefined && tax_rate > 0) {
        finalTaxAmount = finalSubtotal * (tax_rate / 100);
      } else if (finalTaxAmount === null || finalTaxAmount === undefined) {
        finalTaxAmount = 0;
      }
      
      // Calculate total
      if (finalTotalAmount === null || finalTotalAmount === undefined) {
        finalTotalAmount = finalSubtotal + (finalTaxAmount || 0);
      }
    } else if (!finalTotalAmount) {
      return NextResponse.json(
        { error: 'total_amount or line_items are required' },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceNumberResult = await query<{ invoice_number: string }>(
      'SELECT generate_invoice_number() as invoice_number',
      []
    );
    const invoice_number = invoiceNumberResult.rows[0]?.invoice_number;

    if (!invoice_number) {
      return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 });
    }

    // Create invoice
    const invoiceResult = await query<Invoice>(
      `INSERT INTO invoices (
        itinerary_id, lead_id, invoice_number, total_amount, subtotal, tax_rate, tax_amount,
        status, due_date, billing_address, payment_terms, notes, currency, line_items
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        itinerary_id,
        finalLeadId,
        invoice_number,
        finalTotalAmount,
        finalSubtotal,
        tax_rate || 0,
        finalTaxAmount || 0,
        due_date ? new Date(due_date).toISOString().split('T')[0] : null,
        billing_address ? JSON.stringify(billing_address) : null,
        payment_terms || null,
        notes || null,
        currency || 'USD',
        line_items ? JSON.stringify(line_items) : null,
      ]
    );

    return NextResponse.json({ invoice: invoiceResult.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoices?itineraryId=xxx
 * Get invoices for an itinerary
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
    const itineraryId = searchParams.get('itineraryId');
    const leadId = searchParams.get('leadId');

    if (!itineraryId && !leadId) {
      return NextResponse.json(
        { error: 'itineraryId or leadId is required' },
        { status: 400 }
      );
    }

    // Build query based on provided parameter
    let queryText: string;
    let queryParams: string[];
    let verificationQuery: string;
    let verificationParams: string[];

    if (leadId) {
      // Verify lead ownership
      const lead = await queryOne<{ agent_id: string }>(
        'SELECT agent_id FROM leads WHERE id = $1',
        [leadId]
      );

      if (!lead || lead.agent_id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      queryText = 'SELECT * FROM invoices WHERE lead_id = $1 ORDER BY created_at DESC';
      queryParams = [leadId];
    } else {
      // Verify itinerary ownership
      const itinerary = await queryOne<{ agent_id: string }>(
        'SELECT agent_id FROM itineraries WHERE id = $1',
        [itineraryId!]
      );

      if (!itinerary || itinerary.agent_id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      queryText = 'SELECT * FROM invoices WHERE itinerary_id = $1 ORDER BY created_at DESC';
      queryParams = [itineraryId!];
    }

    // Fetch invoices
    const invoicesResult = await query<Invoice>(queryText, queryParams);

    return NextResponse.json({ invoices: invoicesResult.rows });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

