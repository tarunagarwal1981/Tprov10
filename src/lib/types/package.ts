/**
 * Package Type Definitions
 * Provides type safety for package-related operations
 */

/**
 * Package ID type - ensures consistent string handling
 * Package IDs are stored as UUID strings in the database
 */
export type PackageId = string;

/**
 * Multi-city package base structure
 */
export interface MultiCityPackage {
  id: PackageId;
  title: string;
  destination_region: string | null;
  operator_id: string;
  base_price: number | null;
  per_person_price: number | null;
  fixed_price: number | null;
  pricing_mode: string | null;
  currency: string;
  total_nights: number;
  total_cities: number;
  status: string;
}

/**
 * Multi-city hotel package base structure
 */
export interface MultiCityHotelPackage {
  id: PackageId;
  title: string;
  destination_region: string | null;
  operator_id: string;
  base_price: number | null;
  adult_price: number | null;
  currency: string;
  total_nights: number;
  total_cities: number;
  status: string;
}

/**
 * Package city information
 */
export interface PackageCity {
  package_id: PackageId;
  name: string;
  nights: number;
}

/**
 * Package image information
 */
export interface PackageImage {
  package_id: PackageId;
  public_url: string | null;
  is_cover: boolean;
}

/**
 * Package with full details (cities and images)
 */
export interface PackageWithDetails {
  id: PackageId;
  title: string;
  destination_region: string | null;
  operator_id: string;
  base_price: number | null;
  currency: string;
  total_nights: number;
  total_cities: number;
  status: string;
  featured_image_url?: string;
  cities: Array<{ name: string; nights: number; country?: string | null }>;
  // Additional fields for multi-city packages
  per_person_price?: number | null;
  fixed_price?: number | null;
  pricing_mode?: string | null;
  // Additional fields for multi-city hotel packages
  adult_price?: number | null;
}

/**
 * Normalize package ID to ensure consistent string type
 * Handles UUID, string, or any format and converts to string
 */
export function normalizePackageId(id: unknown): PackageId {
  if (typeof id === 'string') {
    return id.trim();
  }
  if (typeof id === 'number') {
    return String(id);
  }
  if (id === null || id === undefined) {
    throw new Error('Package ID cannot be null or undefined');
  }
  return String(id);
}

/**
 * Compare two package IDs safely
 * Handles type coercion and ensures consistent comparison
 */
export function comparePackageIds(id1: unknown, id2: unknown): boolean {
  try {
    const normalized1 = normalizePackageId(id1);
    const normalized2 = normalizePackageId(id2);
    return normalized1 === normalized2;
  } catch {
    return false;
  }
}

