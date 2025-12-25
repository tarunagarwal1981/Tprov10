import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';
import React from 'react';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/itineraries/[itineraryId]/pdf
 * Generate and return itinerary PDF
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

    // Fetch itinerary
    const itinerary = await queryOne<{
      id: string;
      name: string;
      customer_id: string | null;
      lead_id: string;
      agent_id: string;
      start_date: string | null;
      end_date: string | null;
      adults_count: number;
      children_count: number;
      infants_count: number;
      total_price: number;
      currency: string;
    }>(
      'SELECT * FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (!itinerary) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    // Verify ownership
    if (itinerary.agent_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch lead details
    const lead = await queryOne<{
      id: string;
      customer_name: string | null;
      customer_email: string | null;
      customer_phone: string | null;
      destination: string;
    }>(
      'SELECT id, customer_name, customer_email, customer_phone, destination FROM leads WHERE id = $1',
      [itinerary.lead_id]
    );

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Fetch days
    const daysResult = await query<{
      id: string;
      day_number: number;
      date: string | null;
      city_name: string;
      time_slots: any;
    }>(
      'SELECT * FROM itinerary_days WHERE itinerary_id = $1 ORDER BY day_number ASC',
      [itineraryId]
    );

    // Fetch items
    const itemsResult = await query<{
      id: string;
      package_title: string;
      package_type: string;
      operator_id: string;
      total_price: number | null;
      unit_price: number | null;
    }>(
      'SELECT id, package_title, package_type, operator_id, total_price, unit_price FROM itinerary_items WHERE itinerary_id = $1',
      [itineraryId]
    );

    // Fetch operator details
    const operatorIds = [...new Set(itemsResult.rows.map(item => item.operator_id).filter(Boolean))];
    const operatorDetails: Record<string, any> = {};

    if (operatorIds.length > 0) {
      const placeholders = operatorIds.map((_, i) => `$${i + 1}`).join(', ');
      const operatorsResult = await query<{
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
        WHERE id::text IN (${placeholders})`,
        operatorIds
      );

      operatorsResult.rows.forEach(op => {
        operatorDetails[op.id] = {
          name: op.company_name || op.name || 'Unknown Operator',
          email: op.email || null,
          phone: op.phone || op.phone_number || null,
          website: op.website_url || null,
          address: op.business_address || null,
        };
      });
    }

    // Generate PDF using @react-pdf/renderer
    // Note: Package must be installed: npm install @react-pdf/renderer
    try {
      const { renderToBuffer } = await import('@react-pdf/renderer');
      const { ItineraryPDF } = await import('@/lib/pdf/templates/ItineraryPDF');
      
      const pdfBuffer = await renderToBuffer(
        React.createElement(ItineraryPDF, {
          itinerary: {
            id: itinerary.id,
            name: itinerary.name,
            customer_id: itinerary.customer_id,
            start_date: itinerary.start_date,
            end_date: itinerary.end_date,
            adults_count: itinerary.adults_count,
            children_count: itinerary.children_count,
            infants_count: itinerary.infants_count,
            total_price: itinerary.total_price,
            currency: itinerary.currency,
          },
          lead: {
            customerName: lead.customer_name || undefined,
            customerEmail: lead.customer_email || undefined,
            customerPhone: lead.customer_phone || undefined,
            destination: lead.destination,
          },
          days: daysResult.rows,
          items: itemsResult.rows,
          operatorDetails: operatorDetails,
        })
      );

      // Return PDF
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="itinerary-${itinerary.customer_id || itineraryId}.pdf"`,
        },
      });
    } catch (importError: any) {
      // If package is not installed, return helpful error
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
    console.error('Error generating itinerary PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

