/**
 * Lead Service
 * 
 * Provides reusable functions for lead management operations,
 * particularly for creating leads from marketplace purchases.
 */

import { query, queryOne } from '@/lib/aws/lambda-database';

export interface LeadCreationResult {
  leadId: string;
  customerId: string;
  created: boolean;
}

/**
 * Ensure a lead exists in the leads table from a marketplace purchase
 * 
 * This function:
 * 1. Checks if lead already exists (idempotent)
 * 2. Verifies the purchase exists
 * 3. Fetches marketplace lead details
 * 4. Generates customer_id
 * 5. Creates lead entry in leads table
 * 
 * @param leadId - The marketplace lead ID
 * @param agentId - The agent/user ID who purchased the lead
 * @returns Lead creation result with leadId, customerId, and created flag
 * @throws Error if purchase doesn't exist or marketplace lead not found
 */
export async function ensureLeadFromPurchase(
  leadId: string,
  agentId: string
): Promise<LeadCreationResult> {
  console.log('[LeadService] ensureLeadFromPurchase called:', { leadId, agentId });

  // First, check if lead already exists in leads table (idempotent check)
  const existingLead = await queryOne<{ id: string; customer_id: string }>(
    `SELECT id, customer_id FROM leads 
     WHERE (id::text = $1 OR marketplace_lead_id::text = $1) 
     AND agent_id::text = $2 
     LIMIT 1`,
    [leadId, agentId]
  );

  if (existingLead) {
    console.log('[LeadService] Lead already exists:', { leadId: existingLead.id });
    return {
      leadId: existingLead.id,
      customerId: existingLead.customer_id || '',
      created: false,
    };
  }

  // Lead doesn't exist, verify it's a purchased marketplace lead
  const purchase = await queryOne<{ id: string }>(
    'SELECT id FROM lead_purchases WHERE lead_id::text = $1 AND agent_id::text = $2 LIMIT 1',
    [leadId, agentId]
  );

  if (!purchase) {
    throw new Error('Lead not found or not purchased by this agent');
  }

  console.log('[LeadService] Purchase verified, fetching marketplace lead details...');

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
    throw new Error('Marketplace lead not found');
  }

  console.log('[LeadService] Marketplace lead found, generating customer_id...');

  // Generate customer_id before creating lead
  const customerIdResult = await query<{ customer_id: string }>(
    `SELECT generate_lead_customer_id() as customer_id`,
    []
  );
  const customerId = customerIdResult.rows[0]?.customer_id;

  if (!customerId) {
    console.error('[LeadService] Failed to generate customer_id');
    throw new Error('Failed to generate customer ID');
  }

  console.log('[LeadService] Customer ID generated, creating lead entry...');

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
      true, // purchased_from_marketplace
    ]
  );

  if (!insertResult.rows || insertResult.rows.length === 0 || !insertResult.rows[0]) {
    throw new Error('Failed to create lead');
  }

  const createdLead = insertResult.rows[0];
  console.log('[LeadService] Lead created successfully:', {
    leadId: createdLead.id,
    customerId: createdLead.customer_id,
  });

  return {
    leadId: createdLead.id,
    customerId: createdLead.customer_id,
    created: true,
  };
}

