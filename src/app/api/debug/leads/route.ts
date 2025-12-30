import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/aws/lambda-database';
import { getUserIdFromToken } from '@/lib/auth/getUserIdFromToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/debug/leads
 * Debug endpoint to query leads directly and check why they're not appearing
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
    const leadId = searchParams.get('leadId');
    const userIdParam = searchParams.get('userId') || userId;

    // Get user info
    const user = await queryOne<{ id: string; role: string; parent_agent_id: string | null; email: string }>(
      'SELECT id, role, parent_agent_id, email FROM users WHERE id = $1',
      [userIdParam]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const results: any = {
      user: {
        id: user.id,
        role: user.role,
        parent_agent_id: user.parent_agent_id,
        email: user.email,
      },
    };

    // Query specific lead if provided
    if (leadId) {
      const lead = await queryOne<{
        id: string;
        agent_id: string;
        status: string | null;
        stage: string | null;
        customer_name: string;
        created_by_sub_agent_id: string | null;
        created_at: string;
        purchased_from_marketplace: boolean;
        is_purchased: boolean;
      }>(
        `SELECT 
          id, 
          agent_id, 
          status, 
          stage, 
          customer_name, 
          created_by_sub_agent_id,
          created_at,
          purchased_from_marketplace,
          is_purchased
        FROM leads 
        WHERE id::text = $1`,
        [leadId]
      );

      if (lead) {
        results.lead = {
          ...lead,
          agent_id_type: typeof lead.agent_id,
          agent_id_matches_user: lead.agent_id === userIdParam,
          agent_id_text_match: lead.agent_id === userIdParam,
          status_is_published: lead.status === 'published',
          status_is_null: lead.status === null,
          status_matches: lead.status === null || lead.status === 'published',
        };

        // Test WHERE clause conditions
        let agentIdMatches = false;
        if (user.role === 'SUB_AGENT') {
          agentIdMatches = lead.agent_id === user.parent_agent_id || lead.created_by_sub_agent_id === userIdParam;
        } else {
          agentIdMatches = lead.agent_id === userIdParam;
          if (!agentIdMatches && lead.created_by_sub_agent_id) {
            const subAgentCheck = await queryOne<{ id: string }>(
              'SELECT id FROM users WHERE id::text = $1 AND parent_agent_id::text = $2',
              [lead.created_by_sub_agent_id, userIdParam]
            );
            agentIdMatches = !!subAgentCheck;
          }
        }

        results.whereClauseTest = {
          agentIdMatches,
          statusMatches: lead.status === null || lead.status === 'published',
          shouldAppear: agentIdMatches && (lead.status === null || lead.status === 'published'),
          agentIdComparison: {
            leadAgentId: lead.agent_id,
            userId: userIdParam,
            userParentAgentId: user.parent_agent_id,
            userRole: user.role,
            directMatch: lead.agent_id === userIdParam,
            parentMatch: user.role === 'SUB_AGENT' ? lead.agent_id === user.parent_agent_id : false,
            subAgentCreated: lead.created_by_sub_agent_id === userIdParam,
          },
        };

        // Test the exact WHERE clause from manage route
        const whereClause = user.role === 'SUB_AGENT'
          ? `(l.agent_id::text = $1 OR l.created_by_sub_agent_id::text = $2) AND (l.status IS NULL OR l.status = 'published')`
          : `(l.agent_id::text = $1 OR EXISTS (SELECT 1 FROM users u WHERE u.parent_agent_id::text = $1 AND l.created_by_sub_agent_id::text = u.id::text)) AND (l.status IS NULL OR l.status = 'published')`;

        const testParams = user.role === 'SUB_AGENT'
          ? [user.parent_agent_id, userIdParam]
          : [userIdParam];

        const testQuery = `SELECT id FROM leads l WHERE l.id::text = $${testParams.length + 1} AND ${whereClause}`;
        const testParamsWithLeadId = [...testParams, leadId];
        
        const testResult = await queryOne<{ id: string }>(testQuery, testParamsWithLeadId);
        results.exactWhereClauseTest = {
          matches: !!testResult,
          whereClause,
          testParams: testParamsWithLeadId,
        };
      } else {
        results.lead = null;
        results.error = 'Lead not found';
      }
    }

    // Query all leads for this user to see what's showing up
    const allLeadsQuery = user.role === 'SUB_AGENT'
      ? `SELECT id, agent_id, status, stage, customer_name, created_by_sub_agent_id, created_at
         FROM leads 
         WHERE (agent_id::text = $1 OR created_by_sub_agent_id::text = $2) 
           AND (status IS NULL OR status = 'published')
         ORDER BY created_at DESC
         LIMIT 10`
      : `SELECT id, agent_id, status, stage, customer_name, created_by_sub_agent_id, created_at
         FROM leads 
         WHERE (agent_id::text = $1 OR EXISTS (
           SELECT 1 FROM users u WHERE u.parent_agent_id::text = $1 AND created_by_sub_agent_id::text = u.id::text
         ))
           AND (status IS NULL OR status = 'published')
         ORDER BY created_at DESC
         LIMIT 10`;

    const allLeadsParams = user.role === 'SUB_AGENT'
      ? [user.parent_agent_id, userIdParam]
      : [userIdParam];

    const allLeads = await query<{
      id: string;
      agent_id: string;
      status: string | null;
      stage: string | null;
      customer_name: string;
      created_by_sub_agent_id: string | null;
      created_at: string;
    }>(allLeadsQuery, allLeadsParams);

    results.allLeads = allLeads.rows.map(lead => ({
      ...lead,
      agent_id_matches_user: lead.agent_id === userIdParam,
    }));

    // Query recently created leads (last 5, regardless of filters)
    const recentLeads = await query<{
      id: string;
      agent_id: string;
      status: string | null;
      stage: string | null;
      customer_name: string;
      created_by_sub_agent_id: string | null;
      created_at: string;
    }>(
      `SELECT id, agent_id, status, stage, customer_name, created_by_sub_agent_id, created_at
       FROM leads
       ORDER BY created_at DESC
       LIMIT 5`
    );

    results.recentLeads = recentLeads.rows;

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('[Debug Leads] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to debug leads',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

