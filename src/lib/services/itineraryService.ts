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
  lead_id: string;
  agent_id: string;
  name: string;
  status: 'draft' | 'completed' | 'sent' | 'approved' | 'rejected';
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
  async getLeadItineraries(leadId: string): Promise<Itinerary[]> {
    try {
      const result = await query<Itinerary>(
        'SELECT * FROM itineraries WHERE lead_id = $1 ORDER BY created_at DESC',
        [leadId]
      );
      console.log('[ItineraryService] Fetched itineraries from DB:', result.rows.length);
      console.log('[ItineraryService] Itinerary total_price values:', result.rows.map((it: Itinerary) => ({
        id: it.id,
        name: it.name,
        total_price: it.total_price,
        total_price_type: typeof it.total_price,
        total_price_is_null: it.total_price === null,
        total_price_is_undefined: it.total_price === undefined,
      })));
      return result.rows;
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

      // Create new itinerary
      const newItineraryResult = await query<Itinerary>(
        `INSERT INTO itineraries (
          lead_id, agent_id, name, status, adults_count, children_count,
          infants_count, start_date, end_date, total_price, currency,
          lead_budget_min, lead_budget_max, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          itinerary.lead_id,
          itinerary.agent_id,
          newName,
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

