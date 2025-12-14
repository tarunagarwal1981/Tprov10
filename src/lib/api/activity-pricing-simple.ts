/**
 * Activity Pricing Simple API Service
 * Wrapper for API routes - no Supabase dependencies
 */

import type { ActivityPricingPackage } from '@/lib/types/activity-pricing-simple';

// Simple pricing option interface (from form)
interface SimplePricingOption {
  id: string;
  activityName: string;
  packageType: 'TICKET_ONLY' | 'PRIVATE_TRANSFER' | 'SHARED_TRANSFER';
  adultPrice: number;
  childPrice: number;
  childMinAge: number;
  childMaxAge: number;
  vehicles?: any[];
}

/**
 * Convert simple pricing option to full pricing package format
 */
function convertSimpleToPricingPackage(opt: SimplePricingOption, index: number): ActivityPricingPackage {
  return {
    id: opt.id.startsWith('temp-') ? '' : opt.id,
    packageId: '',
    packageName: opt.activityName,
    description: undefined,
    adultPrice: opt.adultPrice,
    childPrice: opt.childPrice,
    childMinAge: opt.childMinAge,
    childMaxAge: opt.childMaxAge,
    infantPrice: undefined,
    infantMaxAge: undefined,
    transferIncluded: opt.packageType !== 'TICKET_ONLY',
    transferType: opt.packageType === 'PRIVATE_TRANSFER' ? 'PRIVATE' : opt.packageType === 'SHARED_TRANSFER' ? 'SHARED' : undefined,
    transferPriceAdult: undefined,
    transferPriceChild: undefined,
    transferPriceInfant: undefined,
    pickupLocation: undefined,
    pickupInstructions: undefined,
    dropoffLocation: undefined,
    dropoffInstructions: undefined,
    includedItems: [],
    excludedItems: undefined,
    isActive: true,
    isFeatured: false,
    displayOrder: index,
  };
}

/**
 * Get pricing packages for an activity package
 */
export async function getPricingPackages(packageId: string): Promise<ActivityPricingPackage[]> {
  try {
    const response = await fetch(`/api/operator/packages/activity/${packageId}/pricing`);
    
    if (!response.ok) {
      console.error('Failed to fetch pricing packages');
      return [];
    }

    const data = await response.json();
    return data.pricingPackages || [];
  } catch (error) {
    console.error('Error fetching pricing packages:', error);
    return [];
  }
}

/**
 * Convert pricing package to simple format (for form)
 */
export async function convertPricingPackageToSimple(pkg: ActivityPricingPackage): Promise<SimplePricingOption> {
  // Load vehicles if this is a private transfer package
  if (pkg.transferType === 'PRIVATE') {
    try {
      const response = await fetch(`/api/operator/packages/activity/pricing/${pkg.id}/vehicles`);
      if (response.ok) {
        const data = await response.json();
        const simple = convertPricingPackageToSimpleSync(pkg);
        simple.vehicles = data.vehicles || [];
        return simple;
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  }
  
  return convertPricingPackageToSimpleSync(pkg);
}

/**
 * Convert pricing package to simple format (synchronous helper)
 */
function convertPricingPackageToSimpleSync(pkg: ActivityPricingPackage): SimplePricingOption {
  return {
    id: pkg.id,
    activityName: pkg.packageName,
    packageType: pkg.transferType === 'PRIVATE' ? 'PRIVATE_TRANSFER' : pkg.transferType === 'SHARED' ? 'SHARED_TRANSFER' : 'TICKET_ONLY',
    adultPrice: pkg.adultPrice,
    childPrice: pkg.childPrice,
    childMinAge: pkg.childMinAge,
    childMaxAge: pkg.childMaxAge,
    vehicles: [], // Will be loaded separately if needed
  };
}

/**
 * Save pricing packages with vehicles using API route
 */
export async function savePricingPackagesWithVehicles(
  packageId: string,
  simplePricingOptions: SimplePricingOption[]
): Promise<void> {
  // Convert simple options to full pricing packages
  const pricingPackages = simplePricingOptions.map((opt, index) => 
    convertSimpleToPricingPackage(opt, index)
  );
  
  // Prepare vehicles data
  const vehiclesData = simplePricingOptions.map((opt, index) => ({
    pricingPackageIndex: index,
    vehicles: opt.packageType === 'PRIVATE_TRANSFER' ? (opt.vehicles || []) : [],
  }));

  const response = await fetch('/api/operator/packages/activity/pricing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      packageId,
      pricingPackages,
      vehicles: vehiclesData,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save pricing packages');
  }
}
