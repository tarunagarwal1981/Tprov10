import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Invoice {
  id: string;
  itinerary_id: string;
  invoice_number: string;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  sent_at: string | null;
  paid_at: string | null;
  due_date: string | null;
  pdf_url: string | null;
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
    const { itinerary_id, total_amount, due_date } = body;

    if (!itinerary_id || !total_amount) {
      return NextResponse.json(
        { error: 'itinerary_id and total_amount are required' },
        { status: 400 }
      );
    }

    // Verify itinerary ownership
    const itinerary = await queryOne<{ agent_id: string; total_price: number }>(
      'SELECT agent_id, total_price FROM itineraries WHERE id = $1',
      [itinerary_id]
    );

    if (!itinerary || itinerary.agent_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
        itinerary_id, invoice_number, total_amount, status, due_date
      ) VALUES ($1, $2, $3, 'draft', $4)
      RETURNING *`,
      [
        itinerary_id,
        invoice_number,
        total_amount,
        due_date ? new Date(due_date).toISOString().split('T')[0] : null,
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

    if (!itineraryId) {
      return NextResponse.json(
        { error: 'itineraryId is required' },
        { status: 400 }
      );
    }

    // Verify itinerary ownership
    const itinerary = await queryOne<{ agent_id: string }>(
      'SELECT agent_id FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (!itinerary || itinerary.agent_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch invoices
    const invoicesResult = await query<Invoice>(
      'SELECT * FROM invoices WHERE itinerary_id = $1 ORDER BY created_at DESC',
      [itineraryId]
    );

    return NextResponse.json({ invoices: invoicesResult.rows });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

