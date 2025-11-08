/**
 * Query Service
 * Service layer for itinerary query operations
 * Handles all database interactions for query form data
 */

import { createClient } from '@/lib/supabase/client';

export interface Destination {
  city: string;
  nights: number;
}

export interface Travelers {
  rooms: number;
  adults: number;
  children: number;
  infants: number;
}

export interface ItineraryQuery {
  id: string;
  lead_id: string;
  agent_id: string;
  destinations: Destination[];
  leaving_from: string | null;
  nationality: string | null;
  leaving_on: string | null;
  travelers: Travelers | null;
  star_rating: number | null;
  add_transfers: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateQueryData {
  lead_id: string;
  agent_id: string;
  destinations: Destination[];
  leaving_from?: string;
  nationality?: string;
  leaving_on?: string;
  travelers?: Travelers;
  star_rating?: number;
  add_transfers?: boolean;
}

export interface UpdateQueryData {
  destinations?: Destination[];
  leaving_from?: string;
  nationality?: string;
  leaving_on?: string;
  travelers?: Travelers;
  star_rating?: number;
  add_transfers?: boolean;
}

export class QueryService {
  private supabase = createClient();

  /**
   * Get query for a lead
   * @param leadId - Lead ID
   * @returns Query data or null if not found
   */
  async getQueryByLeadId(leadId: string): Promise<ItineraryQuery | null> {
    const { data, error } = await this.supabase
      .from('itinerary_queries' as any)
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching query:', error);
      throw error;
    }

    if (!data) return null;

    return this.mapQueryFromDB(data);
  }

  /**
   * Create a new query
   * @param queryData - Query data to create
   * @returns Created query
   */
  async createQuery(queryData: CreateQueryData): Promise<ItineraryQuery> {
    const { data, error } = await this.supabase
      .from('itinerary_queries' as any)
      .insert({
        lead_id: queryData.lead_id,
        agent_id: queryData.agent_id,
        destinations: queryData.destinations || [],
        leaving_from: queryData.leaving_from || null,
        nationality: queryData.nationality || null,
        leaving_on: queryData.leaving_on || null,
        travelers: queryData.travelers || null,
        star_rating: queryData.star_rating || null,
        add_transfers: queryData.add_transfers || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating query:', error);
      throw error;
    }

    return this.mapQueryFromDB(data);
  }

  /**
   * Update an existing query
   * @param queryId - Query ID
   * @param updateData - Data to update
   * @returns Updated query
   */
  async updateQuery(queryId: string, updateData: UpdateQueryData): Promise<ItineraryQuery> {
    const updatePayload: any = {};

    if (updateData.destinations !== undefined) {
      updatePayload.destinations = updateData.destinations;
    }
    if (updateData.leaving_from !== undefined) {
      updatePayload.leaving_from = updateData.leaving_from || null;
    }
    if (updateData.nationality !== undefined) {
      updatePayload.nationality = updateData.nationality || null;
    }
    if (updateData.leaving_on !== undefined) {
      updatePayload.leaving_on = updateData.leaving_on || null;
    }
    if (updateData.travelers !== undefined) {
      updatePayload.travelers = updateData.travelers || null;
    }
    if (updateData.star_rating !== undefined) {
      updatePayload.star_rating = updateData.star_rating || null;
    }
    if (updateData.add_transfers !== undefined) {
      updatePayload.add_transfers = updateData.add_transfers;
    }

    const { data, error } = await this.supabase
      .from('itinerary_queries' as any)
      .update(updatePayload)
      .eq('id', queryId)
      .select()
      .single();

    if (error) {
      console.error('Error updating query:', error);
      throw error;
    }

    return this.mapQueryFromDB(data);
  }

  /**
   * Upsert query (create or update)
   * @param queryData - Query data
   * @returns Query data
   */
  async upsertQuery(queryData: CreateQueryData): Promise<ItineraryQuery> {
    // First check if query exists
    const existing = await this.getQueryByLeadId(queryData.lead_id);

    if (existing) {
      // Update existing
      return this.updateQuery(existing.id, {
        destinations: queryData.destinations,
        leaving_from: queryData.leaving_from,
        nationality: queryData.nationality,
        leaving_on: queryData.leaving_on,
        travelers: queryData.travelers,
        star_rating: queryData.star_rating,
        add_transfers: queryData.add_transfers,
      });
    } else {
      // Create new
      return this.createQuery(queryData);
    }
  }

  /**
   * Delete a query
   * @param queryId - Query ID
   */
  async deleteQuery(queryId: string): Promise<void> {
    const { error } = await this.supabase
      .from('itinerary_queries' as any)
      .delete()
      .eq('id', queryId);

    if (error) {
      console.error('Error deleting query:', error);
      throw error;
    }
  }

  /**
   * Map database row to ItineraryQuery
   */
  private mapQueryFromDB(row: any): ItineraryQuery {
    return {
      id: row.id,
      lead_id: row.lead_id,
      agent_id: row.agent_id,
      destinations: (row.destinations || []) as Destination[],
      leaving_from: row.leaving_from,
      nationality: row.nationality,
      leaving_on: row.leaving_on,
      travelers: row.travelers as Travelers | null,
      star_rating: row.star_rating,
      add_transfers: row.add_transfers || false,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

// Export singleton instance
export const queryService = new QueryService();

