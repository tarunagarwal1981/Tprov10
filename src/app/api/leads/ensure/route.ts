import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/aws/lambda-database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/leads/ensure
 * Ensure a lead exists in the leads table (create if it doesn't exist from marketplace)
 * Body: { leadId: string, agentId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { leadId, agentId } = await request.json();

    if (!leadId || !agentId) {
      return NextResponse.json(
        { error: 'leadId and agentId are required' },
        { status: 400 }
      );
    }

    // First, check if lead exists in leads table
    const existingLead = await queryOne<{ id: string }>(
      `SELECT id FROM leads 
       WHERE (id::text = $1 OR marketplace_lead_id::text = $1) 
       AND agent_id::text = $2 
       LIMIT 1`,
      [leadId, agentId]
    );

    if (existingLead) {
      return NextResponse.json({ 
        leadId: existingLead.id,
        created: false 
      });
    }

    // Lead doesn't exist, check if it's a purchased marketplace lead
    const purchase = await queryOne<{ id: string }>(
      'SELECT id FROM lead_purchases WHERE lead_id::text = $1 AND agent_id::text = $2 LIMIT 1',
      [leadId, agentId]
    );

    if (!purchase) {
      return NextResponse.json(
        { error: 'Lead not found or not purchased by this agent' },
        { status: 404 }
      );
    }

    // Fetch marketplace lead details
    const marketplaceLead = await queryOne<{
      customer_name?: string | null;
      customer_email?: string | null;
      customer_phone?: string | null;
      special_requirements?: string | null;
      destination?: string | null;
    }>(
      `SELECT customer_name, customer_email, customer_phone, 
       special_requirements, destination
       FROM lead_marketplace WHERE id::text = $1 LIMIT 1`,
      [leadId]
    );

    if (!marketplaceLead) {
      return NextResponse.json(
        { error: 'Marketplace lead not found' },
        { status: 404 }
      );
    }

    // Generate customer_id before creating lead
    const customerIdResult = await query<{ customer_id: string }>(
      `SELECT generate_lead_customer_id() as customer_id`,
      []
    );
    const customerId = customerIdResult.rows[0]?.customer_id;

    if (!customerId) {
      console.error('[Leads Ensure] Failed to generate customer_id');
      return NextResponse.json(
        { error: 'Failed to generate customer ID' },
        { status: 500 }
      );
    }

    // Create lead in leads table
    const insertResult = await query<{ id: string; customer_id: string }>(
      `INSERT INTO leads (
        id, agent_id, marketplace_lead_id, customer_id, customer_name, customer_email, 
        customer_phone, destination, requirements, stage, is_purchased, purchased_from_marketplace
      ) VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, customer_id`,
      [
        agentId,
        leadId,
        customerId,
        marketplaceLead.customer_name || '',
        marketplaceLead.customer_email || '',
        marketplaceLead.customer_phone || null,
        marketplaceLead.destination || '',
        marketplaceLead.special_requirements || null,
        'NEW', // stage
        true, // is_purchased
        true  // purchased_from_marketplace
      ]
    );

    if (!insertResult.rows || insertResult.rows.length === 0 || !insertResult.rows[0]) {
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    const createdLead = insertResult.rows[0];
    return NextResponse.json({ 
      leadId: createdLead.id,
      customerId: createdLead.customer_id,
      created: true 
    });
  } catch (error) {
    console.error('[Leads Ensure] Error ensuring lead exists:', error);
    console.error('[Leads Ensure] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      { 
        error: 'Failed to ensure lead exists', 
        details: error instanceof Error ? error.message : 'Unknown error',
        fullError: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error
      },
      { status: 500 }
    );
  }
}

