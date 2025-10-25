/**
 * Activity Package Pricing Options Service
 * Handles ticket-only and ticket-with-transfer pricing options for activity packages
 */

import { createSupabaseBrowserClient } from './client';
import {
  TicketOnlyPricingOption,
  TicketWithTransferPricingOption,
  VehicleType,
} from '@/lib/types/activity-package';

// ============================================================================
// DATABASE INTERFACES
// ============================================================================

interface TicketOnlyPricingRow {
  id: string;
  package_id: string;
  option_name: string;
  description: string | null;
  adult_price: number;
  child_price: number;
  child_min_age: number;
  child_max_age: number;
  infant_price: number | null;
  infant_max_age: number | null;
  included_items: string[];
  excluded_items: string[];
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface TicketWithTransferPricingRow {
  id: string;
  package_id: string;
  option_name: string;
  description: string | null;
  vehicle_type: string;
  vehicle_name: string;
  max_capacity: number;
  vehicle_features: string[];
  adult_price: number;
  child_price: number;
  child_min_age: number;
  child_max_age: number;
  infant_price: number | null;
  infant_max_age: number | null;
  pickup_location: string | null;
  pickup_instructions: string | null;
  dropoff_location: string | null;
  dropoff_instructions: string | null;
  included_items: string[];
  excluded_items: string[];
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DATA TRANSFORMATION FUNCTIONS
// ============================================================================

function rowToTicketOnly(row: TicketOnlyPricingRow): TicketOnlyPricingOption {
  return {
    id: row.id,
    optionName: row.option_name,
    description: row.description ?? undefined,
    adultPrice: Number(row.adult_price),
    childPrice: Number(row.child_price),
    childMinAge: row.child_min_age,
    childMaxAge: row.child_max_age,
    infantPrice: row.infant_price ? Number(row.infant_price) : undefined,
    infantMaxAge: row.infant_max_age ?? undefined,
    includedItems: row.included_items || [],
    excludedItems: row.excluded_items || [],
    isActive: row.is_active,
    isFeatured: row.is_featured,
    displayOrder: row.display_order,
  };
}

function ticketOnlyToRow(option: Partial<TicketOnlyPricingOption>, packageId: string): Partial<TicketOnlyPricingRow> {
  const row: Partial<TicketOnlyPricingRow> = {
    package_id: packageId,
  };

  if (option.optionName !== undefined) row.option_name = option.optionName;
  if (option.description !== undefined) row.description = option.description;
  if (option.adultPrice !== undefined) row.adult_price = option.adultPrice;
  if (option.childPrice !== undefined) row.child_price = option.childPrice;
  if (option.childMinAge !== undefined) row.child_min_age = option.childMinAge;
  if (option.childMaxAge !== undefined) row.child_max_age = option.childMaxAge;
  if (option.infantPrice !== undefined) row.infant_price = option.infantPrice;
  if (option.infantMaxAge !== undefined) row.infant_max_age = option.infantMaxAge;
  if (option.includedItems !== undefined) row.included_items = option.includedItems;
  if (option.excludedItems !== undefined) row.excluded_items = option.excludedItems;
  if (option.isActive !== undefined) row.is_active = option.isActive;
  if (option.isFeatured !== undefined) row.is_featured = option.isFeatured;
  if (option.displayOrder !== undefined) row.display_order = option.displayOrder;

  return row;
}

function rowToTicketTransfer(row: TicketWithTransferPricingRow): TicketWithTransferPricingOption {
  return {
    id: row.id,
    optionName: row.option_name,
    description: row.description ?? undefined,
    vehicleType: row.vehicle_type as VehicleType,
    vehicleName: row.vehicle_name,
    maxCapacity: row.max_capacity,
    vehicleFeatures: row.vehicle_features || [],
    adultPrice: Number(row.adult_price),
    childPrice: Number(row.child_price),
    childMinAge: row.child_min_age,
    childMaxAge: row.child_max_age,
    infantPrice: row.infant_price ? Number(row.infant_price) : undefined,
    infantMaxAge: row.infant_max_age ?? undefined,
    pickupLocation: row.pickup_location ?? undefined,
    pickupInstructions: row.pickup_instructions ?? undefined,
    dropoffLocation: row.dropoff_location ?? undefined,
    dropoffInstructions: row.dropoff_instructions ?? undefined,
    includedItems: row.included_items || [],
    excludedItems: row.excluded_items || [],
    isActive: row.is_active,
    isFeatured: row.is_featured,
    displayOrder: row.display_order,
  };
}

function ticketTransferToRow(option: Partial<TicketWithTransferPricingOption>, packageId: string): Partial<TicketWithTransferPricingRow> {
  const row: Partial<TicketWithTransferPricingRow> = {
    package_id: packageId,
  };

  if (option.optionName !== undefined) row.option_name = option.optionName;
  if (option.description !== undefined) row.description = option.description;
  if (option.vehicleType !== undefined) row.vehicle_type = option.vehicleType;
  if (option.vehicleName !== undefined) row.vehicle_name = option.vehicleName;
  if (option.maxCapacity !== undefined) row.max_capacity = option.maxCapacity;
  if (option.vehicleFeatures !== undefined) row.vehicle_features = option.vehicleFeatures;
  if (option.adultPrice !== undefined) row.adult_price = option.adultPrice;
  if (option.childPrice !== undefined) row.child_price = option.childPrice;
  if (option.childMinAge !== undefined) row.child_min_age = option.childMinAge;
  if (option.childMaxAge !== undefined) row.child_max_age = option.childMaxAge;
  if (option.infantPrice !== undefined) row.infant_price = option.infantPrice;
  if (option.infantMaxAge !== undefined) row.infant_max_age = option.infantMaxAge;
  if (option.pickupLocation !== undefined) row.pickup_location = option.pickupLocation;
  if (option.pickupInstructions !== undefined) row.pickup_instructions = option.pickupInstructions;
  if (option.dropoffLocation !== undefined) row.dropoff_location = option.dropoffLocation;
  if (option.dropoffInstructions !== undefined) row.dropoff_instructions = option.dropoffInstructions;
  if (option.includedItems !== undefined) row.included_items = option.includedItems;
  if (option.excludedItems !== undefined) row.excluded_items = option.excludedItems;
  if (option.isActive !== undefined) row.is_active = option.isActive;
  if (option.isFeatured !== undefined) row.is_featured = option.isFeatured;
  if (option.displayOrder !== undefined) row.display_order = option.displayOrder;

  return row;
}

// ============================================================================
// TICKET ONLY PRICING OPERATIONS
// ============================================================================

/**
 * Get all ticket-only pricing options for a package
 */
export async function getTicketOnlyPricingOptions(packageId: string): Promise<TicketOnlyPricingOption[]> {
  const supabase = createSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .from('activity_ticket_only_pricing')
    .select('*')
    .eq('package_id', packageId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching ticket-only pricing options:', error);
    throw error;
  }

  return (data || []).map(rowToTicketOnly);
}

/**
 * Create a new ticket-only pricing option
 */
export async function createTicketOnlyPricingOption(
  packageId: string,
  option: Omit<TicketOnlyPricingOption, 'id'>
): Promise<TicketOnlyPricingOption> {
  const supabase = createSupabaseBrowserClient();
  const row = ticketOnlyToRow(option, packageId) as any;

  const { data, error } = await supabase
    .from('activity_ticket_only_pricing')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error creating ticket-only pricing option:', error);
    throw error;
  }

  return rowToTicketOnly(data);
}

/**
 * Update a ticket-only pricing option
 */
export async function updateTicketOnlyPricingOption(
  optionId: string,
  packageId: string,
  updates: Partial<TicketOnlyPricingOption>
): Promise<TicketOnlyPricingOption> {
  const supabase = createSupabaseBrowserClient();
  const row = ticketOnlyToRow(updates, packageId) as any;

  const { data, error } = await supabase
    .from('activity_ticket_only_pricing')
    .update(row)
    .eq('id', optionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating ticket-only pricing option:', error);
    throw error;
  }

  return rowToTicketOnly(data);
}

/**
 * Delete a ticket-only pricing option
 */
export async function deleteTicketOnlyPricingOption(optionId: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  
  const { error } = await supabase
    .from('activity_ticket_only_pricing')
    .delete()
    .eq('id', optionId);

  if (error) {
    console.error('Error deleting ticket-only pricing option:', error);
    throw error;
  }
}

/**
 * Bulk upsert ticket-only pricing options
 */
export async function upsertTicketOnlyPricingOptions(
  packageId: string,
  options: TicketOnlyPricingOption[]
): Promise<TicketOnlyPricingOption[]> {
  const supabase = createSupabaseBrowserClient();
  
  // First, get existing options
  const existing = await getTicketOnlyPricingOptions(packageId);
  const existingIds = existing.map(opt => opt.id);

  // Delete options that are no longer in the list
  const optionIds = options.map(opt => opt.id).filter(id => id);
  const toDelete = existingIds.filter(id => !optionIds.includes(id));
  
  if (toDelete.length > 0) {
    await supabase
      .from('activity_ticket_only_pricing')
      .delete()
      .in('id', toDelete);
  }

  // Upsert remaining options
  const results: TicketOnlyPricingOption[] = [];
  
  for (const option of options) {
    if (option.id && existingIds.includes(option.id)) {
      // Update existing
      const updated = await updateTicketOnlyPricingOption(option.id, packageId, option);
      results.push(updated);
    } else {
      // Create new
      const { id, ...optionData } = option;
      const created = await createTicketOnlyPricingOption(packageId, optionData);
      results.push(created);
    }
  }

  return results;
}

// ============================================================================
// TICKET WITH TRANSFER PRICING OPERATIONS
// ============================================================================

/**
 * Get all ticket-with-transfer pricing options for a package
 */
export async function getTicketWithTransferPricingOptions(packageId: string): Promise<TicketWithTransferPricingOption[]> {
  const supabase = createSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .from('activity_ticket_with_transfer_pricing')
    .select('*')
    .eq('package_id', packageId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching ticket-with-transfer pricing options:', error);
    throw error;
  }

  return (data || []).map(rowToTicketTransfer);
}

/**
 * Create a new ticket-with-transfer pricing option
 */
export async function createTicketWithTransferPricingOption(
  packageId: string,
  option: Omit<TicketWithTransferPricingOption, 'id'>
): Promise<TicketWithTransferPricingOption> {
  const supabase = createSupabaseBrowserClient();
  const row = ticketTransferToRow(option, packageId) as any;

  const { data, error } = await supabase
    .from('activity_ticket_with_transfer_pricing')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error creating ticket-with-transfer pricing option:', error);
    throw error;
  }

  return rowToTicketTransfer(data);
}

/**
 * Update a ticket-with-transfer pricing option
 */
export async function updateTicketWithTransferPricingOption(
  optionId: string,
  packageId: string,
  updates: Partial<TicketWithTransferPricingOption>
): Promise<TicketWithTransferPricingOption> {
  const supabase = createSupabaseBrowserClient();
  const row = ticketTransferToRow(updates, packageId) as any;

  const { data, error } = await supabase
    .from('activity_ticket_with_transfer_pricing')
    .update(row)
    .eq('id', optionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating ticket-with-transfer pricing option:', error);
    throw error;
  }

  return rowToTicketTransfer(data);
}

/**
 * Delete a ticket-with-transfer pricing option
 */
export async function deleteTicketWithTransferPricingOption(optionId: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  
  const { error } = await supabase
    .from('activity_ticket_with_transfer_pricing')
    .delete()
    .eq('id', optionId);

  if (error) {
    console.error('Error deleting ticket-with-transfer pricing option:', error);
    throw error;
  }
}

/**
 * Bulk upsert ticket-with-transfer pricing options
 */
export async function upsertTicketWithTransferPricingOptions(
  packageId: string,
  options: TicketWithTransferPricingOption[]
): Promise<TicketWithTransferPricingOption[]> {
  const supabase = createSupabaseBrowserClient();
  
  // First, get existing options
  const existing = await getTicketWithTransferPricingOptions(packageId);
  const existingIds = existing.map(opt => opt.id);

  // Delete options that are no longer in the list
  const optionIds = options.map(opt => opt.id).filter(id => id);
  const toDelete = existingIds.filter(id => !optionIds.includes(id));
  
  if (toDelete.length > 0) {
    await supabase
      .from('activity_ticket_with_transfer_pricing')
      .delete()
      .in('id', toDelete);
  }

  // Upsert remaining options
  const results: TicketWithTransferPricingOption[] = [];
  
  for (const option of options) {
    if (option.id && existingIds.includes(option.id)) {
      // Update existing
      const updated = await updateTicketWithTransferPricingOption(option.id, packageId, option);
      results.push(updated);
    } else {
      // Create new
      const { id, ...optionData } = option;
      const created = await createTicketWithTransferPricingOption(packageId, optionData);
      results.push(created);
    }
  }

  return results;
}

// ============================================================================
// COMBINED OPERATIONS
// ============================================================================

/**
 * Get all pricing options for a package
 */
export async function getAllPricingOptions(packageId: string) {
  const [ticketOnly, ticketWithTransfer] = await Promise.all([
    getTicketOnlyPricingOptions(packageId),
    getTicketWithTransferPricingOptions(packageId),
  ]);

  return {
    ticketOnlyOptions: ticketOnly,
    ticketWithTransferOptions: ticketWithTransfer,
  };
}

/**
 * Bulk save all pricing options for a package
 */
export async function savePricingOptions(
  packageId: string,
  ticketOnly: TicketOnlyPricingOption[],
  ticketWithTransfer: TicketWithTransferPricingOption[]
) {
  const [savedTicketOnly, savedTicketTransfer] = await Promise.all([
    upsertTicketOnlyPricingOptions(packageId, ticketOnly),
    upsertTicketWithTransferPricingOptions(packageId, ticketWithTransfer),
  ]);

  return {
    ticketOnlyOptions: savedTicketOnly,
    ticketWithTransferOptions: savedTicketTransfer,
  };
}

/**
 * Get active pricing options for public display
 */
export async function getActivePricingOptions(packageId: string) {
  const all = await getAllPricingOptions(packageId);
  
  return {
    ticketOnlyOptions: all.ticketOnlyOptions.filter(opt => opt.isActive),
    ticketWithTransferOptions: all.ticketWithTransferOptions.filter(opt => opt.isActive),
  };
}

