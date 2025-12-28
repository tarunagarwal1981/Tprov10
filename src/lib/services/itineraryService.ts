/**
 * Itinerary Service
 * Service layer for itinerary operations
 * 
 * MIGRATED: Now uses PostgreSQL directly via AWS RDS
 */

// Use Lambda database service for reliable VPC access
import { query, queryOne, queryMany } from '@/lib/aws/lambda-database';

export interface Itinerary {
  id: string;
  customer_id: string | null;
  lead_id: string;
  agent_id: string;
  name: string;
  status: 'draft' | 'completed' | 'sent' | 'approved' | 'rejected' | 'confirmed' | 'invoice_sent' | 'payment_received' | 'locked';
  adults_count: number;
  children_count: number;
  infants_count: number;
  start_date: string | null;
  end_date: string | null;
  total_price: number;
  currency: string;
  lead_budget_min: number | null;
  lead_budget_max: number | null;
  notes: string | null;
  query_id: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  is_locked: boolean;
  locked_at: string | null;
  locked_by: string | null;
}

export interface ItineraryDay {
  id: string;
  itinerary_id: string;
  day_number: number;
  date: string | null;
  city_name: string | null;
  notes: string | null;
  display_order: number;
}

export interface ItineraryItem {
  id: string;
  itinerary_id: string;
  day_id: string | null;
  package_type: 'activity' | 'transfer' | 'multi_city' | 'multi_city_hotel' | 'fixed_departure';
  package_id: string;
  operator_id: string;
  package_title: string;
  package_image_url: string | null;
  configuration: any;
  unit_price: number;
  quantity: number;
  total_price: number;
  display_order: number;
  notes: string | null;
}

export interface OperatorInfo {
  operator_id: string;
  operator_name: string;
  operator_email: string | null;
  operator_phone: string | null;
  packages: ItineraryItem[];
}

export class ItineraryService {
  // Get all itineraries for a lead
  async getLeadItineraries(leadId: string, agentId?: string): Promise<Itinerary[]> {
    try {
      console.log('[ItineraryService] Fetching itineraries for leadId:', leadId, 'agentId:', agentId || 'not provided');
      
      // Get the lead's customer_id and marketplace_lead_id first
      const leadInfo = await queryOne<{
        customer_id: string | null;
        marketplace_lead_id: string | null;
        agent_id: string | null;
      }>(
        `SELECT customer_id, marketplace_lead_id::text as marketplace_lead_id, agent_id::text as agent_id
         FROM leads 
         WHERE id::text = $1`,
        [leadId]
      );
      
      if (!leadInfo) {
        console.log('[ItineraryService] Lead not found in leads table, trying direct itinerary query only');
        // If lead not found, still try direct query (might be marketplace lead ID)
        const directResult = await query<Itinerary>(
          agentId
            ? 'SELECT * FROM itineraries WHERE lead_id::text = $1 AND agent_id::text = $2 ORDER BY created_at DESC'
            : 'SELECT * FROM itineraries WHERE lead_id::text = $1 ORDER BY created_at DESC',
          agentId ? [leadId, agentId] : [leadId]
        );
        console.log('[ItineraryService] Direct query (no lead info):', directResult.rows.length, 'itineraries');
        return directResult.rows;
      }
      
      console.log('[ItineraryService] Lead info found:', {
        customer_id: leadInfo.customer_id,
        marketplace_lead_id: leadInfo.marketplace_lead_id,
        agent_id: leadInfo.agent_id,
      });
      
      // STEP 1: PRIMARY QUERY - Get all itineraries directly linked to this leads.id
      // This is the main query - should find most/all itineraries for this specific lead
      const directQuery = 'SELECT * FROM itineraries WHERE lead_id::text = $1 ORDER BY created_at DESC';
      console.log('[ItineraryService] Executing PRIMARY query for lead_id:', leadId);
      const directResult = await query<Itinerary>(directQuery, [leadId]);
      console.log('[ItineraryService] PRIMARY query found:', directResult.rows.length, 'itineraries');
      
      // Filter by agent_id if provided (security measure)
      let filteredDirect = directResult.rows;
      if (agentId) {
        const beforeFilter = filteredDirect.length;
        filteredDirect = filteredDirect.filter(it => it.agent_id === agentId);
        const afterFilter = filteredDirect.length;
        if (beforeFilter > afterFilter) {
          console.log(`[ItineraryService] ⚠️ Filtered out ${beforeFilter - afterFilter} itineraries due to agent_id mismatch`);
        }
      }
      
      // Track all found itinerary IDs to avoid duplicates
      const foundItineraryIds = new Set<string>();
      filteredDirect.forEach(it => foundItineraryIds.add(it.id));
      
      // STEP 2: FALLBACK QUERY - If lead has marketplace_lead_id, find ALL itineraries for ALL leads with same marketplace_lead_id
      // This handles data inconsistencies where multiple leads.id records exist for the same marketplace lead
      const additionalItineraries: Itinerary[] = [];
      
      if (leadInfo.marketplace_lead_id) {
        console.log('[ItineraryService] Lead has marketplace_lead_id, executing FALLBACK query');
        console.log('[ItineraryService] This will find ALL itineraries for ALL leads.id records with marketplace_lead_id:', leadInfo.marketplace_lead_id);
        
        // Find all leads with the same marketplace_lead_id and same agent_id (security)
        // Then get all their itineraries
        const marketplaceQuery = agentId
          ? `SELECT DISTINCT i.* 
             FROM itineraries i
             INNER JOIN leads l ON l.id::text = i.lead_id::text
             WHERE l.marketplace_lead_id::text = $1 
             AND l.agent_id::text = $2
             AND l.marketplace_lead_id IS NOT NULL
             ORDER BY i.created_at DESC`
          : `SELECT DISTINCT i.* 
             FROM itineraries i
             INNER JOIN leads l ON l.id::text = i.lead_id::text
             WHERE l.marketplace_lead_id::text = $1 
             AND l.marketplace_lead_id IS NOT NULL
             ORDER BY i.created_at DESC`;
        
        const marketplaceParams = agentId ? [leadInfo.marketplace_lead_id, agentId] : [leadInfo.marketplace_lead_id];
        const marketplaceResult = await query<Itinerary>(marketplaceQuery, marketplaceParams);
        console.log('[ItineraryService] FALLBACK query (marketplace_lead_id) found:', marketplaceResult.rows.length, 'itineraries');
        
        // Log details about what was found
        if (marketplaceResult.rows.length > 0) {
          const uniqueLeadIds = new Set(marketplaceResult.rows.map(it => it.lead_id));
          console.log('[ItineraryService] These itineraries are linked to', uniqueLeadIds.size, 'different lead_id records:', Array.from(uniqueLeadIds));
        }
        
        // Filter by agent_id if not already filtered in query (double-check for security)
        const filteredMarketplace = agentId 
          ? marketplaceResult.rows.filter(it => it.agent_id === agentId)
          : marketplaceResult.rows;
        
        console.log('[ItineraryService] After agent_id filter:', filteredMarketplace.length, 'itineraries');
        
        // Add only new itineraries (not already found in PRIMARY query)
        filteredMarketplace.forEach(it => {
          if (!foundItineraryIds.has(it.id)) {
            foundItineraryIds.add(it.id);
            additionalItineraries.push(it);
            console.log(`[ItineraryService] Additional itinerary ${it.id} (lead_id: ${it.lead_id}) found via FALLBACK query`);
          } else {
            console.log(`[ItineraryService] Itinerary ${it.id} already found via PRIMARY query, skipping duplicate`);
          }
        });
      }
      
      // STEP 3: Combine all itineraries and sort by created_at
      const finalItineraries = [...filteredDirect, ...additionalItineraries].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });
      
      console.log('[ItineraryService] Fetched itineraries from DB (total):', finalItineraries.length);
      console.log('[ItineraryService] Breakdown:', {
        primary_query: filteredDirect.length,
        fallback_query: additionalItineraries.length,
        total_final: finalItineraries.length,
      });
      
      // Log each itinerary's details
      finalItineraries.forEach((it: Itinerary, index: number) => {
        console.log(`[ItineraryService] Itinerary ${index + 1} from DB:`, {
          id: it.id,
          name: it.name,
          lead_id: it.lead_id,
          agent_id: it.agent_id,
          total_price: it.total_price,
          total_price_type: typeof it.total_price,
          total_price_is_null: it.total_price === null,
          total_price_is_undefined: it.total_price === undefined,
          total_price_value: it.total_price ?? 'NULL/UNDEFINED',
        });
        console.log(`[ItineraryService] Price for "${it.name}": total_price=${it.total_price} (type: ${typeof it.total_price})`);
      });
      
      return finalItineraries;
    } catch (error) {
      console.error('Error fetching lead itineraries:', error);
      throw error;
    }
  }

  // Get itinerary with all details
  async getItineraryDetails(itineraryId: string): Promise<{
    itinerary: Itinerary;
    days: ItineraryDay[];
    items: ItineraryItem[];
  }> {
    try {
      // Get itinerary
      const itinerary = await queryOne<Itinerary>(
        'SELECT * FROM itineraries WHERE id = $1',
        [itineraryId]
      );

      if (!itinerary) {
        throw new Error('Itinerary not found');
      }

      // Get days
      const daysResult = await query<ItineraryDay>(
        'SELECT * FROM itinerary_days WHERE itinerary_id = $1 ORDER BY day_number ASC',
        [itineraryId]
      );

      // Get items
      const itemsResult = await query<ItineraryItem>(
        'SELECT * FROM itinerary_items WHERE itinerary_id = $1 ORDER BY display_order ASC',
        [itineraryId]
      );

      return {
        itinerary,
        days: daysResult.rows,
        items: itemsResult.rows,
      };
    } catch (error) {
      console.error('Error fetching itinerary details:', error);
      throw error;
    }
  }

  // Get lead details for itinerary
  async getLeadDetails(leadId: string) {
    try {
      const lead = await queryOne(
        'SELECT * FROM leads WHERE id = $1',
        [leadId]
      );

      if (!lead) {
        throw new Error('Lead not found');
      }

      return lead;
    } catch (error) {
      console.error('Error fetching lead details:', error);
      throw error;
    }
  }

  // Get consolidated operator information
  async getOperatorsInfo(itineraryId: string): Promise<OperatorInfo[]> {
    try {
      // Get all items for this itinerary
      const itemsResult = await query<ItineraryItem>(
        'SELECT * FROM itinerary_items WHERE itinerary_id = $1',
        [itineraryId]
      );

      const items = itemsResult.rows;
      const uniqueOperatorIds = [...new Set(items.map(item => item.operator_id))];

      if (uniqueOperatorIds.length === 0) {
        return [];
      }

      // Get operator profiles
      const profileMap = new Map<string, { name: string; email: string | null; phone: string | null }>();
      
      try {
        const placeholders = uniqueOperatorIds.map((_, i) => `$${i + 1}`).join(', ');
        const profilesResult = await query<{
          id: string;
          company_name?: string;
          email?: string;
          phone?: string;
        }>(
          `SELECT id, company_name, email, phone FROM profiles WHERE id IN (${placeholders})`,
          uniqueOperatorIds
        );

        profilesResult.rows.forEach(p => {
          profileMap.set(p.id, {
            name: p.company_name || 'Unknown Operator',
            email: p.email || null,
            phone: p.phone || null,
          });
        });
      } catch (err) {
        console.warn('Profiles table not found or error fetching profiles:', err);
      }

      // Fill missing operators with defaults
      uniqueOperatorIds.forEach(id => {
        if (!profileMap.has(id)) {
          profileMap.set(id, { name: 'Unknown Operator', email: null, phone: null });
        }
      });

      // Group items by operator
      const operatorMap = new Map<string, ItineraryItem[]>();
      items.forEach(item => {
        if (!operatorMap.has(item.operator_id)) {
          operatorMap.set(item.operator_id, []);
        }
        operatorMap.get(item.operator_id)!.push(item);
      });

      // Build operator info array
      return Array.from(operatorMap.entries()).map(([operatorId, packages]) => {
        const profile = profileMap.get(operatorId);
        return {
          operator_id: operatorId,
          operator_name: profile?.name || 'Unknown Operator',
          operator_email: profile?.email || null,
          operator_phone: profile?.phone || null,
          packages,
        };
      });
    } catch (error) {
      console.error('Error fetching operators info:', error);
      throw error;
    }
  }

  // Duplicate itinerary
  async duplicateItinerary(itineraryId: string, newName: string): Promise<Itinerary> {
    try {
      const { itinerary, days, items } = await this.getItineraryDetails(itineraryId);

      // Generate customer_id for duplicate
      const customerIdResult = await query<{ customer_id: string }>(
        `SELECT generate_itinerary_customer_id() as customer_id`,
        []
      );
      const customerId = customerIdResult.rows[0]?.customer_id;

      // Create new itinerary
      const newItineraryResult = await query<Itinerary>(
        `INSERT INTO itineraries (
          lead_id, agent_id, name, customer_id, status, adults_count, children_count,
          infants_count, start_date, end_date, total_price, currency,
          lead_budget_min, lead_budget_max, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          itinerary.lead_id,
          itinerary.agent_id,
          newName,
          customerId,
          'draft',
          itinerary.adults_count,
          itinerary.children_count,
          itinerary.infants_count,
          itinerary.start_date,
          itinerary.end_date,
          0,
          itinerary.currency,
          itinerary.lead_budget_min,
          itinerary.lead_budget_max,
          itinerary.notes,
        ]
      );

      if (!newItineraryResult.rows || newItineraryResult.rows.length === 0) {
        throw new Error('Failed to create duplicate itinerary');
      }

      const newItinerary = newItineraryResult.rows[0];
      if (!newItinerary) {
        throw new Error('Failed to create duplicate itinerary - no data returned');
      }

      // Duplicate days
      const dayIdMap = new Map<string, string>();
      for (const day of days) {
        const newDayResult = await query<ItineraryDay>(
          `INSERT INTO itinerary_days (
            itinerary_id, day_number, date, city_name, notes, display_order
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *`,
          [
            newItinerary.id,
            day.day_number,
            day.date,
            day.city_name,
            day.notes,
            day.display_order ?? day.day_number,
          ]
        );

        if (newDayResult.rows && newDayResult.rows.length > 0 && newDayResult.rows[0]) {
          dayIdMap.set(day.id, newDayResult.rows[0].id);
        }
      }

      // Duplicate items
      for (const item of items) {
        const newDayId = item.day_id ? dayIdMap.get(item.day_id) || null : null;

        await query(
          `INSERT INTO itinerary_items (
            itinerary_id, day_id, package_type, package_id, operator_id,
            package_title, package_image_url, configuration, unit_price,
            quantity, total_price, display_order, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            newItinerary.id,
            newDayId,
            item.package_type,
            item.package_id,
            item.operator_id,
            item.package_title,
            item.package_image_url,
            typeof item.configuration === 'object' ? JSON.stringify(item.configuration) : item.configuration,
            item.unit_price,
            item.quantity,
            item.total_price,
            item.display_order,
            item.notes,
          ]
        );
      }

      return newItinerary;
    } catch (error) {
      console.error('Error duplicating itinerary:', error);
      throw error;
    }
  }

  // Update itinerary status
  async updateItineraryStatus(itineraryId: string, status: Itinerary['status']): Promise<void> {
    try {
      if (status === 'sent') {
        await query(
          'UPDATE itineraries SET status = $1, updated_at = NOW(), sent_at = NOW() WHERE id = $2',
          [status, itineraryId]
        );
      } else {
        await query(
          'UPDATE itineraries SET status = $1, updated_at = NOW() WHERE id = $2',
          [status, itineraryId]
        );
      }
    } catch (error) {
      console.error('Error updating itinerary status:', error);
      throw error;
    }
  }
}

export const itineraryService = new ItineraryService();

