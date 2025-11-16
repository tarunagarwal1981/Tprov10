// ============================================================================
// ACTIVITY PACKAGE VEHICLES SERVICE
// ============================================================================
// This service handles CRUD operations for vehicles in private transfer packages

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { PackageVehicle } from '@/components/packages/forms/tabs/ActivityPricingOptionsTab';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface VehicleRow {
  id: string;
  pricing_package_id: string;
  vehicle_type: string;
  max_capacity: number;
  vehicle_category: string;
  price: number;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DATA TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Convert database row to TypeScript object
 */
function rowToVehicle(row: VehicleRow): PackageVehicle {
  return {
    id: row.id,
    vehicleType: row.vehicle_type,
    maxCapacity: row.max_capacity,
    vehicleCategory: row.vehicle_category,
    price: row.price,
    description: row.description || undefined,
  };
}

/**
 * Convert TypeScript object to database row format
 */
function vehicleToRow(
  vehicle: PackageVehicle,
  pricingPackageId: string,
  displayOrder: number = 0
): Partial<VehicleRow> {
  return {
    pricing_package_id: pricingPackageId,
    vehicle_type: vehicle.vehicleType,
    max_capacity: vehicle.maxCapacity,
    vehicle_category: vehicle.vehicleCategory,
    price: vehicle.price || 0,
    description: vehicle.description || null,
    display_order: displayOrder,
  };
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get all vehicles for a pricing package
 */
export async function getVehiclesForPricingPackage(
  pricingPackageId: string
): Promise<PackageVehicle[]> {
  const supabase = createSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .from('activity_package_vehicles' as any)
    .select('*')
    .eq('pricing_package_id', pricingPackageId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }

  return ((data || []) as any[]).map(rowToVehicle);
}

/**
 * Create a new vehicle
 */
export async function createVehicle(
  pricingPackageId: string,
  vehicle: PackageVehicle,
  displayOrder: number = 0
): Promise<PackageVehicle> {
  const supabase = createSupabaseBrowserClient();
  
  const row = vehicleToRow(vehicle, pricingPackageId, displayOrder);
  
  const { data, error } = await supabase
    .from('activity_package_vehicles' as any)
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error creating vehicle:', error);
    throw error;
  }

  return rowToVehicle(data as any);
}

/**
 * Update an existing vehicle
 */
export async function updateVehicle(
  id: string,
  pricingPackageId: string,
  updates: Partial<PackageVehicle>
): Promise<PackageVehicle> {
  const supabase = createSupabaseBrowserClient();
  
  const row = vehicleToRow(
    { ...updates, id } as PackageVehicle,
    pricingPackageId
  );
  
  // Remove id from update payload
  const { id: _, ...updateData } = row as any;
  
  const { data, error } = await supabase
    .from('activity_package_vehicles' as any)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }

  return rowToVehicle(data as any);
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  
  const { error } = await supabase
    .from('activity_package_vehicles' as any)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
}

/**
 * Delete all vehicles for a pricing package
 */
export async function deleteVehiclesForPricingPackage(
  pricingPackageId: string
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  
  const { error } = await supabase
    .from('activity_package_vehicles' as any)
    .delete()
    .eq('pricing_package_id', pricingPackageId);

  if (error) {
    console.error('Error deleting vehicles for pricing package:', error);
    throw error;
  }
}

/**
 * Bulk upsert vehicles for a pricing package
 * Creates new vehicles, updates existing ones, and deletes removed ones
 */
export async function saveVehiclesForPricingPackage(
  pricingPackageId: string,
  vehicles: PackageVehicle[]
): Promise<PackageVehicle[]> {
  const supabase = createSupabaseBrowserClient();
  
  // Get existing vehicles
  const existing = await getVehiclesForPricingPackage(pricingPackageId);
  const existingIds = new Set(existing.map(v => v.id));
  
  const results: PackageVehicle[] = [];
  
  // Process each vehicle
  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    if (!vehicle) continue; // Skip if vehicle is undefined
    // Determine if this is an update or create based on whether ID exists in database
    const isUpdate = vehicle.id && !vehicle.id.startsWith('vehicle-') && existingIds.has(vehicle.id);
    
    if (isUpdate) {
      // Update existing
      const updated = await updateVehicle(vehicle.id, pricingPackageId, vehicle);
      results.push(updated);
      existingIds.delete(vehicle.id);
    } else {
      // Create new
      const row = vehicleToRow(vehicle, pricingPackageId, i);
      const { data, error } = await supabase
        .from('activity_package_vehicles' as any)
        .insert(row)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating vehicle:', error);
        throw error;
      }
      
      results.push(rowToVehicle(data as any));
    }
  }
  
  // Delete vehicles that were removed
  for (const idToDelete of existingIds) {
    await deleteVehicle(idToDelete);
  }
  
  return results;
}

/**
 * Update display order of vehicles
 */
export async function updateVehiclesOrder(
  vehicles: { id: string; displayOrder: number }[]
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  
  for (const vehicle of vehicles) {
    const { error } = await supabase
      .from('activity_package_vehicles' as any)
      .update({ display_order: vehicle.displayOrder })
      .eq('id', vehicle.id);
    
    if (error) {
      console.error('Error updating vehicle order:', error);
      throw error;
    }
  }
}

