/**
 * Debug script to query database and troubleshoot missing leads
 * 
 * Usage:
 *   npm run debug:leads <lead-id>
 *   npm run debug:leads  # Query default lead
 */

import { resolve } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// AWS credentials should be loaded from .env.local or environment variables
// Do not hardcode credentials in this file

// Use Lambda database client (works from local machine)
// Need to use dynamic import with full path
const lambdaDbPath = resolve(process.cwd(), 'src/lib/aws/lambda-database.ts');
const lambdaDb = await import(lambdaDbPath);
const { query, queryOne } = lambdaDb;

const LEAD_IDS = [
  '4297b45b-387b-4fc8-a8fa-9cca9a00f52c',
  'f186f9c5-1f6b-41b1-8ab2-8db7c937cdba',
  '9a3633ea-df31-4e72-845e-e21bb5c8ffef', // From earlier
];

const USER_ID = 'fb0270d9-2755-4aa2-bc86-16ade418fab9'; // From logs

async function main() {
  const leadId = process.argv[2] || LEAD_IDS[0];
  
  console.log('='.repeat(80));
  console.log('🔍 DEBUGGING MISSING LEADS');
  console.log('='.repeat(80));
  console.log(`User ID: ${USER_ID}`);
  console.log(`Lead ID: ${leadId}`);
  console.log('');

  try {
    // 1. Get user info
    console.log('📋 Step 1: Getting user information...');
    const user = await queryOne<{ id: string; role: string; parent_agent_id: string | null; email: string }>(
      'SELECT id, role, parent_agent_id, email FROM users WHERE id::text = $1',
      [USER_ID]
    );

    if (!user) {
      console.error('❌ User not found!');
      process.exit(1);
    }

    console.log('✅ User found:');
    console.log(JSON.stringify(user, null, 2));
    console.log('');

    // 2. Query the specific lead
    console.log('📋 Step 2: Querying specific lead...');
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

    if (!lead) {
      console.error(`❌ Lead ${leadId} not found in database!`);
      process.exit(1);
    }

    console.log('✅ Lead found:');
    console.log(JSON.stringify(lead, null, 2));
    console.log('');

    // 3. Check agent_id matching
    console.log('📋 Step 3: Checking agent_id matching...');
    const agentIdMatches = lead.agent_id === USER_ID;
    const agentIdTextMatch = String(lead.agent_id) === String(USER_ID);
    
    console.log(`Lead agent_id: ${lead.agent_id} (type: ${typeof lead.agent_id})`);
    console.log(`User ID: ${USER_ID} (type: ${typeof USER_ID})`);
    console.log(`Direct match (===): ${agentIdMatches}`);
    console.log(`Text match: ${agentIdTextMatch}`);
    console.log('');

    // 4. Check status
    console.log('📋 Step 4: Checking status...');
    const statusIsPublished = lead.status === 'published';
    const statusIsNull = lead.status === null;
    const statusMatches = statusIsNull || statusIsPublished;
    
    console.log(`Lead status: ${lead.status} (${lead.status === null ? 'NULL' : typeof lead.status})`);
    console.log(`Status is NULL: ${statusIsNull}`);
    console.log(`Status is 'published': ${statusIsPublished}`);
    console.log(`Status matches (NULL or 'published'): ${statusMatches}`);
    console.log('');

    // 5. Test WHERE clause conditions based on user role
    console.log('📋 Step 5: Testing WHERE clause conditions...');
    let agentIdConditionMatches = false;
    
    if (user.role === 'SUB_AGENT') {
      const parentMatch = lead.agent_id === user.parent_agent_id;
      const subAgentMatch = lead.created_by_sub_agent_id === USER_ID;
      agentIdConditionMatches = parentMatch || subAgentMatch;
      
      console.log(`User role: SUB_AGENT`);
      console.log(`Parent agent_id: ${user.parent_agent_id}`);
      console.log(`Lead agent_id matches parent: ${parentMatch}`);
      console.log(`Lead created_by_sub_agent_id matches user: ${subAgentMatch}`);
      console.log(`Agent ID condition matches: ${agentIdConditionMatches}`);
    } else {
      const directMatch = lead.agent_id === USER_ID;
      agentIdConditionMatches = directMatch;
      
      if (!directMatch && lead.created_by_sub_agent_id) {
        // Check if created by sub-agent
        const subAgentCheck = await queryOne<{ id: string }>(
          'SELECT id FROM users WHERE id::text = $1 AND parent_agent_id::text = $2',
          [lead.created_by_sub_agent_id, USER_ID]
        );
        agentIdConditionMatches = !!subAgentCheck;
        console.log(`User role: MAIN AGENT`);
        console.log(`Direct match: ${directMatch}`);
        console.log(`Created by sub-agent check: ${!!subAgentCheck}`);
      } else {
        console.log(`User role: MAIN AGENT`);
        console.log(`Direct match: ${directMatch}`);
      }
      console.log(`Agent ID condition matches: ${agentIdConditionMatches}`);
    }
    console.log('');

    // 6. Test exact WHERE clause from manage route
    console.log('📋 Step 6: Testing exact WHERE clause from manage route...');
    const whereClause = user.role === 'SUB_AGENT'
      ? `(l.agent_id::text = $1 OR l.created_by_sub_agent_id::text = $2) AND (l.status IS NULL OR l.status = 'published')`
      : `(l.agent_id::text = $1 OR EXISTS (SELECT 1 FROM users u WHERE u.parent_agent_id::text = $1 AND l.created_by_sub_agent_id::text = u.id::text)) AND (l.status IS NULL OR l.status = 'published')`;

    const testParams = user.role === 'SUB_AGENT'
      ? [user.parent_agent_id, USER_ID]
      : [USER_ID];

    const testQuery = `SELECT id, agent_id, status FROM leads l WHERE l.id::text = $${testParams.length + 1} AND ${whereClause}`;
    const testParamsWithLeadId = [...testParams, leadId];
    
    console.log(`WHERE clause: ${whereClause}`);
    console.log(`Test params: ${JSON.stringify(testParamsWithLeadId)}`);
    
    const testResult = await queryOne<{ id: string; agent_id: string; status: string | null }>(
      testQuery,
      testParamsWithLeadId
    );
    
    console.log(`Test result: ${testResult ? '✅ MATCHES' : '❌ DOES NOT MATCH'}`);
    if (testResult) {
      console.log(JSON.stringify(testResult, null, 2));
    }
    console.log('');

    // 7. Query all leads that should be visible
    console.log('📋 Step 7: Querying all leads that should be visible...');
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
      ? [user.parent_agent_id, USER_ID]
      : [USER_ID];

    const allLeads = await query<{
      id: string;
      agent_id: string;
      status: string | null;
      stage: string | null;
      customer_name: string;
      created_by_sub_agent_id: string | null;
      created_at: string;
    }>(allLeadsQuery, allLeadsParams);

    console.log(`Found ${allLeads.rows.length} leads that should be visible:`);
    allLeads.rows.forEach((l, i) => {
      const isOurLead = l.id === leadId;
      console.log(`  ${i + 1}. ${l.id} ${isOurLead ? '⭐ (THIS LEAD)' : ''}`);
      console.log(`     Customer: ${l.customer_name}`);
      console.log(`     Agent ID: ${l.agent_id}`);
      console.log(`     Status: ${l.status || 'NULL'}`);
      console.log(`     Created: ${l.created_at}`);
      console.log('');
    });

    const ourLeadInResults = allLeads.rows.some(l => l.id === leadId);
    console.log(`Our lead in results: ${ourLeadInResults ? '✅ YES' : '❌ NO'}`);
    console.log('');

    // 8. Summary
    console.log('='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Lead ID: ${leadId}`);
    console.log(`Agent ID matches: ${agentIdConditionMatches ? '✅' : '❌'}`);
    console.log(`Status matches: ${statusMatches ? '✅' : '❌'}`);
    console.log(`Should appear: ${agentIdConditionMatches && statusMatches ? '✅ YES' : '❌ NO'}`);
    console.log(`Exact WHERE clause test: ${testResult ? '✅ MATCHES' : '❌ DOES NOT MATCH'}`);
    console.log(`In visible leads query: ${ourLeadInResults ? '✅ YES' : '❌ NO'}`);
    console.log('='.repeat(80));

    if (!testResult) {
      console.log('');
      console.log('🔍 ROOT CAUSE ANALYSIS:');
      if (!agentIdConditionMatches) {
        console.log('  ❌ Agent ID condition does not match');
        console.log(`     Lead agent_id: ${lead.agent_id}`);
        console.log(`     User ID: ${USER_ID}`);
        if (user.role === 'SUB_AGENT') {
          console.log(`     Parent agent_id: ${user.parent_agent_id}`);
        }
      }
      if (!statusMatches) {
        console.log('  ❌ Status condition does not match');
        console.log(`     Lead status: ${lead.status || 'NULL'}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

main();

