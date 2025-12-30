/**
 * RCA Script: Check Lead Communications
 * 
 * This script checks:
 * 1. If communications are being saved to the database
 * 2. What lead_id is being used (should be from leads table, not marketplace)
 * 3. If agent_id is correctly set
 * 4. The relationship between purchased leads and communications
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const dbConfig = {
  host: process.env.RDS_HOST,
  port: parseInt(process.env.RDS_PORT || '5432'),
  database: process.env.RDS_DATABASE,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  ssl: process.env.RDS_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

async function checkCommunications() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // 1. Check recent communications
    console.log('='.repeat(80));
    console.log('1. RECENT COMMUNICATIONS (Last 10)');
    console.log('='.repeat(80));
    const recentComms = await client.query(`
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
    
    if (recentComms.rows.length === 0) {
      console.log('❌ No communications found in database!\n');
    } else {
      console.log(`✅ Found ${recentComms.rows.length} communications:\n`);
      recentComms.rows.forEach((comm, idx) => {
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
    const purchasedLeads = await client.query(`
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
    
    if (purchasedLeads.rows.length === 0) {
      console.log('❌ No purchased leads found in leads table!\n');
    } else {
      console.log(`✅ Found ${purchasedLeads.rows.length} purchased leads:\n`);
      purchasedLeads.rows.forEach((lead, idx) => {
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
    const commsForPurchasedLeads = await client.query(`
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
    
    if (commsForPurchasedLeads.rows.length === 0) {
      console.log('❌ No communications found for purchased leads!\n');
    } else {
      console.log(`✅ Found ${commsForPurchasedLeads.rows.length} communications for purchased leads:\n`);
      commsForPurchasedLeads.rows.forEach((row, idx) => {
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
    const orphanedComms = await client.query(`
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
    
    if (orphanedComms.rows.length === 0) {
      console.log('✅ No orphaned communications found\n');
    } else {
      console.log(`⚠️  Found ${orphanedComms.rows.length} orphaned communications:\n`);
      orphanedComms.rows.forEach((comm, idx) => {
        console.log(`${idx + 1}. Communication ID: ${comm.id}`);
        console.log(`   Lead ID: ${comm.lead_id} (NOT FOUND IN LEADS TABLE)`);
        console.log(`   Agent ID: ${comm.agent_id || 'NULL'}`);
        console.log(`   Type: ${comm.communication_type}`);
        console.log(`   Created At: ${comm.created_at}`);
        console.log('');
      });
    }

    // 5. Check lead_purchases to see what was purchased
    console.log('='.repeat(80));
    console.log('5. RECENT LEAD PURCHASES');
    console.log('='.repeat(80));
    const purchases = await client.query(`
      SELECT 
        lp.id as purchase_id,
        lp.lead_id as marketplace_lead_id,
        lp.agent_id,
        lp.purchased_at,
        l.id as lead_id_in_leads_table,
        l.customer_id
      FROM lead_purchases lp
      LEFT JOIN leads l ON l.marketplace_lead_id::text = lp.lead_id::text AND l.agent_id::text = lp.agent_id::text
      ORDER BY lp.purchased_at DESC
      LIMIT 10
    `);
    
    if (purchases.rows.length === 0) {
      console.log('❌ No purchases found!\n');
    } else {
      console.log(`✅ Found ${purchases.rows.length} purchases:\n`);
      purchases.rows.forEach((purchase, idx) => {
        console.log(`${idx + 1}. Purchase ID: ${purchase.purchase_id}`);
        console.log(`   Marketplace Lead ID: ${purchase.marketplace_lead_id}`);
        console.log(`   Agent ID: ${purchase.agent_id}`);
        console.log(`   Lead ID in leads table: ${purchase.lead_id_in_leads_table || '❌ NOT FOUND'}`);
        console.log(`   Customer ID: ${purchase.customer_id || 'N/A'}`);
        console.log(`   Purchased At: ${purchase.purchased_at}`);
        console.log('');
      });
    }

    // 6. Summary
    console.log('='.repeat(80));
    console.log('6. SUMMARY');
    console.log('='.repeat(80));
    const totalComms = await client.query('SELECT COUNT(*) as count FROM lead_communications');
    const totalPurchasedLeads = await client.query('SELECT COUNT(*) as count FROM leads WHERE is_purchased = true OR purchased_from_marketplace = true');
    const totalPurchases = await client.query('SELECT COUNT(*) as count FROM lead_purchases');
    
    console.log(`Total Communications: ${totalComms.rows[0].count}`);
    console.log(`Total Purchased Leads (in leads table): ${totalPurchasedLeads.rows[0].count}`);
    console.log(`Total Purchases: ${totalPurchases.rows[0].count}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

checkCommunications().catch(console.error);

