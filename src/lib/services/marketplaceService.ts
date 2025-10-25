/**
 * Marketplace Service
 * Service layer for lead marketplace operations
 * Handles all database interactions for the lead marketplace feature
 */

import { createSupabaseBrowserClient, SupabaseError } from '@/lib/supabase/client';
import type { SupabaseClientType } from '@/lib/supabase/client';
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
    const supabase = createSupabaseBrowserClient();

    try {
      // Start with base query for available leads
      let query = supabase
        .from('lead_marketplace')
        .select('*')
        .eq('status', LeadStatus.AVAILABLE)
        .gt('expires_at', new Date().toISOString())
        .order('lead_quality_score', { ascending: false })
        .order('posted_at', { ascending: false });

      // Apply filters if provided
      if (filters) {
        if (filters.destination) {
          query = query.ilike('destination', `%${filters.destination}%`);
        }

        if (filters.tripType) {
          query = query.eq('trip_type', filters.tripType);
        }

        if (filters.budgetMin !== undefined) {
          query = query.gte('budget_max', filters.budgetMin);
        }

        if (filters.budgetMax !== undefined) {
          query = query.lte('budget_min', filters.budgetMax);
        }

        if (filters.durationMin !== undefined) {
          query = query.gte('duration_days', filters.durationMin);
        }

        if (filters.durationMax !== undefined) {
          query = query.lte('duration_days', filters.durationMax);
        }

        if (filters.minQualityScore !== undefined) {
          query = query.gte('lead_quality_score', filters.minQualityScore);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('[MarketplaceService] Error fetching available leads:', error);
        throw new SupabaseError(
          'Failed to fetch available leads',
          error.code,
          error.message,
          error.hint
        );
      }

      if (!data) {
        return [];
      }

      // Map database results to client format, hiding sensitive data
      return data.map((dbLead: MarketplaceLeadDB) => {
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
    const supabase = createSupabaseBrowserClient();

    try {
      // Check if agent has purchased this lead
      const hasPurchased = await this.hasAgentPurchased(leadId, agentId);

      // Fetch lead details
      const { data, error } = await supabase
        .from('lead_marketplace')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) {
        console.error('[MarketplaceService] Error fetching lead details:', error);
        throw new SupabaseError(
          'Failed to fetch lead details',
          error.code,
          error.message,
          error.hint
        );
      }

      if (!data) {
        throw new SupabaseError('Lead not found', 'NOT_FOUND');
      }

      const lead = mapMarketplaceLeadFromDB(data as MarketplaceLeadDB);

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
    const supabase = createSupabaseBrowserClient();

    try {
      // First, verify the lead is available
      const { data: leadData, error: leadError } = await supabase
        .from('lead_marketplace')
        .select('id, status, expires_at, lead_price')
        .eq('id', leadId)
        .single();

      if (leadError || !leadData) {
        throw new SupabaseError(
          'Lead not found or unavailable',
          leadError?.code,
          leadError?.message
        );
      }

      // Check if lead is available
      if (leadData.status !== LeadStatus.AVAILABLE) {
        throw new SupabaseError(
          'Lead is no longer available for purchase',
          'LEAD_UNAVAILABLE'
        );
      }

      // Check if lead has expired
      if (new Date(leadData.expires_at) <= new Date()) {
        throw new SupabaseError('Lead has expired', 'LEAD_EXPIRED');
      }

      // Check if agent has already purchased this lead
      const alreadyPurchased = await this.hasAgentPurchased(leadId, agentId);
      if (alreadyPurchased) {
        throw new SupabaseError(
          'You have already purchased this lead',
          'ALREADY_PURCHASED'
        );
      }

      // Create purchase record (trigger will update lead status)
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('lead_purchases')
        .insert({
          lead_id: leadId,
          agent_id: agentId,
          purchase_price: leadData.lead_price,
        })
        .select()
        .single();

      if (purchaseError) {
        console.error('[MarketplaceService] Error creating purchase:', purchaseError);
        throw new SupabaseError(
          'Failed to purchase lead',
          purchaseError.code,
          purchaseError.message,
          purchaseError.hint
        );
      }

      if (!purchaseData) {
        throw new SupabaseError('Purchase failed - no data returned', 'PURCHASE_FAILED');
      }

      return mapLeadPurchaseFromDB(purchaseData as LeadPurchaseDB);
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
    const supabase = createSupabaseBrowserClient();

    try {
      const { data, error } = await supabase
        .from('lead_purchases')
        .select(`
          *,
          lead:lead_marketplace (*)
        `)
        .eq('agent_id', agentId)
        .order('purchased_at', { ascending: false });

      if (error) {
        console.error('[MarketplaceService] Error fetching purchased leads:', error);
        throw new SupabaseError(
          'Failed to fetch purchased leads',
          error.code,
          error.message,
          error.hint
        );
      }

      if (!data) {
        return [];
      }

      // Map purchases and include full lead details
      return data.map((item: any) => {
        const purchase = mapLeadPurchaseFromDB(item as LeadPurchaseDB);
        if (item.lead) {
          purchase.lead = mapMarketplaceLeadFromDB(item.lead as MarketplaceLeadDB);
        }
        return purchase;
      });
    } catch (error) {
      console.error('[MarketplaceService] Error in getAgentPurchasedLeads:', error);
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
    const supabase = createSupabaseBrowserClient();

    try {
      const { data, error } = await supabase
        .from('lead_purchases')
        .select('id')
        .eq('lead_id', leadId)
        .eq('agent_id', agentId)
        .maybeSingle();

      if (error) {
        console.error('[MarketplaceService] Error checking purchase status:', error);
        // Don't throw here, return false on error
        return false;
      }

      return !!data;
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
    const supabase = createSupabaseBrowserClient();

    try {
      // Get total available leads
      const { count: availableCount, error: availableError } = await supabase
        .from('lead_marketplace')
        .select('*', { count: 'exact', head: true })
        .eq('status', LeadStatus.AVAILABLE)
        .gt('expires_at', new Date().toISOString());

      if (availableError) {
        console.error('[MarketplaceService] Error counting available leads:', availableError);
      }

      // Get agent's total purchases
      const { count: purchasedCount, error: purchasedError } = await supabase
        .from('lead_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId);

      if (purchasedError) {
        console.error('[MarketplaceService] Error counting purchases:', purchasedError);
      }

      // Get this month's purchases
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: thisMonthCount, error: thisMonthError } = await supabase
        .from('lead_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .gte('purchased_at', startOfMonth.toISOString());

      if (thisMonthError) {
        console.error('[MarketplaceService] Error counting this month purchases:', thisMonthError);
      }

      // Get total spent
      const { data: purchaseData, error: spentError } = await supabase
        .from('lead_purchases')
        .select('purchase_price')
        .eq('agent_id', agentId);

      if (spentError) {
        console.error('[MarketplaceService] Error calculating total spent:', spentError);
      }

      const totalSpent = purchaseData
        ? purchaseData.reduce((sum, p) => sum + (Number(p.purchase_price) || 0), 0)
        : 0;

      return {
        totalAvailable: availableCount || 0,
        purchased: purchasedCount || 0,
        thisMonth: thisMonthCount || 0,
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
    const supabase = createSupabaseBrowserClient();

    try {
      let query = supabase
        .from('lead_marketplace')
        .select('*')
        .eq('status', LeadStatus.AVAILABLE)
        .gt('expires_at', new Date().toISOString());

      // Add search term if provided
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim();
        query = query.or(
          `title.ilike.%${term}%,destination.ilike.%${term}%,special_requirements.ilike.%${term}%`
        );
      }

      // Apply additional filters
      if (filters) {
        if (filters.tripType) {
          query = query.eq('trip_type', filters.tripType);
        }
        if (filters.budgetMin !== undefined) {
          query = query.gte('budget_max', filters.budgetMin);
        }
        if (filters.budgetMax !== undefined) {
          query = query.lte('budget_min', filters.budgetMax);
        }
        if (filters.minQualityScore !== undefined) {
          query = query.gte('lead_quality_score', filters.minQualityScore);
        }
      }

      query = query
        .order('lead_quality_score', { ascending: false })
        .order('posted_at', { ascending: false })
        .limit(50);

      const { data, error } = await query;

      if (error) {
        console.error('[MarketplaceService] Error searching leads:', error);
        throw new SupabaseError(
          'Failed to search leads',
          error.code,
          error.message,
          error.hint
        );
      }

      if (!data) {
        return [];
      }

      // Map and hide sensitive data
      return data.map((dbLead: MarketplaceLeadDB) => {
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
    const supabase = createSupabaseBrowserClient();

    try {
      const { data, error } = await supabase
        .from('lead_marketplace')
        .select('*')
        .eq('status', LeadStatus.AVAILABLE)
        .gt('expires_at', new Date().toISOString())
        .gte('lead_quality_score', 80)
        .order('lead_quality_score', { ascending: false })
        .order('posted_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[MarketplaceService] Error fetching featured leads:', error);
        throw new SupabaseError(
          'Failed to fetch featured leads',
          error.code,
          error.message,
          error.hint
        );
      }

      if (!data) {
        return [];
      }

      // Map and hide sensitive data
      return data.map((dbLead: MarketplaceLeadDB) => {
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
    const supabase = createSupabaseBrowserClient();

    try {
      const now = new Date();
      const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('lead_marketplace')
        .select('*')
        .eq('status', LeadStatus.AVAILABLE)
        .gt('expires_at', now.toISOString())
        .lt('expires_at', twentyFourHoursLater.toISOString())
        .order('expires_at', { ascending: true });

      if (error) {
        console.error('[MarketplaceService] Error fetching expiring leads:', error);
        throw new SupabaseError(
          'Failed to fetch expiring leads',
          error.code,
          error.message,
          error.hint
        );
      }

      if (!data) {
        return [];
      }

      // Map and hide sensitive data
      return data.map((dbLead: MarketplaceLeadDB) => {
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

