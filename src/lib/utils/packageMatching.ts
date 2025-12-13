/**
 * Package Matching Utilities
 * 
 * Provides exact and similar package matching based on query destinations
 */

import { matchCityNames, normalizeCityName } from './cityMatching';

export interface QueryDestination {
  city: string;
  nights: number;
}

export interface PackageCity {
  name: string;
  nights: number;
  country?: string | null;
}

export interface PackageWithCities {
  id: string;
  cities?: PackageCity[];
  [key: string]: any;
}

/**
 * Check if a package exactly matches the query destinations
 * Requirements:
 * - Same cities in same order
 * - Exact nights for each city
 * - No extra cities in package
 */
export function isExactMatch(
  queryDestinations: QueryDestination[],
  packageCities: PackageCity[]
): boolean {
  // Must have same number of cities
  if (queryDestinations.length !== packageCities.length) {
    return false;
  }

  // Check each city in order with exact nights
  for (let i = 0; i < queryDestinations.length; i++) {
    const queryDest = queryDestinations[i];
    const packageCity = packageCities[i];

    if (!queryDest || !packageCity) {
      return false;
    }

    // Check city name match (using intelligent matching - exact or alias)
    const cityMatch = matchCityNames(queryDest.city, packageCity.name);
    if (!cityMatch || (cityMatch !== 'exact' && cityMatch !== 'alias')) {
      return false;
    }

    // Check exact nights match
    if (queryDest.nights !== packageCity.nights) {
      return false;
    }
  }

  return true;
}

/**
 * Find exact matching packages
 * Returns packages that match query destinations exactly (cities, order, nights)
 */
export function findExactMatches(
  queryDestinations: QueryDestination[],
  packages: PackageWithCities[]
): PackageWithCities[] {
  if (!queryDestinations || queryDestinations.length === 0) {
    return [];
  }

  return packages.filter((pkg) => {
    if (!pkg.cities || pkg.cities.length === 0) {
      return false;
    }

    return isExactMatch(queryDestinations, pkg.cities);
  });
}

/**
 * Get countries from query destinations
 * Extracts country information if available (e.g., "Bali, Indonesia" -> "Indonesia")
 * Also tries to get country from city aliases if available
 */
function getCountriesFromDestinations(destinations: QueryDestination[]): string[] {
  const countries = new Set<string>();
  
  for (const dest of destinations) {
    const cityName = dest.city;
    // Try to extract country from "City, Country" format
    const parts = cityName.split(',').map(p => p.trim());
    if (parts.length > 1) {
      // Last part is likely the country
      const country = parts[parts.length - 1];
      if (country) {
        countries.add(country.toLowerCase());
      }
    }
  }
  
  return Array.from(countries);
}

/**
 * Check if package cities match query countries
 * Returns true if package has cities from the same countries as query
 * Uses country field from database if available, otherwise extracts from city name
 */
function matchesCountries(
  queryDestinations: QueryDestination[],
  packageCities: PackageCity[]
): boolean {
  const queryCountries = getCountriesFromDestinations(queryDestinations);
  
  if (queryCountries.length === 0) {
    // If we can't extract countries from query, fall back to city matching
    return false;
  }

  for (const pkgCity of packageCities) {
    let pkgCountry: string | null = null;
    
    // First try to use country field from database
    if (pkgCity.country) {
      pkgCountry = pkgCity.country.toLowerCase();
    } else {
      // Fall back to extracting from city name
      const cityParts = pkgCity.name.split(',').map(p => p.trim());
      if (cityParts.length > 1) {
        const country = cityParts[cityParts.length - 1];
        if (country) {
          pkgCountry = country.toLowerCase();
        }
      }
    }
    
    if (pkgCountry && queryCountries.includes(pkgCountry)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if package has partial city matches with query
 * Returns true if at least one query city matches a package city
 */
function hasPartialCityMatch(
  queryDestinations: QueryDestination[],
  packageCities: PackageCity[]
): boolean {
  const queryCityNames = queryDestinations.map(d => d.city);
  const packageCityNames = packageCities.map(c => c.name);

  for (const queryCity of queryCityNames) {
    for (const pkgCity of packageCityNames) {
      const match = matchCityNames(queryCity, pkgCity);
      if (match) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Find similar packages
 * Priority:
 * 1. Same countries (all query cities' countries match package countries)
 * 2. Partial city match (at least one city matches)
 * 
 * Returns packages sorted by similarity (same countries first, then partial matches)
 */
export function findSimilarPackages(
  queryDestinations: QueryDestination[],
  packages: PackageWithCities[]
): PackageWithCities[] {
  if (!queryDestinations || queryDestinations.length === 0) {
    return [];
  }

  // Filter out exact matches first
  const exactMatches = findExactMatches(queryDestinations, packages);
  const exactMatchIds = new Set(exactMatches.map(p => p.id));

  // Get packages that are not exact matches
  const nonExactPackages = packages.filter(p => !exactMatchIds.has(p.id));

  // Categorize similar packages
  const sameCountryPackages: PackageWithCities[] = [];
  const partialMatchPackages: PackageWithCities[] = [];

  for (const pkg of nonExactPackages) {
    if (!pkg.cities || pkg.cities.length === 0) {
      continue;
    }

    // Check if matches countries
    if (matchesCountries(queryDestinations, pkg.cities)) {
      sameCountryPackages.push(pkg);
    } else if (hasPartialCityMatch(queryDestinations, pkg.cities)) {
      partialMatchPackages.push(pkg);
    }
  }

  // Return: same countries first, then partial matches
  return [...sameCountryPackages, ...partialMatchPackages];
}

