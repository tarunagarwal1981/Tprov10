// ============================================================================
// SIMPLIFIED ACTIVITY PRICING PACKAGE TYPES
// ============================================================================
// This file contains types for the simplified pricing package system
// Each package is a complete template with optional transfers

export type TransferType = 'SHARED' | 'PRIVATE';

export interface ActivityPricingPackage {
  id: string;
  packageId?: string; // Activity package ID (for database operations)
  
  // Package Template
  packageName: string; // e.g., "Basic Experience", "Premium VIP", "Family Package"
  description?: string;
  
  // ========================================
  // Ticket Pricing (Required)
  // ========================================
  adultPrice: number;
  childPrice: number;
  childMinAge: number; // Default: 3
  childMaxAge: number; // Default: 12
  infantPrice?: number; // Default: 0 (free)
  infantMaxAge?: number; // Default: 2
  
  // ========================================
  // Optional Transfer Pricing (Per Person)
  // ========================================
  transferIncluded: boolean; // Does this package include transfers?
  transferType?: TransferType; // 'SHARED' or 'PRIVATE'
  
  // Transfer pricing per person (additional cost)
  transferPriceAdult?: number;
  transferPriceChild?: number;
  transferPriceInfant?: number;
  
  // Transfer details
  pickupLocation?: string;
  pickupInstructions?: string;
  dropoffLocation?: string;
  dropoffInstructions?: string;
  
  // ========================================
  // What's Included
  // ========================================
  includedItems: string[];
  excludedItems?: string[];
  
  // ========================================
  // Status and Display
  // ========================================
  isActive: boolean;
  isFeatured: boolean; // Mark as "Most Popular", "Best Value", etc.
  displayOrder: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate total price for a person in a package
 */
export function calculatePackagePrice(
  pkg: ActivityPricingPackage,
  personType: 'adult' | 'child' | 'infant'
): number {
  let price = 0;
  
  // Base ticket price
  switch (personType) {
    case 'adult':
      price = pkg.adultPrice;
      break;
    case 'child':
      price = pkg.childPrice;
      break;
    case 'infant':
      price = pkg.infantPrice || 0;
      break;
  }
  
  // Add transfer price if included
  if (pkg.transferIncluded) {
    switch (personType) {
      case 'adult':
        price += pkg.transferPriceAdult || 0;
        break;
      case 'child':
        price += pkg.transferPriceChild || 0;
        break;
      case 'infant':
        price += pkg.transferPriceInfant || 0;
        break;
    }
  }
  
  return price;
}

/**
 * Get formatted price for display
 */
export function formatPackagePrice(
  pkg: ActivityPricingPackage,
  personType: 'adult' | 'child' | 'infant',
  currency: string = 'USD'
): string {
  const price = calculatePackagePrice(pkg, personType);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
}

/**
 * Create a default pricing package
 */
export function createDefaultPricingPackage(): ActivityPricingPackage {
  return {
    id: `temp-${Date.now()}-${Math.random().toString(36).substring(2)}`,
    packageName: '',
    description: '',
    adultPrice: 0,
    childPrice: 0,
    childMinAge: 3,
    childMaxAge: 12,
    infantPrice: 0,
    infantMaxAge: 2,
    transferIncluded: false,
    transferType: undefined,
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
    displayOrder: 0,
  };
}

/**
 * Validate a pricing package
 */
export interface PricingPackageValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePricingPackage(
  pkg: ActivityPricingPackage
): PricingPackageValidation {
  const errors: string[] = [];
  
  // Required fields
  if (!pkg.packageName.trim()) {
    errors.push('Package name is required');
  }
  
  if (pkg.adultPrice < 0) {
    errors.push('Adult price must be 0 or greater');
  }
  
  if (pkg.childPrice < 0) {
    errors.push('Child price must be 0 or greater');
  }
  
  // Age range validation
  if (pkg.childMinAge < 0) {
    errors.push('Child minimum age must be 0 or greater');
  }
  
  if (pkg.childMaxAge <= pkg.childMinAge) {
    errors.push('Child maximum age must be greater than minimum age');
  }
  
  if (pkg.infantMaxAge !== undefined && pkg.infantMaxAge < 0) {
    errors.push('Infant maximum age must be 0 or greater');
  }
  
  // Transfer validation
  if (pkg.transferIncluded) {
    if (!pkg.transferType) {
      errors.push('Transfer type is required when transfer is included');
    }
    
    if (pkg.transferPriceAdult !== undefined && pkg.transferPriceAdult < 0) {
      errors.push('Transfer adult price must be 0 or greater');
    }
    
    if (pkg.transferPriceChild !== undefined && pkg.transferPriceChild < 0) {
      errors.push('Transfer child price must be 0 or greater');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

