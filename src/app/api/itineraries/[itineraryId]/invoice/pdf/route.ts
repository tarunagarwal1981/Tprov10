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

    // Get invoiceId from query params if provided, otherwise get latest
    const searchParams = request.nextUrl.searchParams;
    const invoiceIdParam = searchParams.get('invoiceId');
    
    let invoice;
    if (invoiceIdParam) {
      invoice = await queryOne<{
        id: string;
        invoice_number: string;
        total_amount: number;
        subtotal: number | null;
        tax_rate: number | null;
        tax_amount: number | null;
        due_date: string | null;
        status: string;
        created_at: string;
        billing_address: any | null;
        payment_terms: string | null;
        notes: string | null;
        currency: string | null;
        line_items: any | null;
      }>(
        'SELECT * FROM invoices WHERE id = $1',
        [invoiceIdParam]
      );
    } else {
      invoice = await queryOne<{
        id: string;
        invoice_number: string;
        total_amount: number;
        subtotal: number | null;
        tax_rate: number | null;
        tax_amount: number | null;
        due_date: string | null;
        status: string;
        created_at: string;
        billing_address: any | null;
        payment_terms: string | null;
        notes: string | null;
        currency: string | null;
        line_items: any | null;
      }>(
        'SELECT * FROM invoices WHERE itinerary_id = $1 ORDER BY created_at DESC LIMIT 1',
        [itineraryId]
      );
    }

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

    // Fetch items (use line_items from invoice if available, otherwise fetch from itinerary)
    let items: Array<{
      id: string;
      package_title: string;
      package_type: string;
      total_price: number | null;
      unit_price: number | null;
      quantity: number;
    }> = [];

    if (invoice.line_items && Array.isArray(invoice.line_items)) {
      // Use line items from invoice
      items = invoice.line_items.map((item: any, index: number) => ({
        id: item.id || `item-${index}`,
        package_title: item.description || 'Item',
        package_type: 'service',
        total_price: item.total || 0,
        unit_price: item.unit_price || 0,
        quantity: item.quantity || 1,
      }));
    } else {
      // Fallback to itinerary items
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
      items = itemsResult.rows;
    }

    // Generate PDF
    try {
      const { renderToBuffer } = await import('@react-pdf/renderer');
      const { InvoicePDF } = await import('@/lib/pdf/templates/InvoicePDF');
      
      const InvoicePDFComponent = InvoicePDF as React.ComponentType<any>;
      const pdfBuffer = await renderToBuffer(
        React.createElement(InvoicePDFComponent, {
          invoice: {
            invoice_number: invoice.invoice_number,
            total_amount: invoice.total_amount,
            subtotal: invoice.subtotal,
            tax_rate: invoice.tax_rate,
            tax_amount: invoice.tax_amount,
            due_date: invoice.due_date,
            status: invoice.status,
            created_at: invoice.created_at,
            billing_address: invoice.billing_address,
            payment_terms: invoice.payment_terms,
            notes: invoice.notes,
            currency: invoice.currency || 'USD',
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
          items: items,
        })
      );

      return new NextResponse(pdfBuffer as any, {
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

