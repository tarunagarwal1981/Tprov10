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
    
    // Validate itineraryId format (basic UUID check)
    if (!itineraryId || typeof itineraryId !== 'string' || itineraryId.trim().length === 0) {
      console.error('[Itinerary PDF] Invalid itineraryId format:', itineraryId);
      return NextResponse.json({ error: 'Invalid itinerary ID' }, { status: 400 });
    }
    
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    
    if (!token) {
      console.error('[Itinerary PDF] No token provided for itineraryId:', itineraryId);
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }
    
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      console.error('[Itinerary PDF] Failed to get userId from token for itineraryId:', itineraryId);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    console.log('[Itinerary PDF] Request for itineraryId:', itineraryId, 'userId:', userId);

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
      console.error('[Itinerary PDF] Itinerary not found:', itineraryId);
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    // Verify ownership
    if (itinerary.agent_id !== userId) {
      console.error('[Itinerary PDF] Access denied - userId:', userId, 'agent_id:', itinerary.agent_id);
      return NextResponse.json({ error: 'Forbidden - You do not have access to this itinerary' }, { status: 403 });
    }

    console.log('[Itinerary PDF] Itinerary found:', itinerary.id, 'lead_id:', itinerary.lead_id);

    // Fetch lead details - make it more resilient
    let lead = await queryOne<{
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
      console.warn('[Itinerary PDF] Lead not found, using defaults for lead_id:', itinerary.lead_id);
      lead = {
        id: itinerary.lead_id,
        customer_name: null,
        customer_email: null,
        customer_phone: null,
        destination: 'Unknown',
      };
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

    console.log('[Itinerary PDF] Fetched days:', daysResult.rows.length);

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

    console.log('[Itinerary PDF] Fetched items:', itemsResult.rows.length);

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
      console.log('[Itinerary PDF] Starting PDF generation...');
      const { renderToBuffer } = await import('@react-pdf/renderer');
      const { ItineraryPDF } = await import('@/lib/pdf/templates/ItineraryPDF');
      
      const ItineraryPDFComponent = ItineraryPDF as React.ComponentType<any>;
      
      // Ensure we have default values for all required fields
      const pdfData = {
        itinerary: {
          id: itinerary.id,
          name: itinerary.name || 'Untitled Itinerary',
          customer_id: itinerary.customer_id,
          start_date: itinerary.start_date,
          end_date: itinerary.end_date,
          adults_count: itinerary.adults_count || 0,
          children_count: itinerary.children_count || 0,
          infants_count: itinerary.infants_count || 0,
          currency: itinerary.currency || 'USD',
        },
        lead: {
          customerName: lead.customer_name || 'Customer',
          customerEmail: lead.customer_email || undefined,
          customerPhone: lead.customer_phone || undefined,
          destination: lead.destination || 'Unknown',
        },
        days: daysResult.rows || [],
        items: itemsResult.rows || [],
        operatorDetails: operatorDetails || {},
      };

      console.log('[Itinerary PDF] Rendering PDF with data:', {
        itineraryId: pdfData.itinerary.id,
        daysCount: pdfData.days.length,
        itemsCount: pdfData.items.length,
      });

      const pdfBuffer = await renderToBuffer(
        React.createElement(ItineraryPDFComponent, pdfData)
      );

      console.log('[Itinerary PDF] PDF generated successfully, size:', pdfBuffer.length, 'bytes');

      // Return PDF
      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="itinerary-${itinerary.customer_id || itineraryId}.pdf"`,
        },
      });
    } catch (pdfError: any) {
      console.error('[Itinerary PDF] PDF generation failed:', {
        error: pdfError.message,
        stack: pdfError.stack,
        code: pdfError.code,
        itineraryId,
      });
      
      // If package is not installed, return helpful error
      if (pdfError.code === 'MODULE_NOT_FOUND' || pdfError.message?.includes('@react-pdf/renderer')) {
        return NextResponse.json(
          { 
            error: 'PDF generation library not installed',
            message: 'Please install @react-pdf/renderer: npm install @react-pdf/renderer',
          },
          { status: 503 }
        );
      }
      
      // Return detailed error for debugging
      return NextResponse.json(
        { 
          error: 'Failed to generate PDF',
          details: pdfError.message || 'Unknown error occurred during PDF generation',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Itinerary PDF] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      itineraryId: error instanceof Error ? undefined : 'unknown',
    });
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

