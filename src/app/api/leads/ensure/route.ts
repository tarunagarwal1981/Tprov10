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

    // Create lead in leads table
    // Note: We'll use the Lambda database service to insert
    // Since we don't have a direct insert function, we'll need to add it to the Lambda
    // For now, let's use a workaround by calling the existing query function with INSERT
    
    // Actually, we need to add an 'insert' action to the Lambda database service
    // For now, let's return the marketplace lead data and let the client handle it
    // OR we can use a raw SQL INSERT via the query function
    
    const insertResult = await query<{ id: string }>(
      `INSERT INTO leads (
        agent_id, marketplace_lead_id, customer_name, customer_email, 
        customer_phone, destination, requirements, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        agentId,
        leadId,
        marketplaceLead.customer_name || '',
        marketplaceLead.customer_email || '',
        marketplaceLead.customer_phone || null,
        marketplaceLead.destination || '',
        marketplaceLead.special_requirements || null,
        'active'
      ]
    );

    if (!insertResult.rows || insertResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      leadId: insertResult.rows[0].id,
      created: true 
    });
  } catch (error) {
    console.error('Error ensuring lead exists:', error);
    return NextResponse.json(
      { error: 'Failed to ensure lead exists', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

