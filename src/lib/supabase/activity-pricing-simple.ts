// ============================================================================
// SIMPLIFIED ACTIVITY PRICING PACKAGES SERVICE
// ============================================================================
// This service handles CRUD operations for the simplified pricing package system

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ActivityPricingPackage } from '@/lib/types/activity-pricing-simple';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PricingPackageRow {
  id: string;
  package_id: string;
  package_name: string;
  description: string | null;
  adult_price: number;
  child_price: number;
  child_min_age: number;
  child_max_age: number;
  infant_price: number | null;
  infant_max_age: number | null;
  transfer_included: boolean;
  transfer_type: string | null;
  transfer_price_adult: number | null;
  transfer_price_child: number | null;
  transfer_price_infant: number | null;
  pickup_location: string | null;
  pickup_instructions: string | null;
  dropoff_location: string | null;
  dropoff_instructions: string | null;
  included_items: string[] | null;
  excluded_items: string[] | null;
  is_active: boolean;
  is_featured: boolean;
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
function rowToPricingPackage(row: PricingPackageRow): ActivityPricingPackage {
  return {
    id: row.id,
    packageId: row.package_id,
    packageName: row.package_name,
    description: row.description || undefined,
    adultPrice: Number(row.adult_price),
    childPrice: Number(row.child_price),
    childMinAge: row.child_min_age,
    childMaxAge: row.child_max_age,
    infantPrice: row.infant_price !== null ? Number(row.infant_price) : undefined,
    infantMaxAge: row.infant_max_age || undefined,
    transferIncluded: row.transfer_included,
    transferType: row.transfer_type as 'SHARED' | 'PRIVATE' | undefined,
    transferPriceAdult: row.transfer_price_adult !== null ? Number(row.transfer_price_adult) : undefined,
    transferPriceChild: row.transfer_price_child !== null ? Number(row.transfer_price_child) : undefined,
    transferPriceInfant: row.transfer_price_infant !== null ? Number(row.transfer_price_infant) : undefined,
    pickupLocation: row.pickup_location || undefined,
    pickupInstructions: row.pickup_instructions || undefined,
    dropoffLocation: row.dropoff_location || undefined,
    dropoffInstructions: row.dropoff_instructions || undefined,
    includedItems: row.included_items || [],
    excludedItems: row.excluded_items || undefined,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    displayOrder: row.display_order,
  };
}

/**
 * Convert TypeScript object to database row format
 */
function pricingPackageToRow(
  pkg: ActivityPricingPackage,
  packageId: string
): Partial<PricingPackageRow> {
  return {
    package_id: packageId,
    package_name: pkg.packageName,
    description: pkg.description || null,
    adult_price: pkg.adultPrice,
    child_price: pkg.childPrice,
    child_min_age: pkg.childMinAge,
    child_max_age: pkg.childMaxAge,
    infant_price: pkg.infantPrice ?? 0,
    infant_max_age: pkg.infantMaxAge ?? 2,
    transfer_included: pkg.transferIncluded,
    transfer_type: pkg.transferType || null,
    transfer_price_adult: pkg.transferPriceAdult ?? null,
    transfer_price_child: pkg.transferPriceChild ?? null,
    transfer_price_infant: pkg.transferPriceInfant ?? null,
    pickup_location: pkg.pickupLocation || null,
    pickup_instructions: pkg.pickupInstructions || null,
    dropoff_location: pkg.dropoffLocation || null,
    dropoff_instructions: pkg.dropoffInstructions || null,
    included_items: pkg.includedItems.length > 0 ? pkg.includedItems : null,
    excluded_items: pkg.excludedItems && pkg.excludedItems.length > 0 ? pkg.excludedItems : null,
    is_active: pkg.isActive,
    is_featured: pkg.isFeatured,
    display_order: pkg.displayOrder,
  };
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get all pricing packages for an activity package
 */
export async function getPricingPackages(
  packageId: string
): Promise<ActivityPricingPackage[]> {
  const supabase = createSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .from('activity_pricing_packages' as any)
    .select('*')
    .eq('package_id', packageId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching pricing packages:', error);
    throw error;
  }

  return ((data || []) as any[]).map(rowToPricingPackage);
}

/**
 * Get only active pricing packages (for public display)
 */
export async function getActivePricingPackages(
  packageId: string
): Promise<ActivityPricingPackage[]> {
  const supabase = createSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .from('activity_pricing_packages' as any)
    .select('*')
    .eq('package_id', packageId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching active pricing packages:', error);
    throw error;
  }

  return ((data || []) as any[]).map(rowToPricingPackage);
}

/**
 * Create a new pricing package
 */
export async function createPricingPackage(
  packageId: string,
  pkg: ActivityPricingPackage
): Promise<ActivityPricingPackage> {
  const supabase = createSupabaseBrowserClient();
  
  const row = pricingPackageToRow(pkg, packageId);
  
  const { data, error } = await supabase
    .from('activity_pricing_packages' as any)
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error creating pricing package:', error);
    throw error;
  }

  return rowToPricingPackage(data as any);
}

/**
 * Update an existing pricing package
 */
export async function updatePricingPackage(
  id: string,
  packageId: string,
  updates: Partial<ActivityPricingPackage>
): Promise<ActivityPricingPackage> {
  const supabase = createSupabaseBrowserClient();
  
  const row = pricingPackageToRow(
    { ...updates, id } as ActivityPricingPackage,
    packageId
  );
  
  const { data, error } = await supabase
    .from('activity_pricing_packages' as any)
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating pricing package:', error);
    throw error;
  }

  return rowToPricingPackage(data as any);
}

/**
 * Delete a pricing package
 */
export async function deletePricingPackage(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  
  const { error } = await supabase
    .from('activity_pricing_packages' as any)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting pricing package:', error);
    throw error;
  }
}

/**
 * Bulk upsert pricing packages
 * Creates new packages, updates existing ones, and deletes removed ones
 */
export async function savePricingPackages(
  packageId: string,
  packages: ActivityPricingPackage[]
): Promise<ActivityPricingPackage[]> {
  const supabase = createSupabaseBrowserClient();
  
  // Get existing packages
  const existing = await getPricingPackages(packageId);
  const existingIds = new Set(existing.map(p => p.id));
  
  const results: ActivityPricingPackage[] = [];
  
  // Process each package
  for (const pkg of packages) {
    // Determine if this is an update or create
    const isUpdate = pkg.id && !pkg.id.startsWith('temp-') && existingIds.has(pkg.id);
    
    if (isUpdate) {
      // Update existing
      const updated = await updatePricingPackage(pkg.id, packageId, pkg);
      results.push(updated);
      existingIds.delete(pkg.id);
    } else {
      // Create new
      const row = pricingPackageToRow(pkg, packageId);
      const { data, error } = await supabase
        .from('activity_pricing_packages' as any)
        .insert(row)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating pricing package:', error);
        throw error;
      }
      
      results.push(rowToPricingPackage(data as any));
    }
  }
  
  // Delete packages that were removed
  for (const idToDelete of existingIds) {
    await deletePricingPackage(idToDelete);
  }
  
  return results;
}

/**
 * Save pricing packages with their vehicles
 * This is the main function to use when saving from the form
 */
export async function savePricingPackagesWithVehicles(
  packageId: string,
  simplePricingOptions: any[]
): Promise<void> {
  // Convert simple options to full pricing packages
  const pricingPackages = simplePricingOptions.map((opt, index) => 
    convertSimpleToPricingPackage(opt, index)
  );
  
  // Save pricing packages first
  const savedPackages = await savePricingPackages(packageId, pricingPackages);
  
  // Save vehicles for private transfer packages
  const { saveVehiclesForPricingPackage } = await import('./activity-package-vehicles');
  
  for (let i = 0; i < simplePricingOptions.length; i++) {
    const simpleOption = simplePricingOptions[i];
    const savedPackage = savedPackages[i];
    
    // Save vehicles if this is a private transfer package
    if (simpleOption.packageType === 'PRIVATE_TRANSFER' && savedPackage) {
      const vehicles = simpleOption.vehicles || [];
      await saveVehiclesForPricingPackage(savedPackage.id, vehicles);
    }
  }
}

/**
 * Toggle active status of a pricing package
 */
export async function togglePricingPackageStatus(
  id: string,
  isActive: boolean
): Promise<ActivityPricingPackage> {
  const supabase = createSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .from('activity_pricing_packages' as any)
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error toggling pricing package status:', error);
    throw error;
  }

  return rowToPricingPackage(data as any);
}

/**
 * Toggle featured status of a pricing package
 */
export async function togglePricingPackageFeatured(
  id: string,
  isFeatured: boolean
): Promise<ActivityPricingPackage> {
  const supabase = createSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .from('activity_pricing_packages' as any)
    .update({ is_featured: isFeatured })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error toggling pricing package featured status:', error);
    throw error;
  }

  return rowToPricingPackage(data as any);
}

/**
 * Update display order of pricing packages
 */
export async function updatePricingPackagesOrder(
  packages: { id: string; displayOrder: number }[]
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  
  for (const pkg of packages) {
    const { error } = await supabase
      .from('activity_pricing_packages' as any)
      .update({ display_order: pkg.displayOrder })
      .eq('id', pkg.id);
    
    if (error) {
      console.error('Error updating pricing package order:', error);
      throw error;
    }
  }
}

// ============================================================================
// CONVERSION FUNCTIONS FOR SIMPLE FORMAT
// ============================================================================

/**
 * Convert simple pricing option from form to full ActivityPricingPackage
 * Used when saving form data to database
 */
export function convertSimpleToPricingPackage(
  simple: {
    id: string;
    activityName: string;
    packageType: 'TICKET_ONLY' | 'PRIVATE_TRANSFER' | 'SHARED_TRANSFER';
    adultPrice: number;
    childPrice: number;
    childMinAge: number;
    childMaxAge: number;
    vehicles?: any[]; // Vehicles array for private transfers
  },
  displayOrder: number = 0
): ActivityPricingPackage {
  const transferIncluded = simple.packageType !== 'TICKET_ONLY';
  const transferType = simple.packageType === 'PRIVATE_TRANSFER' ? 'PRIVATE' : 
                      simple.packageType === 'SHARED_TRANSFER' ? 'SHARED' : undefined;
  
  return {
    id: simple.id,
    packageName: simple.activityName,
    description: undefined,
    adultPrice: simple.adultPrice,
    childPrice: simple.childPrice,
    childMinAge: simple.childMinAge,
    childMaxAge: simple.childMaxAge,
    infantPrice: 0,
    infantMaxAge: 2,
    transferIncluded,
    transferType,
    transferPriceAdult: 0,
    transferPriceChild: 0,
    transferPriceInfant: 0,
    pickupLocation: '',
    pickupInstructions: '',
    dropoffLocation: '',
    dropoffInstructions: '',
    includedItems: [],
    excludedItems: [],
    isActive: true,
    isFeatured: false,
    displayOrder,
  };
}

/**
 * Convert ActivityPricingPackage to simple format for form
 * Used when loading database data into form
 */
export async function convertPricingPackageToSimple(
  pkg: ActivityPricingPackage
): Promise<{
  id: string;
  activityName: string;
  packageType: 'TICKET_ONLY' | 'PRIVATE_TRANSFER' | 'SHARED_TRANSFER';
  adultPrice: number;
  childPrice: number;
  childMinAge: number;
  childMaxAge: number;
  vehicles?: any[];
}> {
  let packageType: 'TICKET_ONLY' | 'PRIVATE_TRANSFER' | 'SHARED_TRANSFER' = 'TICKET_ONLY';
  
  if (pkg.transferIncluded) {
    packageType = pkg.transferType === 'PRIVATE' ? 'PRIVATE_TRANSFER' : 'SHARED_TRANSFER';
  }
  
  const simple: any = {
    id: pkg.id,
    activityName: pkg.packageName,
    packageType,
    adultPrice: pkg.adultPrice,
    childPrice: pkg.childPrice,
    childMinAge: pkg.childMinAge,
    childMaxAge: pkg.childMaxAge,
  };

  // Load vehicles for private transfers if pricing package has a real database ID
  if (packageType === 'PRIVATE_TRANSFER' && pkg.id && !pkg.id.startsWith('temp-')) {
    try {
      const { getVehiclesForPricingPackage } = await import('./activity-package-vehicles');
      const vehicles = await getVehiclesForPricingPackage(pkg.id);
      simple.vehicles = vehicles;
    } catch (error) {
      console.error('Error loading vehicles:', error);
      simple.vehicles = [];
    }
  }
  
  return simple;
}

