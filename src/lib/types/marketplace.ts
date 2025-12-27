/**
 * Lead Marketplace Type Definitions
 * Types for the lead marketplace where travel agents can purchase quality leads
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum LeadStatus {
  AVAILABLE = 'AVAILABLE',
  PURCHASED = 'PURCHASED',
  EXPIRED = 'EXPIRED'
}

export enum TripType {
  ADVENTURE = 'ADVENTURE',
  CULTURAL = 'CULTURAL',
  BEACH = 'BEACH',
  WILDLIFE = 'WILDLIFE',
  LUXURY = 'LUXURY',
  BUDGET = 'BUDGET',
  FAMILY = 'FAMILY',
  HONEYMOON = 'HONEYMOON'
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Marketplace Lead
 * Represents a lead available for purchase in the marketplace
 */
export interface MarketplaceLead {
  id: string;
  title: string;
  destination: string;
  tripType: TripType;
  budgetMin: number;
  budgetMax: number;
  durationDays: number;
  travelersCount: number;
  travelDateStart?: Date;
  travelDateEnd?: Date;
  specialRequirements: string;
  leadQualityScore: number;
  leadPrice: number;
  status: LeadStatus;
  postedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Hidden until purchased
  // These fields are only available after the lead is purchased
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  detailedRequirements?: string;
  customerId?: string | null; // Customer-facing ID from leads table (e.g., LD250001)
}

/**
 * Lead Purchase
 * Represents a purchase transaction of a marketplace lead
 */
export interface LeadPurchase {
  id: string;
  leadId: string;
  agentId: string;
  purchasePrice: number;
  purchasedAt: Date;
  createdAt: Date;
  
  // Populated when joining with marketplace lead
  lead?: MarketplaceLead;
}

/**
 * Lead Filters
 * Filters for searching and filtering marketplace leads
 */
export interface LeadFilters {
  destination?: string;
  tripType?: TripType;
  budgetMin?: number;
  budgetMax?: number;
  durationMin?: number;
  durationMax?: number;
  minQualityScore?: number;
  status?: LeadStatus;
}

/**
 * Lead Statistics
 * Marketplace statistics and metrics
 */
export interface LeadMarketplaceStats {
  totalAvailable: number;
  totalPurchased: number;
  totalExpired: number;
  avgLeadPrice: number;
  avgQualityScore: number;
}

/**
 * Purchase Summary
 * Summary of agent's purchases
 */
export interface AgentPurchaseSummary {
  totalPurchases: number;
  totalSpent: number;
  averagePurchasePrice: number;
  recentPurchases: LeadPurchase[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a lead is available for purchase
 */
export const isLeadAvailable = (lead: MarketplaceLead): boolean => {
  return lead.status === LeadStatus.AVAILABLE && 
         new Date(lead.expiresAt) > new Date();
};

/**
 * Check if a lead has been purchased
 */
export const isLeadPurchased = (lead: MarketplaceLead): boolean => {
  return lead.status === LeadStatus.PURCHASED;
};

/**
 * Check if a lead has expired
 */
export const isLeadExpired = (lead: MarketplaceLead): boolean => {
  return lead.status === LeadStatus.EXPIRED || 
         new Date(lead.expiresAt) <= new Date();
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Database representation (snake_case)
 * Used for Supabase queries
 */
export interface MarketplaceLeadDB {
  id: string;
  title: string;
  destination: string;
  trip_type: 'ADVENTURE' | 'CULTURAL' | 'BEACH' | 'WILDLIFE' | 'LUXURY' | 'BUDGET' | 'FAMILY' | 'HONEYMOON';
  budget_min: number;
  budget_max: number;
  duration_days: number;
  travelers_count: number;
  travel_date_start?: string | null;
  travel_date_end?: string | null;
  special_requirements: string;
  lead_quality_score: number;
  lead_price: number;
  status: 'AVAILABLE' | 'PURCHASED' | 'EXPIRED';
  posted_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  
  // Hidden fields
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  detailed_requirements?: string;
}

/**
 * Database representation for purchases
 */
export interface LeadPurchaseDB {
  id: string;
  lead_id: string;
  agent_id: string;
  purchase_price: number;
  purchased_at: string;
  created_at: string;
}

/**
 * Convert database lead to client lead
 */
export const mapMarketplaceLeadFromDB = (dbLead: MarketplaceLeadDB): MarketplaceLead => ({
  id: dbLead.id,
  title: dbLead.title,
  destination: dbLead.destination,
  tripType: dbLead.trip_type as TripType,
  budgetMin: dbLead.budget_min,
  budgetMax: dbLead.budget_max,
  durationDays: dbLead.duration_days,
  travelersCount: dbLead.travelers_count,
  travelDateStart: dbLead.travel_date_start ? new Date(dbLead.travel_date_start) : undefined,
  travelDateEnd: dbLead.travel_date_end ? new Date(dbLead.travel_date_end) : undefined,
  specialRequirements: dbLead.special_requirements,
  leadQualityScore: dbLead.lead_quality_score,
  leadPrice: dbLead.lead_price,
  status: dbLead.status as LeadStatus,
  postedAt: new Date(dbLead.posted_at),
  expiresAt: new Date(dbLead.expires_at),
  createdAt: new Date(dbLead.created_at),
  updatedAt: new Date(dbLead.updated_at),
  customerName: dbLead.customer_name,
  customerEmail: dbLead.customer_email,
  customerPhone: dbLead.customer_phone,
  detailedRequirements: dbLead.detailed_requirements,
});

/**
 * Convert database purchase to client purchase
 */
export const mapLeadPurchaseFromDB = (dbPurchase: LeadPurchaseDB): LeadPurchase => ({
  id: dbPurchase.id,
  leadId: dbPurchase.lead_id,
  agentId: dbPurchase.agent_id,
  purchasePrice: dbPurchase.purchase_price,
  purchasedAt: new Date(dbPurchase.purchased_at),
  createdAt: new Date(dbPurchase.created_at),
});

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get display-friendly trip type label
 */
export const getTripTypeLabel = (tripType: TripType): string => {
  const labels: Record<TripType, string> = {
    [TripType.ADVENTURE]: 'Adventure',
    [TripType.CULTURAL]: 'Cultural',
    [TripType.BEACH]: 'Beach',
    [TripType.WILDLIFE]: 'Wildlife',
    [TripType.LUXURY]: 'Luxury',
    [TripType.BUDGET]: 'Budget',
    [TripType.FAMILY]: 'Family',
    [TripType.HONEYMOON]: 'Honeymoon',
  };
  return labels[tripType];
};

/**
 * Get status badge color
 */
export const getLeadStatusColor = (status: LeadStatus): string => {
  const colors: Record<LeadStatus, string> = {
    [LeadStatus.AVAILABLE]: 'green',
    [LeadStatus.PURCHASED]: 'blue',
    [LeadStatus.EXPIRED]: 'gray',
  };
  return colors[status];
};

/**
 * Format quality score as percentage
 */
export const formatQualityScore = (score: number): string => {
  return `${score}%`;
};

/**
 * Calculate days until expiry
 */
export const getDaysUntilExpiry = (expiresAt: Date): number => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

