import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface LeadCommunication {
  id: string;
  lead_id: string;
  agent_id: string | null;
  sub_agent_id: string | null;
  communication_type: 'email' | 'phone_call' | 'app_message' | 'whatsapp' | 'meeting' | 'other';
  direction: 'outbound' | 'inbound';
  subject: string | null;
  content: string | null;
  sent_at: string | null;
  received_at: string | null;
  customer_response: 'positive' | 'negative' | 'no_response' | 'pending' | null;
  response_notes: string | null;
  attachments: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/leads/[leadId]/communications
 * Get all communications for a lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query<LeadCommunication>(
      `SELECT * FROM lead_communications 
       WHERE lead_id = $1 
       ORDER BY created_at DESC`,
      [leadId]
    );

    return NextResponse.json({ communications: result.rows });
  } catch (error) {
    console.error('Error fetching lead communications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads/[leadId]/communications
 * Create a new communication record
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      communication_type,
      direction,
      subject,
      content,
      sent_at,
      received_at,
      customer_response,
      response_notes,
      attachments,
      agent_id,
      sub_agent_id,
    } = body;

    // Validate required fields
    if (!communication_type || !direction) {
      return NextResponse.json(
        { error: 'communication_type and direction are required' },
        { status: 400 }
      );
    }

    // Get the lead record to ensure it exists and get agent_id
    const lead = await queryOne<{ id: string; agent_id: string }>(
      'SELECT id, agent_id FROM leads WHERE id = $1',
      [leadId]
    );

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Use agent_id from lead record if not provided in request body
    // This ensures communications are always linked to the correct agent
    const finalAgentId = agent_id || lead.agent_id || null;

    const result = await query<LeadCommunication>(
      `INSERT INTO lead_communications (
        lead_id, agent_id, sub_agent_id, communication_type, direction,
        subject, content, sent_at, received_at, customer_response,
        response_notes, attachments, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        leadId,
        finalAgentId,
        sub_agent_id || null,
        communication_type,
        direction,
        subject || null,
        content || null,
        sent_at ? new Date(sent_at).toISOString() : null,
        received_at ? new Date(received_at).toISOString() : null,
        customer_response || null,
        response_notes || null,
        attachments ? JSON.stringify(attachments) : '[]',
        userId,
      ]
    );

    return NextResponse.json({ communication: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating lead communication:', error);
    return NextResponse.json(
      { error: 'Failed to create communication', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

