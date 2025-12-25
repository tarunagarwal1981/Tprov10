/**
 * Travel Agent Type Definitions
 * Types related to travel agents and their lead management
 */

import type { ContactInfo } from '../types';
import type { MarketplaceLead, TripType } from './marketplace';

// ============================================================================
// ENUMS
// ============================================================================

export enum LeadSource {
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  EMAIL_CAMPAIGN = 'EMAIL_CAMPAIGN',
  PHONE_INQUIRY = 'PHONE_INQUIRY',
  WALK_IN = 'WALK_IN',
  MARKETPLACE = 'MARKETPLACE',
  PARTNER = 'PARTNER',
  OTHER = 'OTHER'
}

export enum LeadPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum LeadStage {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
  ARCHIVED = 'ARCHIVED'
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Lead
 * Represents a potential customer/booking opportunity for a travel agent
 */
export interface Lead {
  id: string;
  agentId: string;
  
  // Customer Information
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Trip Details
  destination?: string;
  tripType?: TripType;
  budgetMin?: number;
  budgetMax?: number;
  durationDays?: number;
  travelersCount?: number;
  travelDateStart?: Date;
  travelDateEnd?: Date;
  
  // Lead Management
  source: LeadSource;
  priority: LeadPriority;
  stage: LeadStage;
  assignedTo?: string; // User ID of assigned agent
  
  // Additional Information
  requirements?: string;
  notes?: string;
  tags?: string[];
  
  // Marketplace Integration (NEW)
  marketplaceLeadId?: string;
  isPurchased: boolean;
  purchasedFromMarketplace: boolean;
  
  // Follow-up
  nextFollowUpDate?: Date;
  lastContactedAt?: Date;
  
  // Conversion
  convertedToBooking?: boolean;
  bookingId?: string;
  estimatedValue?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Related data (populated via joins)
  marketplaceLead?: MarketplaceLead;
}

/**
 * Lead Activity
 * Tracks interactions and activities related to a lead
 */
export interface LeadActivity {
  id: string;
  leadId: string;
  agentId: string;
  activityType: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'STATUS_CHANGE' | 'PURCHASE';
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * Lead Statistics
 * Statistics for an agent's leads
 */
export interface LeadStats {
  total: number;
  byStage: Record<LeadStage, number>;
  bySource: Record<LeadSource, number>;
  byPriority: Record<LeadPriority, number>;
  conversionRate: number;
  averageValue: number;
  fromMarketplace: number;
}

/**
 * Lead Filter Options
 */
export interface LeadFilterOptions {
  stage?: LeadStage | LeadStage[];
  source?: LeadSource | LeadSource[];
  priority?: LeadPriority | LeadPriority[];
  assignedTo?: string;
  purchasedFromMarketplace?: boolean;
  destination?: string;
  tripType?: TripType;
  budgetMin?: number;
  budgetMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

// ============================================================================
// DATABASE TYPES (snake_case)
// ============================================================================

/**
 * Database representation of Lead
 */
export interface LeadDB {
  id: string;
  agent_id: string;
  
  // Customer Information
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  
  // Trip Details
  destination?: string;
  trip_type?: TripType;
  budget_min?: number;
  budget_max?: number;
  duration_days?: number;
  travelers_count?: number;
  travel_date_start?: string;
  travel_date_end?: string;
  
  // Lead Management
  source: LeadSource;
  priority: LeadPriority;
  stage: LeadStage;
  assigned_to?: string;
  
  // Additional Information
  requirements?: string;
  notes?: string;
  tags?: string[];
  
  // Marketplace Integration
  marketplace_lead_id?: string;
  is_purchased: boolean;
  purchased_from_marketplace: boolean;
  
  // Follow-up
  next_follow_up_date?: string;
  last_contacted_at?: string;
  
  // Conversion
  converted_to_booking?: boolean;
  booking_id?: string;
  estimated_value?: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Database representation of Lead Activity
 */
export interface LeadActivityDB {
  id: string;
  lead_id: string;
  agent_id: string;
  activity_type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'STATUS_CHANGE' | 'PURCHASE';
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

/**
 * Convert database lead to client lead
 */
export const mapLeadFromDB = (dbLead: LeadDB): Lead => ({
  id: dbLead.id,
  agentId: dbLead.agent_id,
  customerName: dbLead.customer_name,
  customerEmail: dbLead.customer_email,
  customerPhone: dbLead.customer_phone,
  destination: dbLead.destination,
  tripType: dbLead.trip_type,
  budgetMin: dbLead.budget_min,
  budgetMax: dbLead.budget_max,
  durationDays: dbLead.duration_days,
  travelersCount: dbLead.travelers_count,
  travelDateStart: dbLead.travel_date_start ? new Date(dbLead.travel_date_start) : undefined,
  travelDateEnd: dbLead.travel_date_end ? new Date(dbLead.travel_date_end) : undefined,
  source: dbLead.source,
  priority: dbLead.priority,
  stage: dbLead.stage,
  assignedTo: dbLead.assigned_to,
  requirements: dbLead.requirements,
  notes: dbLead.notes,
  tags: dbLead.tags,
  marketplaceLeadId: dbLead.marketplace_lead_id,
  isPurchased: dbLead.is_purchased,
  purchasedFromMarketplace: dbLead.purchased_from_marketplace,
  nextFollowUpDate: dbLead.next_follow_up_date ? new Date(dbLead.next_follow_up_date) : undefined,
  lastContactedAt: dbLead.last_contacted_at ? new Date(dbLead.last_contacted_at) : undefined,
  convertedToBooking: dbLead.converted_to_booking,
  bookingId: dbLead.booking_id,
  estimatedValue: dbLead.estimated_value,
  createdAt: new Date(dbLead.created_at),
  updatedAt: new Date(dbLead.updated_at),
});

/**
 * Convert client lead to database lead
 */
export const mapLeadToDB = (lead: Partial<Lead>): Partial<LeadDB> => ({
  agent_id: lead.agentId,
  customer_name: lead.customerName,
  customer_email: lead.customerEmail,
  customer_phone: lead.customerPhone,
  destination: lead.destination,
  trip_type: lead.tripType,
  budget_min: lead.budgetMin,
  budget_max: lead.budgetMax,
  duration_days: lead.durationDays,
  travelers_count: lead.travelersCount,
  travel_date_start: lead.travelDateStart?.toISOString(),
  travel_date_end: lead.travelDateEnd?.toISOString(),
  source: lead.source,
  priority: lead.priority,
  stage: lead.stage,
  assigned_to: lead.assignedTo,
  requirements: lead.requirements,
  notes: lead.notes,
  tags: lead.tags,
  marketplace_lead_id: lead.marketplaceLeadId,
  is_purchased: lead.isPurchased ?? false,
  purchased_from_marketplace: lead.purchasedFromMarketplace ?? false,
  next_follow_up_date: lead.nextFollowUpDate?.toISOString(),
  last_contacted_at: lead.lastContactedAt?.toISOString(),
  converted_to_booking: lead.convertedToBooking,
  booking_id: lead.bookingId,
  estimated_value: lead.estimatedValue,
});

/**
 * Convert database activity to client activity
 */
export const mapLeadActivityFromDB = (dbActivity: LeadActivityDB): LeadActivity => ({
  id: dbActivity.id,
  leadId: dbActivity.lead_id,
  agentId: dbActivity.agent_id,
  activityType: dbActivity.activity_type,
  description: dbActivity.description,
  metadata: dbActivity.metadata,
  createdAt: new Date(dbActivity.created_at),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a lead is from the marketplace
 */
export const isMarketplaceLead = (lead: Lead): boolean => {
  return lead.purchasedFromMarketplace && !!lead.marketplaceLeadId;
};

/**
 * Get stage display name
 */
export const getLeadStageLabel = (stage: LeadStage): string => {
  const labels: Record<LeadStage, string> = {
    [LeadStage.NEW]: 'New',
    [LeadStage.CONTACTED]: 'Contacted',
    [LeadStage.QUALIFIED]: 'Qualified',
    [LeadStage.PROPOSAL_SENT]: 'Proposal Sent',
    [LeadStage.NEGOTIATION]: 'Negotiation',
    [LeadStage.WON]: 'Won',
    [LeadStage.LOST]: 'Lost',
    [LeadStage.ARCHIVED]: 'Archived',
  };
  return labels[stage];
};

/**
 * Get priority display name
 */
export const getLeadPriorityLabel = (priority: LeadPriority): string => {
  const labels: Record<LeadPriority, string> = {
    [LeadPriority.LOW]: 'Low',
    [LeadPriority.MEDIUM]: 'Medium',
    [LeadPriority.HIGH]: 'High',
    [LeadPriority.URGENT]: 'Urgent',
  };
  return labels[priority];
};

/**
 * Get source display name
 */
export const getLeadSourceLabel = (source: LeadSource): string => {
  const labels: Record<LeadSource, string> = {
    [LeadSource.WEBSITE]: 'Website',
    [LeadSource.REFERRAL]: 'Referral',
    [LeadSource.SOCIAL_MEDIA]: 'Social Media',
    [LeadSource.EMAIL_CAMPAIGN]: 'Email Campaign',
    [LeadSource.PHONE_INQUIRY]: 'Phone Inquiry',
    [LeadSource.WALK_IN]: 'Walk-in',
    [LeadSource.MARKETPLACE]: 'Marketplace',
    [LeadSource.PARTNER]: 'Partner',
    [LeadSource.OTHER]: 'Other',
  };
  return labels[source];
};

/**
 * Get priority color for UI
 */
export const getLeadPriorityColor = (priority: LeadPriority): string => {
  const colors: Record<LeadPriority, string> = {
    [LeadPriority.LOW]: 'gray',
    [LeadPriority.MEDIUM]: 'blue',
    [LeadPriority.HIGH]: 'orange',
    [LeadPriority.URGENT]: 'red',
  };
  return colors[priority];
};

/**
 * Get stage color for UI
 */
export const getLeadStageColor = (stage: LeadStage): string => {
  const colors: Record<LeadStage, string> = {
    [LeadStage.NEW]: 'blue',
    [LeadStage.CONTACTED]: 'cyan',
    [LeadStage.QUALIFIED]: 'purple',
    [LeadStage.PROPOSAL_SENT]: 'indigo',
    [LeadStage.NEGOTIATION]: 'yellow',
    [LeadStage.WON]: 'green',
    [LeadStage.LOST]: 'red',
    [LeadStage.ARCHIVED]: 'gray',
  };
  return colors[stage];
};

