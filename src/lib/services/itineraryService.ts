import { createClient } from '@/lib/supabase/client';

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
  private supabase = createClient();

  // Get all itineraries for a lead
  async getLeadItineraries(leadId: string): Promise<Itinerary[]> {
    const { data, error } = await this.supabase
      .from('itineraries' as any)
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as Itinerary[];
  }

  // Get itinerary with all details
  async getItineraryDetails(itineraryId: string): Promise<{
    itinerary: Itinerary;
    days: ItineraryDay[];
    items: ItineraryItem[];
  }> {
    const { data: itinerary, error: itineraryError } = await this.supabase
      .from('itineraries' as any)
      .select('*')
      .eq('id', itineraryId)
      .single();

    if (itineraryError) throw itineraryError;

    const itineraryTyped = itinerary as unknown as Itinerary;

    const { data: days, error: daysError } = await this.supabase
      .from('itinerary_days' as any)
      .select('*')
      .eq('itinerary_id', itineraryId)
      .order('day_number', { ascending: true });

    if (daysError) throw daysError;

    const daysTyped = (days || []) as unknown as ItineraryDay[];

    const { data: items, error: itemsError } = await this.supabase
      .from('itinerary_items' as any)
      .select('*')
      .eq('itinerary_id', itineraryId)
      .order('display_order', { ascending: true });

    if (itemsError) throw itemsError;

    return {
      itinerary: itineraryTyped,
      days: daysTyped,
      items: (items || []) as unknown as ItineraryItem[],
    };
  }

  // Get lead details for itinerary
  async getLeadDetails(leadId: string) {
    const { data, error } = await this.supabase
      .from('leads' as any)
      .select('*')
      .eq('id', leadId)
      .single();

    if (error) throw error;
    return data as unknown as any;
  }

  // Get consolidated operator information
  async getOperatorsInfo(itineraryId: string): Promise<OperatorInfo[]> {
    const { data: items, error } = await this.supabase
      .from('itinerary_items' as any)
      .select('operator_id')
      .eq('itinerary_id', itineraryId);

    if (error) throw error;

    const uniqueOperatorIds = [...new Set((items || []).map(item => item.operator_id))];

    // Get all items with operator info
    const { data: allItems, error: itemsError } = await this.supabase
      .from('itinerary_items' as any)
      .select('*')
      .eq('itinerary_id', itineraryId);

    if (itemsError) throw itemsError;

    // Get operator profiles - try profiles table, fallback to auth.users
    let profileMap = new Map<string, { name: string; email: string | null; phone: string | null }>();
    
    try {
      const { data: profiles } = await this.supabase
        .from('profiles' as any)
        .select('id, company_name, email, phone')
        .in('id', uniqueOperatorIds);

      if (profiles) {
        const profilesTyped = profiles as unknown as Array<{ id: string; company_name?: string; email?: string; phone?: string }>;
        profileMap = new Map(
          profilesTyped.map(p => [p.id, { 
            name: p.company_name || 'Unknown Operator', 
            email: p.email || null, 
            phone: p.phone || null 
          }])
        );
      }
    } catch (err) {
      // Profiles table might not exist, try to get from auth.users metadata
      console.warn('Profiles table not found, trying auth.users');
    }

    // Fill missing operators with defaults
    uniqueOperatorIds.forEach(id => {
      if (!profileMap.has(id)) {
        profileMap.set(id, { name: 'Unknown Operator', email: null, phone: null });
      }
    });

    // Group items by operator
    const operatorMap = new Map<string, ItineraryItem[]>();

    const allItemsTyped = (allItems || []) as unknown as ItineraryItem[];
    allItemsTyped.forEach((item: ItineraryItem) => {
      if (!operatorMap.has(item.operator_id)) {
        operatorMap.set(item.operator_id, []);
      }
      operatorMap.get(item.operator_id)!.push(item as ItineraryItem);
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
  }

  // Duplicate itinerary
  async duplicateItinerary(itineraryId: string, newName: string): Promise<Itinerary> {
    const { itinerary, days, items } = await this.getItineraryDetails(itineraryId);

    // Create new itinerary
    const { data: newItinerary, error: itineraryError } = await this.supabase
      .from('itineraries' as any)
      .insert({
        lead_id: itinerary.lead_id,
        agent_id: itinerary.agent_id,
        name: newName,
        status: 'draft',
        adults_count: itinerary.adults_count,
        children_count: itinerary.children_count,
        infants_count: itinerary.infants_count,
        start_date: itinerary.start_date,
        end_date: itinerary.end_date,
        total_price: 0,
        currency: itinerary.currency,
        lead_budget_min: itinerary.lead_budget_min,
        lead_budget_max: itinerary.lead_budget_max,
        notes: itinerary.notes,
      })
      .select()
      .single();

    if (itineraryError) throw itineraryError;

    const newItineraryTyped = newItinerary as unknown as Itinerary;

    // Duplicate days
    const dayIdMap = new Map<string, string>();
    
    for (const day of daysTyped) {
      const { data: newDay, error: dayError } = await this.supabase
        .from('itinerary_days' as any)
        .insert({
          itinerary_id: newItinerary.id,
          day_number: day.day_number,
          date: day.date,
          city_name: day.city_name,
          notes: day.notes,
          display_order: day.display_order,
        })
        .select()
        .single();

      if (dayError) throw dayError;
      const newDayTyped = newDay as unknown as ItineraryDay;
      dayIdMap.set(day.id, newDayTyped.id);
    }

    // Duplicate items
    const itemsTyped = items as unknown as ItineraryItem[];
    for (const item of itemsTyped) {
      const newDayId = item.day_id ? dayIdMap.get(item.day_id) || null : null;

      const { error: itemError } = await this.supabase
        .from('itinerary_items' as any)
        .insert({
          itinerary_id: newItinerary.id,
          day_id: newDayId,
          package_type: item.package_type,
          package_id: item.package_id,
          operator_id: item.operator_id,
          package_title: item.package_title,
          package_image_url: item.package_image_url,
          configuration: item.configuration,
          unit_price: item.unit_price,
          quantity: item.quantity,
          total_price: item.total_price,
          display_order: item.display_order,
          notes: item.notes,
        });

      if (itemError) throw itemError;
    }

    return newItineraryTyped;
  }

  // Update itinerary status
  async updateItineraryStatus(itineraryId: string, status: Itinerary['status']): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }

    const { error } = await this.supabase
      .from('itineraries' as any)
      .update(updateData)
      .eq('id', itineraryId);

    if (error) throw error;
  }
}

export const itineraryService = new ItineraryService();

