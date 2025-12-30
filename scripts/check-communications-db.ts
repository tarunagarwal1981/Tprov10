/**
 * Check Communications in Database via Lambda
 * Uses the same Lambda database service as the app
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const LAMBDA_FUNCTION_NAME = process.env.DATABASE_LAMBDA_NAME || 'travel-app-database-service';
const AWS_REGION = process.env.DEPLOYMENT_REGION || process.env.REGION || 'us-east-1';

async function queryViaLambda(query: string, params: any[] = []): Promise<any> {
  const lambdaClient = new LambdaClient({
    region: AWS_REGION,
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
  });

  const payload = {
    action: 'query',
    query,
    params,
  };

  const command = new InvokeCommand({
    FunctionName: LAMBDA_FUNCTION_NAME,
    Payload: JSON.stringify(payload),
  });

  const response = await lambdaClient.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.Payload || new Uint8Array()));
  
  if (result.error) {
    throw new Error(result.error);
  }
  
  return result;
}

async function queryOneViaLambda(query: string, params: any[] = []): Promise<any> {
  const result = await queryViaLambda(query, params);
  return result.rows?.[0] || null;
}

async function checkCommunications() {
  try {
    console.log('🔍 Checking Communications in Database...\n');

    // 1. Check recent communications
    console.log('='.repeat(80));
    console.log('1. RECENT COMMUNICATIONS (Last 10)');
    console.log('='.repeat(80));
    const recentComms = await queryViaLambda(`
      SELECT 
        id,
        lead_id,
        agent_id,
        sub_agent_id,
        communication_type,
        direction,
        subject,
        content,
        created_by,
        created_at
      FROM lead_communications
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    if (!recentComms.rows || recentComms.rows.length === 0) {
      console.log('❌ No communications found in database!\n');
    } else {
      console.log(`✅ Found ${recentComms.rows.length} communications:\n`);
      recentComms.rows.forEach((comm: any, idx: number) => {
        console.log(`${idx + 1}. Communication ID: ${comm.id}`);
        console.log(`   Lead ID: ${comm.lead_id}`);
        console.log(`   Agent ID: ${comm.agent_id || 'NULL'}`);
        console.log(`   Sub Agent ID: ${comm.sub_agent_id || 'NULL'}`);
        console.log(`   Type: ${comm.communication_type}, Direction: ${comm.direction}`);
        console.log(`   Subject: ${comm.subject || 'N/A'}`);
        console.log(`   Created By: ${comm.created_by}`);
        console.log(`   Created At: ${comm.created_at}`);
        console.log('');
      });
    }

    // 2. Check leads table for purchased leads
    console.log('='.repeat(80));
    console.log('2. PURCHASED LEADS IN LEADS TABLE');
    console.log('='.repeat(80));
    const purchasedLeads = await queryViaLambda(`
      SELECT 
        id,
        agent_id,
        marketplace_lead_id,
        customer_id,
        customer_name,
        is_purchased,
        purchased_from_marketplace,
        created_at
      FROM leads
      WHERE is_purchased = true OR purchased_from_marketplace = true
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    if (!purchasedLeads.rows || purchasedLeads.rows.length === 0) {
      console.log('❌ No purchased leads found in leads table!\n');
    } else {
      console.log(`✅ Found ${purchasedLeads.rows.length} purchased leads:\n`);
      purchasedLeads.rows.forEach((lead: any, idx: number) => {
        console.log(`${idx + 1}. Lead ID: ${lead.id}`);
        console.log(`   Agent ID: ${lead.agent_id}`);
        console.log(`   Marketplace Lead ID: ${lead.marketplace_lead_id || 'NULL'}`);
        console.log(`   Customer ID: ${lead.customer_id || 'NULL'}`);
        console.log(`   Customer Name: ${lead.customer_name || 'N/A'}`);
        console.log(`   Created At: ${lead.created_at}`);
        console.log('');
      });
    }

    // 3. Check if communications are linked to purchased leads
    console.log('='.repeat(80));
    console.log('3. COMMUNICATIONS LINKED TO PURCHASED LEADS');
    console.log('='.repeat(80));
    const commsForPurchasedLeads = await queryViaLambda(`
      SELECT 
        lc.id as comm_id,
        lc.lead_id,
        lc.agent_id as comm_agent_id,
        lc.communication_type,
        lc.direction,
        lc.created_at as comm_created_at,
        l.id as lead_id_from_leads,
        l.agent_id as lead_agent_id,
        l.marketplace_lead_id,
        l.is_purchased
      FROM lead_communications lc
      INNER JOIN leads l ON l.id::text = lc.lead_id::text
      WHERE l.is_purchased = true OR l.purchased_from_marketplace = true
      ORDER BY lc.created_at DESC
      LIMIT 10
    `);
    
    if (!commsForPurchasedLeads.rows || commsForPurchasedLeads.rows.length === 0) {
      console.log('❌ No communications found for purchased leads!\n');
    } else {
      console.log(`✅ Found ${commsForPurchasedLeads.rows.length} communications for purchased leads:\n`);
      commsForPurchasedLeads.rows.forEach((row: any, idx: number) => {
        console.log(`${idx + 1}. Communication ID: ${row.comm_id}`);
        console.log(`   Lead ID (from comm): ${row.lead_id}`);
        console.log(`   Lead ID (from leads table): ${row.lead_id_from_leads}`);
        console.log(`   Comm Agent ID: ${row.comm_agent_id || 'NULL'}`);
        console.log(`   Lead Agent ID: ${row.lead_agent_id}`);
        console.log(`   Match: ${row.comm_agent_id === row.lead_agent_id ? '✅' : '❌'}`);
        console.log(`   Marketplace Lead ID: ${row.marketplace_lead_id || 'NULL'}`);
        console.log(`   Type: ${row.communication_type}, Direction: ${row.direction}`);
        console.log(`   Created At: ${row.comm_created_at}`);
        console.log('');
      });
    }

    // 4. Check for orphaned communications (lead_id doesn't exist in leads table)
    console.log('='.repeat(80));
    console.log('4. ORPHANED COMMUNICATIONS (lead_id not in leads table)');
    console.log('='.repeat(80));
    const orphanedComms = await queryViaLambda(`
      SELECT 
        lc.id,
        lc.lead_id,
        lc.agent_id,
        lc.communication_type,
        lc.created_at
      FROM lead_communications lc
      LEFT JOIN leads l ON l.id::text = lc.lead_id::text
      WHERE l.id IS NULL
      ORDER BY lc.created_at DESC
      LIMIT 10
    `);
    
    if (!orphanedComms.rows || orphanedComms.rows.length === 0) {
      console.log('✅ No orphaned communications found\n');
    } else {
      console.log(`⚠️  Found ${orphanedComms.rows.length} orphaned communications:\n`);
      orphanedComms.rows.forEach((comm: any, idx: number) => {
        console.log(`${idx + 1}. Communication ID: ${comm.id}`);
        console.log(`   Lead ID: ${comm.lead_id} (NOT FOUND IN LEADS TABLE)`);
        console.log(`   Agent ID: ${comm.agent_id || 'NULL'}`);
        console.log(`   Type: ${comm.communication_type}`);
        console.log(`   Created At: ${comm.created_at}`);
        console.log('');
      });
    }

    // 5. Summary
    console.log('='.repeat(80));
    console.log('5. SUMMARY');
    console.log('='.repeat(80));
    const totalComms = await queryViaLambda('SELECT COUNT(*) as count FROM lead_communications');
    const totalPurchasedLeads = await queryViaLambda('SELECT COUNT(*) as count FROM leads WHERE is_purchased = true OR purchased_from_marketplace = true');
    const totalPurchases = await queryViaLambda('SELECT COUNT(*) as count FROM lead_purchases');
    
    const commsCount = totalComms.rows?.[0]?.count || totalComms.count || 0;
    const leadsCount = totalPurchasedLeads.rows?.[0]?.count || totalPurchasedLeads.count || 0;
    const purchasesCount = totalPurchases.rows?.[0]?.count || totalPurchases.count || 0;
    
    console.log(`Total Communications: ${commsCount}`);
    console.log(`Total Purchased Leads (in leads table): ${leadsCount}`);
    console.log(`Total Purchases: ${purchasesCount}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

checkCommunications().catch(console.error);

