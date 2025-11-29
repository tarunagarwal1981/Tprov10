import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/leads/[leadId]?agentId=xxx
 * Get lead details (either from marketplace or regular leads table)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    // First, check if it's a purchased marketplace lead
    const purchase = await queryOne<{ lead_id: string }>(
      'SELECT lead_id FROM lead_purchases WHERE lead_id::text = $1 AND agent_id::text = $2 LIMIT 1',
      [leadId, agentId]
    );

    let leadData: any = null;

    if (purchase) {
      // Fetch from marketplace
      const marketplaceLead = await queryOne<{
        id: string;
        destination: string;
        customer_name?: string | null;
        customer_email?: string | null;
        customer_phone?: string | null;
        budget_min?: number | null;
        budget_max?: number | null;
        duration_days?: number | null;
        travelers_count?: number | null;
      }>(
        `SELECT id, destination, customer_name, customer_email, customer_phone, 
         budget_min, budget_max, duration_days, travelers_count
         FROM lead_marketplace WHERE id::text = $1 LIMIT 1`,
        [leadId]
      );

      if (marketplaceLead) {
        leadData = {
          id: marketplaceLead.id,
          destination: marketplaceLead.destination,
          customerName: marketplaceLead.customer_name || undefined,
          customerEmail: marketplaceLead.customer_email || undefined,
          customerPhone: marketplaceLead.customer_phone || undefined,
          budgetMin: marketplaceLead.budget_min || undefined,
          budgetMax: marketplaceLead.budget_max || undefined,
          durationDays: marketplaceLead.duration_days || undefined,
          travelersCount: marketplaceLead.travelers_count || undefined,
        };
      }
    } else {
      // Fetch from regular leads table
      const regularLead = await queryOne<{
        id: string;
        destination: string;
        customer_name?: string | null;
        customer_email?: string | null;
        customer_phone?: string | null;
        budget_min?: number | null;
        budget_max?: number | null;
        duration_days?: number | null;
        travelers_count?: number | null;
      }>(
        `SELECT id, destination, customer_name, customer_email, customer_phone, 
         budget_min, budget_max, duration_days, travelers_count
         FROM leads WHERE id::text = $1 AND agent_id::text = $2 LIMIT 1`,
        [leadId, agentId]
      );

      if (regularLead) {
        leadData = {
          id: regularLead.id,
          destination: regularLead.destination,
          customerName: regularLead.customer_name || undefined,
          customerEmail: regularLead.customer_email || undefined,
          customerPhone: regularLead.customer_phone || undefined,
          budgetMin: regularLead.budget_min || undefined,
          budgetMax: regularLead.budget_max || undefined,
          durationDays: regularLead.duration_days || undefined,
          travelersCount: regularLead.travelers_count || undefined,
        };
      }
    }

    if (!leadData) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ lead: leadData });
  } catch (error) {
    console.error('Error fetching lead details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

