/**
 * Marketplace Service
 * Service layer for lead marketplace operations
 * Handles all database interactions for the lead marketplace feature
 * 
 * MIGRATED: Now uses PostgreSQL directly via AWS RDS
 * NOTE: This service should be called from API routes for client-side access
 */

// Use Lambda database service for reliable VPC access
import { query, queryOne, queryMany } from '@/lib/aws/lambda-database';
import {
  MarketplaceLead,
  LeadPurchase,
  LeadFilters,
  LeadStatus,
  TripType,
  type MarketplaceLeadDB,
  type LeadPurchaseDB,
  mapMarketplaceLeadFromDB,
  mapLeadPurchaseFromDB,
} from '@/lib/types/marketplace';

/**
 * Marketplace Service Class
 * Provides all marketplace-related operations
 */
export class MarketplaceService {
  /**
   * Get available leads from marketplace with optional filters
   * @param filters - Optional filters to apply to the search
   * @returns Promise with array of available marketplace leads
   */
  static async getAvailableLeads(filters?: LeadFilters): Promise<MarketplaceLead[]> {
    try {
      let sql = `
        SELECT * FROM lead_marketplace
        WHERE status = $1 AND expires_at > $2
      `;
      const params: any[] = [LeadStatus.AVAILABLE, new Date().toISOString()];
      let paramIndex = 3;

      // Apply filters if provided
      if (filters) {
        if (filters.destination) {
          sql += ` AND destination ILIKE $${paramIndex}`;
          params.push(`%${filters.destination}%`);
          paramIndex++;
        }

        if (filters.tripType) {
          sql += ` AND trip_type = $${paramIndex}`;
          params.push(filters.tripType);
          paramIndex++;
        }

        if (filters.budgetMin !== undefined) {
          sql += ` AND budget_max >= $${paramIndex}`;
          params.push(filters.budgetMin);
          paramIndex++;
        }

        if (filters.budgetMax !== undefined) {
          sql += ` AND budget_min <= $${paramIndex}`;
          params.push(filters.budgetMax);
          paramIndex++;
        }

        if (filters.durationMin !== undefined) {
          sql += ` AND duration_days >= $${paramIndex}`;
          params.push(filters.durationMin);
          paramIndex++;
        }

        if (filters.durationMax !== undefined) {
          sql += ` AND duration_days <= $${paramIndex}`;
          params.push(filters.durationMax);
          paramIndex++;
        }

        if (filters.minQualityScore !== undefined) {
          sql += ` AND lead_quality_score >= $${paramIndex}`;
          params.push(filters.minQualityScore);
          paramIndex++;
        }
      }

      sql += ` ORDER BY lead_quality_score DESC, posted_at DESC`;

      const result = await query<MarketplaceLeadDB>(sql, params);

      // Map database results to client format, hiding sensitive data
      return result.rows.map((dbLead: MarketplaceLeadDB) => {
        const lead = mapMarketplaceLeadFromDB(dbLead);
        // Ensure sensitive fields are not exposed for unpurchased leads
        return {
          ...lead,
          customerName: undefined,
          customerEmail: undefined,
          customerPhone: undefined,
          detailedRequirements: undefined,
        };
      });
    } catch (error) {
      console.error('[MarketplaceService] Error in getAvailableLeads:', error);
      throw error;
    }
  }

  /**
   * Get single lead details
   * Returns limited info if not purchased by the agent, full details if purchased
   * @param leadId - The lead ID to fetch
   * @param agentId - The agent requesting the lead details
   * @returns Promise with lead details
   */
  static async getLeadDetails(leadId: string, agentId: string): Promise<MarketplaceLead> {
    try {
      // Check if agent has purchased this lead
      const hasPurchased = await this.hasAgentPurchased(leadId, agentId);

      // Fetch lead details
      const dbLead = await queryOne<MarketplaceLeadDB>(
        'SELECT * FROM lead_marketplace WHERE id = $1',
        [leadId]
      );

      if (!dbLead) {
        throw new Error('Lead not found');
      }

      const lead = mapMarketplaceLeadFromDB(dbLead);

      // If not purchased, hide sensitive information
      if (!hasPurchased) {
        return {
          ...lead,
          customerName: undefined,
          customerEmail: undefined,
          customerPhone: undefined,
          detailedRequirements: undefined,
        };
      }

      // Return full details if purchased
      return lead;
    } catch (error) {
      console.error('[MarketplaceService] Error in getLeadDetails:', error);
      throw error;
    }
  }

  /**
   * Purchase a lead from the marketplace
   * Creates a purchase record and updates the lead status
   * @param leadId - The lead to purchase
   * @param agentId - The agent making the purchase
   * @returns Promise with purchase details
   */
  static async purchaseLead(leadId: string, agentId: string): Promise<LeadPurchase> {
    try {
      // First, verify the lead is available
      const leadData = await queryOne<{
        id: string;
        status: string;
        expires_at: string;
        lead_price: number;
      }>(
        'SELECT id, status, expires_at, lead_price FROM lead_marketplace WHERE id = $1',
        [leadId]
      );

      if (!leadData) {
        throw new Error('Lead not found or unavailable');
      }

      // Check if lead is available
      if (leadData.status !== LeadStatus.AVAILABLE) {
        throw new Error('Lead is no longer available for purchase');
      }

      // Check if lead has expired
      if (new Date(leadData.expires_at) <= new Date()) {
        throw new Error('Lead has expired');
      }

      // Check if agent has already purchased this lead
      const alreadyPurchased = await this.hasAgentPurchased(leadId, agentId);
      if (alreadyPurchased) {
        throw new Error('You have already purchased this lead');
      }

      // Create purchase record (trigger will update lead status)
      const purchaseResult = await query<LeadPurchaseDB>(
        `INSERT INTO lead_purchases (lead_id, agent_id, purchase_price)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [leadId, agentId, leadData.lead_price]
      );

      if (!purchaseResult.rows || purchaseResult.rows.length === 0) {
        throw new Error('Purchase failed - no data returned');
      }

      const purchase = purchaseResult.rows[0];
      if (!purchase) {
        throw new Error('Purchase failed - no data returned');
      }

      return mapLeadPurchaseFromDB(purchase);
    } catch (error) {
      console.error('[MarketplaceService] Error in purchaseLead:', error);
      throw error;
    }
  }

  /**
   * Get all leads purchased by an agent
   * @param agentId - The agent ID
   * @returns Promise with array of purchased leads with full details
   */
  static async getAgentPurchasedLeads(agentId: string): Promise<LeadPurchase[]> {
    try {
      // Get purchases with lead details using JOIN
      const result = await query<LeadPurchaseDB & { lead: MarketplaceLeadDB }>(
        `SELECT 
          lp.*,
          jsonb_build_object(
            'id', lm.id,
            'title', lm.title,
            'destination', lm.destination,
            'trip_type', lm.trip_type,
            'budget_min', lm.budget_min,
            'budget_max', lm.budget_max,
            'duration_days', lm.duration_days,
            'lead_price', lm.lead_price,
            'lead_quality_score', lm.lead_quality_score,
            'status', lm.status,
            'posted_at', lm.posted_at,
            'expires_at', lm.expires_at,
            'customer_name', lm.customer_name,
            'customer_email', lm.customer_email,
            'customer_phone', lm.customer_phone,
            'special_requirements', lm.special_requirements,
            'detailed_requirements', lm.detailed_requirements
          ) as lead
        FROM lead_purchases lp
        JOIN lead_marketplace lm ON lp.lead_id = lm.id
        WHERE lp.agent_id = $1::uuid
        ORDER BY lp.purchased_at DESC`,
        [agentId]
      );

      // Map purchases and include full lead details
      return result.rows.map((row: any) => {
        const purchase = mapLeadPurchaseFromDB(row as LeadPurchaseDB);
        if (row.lead) {
          purchase.lead = mapMarketplaceLeadFromDB(row.lead as MarketplaceLeadDB);
        }
        return purchase;
      });
    } catch (error) {
      console.error('[MarketplaceService] Error in getAgentPurchasedLeads:', error);

      // If the lead_purchases table doesn't exist (e.g. RDS schema not migrated yet),
      // fail gracefully by returning an empty list instead of a 500 error.
      const message =
        error instanceof Error ? error.message : typeof error === 'string' ? error : '';

      if (message.includes('relation "lead_purchases" does not exist')) {
        console.warn(
          '[MarketplaceService] lead_purchases table missing in RDS – returning empty purchases list.'
        );
        return [];
      }

      throw error;
    }
  }

  /**
   * Check if an agent has already purchased a specific lead
   * @param leadId - The lead ID to check
   * @param agentId - The agent ID to check
   * @returns Promise with boolean indicating if purchased
   */
  static async hasAgentPurchased(leadId: string, agentId: string): Promise<boolean> {
    try {
      const result = await queryOne<{ id: string }>(
        'SELECT id FROM lead_purchases WHERE lead_id = $1::uuid AND agent_id = $2::uuid LIMIT 1',
        [leadId, agentId]
      );

      return !!result;
    } catch (error) {
      console.error('[MarketplaceService] Error in hasAgentPurchased:', error);
      return false;
    }
  }

  /**
   * Get marketplace statistics for an agent
   * Includes total available leads, purchased leads, this month's purchases, and total spent
   * @param agentId - The agent ID
   * @returns Promise with statistics object
   */
  static async getMarketplaceStats(
    agentId: string
  ): Promise<{
    totalAvailable: number;
    purchased: number;
    thisMonth: number;
    totalSpent: number;
  }> {
    try {
      // Get all stats in parallel
      const [availableResult, purchasedResult, thisMonthResult, spentResult] = await Promise.all([
        // Total available leads
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM lead_marketplace 
           WHERE status = $1 AND expires_at > $2`,
          [LeadStatus.AVAILABLE, new Date().toISOString()]
        ),
        // Agent's total purchases
        query<{ count: string }>(
          'SELECT COUNT(*) as count FROM lead_purchases WHERE agent_id = $1::uuid',
          [agentId]
        ),
        // This month's purchases
        (async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
          return query<{ count: string }>(
            `SELECT COUNT(*) as count FROM lead_purchases 
             WHERE agent_id = $1::uuid AND purchased_at >= $2`,
            [agentId, startOfMonth.toISOString()]
          );
        })(),
        // Total spent
        query<{ purchase_price: number }>(
          'SELECT purchase_price FROM lead_purchases WHERE agent_id = $1::uuid',
          [agentId]
        ),
      ]);

      const totalAvailable = parseInt(availableResult.rows[0]?.count || '0', 10);
      const purchased = parseInt(purchasedResult.rows[0]?.count || '0', 10);
      const thisMonth = parseInt(thisMonthResult.rows[0]?.count || '0', 10);
      const totalSpent = spentResult.rows.reduce(
        (sum, p) => sum + (Number(p.purchase_price) || 0),
        0
      );

      return {
        totalAvailable,
        purchased,
        thisMonth,
        totalSpent,
      };
    } catch (error) {
      console.error('[MarketplaceService] Error in getMarketplaceStats:', error);
      // Return zeros on error rather than throwing
      return {
        totalAvailable: 0,
        purchased: 0,
        thisMonth: 0,
        totalSpent: 0,
      };
    }
  }

  /**
   * Search leads by multiple criteria
   * More advanced filtering than getAvailableLeads
   * @param searchTerm - Search term to match against title, destination, requirements
   * @param filters - Additional filters
   * @returns Promise with array of matching leads
   */
  static async searchLeads(
    searchTerm: string,
    filters?: LeadFilters
  ): Promise<MarketplaceLead[]> {
    try {
      let sql = `
        SELECT * FROM lead_marketplace
        WHERE status = $1 AND expires_at > $2
      `;
      const params: any[] = [LeadStatus.AVAILABLE, new Date().toISOString()];
      let paramIndex = 3;

      // Add search term if provided
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim();
        sql += ` AND (title ILIKE $${paramIndex} OR destination ILIKE $${paramIndex} OR special_requirements ILIKE $${paramIndex})`;
        params.push(`%${term}%`);
        paramIndex++;
      }

      // Apply additional filters
      if (filters) {
        if (filters.tripType) {
          sql += ` AND trip_type = $${paramIndex}`;
          params.push(filters.tripType);
          paramIndex++;
        }
        if (filters.budgetMin !== undefined) {
          sql += ` AND budget_max >= $${paramIndex}`;
          params.push(filters.budgetMin);
          paramIndex++;
        }
        if (filters.budgetMax !== undefined) {
          sql += ` AND budget_min <= $${paramIndex}`;
          params.push(filters.budgetMax);
          paramIndex++;
        }
        if (filters.minQualityScore !== undefined) {
          sql += ` AND lead_quality_score >= $${paramIndex}`;
          params.push(filters.minQualityScore);
          paramIndex++;
        }
      }

      sql += ` ORDER BY lead_quality_score DESC, posted_at DESC LIMIT 50`;

      const result = await query<MarketplaceLeadDB>(sql, params);

      // Map and hide sensitive data
      return result.rows.map((dbLead: MarketplaceLeadDB) => {
        const lead = mapMarketplaceLeadFromDB(dbLead);
        return {
          ...lead,
          customerName: undefined,
          customerEmail: undefined,
          customerPhone: undefined,
          detailedRequirements: undefined,
        };
      });
    } catch (error) {
      console.error('[MarketplaceService] Error in searchLeads:', error);
      throw error;
    }
  }

  /**
   * Get featured/high-quality leads
   * Returns leads with quality scores above 80
   * @param limit - Maximum number of leads to return
   * @returns Promise with array of high-quality leads
   */
  static async getFeaturedLeads(limit: number = 10): Promise<MarketplaceLead[]> {
    try {
      const result = await query<MarketplaceLeadDB>(
        `SELECT * FROM lead_marketplace
         WHERE status = $1 AND expires_at > $2 AND lead_quality_score >= 80
         ORDER BY lead_quality_score DESC, posted_at DESC
         LIMIT $3`,
        [LeadStatus.AVAILABLE, new Date().toISOString(), limit]
      );

      // Map and hide sensitive data
      return result.rows.map((dbLead: MarketplaceLeadDB) => {
        const lead = mapMarketplaceLeadFromDB(dbLead);
        return {
          ...lead,
          customerName: undefined,
          customerEmail: undefined,
          customerPhone: undefined,
          detailedRequirements: undefined,
        };
      });
    } catch (error) {
      console.error('[MarketplaceService] Error in getFeaturedLeads:', error);
      throw error;
    }
  }

  /**
   * Get leads expiring soon (within 24 hours)
   * Useful for showing urgent opportunities
   * @returns Promise with array of expiring leads
   */
  static async getExpiringSoonLeads(): Promise<MarketplaceLead[]> {
    try {
      const now = new Date();
      const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const result = await query<MarketplaceLeadDB>(
        `SELECT * FROM lead_marketplace
         WHERE status = $1 
           AND expires_at > $2 
           AND expires_at < $3
         ORDER BY expires_at ASC`,
        [LeadStatus.AVAILABLE, now.toISOString(), twentyFourHoursLater.toISOString()]
      );

      // Map and hide sensitive data
      return result.rows.map((dbLead: MarketplaceLeadDB) => {
        const lead = mapMarketplaceLeadFromDB(dbLead);
        return {
          ...lead,
          customerName: undefined,
          customerEmail: undefined,
          customerPhone: undefined,
          detailedRequirements: undefined,
        };
      });
    } catch (error) {
      console.error('[MarketplaceService] Error in getExpiringSoonLeads:', error);
      throw error;
    }
  }
}

// Export singleton pattern for convenience
export default MarketplaceService;

