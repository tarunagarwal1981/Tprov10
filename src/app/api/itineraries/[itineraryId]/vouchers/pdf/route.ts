import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';
import React from 'react';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/itineraries/[itineraryId]/vouchers/pdf?itemId=xxx
 * Generate voucher PDF for a specific itinerary item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  try {
    const { itineraryId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const itemId = searchParams.get('itemId');
    
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    // Fetch itinerary
    const itinerary = await queryOne<{
      id: string;
      name: string;
      customer_id: string | null;
      lead_id: string;
      agent_id: string;
      start_date: string | null;
      end_date: string | null;
    }>(
      'SELECT id, name, customer_id, lead_id, agent_id, start_date, end_date FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (!itinerary || itinerary.agent_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch item
    const item = await queryOne<{
      id: string;
      package_title: string;
      package_type: string;
      operator_id: string;
      day_id: string | null;
    }>(
      'SELECT id, package_title, package_type, operator_id, day_id FROM itinerary_items WHERE id = $1 AND itinerary_id = $2',
      [itemId, itineraryId]
    );

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Fetch day for date/time
    let dayDate: string | null = null;
    let dayTime: string | null = null;
    if (item.day_id) {
      const day = await queryOne<{
        date: string | null;
        time_slots: any;
      }>(
        'SELECT date, time_slots FROM itinerary_days WHERE id = $1',
        [item.day_id]
      );
      dayDate = day?.date || null;
      // Extract time from time_slots if available
      if (day?.time_slots) {
        const slots = day.time_slots;
        dayTime = slots.morning?.time || slots.afternoon?.time || slots.evening?.time || null;
      }
    }

    // Fetch operator
    const operator = await queryOne<{
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      company_name: string | null;
      phone_number: string | null;
      website_url: string | null;
      business_address: string | null;
    }>(
      `SELECT 
        id, 
        name, 
        email, 
        phone,
        profile->>'companyName' as company_name,
        profile->>'phoneNumber' as phone_number,
        profile->>'websiteUrl' as website_url,
        profile->>'businessAddress' as business_address
      FROM users 
      WHERE id::text = $1`,
      [item.operator_id]
    );

    // Fetch lead
    const lead = await queryOne<{
      customer_name: string | null;
      customer_email: string | null;
      customer_phone: string | null;
    }>(
      'SELECT customer_name, customer_email, customer_phone FROM leads WHERE id = $1',
      [itinerary.lead_id]
    );

    // Generate voucher number
    const voucherNumber = `VOU-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    const bookingReference = `${itinerary.customer_id || itineraryId}-${itemId.slice(-8)}`;

    // Generate PDF
    try {
      const { renderToBuffer } = await import('@react-pdf/renderer');
      const { VoucherPDF } = await import('@/lib/pdf/templates/VoucherPDF');
      
      const pdfBuffer = await renderToBuffer(
        React.createElement(VoucherPDF, {
          voucher: {
            voucher_number: voucherNumber,
            booking_reference: bookingReference,
            created_at: new Date().toISOString(),
          },
          itinerary: {
            id: itinerary.id,
            name: itinerary.name,
            customer_id: itinerary.customer_id,
            start_date: itinerary.start_date,
            end_date: itinerary.end_date,
          },
          lead: {
            customerName: lead?.customer_name || undefined,
            customerEmail: lead?.customer_email || undefined,
            customerPhone: lead?.customer_phone || undefined,
          },
          operator: {
            name: operator?.company_name || operator?.name || 'Unknown Operator',
            email: operator?.email || null,
            phone: operator?.phone || operator?.phone_number || null,
            website: operator?.website_url || null,
            address: operator?.business_address || null,
          },
          packageDetails: {
            title: item.package_title,
            date: dayDate || itinerary.start_date || new Date().toISOString(),
            time: dayTime || 'TBD',
          },
        })
      );

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="voucher-${voucherNumber}.pdf"`,
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
    console.error('Error generating voucher PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

