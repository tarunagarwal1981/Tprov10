/**
 * City Name Normalization and Matching Utilities
 * 
 * Provides intelligent city name matching for package filtering
 * Handles variations, abbreviations, and related cities
 */

/**
 * Normalize a city name for comparison
 * - Removes country suffixes (e.g., "Bali, Indonesia" -> "Bali")
 * - Removes special characters and extra spaces
 * - Converts to lowercase
 * - Handles common abbreviations
 */
export function normalizeCityName(cityName: string): string {
  if (!cityName) return '';
  
  let normalized = cityName.trim();
  
  // Remove country suffixes (e.g., "Bali, Indonesia" -> "Bali")
  // Common patterns: "City, Country", "City - Country", "City (Country)"
  normalized = normalized
    .replace(/,\s*[A-Za-z\s]+$/, '') // Remove ", Country"
    .replace(/\s*-\s*[A-Za-z\s]+$/, '') // Remove " - Country"
    .replace(/\s*\([A-Za-z\s]+\)$/, '') // Remove " (Country)"
    .trim();
  
  // Remove common prefixes/suffixes that don't affect matching
  normalized = normalized
    .replace(/^(the\s+)/i, '') // Remove "The " prefix
    .replace(/\s+(city|town)$/i, '') // Remove " City" or " Town" suffix
    .trim();
  
  // Normalize special characters
  normalized = normalized
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase();
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * City aliases and related cities mapping
 * Maps related cities that should be considered matches
 * e.g., Denpasar is in Bali, so "Bali" should match "Denpasar"
 */
const CITY_ALIASES: Record<string, string[]> = {
  // Indonesia
  'bali': ['denpasar', 'ubud', 'seminyak', 'kuta', 'sanur', 'nusa dua', 'canggu'],
  'jakarta': ['jakarta', 'dki jakarta'],
  'yogyakarta': ['yogyakarta', 'jogja', 'jogjakarta'],
  'bandung': ['bandung'],
  'lombok': ['mataram', 'senggigi', 'kuta lombok'],
  'sumatra': ['medan', 'padang', 'palembang'],
  
  // USA
  'new york': ['nyc', 'new york city', 'manhattan', 'brooklyn'],
  'los angeles': ['la', 'los angeles', 'hollywood', 'beverly hills'],
  'san francisco': ['sf', 'san francisco', 'san fran'],
  'miami': ['miami beach', 'south beach'],
  
  // UK
  'london': ['london', 'greater london'],
  'edinburgh': ['edinburgh'],
  
  // India
  'mumbai': ['mumbai', 'bombay'],
  'delhi': ['delhi', 'new delhi', 'ncr'],
  'bangalore': ['bangalore', 'bengaluru'],
  'goa': ['panaji', 'panjim', 'north goa', 'south goa'],
  
  // Thailand
  'bangkok': ['bangkok', 'krung thep'],
  'phuket': ['phuket', 'patong'],
  'chiang mai': ['chiang mai', 'chiangmai'],
  
  // Add more as needed
};

/**
 * Get all aliases and related cities for a given city
 */
function getCityAliases(cityName: string): string[] {
  const normalized = normalizeCityName(cityName);
  const aliases: string[] = [normalized];
  
  // Check if the city is a key in our aliases map
  if (CITY_ALIASES[normalized]) {
    aliases.push(...CITY_ALIASES[normalized]);
  }
  
  // Check if the city is an alias for another city
  for (const [key, values] of Object.entries(CITY_ALIASES)) {
    if (values.includes(normalized)) {
      aliases.push(key, ...values);
    }
  }
  
  // Remove duplicates
  return [...new Set(aliases)];
}

/**
 * Check if two city names match (with normalization and aliases)
 * Returns match strength: 'exact' | 'normalized' | 'partial' | 'alias' | null
 */
export function matchCityNames(
  queryCity: string,
  packageCity: string
): 'exact' | 'normalized' | 'partial' | 'alias' | null {
  if (!queryCity || !packageCity) return null;
  
  const normalizedQuery = normalizeCityName(queryCity);
  const normalizedPackage = normalizeCityName(packageCity);
  
  // 1. Exact match (after normalization)
  if (normalizedQuery === normalizedPackage) {
    return 'exact';
  }
  
  // 2. Check aliases
  const queryAliases = getCityAliases(queryCity);
  const packageAliases = getCityAliases(packageCity);
  
  // Check if any aliases match
  for (const qAlias of queryAliases) {
    for (const pAlias of packageAliases) {
      if (qAlias === pAlias) {
        return 'alias';
      }
    }
  }
  
  // 3. Normalized match (one contains the other)
  if (normalizedQuery.includes(normalizedPackage) || normalizedPackage.includes(normalizedQuery)) {
    // Avoid false positives for very short matches
    const minLength = Math.min(normalizedQuery.length, normalizedPackage.length);
    if (minLength >= 3) {
      return 'normalized';
    }
  }
  
  // 4. Partial match (word-level matching)
  const queryWords = normalizedQuery.split(/\s+/);
  const packageWords = normalizedPackage.split(/\s+/);
  
  // Check if any significant word matches
  for (const qWord of queryWords) {
    if (qWord.length >= 3) { // Only consider words with 3+ characters
      for (const pWord of packageWords) {
        if (qWord === pWord || qWord.includes(pWord) || pWord.includes(qWord)) {
          return 'partial';
        }
      }
    }
  }
  
  return null;
}

/**
 * Check if a query city matches any package city
 * Returns the best match strength found
 */
export function matchesAnyCity(
  queryCity: string,
  packageCities: string[]
): 'exact' | 'normalized' | 'partial' | 'alias' | null {
  let bestMatch: 'exact' | 'normalized' | 'partial' | 'alias' | null = null;
  
  for (const packageCity of packageCities) {
    const match = matchCityNames(queryCity, packageCity);
    
    if (!match) continue;
    
    // Prioritize better matches - exact is highest priority
    if (match === 'exact') {
      return 'exact';
    }
    
    // Since we return early for 'exact', bestMatch can never be 'exact' here
    // Update bestMatch only if current match is better than existing bestMatch
    if (match === 'alias') {
      // Alias is better than normalized or partial, so always update if bestMatch is null or lower priority
      if (bestMatch === null || bestMatch === 'normalized' || bestMatch === 'partial') {
        bestMatch = 'alias';
      }
    } else if (match === 'normalized') {
      // Normalized is better than partial, so update if bestMatch is null or partial
      if (bestMatch === null || bestMatch === 'partial') {
        bestMatch = 'normalized';
      }
    } else if (match === 'partial') {
      // Partial is lowest priority, only set if nothing else found
      if (bestMatch === null) {
        bestMatch = 'partial';
      }
    }
  }
  
  return bestMatch;
}

/**
 * Build SQL conditions for city matching
 * Returns SQL conditions and parameters for efficient database queries
 */
export function buildCityMatchSQL(
  cities: string[],
  cityColumnName: string = 'c.name'
): { conditions: string; parameters: string[] } {
  if (cities.length === 0) {
    return { conditions: '', parameters: [] };
  }
  
  const conditions: string[] = [];
  const parameters: string[] = [];
  
  for (const city of cities) {
    const normalized = normalizeCityName(city);
    const aliases = getCityAliases(city);
    
    // Build OR conditions for the city and all its aliases
    const cityConditions: string[] = [];
    
    for (const alias of aliases) {
      // Exact match (case-insensitive)
      const paramIndexExact = parameters.length + 1;
      parameters.push(alias.toLowerCase());
      cityConditions.push(`LOWER(${cityColumnName}) = $${paramIndexExact}`);
      
      // Partial match (contains) - ILIKE is already case-insensitive
      if (alias.length >= 3) {
        const paramIndexPartial = parameters.length + 1;
        parameters.push(`%${alias.toLowerCase()}%`);
        cityConditions.push(`${cityColumnName} ILIKE $${paramIndexPartial}`);
      }
    }
    
    if (cityConditions.length > 0) {
      conditions.push(`(${cityConditions.join(' OR ')})`);
    }
  }
  
  return {
    conditions: conditions.join(' OR '),
    parameters,
  };
}

/**
 * Filter packages by cities using intelligent matching
 * This is used for post-processing when SQL matching isn't sufficient
 */
export function filterPackagesByCities<T extends { cities?: Array<{ name: string }> }>(
  packages: T[],
  queryCities: string[],
  minMatchStrength: 'exact' | 'normalized' | 'partial' | 'alias' = 'partial'
): T[] {
  if (queryCities.length === 0) {
    return packages;
  }
  
  const matchStrengthOrder = {
    exact: 4,
    alias: 3,
    normalized: 2,
    partial: 1,
  };
  
  const minStrength = matchStrengthOrder[minMatchStrength];
  
  return packages.filter((pkg) => {
    if (!pkg.cities || pkg.cities.length === 0) {
      return false;
    }
    
    const packageCityNames = pkg.cities.map((c) => c.name);
    
    // Check if any query city matches any package city
    for (const queryCity of queryCities) {
      const match = matchesAnyCity(queryCity, packageCityNames);
      
      if (match && matchStrengthOrder[match] >= minStrength) {
        return true;
      }
    }
    
    return false;
  });
}

