/**
 * Diagnostic script to check lead-itinerary relationships in the database
 * This helps debug why only 1 itinerary is showing when there should be more
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';
const AWS_REGION = process.env.AWS_REGION || process.env.DEPLOYMENT_REGION || 'us-east-1';

async function invokeLambda(action: string, query?: string, params?: any[]): Promise<any> {
  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: process.env.AWS_ACCESS_KEY_ID ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      sessionToken: process.env.AWS_SESSION_TOKEN,
    } : undefined,
  });

  const command = new InvokeCommand({
    FunctionName: LAMBDA_FUNCTION_NAME,
    Payload: JSON.stringify({
      action,
      query,
      params,
    }),
  });

  const response = await lambdaClient.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.Payload));

  if (result.error) {
    throw new Error(result.error);
  }

  return result;
}

async function query(sql: string, params: any[] = []): Promise<{ rows: any[] }> {
  const result = await invokeLambda('query', sql, params);
  // Lambda returns { statusCode: 200, body: "..." } format
  // body is a JSON string that needs to be parsed
  if (result && result.body) {
    const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    if (body.rows) {
      return body;
    }
    if (Array.isArray(body)) {
      return { rows: body };
    }
  }
  // If it's already in the right format
  if (result && result.rows) {
    return result;
  }
  return { rows: [] };
}

async function queryOne(sql: string, params: any[] = []): Promise<any> {
  const result = await invokeLambda('queryOne', sql, params);
  // Lambda returns { statusCode: 200, body: "..." } format
  // body is a JSON string that needs to be parsed
  if (result && result.body) {
    const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    return body.row || body || null;
  }
  // If it's already the row directly
  if (result && result.row) {
    return result.row;
  }
  return result || null;
}

async function checkLeadItineraries() {
  const leadId = 'bbd41638-fd82-4067-8a38-2d4156eecb47'; // The lead ID from the frontend logs
  
  console.log('='.repeat(80));
  console.log('LEAD-ITINERARY RELATIONSHIP DIAGNOSTIC');
  console.log('='.repeat(80));
  console.log(`Checking lead ID: ${leadId}\n`);

  // Step 1: Get the lead's information
  console.log('STEP 1: Fetching lead information...');
  const leadInfo = await queryOne(
    `SELECT id::text as id, agent_id::text as agent_id, customer_id, marketplace_lead_id::text as marketplace_lead_id
     FROM leads 
     WHERE id::text = $1`,
    [leadId]
  );

  if (!leadInfo) {
    console.error('❌ Lead not found in database!');
    return;
  }

  console.log('✅ Lead found:');
  console.log('  - ID:', leadInfo?.id || 'UNDEFINED');
  console.log('  - Agent ID:', leadInfo?.agent_id || 'UNDEFINED');
  console.log('  - Customer ID:', leadInfo?.customer_id || 'NULL');
  console.log('  - Marketplace Lead ID:', leadInfo?.marketplace_lead_id || 'NULL');
  console.log('');
  
  if (!leadInfo || !leadInfo.id) {
    console.error('❌ Lead info is incomplete or missing!');
    console.log('Full leadInfo object:', JSON.stringify(leadInfo, null, 2));
    return;
  }

  // Step 2: Check itineraries directly linked to this lead
  console.log('STEP 2: Checking itineraries directly linked to this lead...');
  const directItineraries = await query(
    `SELECT id::text as id, name, lead_id::text as lead_id, agent_id::text as agent_id, total_price
     FROM itineraries 
     WHERE lead_id::text = $1 
     ORDER BY created_at DESC`,
    [leadId]
  );

  console.log(`✅ Found ${directItineraries.rows.length} itineraries directly linked to this lead:`);
  directItineraries.rows.forEach((it, idx) => {
    console.log(`  ${idx + 1}. ${it.name} (ID: ${it.id}, Agent: ${it.agent_id}, Price: $${it.total_price})`);
  });
  console.log('');

  // Step 3: If lead has marketplace_lead_id, check other leads with same marketplace_lead_id
  if (leadInfo.marketplace_lead_id) {
    console.log('STEP 3: Checking other leads with the same marketplace_lead_id...');
  const relatedLeads = await query(
      `SELECT id::text as id, agent_id::text as agent_id, customer_id, created_at
       FROM leads
       WHERE marketplace_lead_id::text = $1
       ORDER BY created_at DESC`,
      [leadInfo.marketplace_lead_id]
    );

    console.log(`✅ Found ${relatedLeads.rows.length} leads with marketplace_lead_id: ${leadInfo.marketplace_lead_id}`);
    relatedLeads.rows.forEach((lead, idx) => {
      const isCurrentLead = lead.id === leadId;
      console.log(`  ${idx + 1}. Lead ID: ${lead.id} ${isCurrentLead ? '(CURRENT)' : ''}`);
      console.log(`     - Agent ID: ${lead.agent_id}`);
      console.log(`     - Customer ID: ${lead.customer_id || 'NULL'}`);
      console.log(`     - Created: ${lead.created_at}`);
    });
    console.log('');

    // Step 4: Check itineraries for all related leads
    console.log('STEP 4: Checking itineraries for ALL leads with this marketplace_lead_id...');
    const allLeadIds = relatedLeads.rows.map(l => l.id);
    if (allLeadIds.length > 0) {
      const placeholders = allLeadIds.map((_, i) => `$${i + 1}`).join(',');
      const allItineraries = await query(
        `SELECT i.id::text as id, i.name, i.lead_id::text as lead_id, i.agent_id::text as agent_id, 
                i.total_price, l.agent_id::text as lead_agent_id
         FROM itineraries i
         INNER JOIN leads l ON l.id::text = i.lead_id::text
         WHERE l.marketplace_lead_id::text = $1
         ORDER BY i.created_at DESC`,
        [leadInfo.marketplace_lead_id]
      );

      console.log(`✅ Found ${allItineraries.rows.length} total itineraries for all leads with this marketplace_lead_id:`);
      allItineraries.rows.forEach((it, idx) => {
        const isFromCurrentLead = it.lead_id === leadId;
        console.log(`  ${idx + 1}. ${it.name} (ID: ${it.id})`);
        console.log(`     - Lead ID: ${it.lead_id} ${isFromCurrentLead ? '(CURRENT LEAD)' : ''}`);
        console.log(`     - Itinerary Agent ID: ${it.agent_id}`);
        console.log(`     - Lead Agent ID: ${it.lead_agent_id}`);
        console.log(`     - Price: $${it.total_price}`);
        console.log(`     - Match: ${it.agent_id === it.lead_agent_id ? '✅' : '❌'} (itinerary.agent_id === lead.agent_id)`);
        console.log(`     - Filter Match: ${it.lead_agent_id === leadInfo.agent_id ? '✅' : '❌'} (lead.agent_id === current lead.agent_id)`);
      });
      console.log('');

      // Step 5: Summary
      console.log('STEP 5: SUMMARY');
      console.log('='.repeat(80));
      console.log(`Current Lead ID: ${leadId}`);
      console.log(`Current Lead Agent ID: ${leadInfo.agent_id}`);
      console.log(`Marketplace Lead ID: ${leadInfo.marketplace_lead_id}`);
      console.log(`Total related leads: ${relatedLeads.rows.length}`);
      console.log(`Direct itineraries (PRIMARY query): ${directItineraries.rows.length}`);
      console.log(`Total itineraries (FALLBACK query): ${allItineraries.rows.length}`);
      
      const filteredItineraries = allItineraries.rows.filter(it => {
        const leadAgentId = (it as any).lead_agent_id || it.agent_id;
        return leadAgentId === leadInfo.agent_id;
      });
      console.log(`Filtered itineraries (after agent_id filter): ${filteredItineraries.length}`);
      console.log(`Expected total (PRIMARY + FALLBACK): ${directItineraries.rows.length + filteredItineraries.length}`);
      console.log('='.repeat(80));
      
      // Step 6: Check if there are itineraries linked via customer_id
      if (leadInfo.customer_id) {
        console.log('\nSTEP 6: Checking itineraries linked via customer_id...');
        const customerItineraries = await query(
          `SELECT i.id::text as id, i.name, i.lead_id::text as lead_id, i.agent_id::text as agent_id, 
                  i.total_price, l.agent_id::text as lead_agent_id
           FROM itineraries i
           INNER JOIN leads l ON l.id::text = i.lead_id::text
           WHERE l.customer_id = $1
           ORDER BY i.created_at DESC`,
          [leadInfo.customer_id]
        );
        
        console.log(`✅ Found ${customerItineraries.rows.length} itineraries linked via customer_id: ${leadInfo.customer_id}`);
        customerItineraries.rows.forEach((it, idx) => {
          const isFromCurrentLead = it.lead_id === leadId;
          console.log(`  ${idx + 1}. ${it.name} (ID: ${it.id})`);
          console.log(`     - Lead ID: ${it.lead_id} ${isFromCurrentLead ? '(CURRENT LEAD)' : ''}`);
          console.log(`     - Itinerary Agent ID: ${it.agent_id}`);
          console.log(`     - Lead Agent ID: ${it.lead_agent_id}`);
          console.log(`     - Price: $${it.total_price}`);
          console.log(`     - Filter Match: ${it.lead_agent_id === leadInfo.agent_id ? '✅' : '❌'} (lead.agent_id === current lead.agent_id)`);
        });
      }
    }
  } else {
    console.log('⚠️  Lead does NOT have a marketplace_lead_id');
    console.log('   This means the FALLBACK query will NOT run.');
    console.log('   Only the PRIMARY query (direct itineraries) will be used.');
  }
}

// Run the diagnostic
checkLeadItineraries()
  .then(() => {
    console.log('\n✅ Diagnostic complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error running diagnostic:', error);
    process.exit(1);
  });

