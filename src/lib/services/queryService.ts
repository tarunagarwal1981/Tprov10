/**
 * Query Service
 * Service layer for itinerary query operations
 * Handles all database interactions for query form data
 * 
 * MIGRATED: Now uses PostgreSQL directly via AWS RDS
 */

// Use Lambda database service for reliable VPC access
import { query, queryOne } from '@/lib/aws/lambda-database';

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
  /**
   * Get query by ID
   * @param queryId - Query ID
   * @returns Query data or null if not found
   */
  async getQueryById(queryId: string): Promise<ItineraryQuery | null> {
    try {
      const row = await queryOne<{
        id: string;
        lead_id: string;
        agent_id: string;
        destinations: any;
        leaving_from: string | null;
        nationality: string | null;
        leaving_on: string | null;
        travelers: any;
        star_rating: number | null;
        add_transfers: boolean;
        created_at: string;
        updated_at: string;
      }>(
        'SELECT * FROM itinerary_queries WHERE id = $1 LIMIT 1',
        [queryId]
      );

      if (!row) return null;

      return this.mapQueryFromDB(row);
    } catch (error) {
      console.error('Error fetching query:', error);
      throw error;
    }
  }

  /**
   * Get query for a lead
   * @param leadId - Lead ID
   * @returns Query data or null if not found
   */
  async getQueryByLeadId(leadId: string): Promise<ItineraryQuery | null> {
    try {
      const row = await queryOne<{
        id: string;
        lead_id: string;
        agent_id: string;
        destinations: any;
        leaving_from: string | null;
        nationality: string | null;
        leaving_on: string | null;
        travelers: any;
        star_rating: number | null;
        add_transfers: boolean;
        created_at: string;
        updated_at: string;
      }>(
        'SELECT * FROM itinerary_queries WHERE lead_id = $1 LIMIT 1',
        [leadId]
      );

      if (!row) return null;

      return this.mapQueryFromDB(row);
    } catch (error) {
      console.error('Error fetching query:', error);
      throw error;
    }
  }

  /**
   * Create a new query
   * @param queryData - Query data to create
   * @returns Created query
   */
  async createQuery(queryData: CreateQueryData): Promise<ItineraryQuery> {
    try {
      const result = await query<{
        id: string;
        lead_id: string;
        agent_id: string;
        destinations: any;
        leaving_from: string | null;
        nationality: string | null;
        leaving_on: string | null;
        travelers: any;
        star_rating: number | null;
        add_transfers: boolean;
        created_at: string;
        updated_at: string;
      }>(
        `INSERT INTO itinerary_queries (
          lead_id, agent_id, destinations, leaving_from, nationality,
          leaving_on, travelers, star_rating, add_transfers
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          queryData.lead_id,
          queryData.agent_id,
          JSON.stringify(queryData.destinations || []),
          queryData.leaving_from || null,
          queryData.nationality || null,
          queryData.leaving_on || null,
          queryData.travelers ? JSON.stringify(queryData.travelers) : null,
          queryData.star_rating || null,
          queryData.add_transfers || false,
        ]
      );

      if (!result.rows || result.rows.length === 0) {
        throw new Error('Failed to create query - no data returned');
      }

      const createdRow = result.rows[0];
      if (!createdRow) {
        throw new Error('Failed to create query - no data returned');
      }

      return this.mapQueryFromDB(createdRow);
    } catch (error) {
      console.error('Error creating query:', error);
      throw error;
    }
  }

  /**
   * Update an existing query
   * @param queryId - Query ID
   * @param updateData - Data to update
   * @returns Updated query
   */
  async updateQuery(queryId: string, updateData: UpdateQueryData): Promise<ItineraryQuery> {
    try {
      // First verify the query exists
      const existing = await queryOne<{
        id: string;
        lead_id: string;
        agent_id: string;
        destinations: any;
        leaving_from: string | null;
        nationality: string | null;
        leaving_on: string | null;
        travelers: any;
        star_rating: number | null;
        add_transfers: boolean;
        created_at: string;
        updated_at: string;
      }>('SELECT * FROM itinerary_queries WHERE id = $1 LIMIT 1', [queryId]);
      
      if (!existing) {
        throw new Error('Query not found');
      }

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updateData.destinations !== undefined) {
        updates.push(`destinations = $${paramIndex}`);
        values.push(JSON.stringify(updateData.destinations));
        paramIndex++;
      }
      if (updateData.leaving_from !== undefined) {
        updates.push(`leaving_from = $${paramIndex}`);
        values.push(updateData.leaving_from || null);
        paramIndex++;
      }
      if (updateData.nationality !== undefined) {
        updates.push(`nationality = $${paramIndex}`);
        values.push(updateData.nationality || null);
        paramIndex++;
      }
      if (updateData.leaving_on !== undefined) {
        updates.push(`leaving_on = $${paramIndex}`);
        values.push(updateData.leaving_on || null);
        paramIndex++;
      }
      if (updateData.travelers !== undefined) {
        updates.push(`travelers = $${paramIndex}`);
        values.push(updateData.travelers ? JSON.stringify(updateData.travelers) : null);
        paramIndex++;
      }
      if (updateData.star_rating !== undefined) {
        updates.push(`star_rating = $${paramIndex}`);
        values.push(updateData.star_rating || null);
        paramIndex++;
      }
      if (updateData.add_transfers !== undefined) {
        updates.push(`add_transfers = $${paramIndex}`);
        values.push(updateData.add_transfers);
        paramIndex++;
      }

      if (updates.length === 0) {
        // No updates, just return existing query
        return this.mapQueryFromDB(existing);
      }

      // Add updated_at
      updates.push(`updated_at = NOW()`);
      values.push(queryId);

      const sql = `
        UPDATE itinerary_queries
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await query<{
        id: string;
        lead_id: string;
        agent_id: string;
        destinations: any;
        leaving_from: string | null;
        nationality: string | null;
        leaving_on: string | null;
        travelers: any;
        star_rating: number | null;
        add_transfers: boolean;
        created_at: string;
        updated_at: string;
      }>(sql, values);

      if (!result.rows || result.rows.length === 0) {
        // If update failed, return the existing query we fetched earlier
        console.warn('Update query returned no rows, returning existing query');
        return this.mapQueryFromDB(existing);
      }

      const updatedRow = result.rows[0];
      if (!updatedRow) {
        // If no updated row, return the existing query we fetched earlier
        console.warn('Update query returned no updated row, returning existing query');
        return this.mapQueryFromDB(existing);
      }

      return this.mapQueryFromDB(updatedRow);
    } catch (error) {
      console.error('Error updating query:', error);
      throw error;
    }
  }

  /**
   * Upsert query (create or update)
   * @param queryData - Query data
   * @returns Query data
   */
  async upsertQuery(queryData: CreateQueryData): Promise<ItineraryQuery> {
    try {
      // First check if query exists
      const existing = await this.getQueryByLeadId(queryData.lead_id);

      if (existing) {
        // Update existing
        try {
          return await this.updateQuery(existing.id, {
            destinations: queryData.destinations,
            leaving_from: queryData.leaving_from,
            nationality: queryData.nationality,
            leaving_on: queryData.leaving_on,
            travelers: queryData.travelers,
            star_rating: queryData.star_rating,
            add_transfers: queryData.add_transfers,
          });
        } catch (updateError) {
          // If update fails (e.g., query was deleted), create a new one
          console.warn('Update query failed, creating new query:', updateError);
          return this.createQuery(queryData);
        }
      } else {
        // Create new
        return this.createQuery(queryData);
      }
    } catch (error) {
      console.error('Error in upsertQuery:', error);
      throw error;
    }
  }

  /**
   * Delete a query
   * @param queryId - Query ID
   */
  async deleteQuery(queryId: string): Promise<void> {
    try {
      await query('DELETE FROM itinerary_queries WHERE id = $1', [queryId]);
    } catch (error) {
      console.error('Error deleting query:', error);
      throw error;
    }
  }

  /**
   * Map database row to ItineraryQuery
   */
  private mapQueryFromDB(row: {
    id: string;
    lead_id: string;
    agent_id: string;
    destinations: any;
    leaving_from: string | null;
    nationality: string | null;
    leaving_on: string | null;
    travelers: any;
    star_rating: number | null;
    add_transfers: boolean;
    created_at: string;
    updated_at: string;
  }): ItineraryQuery {
    // Parse JSON fields if they're strings
    let destinations: Destination[] = [];
    if (row.destinations) {
      destinations = typeof row.destinations === 'string' 
        ? JSON.parse(row.destinations) 
        : row.destinations;
    }

    let travelers: Travelers | null = null;
    if (row.travelers) {
      travelers = typeof row.travelers === 'string'
        ? JSON.parse(row.travelers)
        : row.travelers;
    }

    return {
      id: row.id,
      lead_id: row.lead_id,
      agent_id: row.agent_id,
      destinations,
      leaving_from: row.leaving_from,
      nationality: row.nationality,
      leaving_on: row.leaving_on,
      travelers,
      star_rating: row.star_rating,
      add_transfers: row.add_transfers || false,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

// Export singleton instance
export const queryService = new QueryService();

