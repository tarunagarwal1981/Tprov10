import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';
import React from 'react';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/itineraries/[itineraryId]/invoice/pdf
 * Generate invoice PDF
 * Note: Requires invoice to be created first via /api/invoices
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch invoice for this itinerary
    const invoice = await queryOne<{
      id: string;
      invoice_number: string;
      total_amount: number;
      due_date: string | null;
      status: string;
      created_at: string;
    }>(
      'SELECT * FROM invoices WHERE itinerary_id = $1 ORDER BY created_at DESC LIMIT 1',
      [itineraryId]
    );

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found. Please create an invoice first.' }, { status: 404 });
    }

    // Fetch itinerary
    const itinerary = await queryOne<{
      id: string;
      name: string;
      customer_id: string | null;
      lead_id: string;
      agent_id: string;
    }>(
      'SELECT id, name, customer_id, lead_id, agent_id FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (!itinerary || itinerary.agent_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch lead
    const lead = await queryOne<{
      customer_name: string | null;
      customer_email: string | null;
      customer_phone: string | null;
    }>(
      'SELECT customer_name, customer_email, customer_phone FROM leads WHERE id = $1',
      [itinerary.lead_id]
    );

    // Fetch items
    const itemsResult = await query<{
      id: string;
      package_title: string;
      package_type: string;
      total_price: number | null;
      unit_price: number | null;
      quantity: number;
    }>(
      'SELECT id, package_title, package_type, total_price, unit_price, quantity FROM itinerary_items WHERE itinerary_id = $1',
      [itineraryId]
    );

    // Generate PDF
    try {
      const { renderToBuffer } = await import('@react-pdf/renderer');
      const { InvoicePDF } = await import('@/lib/pdf/templates/InvoicePDF');
      
      const pdfBuffer = await renderToBuffer(
        React.createElement(InvoicePDF, {
          invoice: {
            invoice_number: invoice.invoice_number,
            total_amount: invoice.total_amount,
            due_date: invoice.due_date,
            status: invoice.status,
            created_at: invoice.created_at,
          },
          itinerary: {
            id: itinerary.id,
            name: itinerary.name,
            customer_id: itinerary.customer_id,
          },
          lead: {
            customerName: lead?.customer_name || undefined,
            customerEmail: lead?.customer_email || undefined,
            customerPhone: lead?.customer_phone || undefined,
          },
          items: itemsResult.rows,
        })
      );

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
        },
      });
    } catch (importError: any) {
      if (importError.code === 'MODULE_NOT_FOUND' || importError.message?.includes('@react-pdf/renderer')) {
        return NextResponse.json(
          { 
            error: 'PDF generation library not installed',
            message: 'Please install @react-pdf/renderer: npm install @react-pdf/renderer',
          },
          { status: 503 }
        );
      }
      throw importError;
    }
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

