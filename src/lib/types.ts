/**
 * Comprehensive TypeScript interfaces for Travel Booking Platform
 * This file contains all type definitions for the entire system
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * User roles in the system
 */
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TOUR_OPERATOR' | 'TRAVEL_AGENT';

/**
 * Address information
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * User profile information
 */
export interface UserProfile {
  address?: Address;
  timezone: string;
  language: string;
  currency: string;
  notification_preferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
  };
}

/**
 * Core user interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profile: UserProfile;
  preferences: Record<string, any>;
  avatar_url?: string;
  phone?: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// TOUR OPERATOR TYPES
// ============================================================================

/**
 * Company details for tour operators
 */
export interface CompanyDetails {
  registration_number: string;
  tax_id: string;
  business_type: string;
  year_established: number;
  description: string;
  website?: string;
  social_media: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

/**
 * Commission rates structure
 */
export interface CommissionRates {
  default_rate: number; // percentage
  agent_specific_rates: Record<string, number>; // agent_id -> rate
  package_type_rates: Record<string, number>; // package_type -> rate
}

/**
 * License information
 */
export interface License {
  type: string;
  number: string;
  expiry_date: Date;
  document_url: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'REJECTED';
}

/**
 * Certification information
 */
export interface Certification {
  name: string;
  issuer: string;
  issue_date: Date;
  expiry_date: Date;
  certificate_url: string;
}

/**
 * Tour operator interface
 */
export interface TourOperator {
  id: string;
  user_id: string;
  company_name: string;
  company_details: CompanyDetails;
  commission_rates: CommissionRates;
  licenses: License[];
  certifications: Certification[];
  is_verified: boolean;
  rating: number;
  review_count: number;
  total_packages: number;
  total_bookings: number;
}

// ============================================================================
// TRAVEL AGENT TYPES
// ============================================================================

/**
 * Agency details for travel agents
 */
export interface AgencyDetails {
  registration_number: string;
  specialization: string[];
  team_size: number;
  description: string;
}

/**
 * Travel agent interface
 */
export interface TravelAgent {
  id: string;
  user_id: string;
  agency_name: string;
  agency_details: AgencyDetails;
  total_bookings: number;
  total_revenue: number;
  commission_earned: number;
  rating: number;
}

// ============================================================================
// PACKAGE TYPES
// ============================================================================

/**
 * Package type enumeration
 */
export type PackageType = 
  | 'ACTIVITY'
  | 'TRANSFERS'
  | 'MULTI_CITY_PACKAGE'
  | 'MULTI_CITY_PACKAGE_WITH_HOTEL'
  | 'FIXED_DEPARTURE_WITH_FLIGHT'
  | 'LAND_PACKAGE'
  | 'CRUISE_PACKAGE'
  | 'HOTEL_ONLY'
  | 'FLIGHT_ONLY'
  | 'CUSTOM_PACKAGE';

/**
 * Package status enumeration
 */
export type PackageStatus = 
  | 'DRAFT'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'ARCHIVED'
  | 'PENDING_REVIEW';

/**
 * Difficulty levels
 */
export type DifficultyLevel = 'EASY' | 'MODERATE' | 'CHALLENGING' | 'EXPERT';

/**
 * Base package interface with common fields
 */
export interface BasePackage {
  id: string;
  tour_operator_id: string;
  title: string;
  description: string;
  short_description: string;
  type: PackageType;
  status: PackageStatus;
  featured_image: string;
  image_gallery: string[];
  pricing: PackagePricing;
  rating: number;
  review_count: number;
  booking_count: number;
  view_count: number;
  tags: string[];
  destination: Location;
  duration: number; // in days
  max_group_size: number;
  min_age: number;
  max_age: number;
  difficulty_level: DifficultyLevel;
  languages: string[];
  inclusions: string[];
  exclusions: string[];
  important_info: string[];
  cancellation_policy: string;
  terms_conditions: string;
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
}

// ============================================================================
// ACTIVITY PACKAGE SPECIFIC TYPES
// ============================================================================

/**
 * Time slot for activities
 */
export interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  available_spots: number;
}

/**
 * Operational hours for activities
 */
export interface OperationalHours {
  days: string[]; // ['monday', 'tuesday', etc.]
  start_time: string;
  end_time: string;
  time_slots: TimeSlot[];
}

/**
 * Package variant for different options
 */
export interface PackageVariant {
  id: string;
  name: string;
  description: string;
  price_adjustment: number; // can be negative for discounts
  features: string[];
  max_capacity: number;
}

/**
 * Age restrictions for activities
 */
export interface AgeRestrictions {
  min_age: number;
  max_age: number;
  child_policy: string;
  infant_policy: string;
}

/**
 * Accessibility information
 */
export interface Accessibility {
  wheelchair_accessible: boolean;
  facilities: string[];
  special_assistance: string[];
}

/**
 * FAQ item
 */
export interface FAQ {
  question: string;
  answer: string;
  category: string;
}

/**
 * Activity package extending base package
 */
export interface ActivityPackage extends BasePackage {
  type: 'ACTIVITY';
  operational_hours: OperationalHours;
  variants: PackageVariant[];
  age_restrictions: AgeRestrictions;
  accessibility: Accessibility;
  faq: FAQ[];
}

// ============================================================================
// TRANSFER PACKAGE SPECIFIC TYPES
// ============================================================================

/**
 * Vehicle types for transfers
 */
export type VehicleType = 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS';

/**
 * Transfer types
 */
export type TransferType = 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_STOP';

/**
 * Vehicle configuration
 */
export interface VehicleConfig {
  type: VehicleType;
  name: string;
  capacity: number;
  luggage_capacity: number;
  features: string[];
  pricing: {
    base_price: number;
    per_hour_rate?: number;
    per_km_rate?: number;
  };
  images: string[];
  description: string;
}

/**
 * Driver information
 */
export interface DriverInfo {
  language: string[];
  uniform: boolean;
  meet_greet: boolean;
  flight_tracking: boolean;
}

/**
 * Transfer package extending base package
 */
export interface TransferPackage extends BasePackage {
  type: 'TRANSFERS';
  vehicle_configs: VehicleConfig[];
  transfer_type: TransferType;
  pickup_locations: Location[];
  dropoff_locations: Location[];
  stop_points: Location[]; // for multi-stop transfers
  driver_info: DriverInfo;
}

// ============================================================================
// MULTI-CITY PACKAGE TYPES
// ============================================================================

/**
 * Transport details between cities
 */
export interface TransportDetails {
  type: 'FLIGHT' | 'TRAIN' | 'BUS' | 'PRIVATE_VEHICLE';
  class: string;
  provider: string;
}

/**
 * City itinerary for multi-city packages
 */
export interface CityItinerary {
  city: Location;
  nights: number;
  hotels?: Hotel[]; // if with hotel package
  activities: Activity[];
  transport_between_cities?: TransportDetails;
}

/**
 * Multi-city package extending base package
 */
export interface MultiCityPackage extends BasePackage {
  type: 'MULTI_CITY_PACKAGE';
  cities: CityItinerary[];
  transport_included: boolean;
  transport_details?: TransportDetails;
}

// ============================================================================
// MULTI-CITY WITH HOTEL PACKAGE TYPES
// ============================================================================

/**
 * Hotel categories
 */
export type HotelCategory = 'BUDGET' | 'STANDARD' | 'DELUXE' | 'LUXURY' | 'PREMIUM';

/**
 * Meal plans
 */
export type MealPlan = 'ROOM_ONLY' | 'BREAKFAST' | 'HALF_BOARD' | 'FULL_BOARD' | 'ALL_INCLUSIVE';

/**
 * Room type information
 */
export interface RoomType {
  name: string;
  capacity: number;
  bed_type: string;
  amenities: string[];
  price_per_night: number;
}

/**
 * Multi-city package with hotel extending multi-city package
 */
export interface MultiCityHotelPackage extends MultiCityPackage {
  type: 'MULTI_CITY_PACKAGE_WITH_HOTEL';
  hotel_category: HotelCategory;
  room_types: RoomType[];
  meal_plan: MealPlan;
}

// ============================================================================
// FIXED DEPARTURE WITH FLIGHT PACKAGE TYPES
// ============================================================================

/**
 * Departure date information
 */
export interface DepartureDate {
  date: Date;
  available_seats: number;
  price: number;
  status: 'AVAILABLE' | 'FULL' | 'CANCELLED';
  cutoff_date: Date;
}

/**
 * Flight details
 */
export interface FlightDetails {
  airline: string;
  flight_number: string;
  class: 'ECONOMY' | 'BUSINESS' | 'FIRST';
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
  baggage_allowance: string;
  meal_service: boolean;
}

/**
 * Group size information
 */
export interface GroupSize {
  min: number;
  max: number;
  current_bookings: number;
}

/**
 * Group discount structure
 */
export interface GroupDiscount {
  min_people: number;
  discount_percentage: number;
}

/**
 * Fixed departure package extending base package
 */
export interface FixedDeparturePackage extends BasePackage {
  type: 'FIXED_DEPARTURE_WITH_FLIGHT';
  departure_dates: DepartureDate[];
  flight_details: FlightDetails;
  group_size: GroupSize;
  tour_leader: boolean;
  group_discounts: GroupDiscount[];
}

// ============================================================================
// LAND PACKAGE TYPES
// ============================================================================

/**
 * Itinerary day information
 */
export interface ItineraryDay {
  day_number: number;
  title: string;
  description: string;
  activities: Activity[];
  meals: string[];
  accommodation?: Hotel;
  transport?: TransportDetails;
}

/**
 * Transport information throughout the package
 */
export interface TransportInfo {
  type: string;
  details: string;
  included: boolean;
}

/**
 * Accommodation information
 */
export interface AccommodationInfo {
  hotel: Hotel;
  nights: number;
  room_type: string;
  meal_plan: MealPlan;
}

/**
 * Land package extending base package
 */
export interface LandPackage extends BasePackage {
  type: 'LAND_PACKAGE';
  destinations: Destination[];
  itinerary: ItineraryDay[];
  transport_throughout: TransportInfo;
  accommodation_details: AccommodationInfo[];
}

// ============================================================================
// CRUISE PACKAGE TYPES
// ============================================================================

/**
 * Port information
 */
export interface Port {
  name: string;
  country: string;
  arrival_time: string;
  departure_time: string;
  shore_excursions: Activity[];
}

/**
 * Cabin type information
 */
export interface CabinType {
  category: string;
  deck: string;
  occupancy: number;
  amenities: string[];
  price: number;
}

/**
 * Cruise package extending base package
 */
export interface CruisePackage extends BasePackage {
  type: 'CRUISE_PACKAGE';
  cruise_line: string;
  ship_name: string;
  cruise_duration: number;
  ports_of_call: Port[];
  cabin_types: CabinType[];
  dining_options: string[];
  onboard_activities: string[];
}

// ============================================================================
// HOTEL ONLY PACKAGE TYPES
// ============================================================================

/**
 * Hotel package extending base package
 */
export interface HotelPackage extends BasePackage {
  type: 'HOTEL_ONLY';
  hotel_name: string;
  hotel_rating: number; // 1-5
  hotel_category: HotelCategory;
  location: Location;
  room_types: RoomType[];
  amenities: string[];
  check_in_time: string;
  check_out_time: string;
  meal_plans: MealPlan[];
}

// ============================================================================
// FLIGHT ONLY PACKAGE TYPES
// ============================================================================

/**
 * Flight types
 */
export type FlightType = 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_CITY';

/**
 * Flight segment information
 */
export interface FlightSegment {
  airline: string;
  flight_number: string;
  departure: {
    airport: string;
    city: string;
    time: string;
    terminal?: string;
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
    terminal?: string;
  };
  duration: number; // in minutes
  stops: number;
}

/**
 * Class option information
 */
export interface ClassOption {
  class: 'ECONOMY' | 'BUSINESS' | 'FIRST';
  price: number;
  availability: number;
  baggage: string;
}

/**
 * Flight package extending base package
 */
export interface FlightPackage extends BasePackage {
  type: 'FLIGHT_ONLY';
  flight_type: FlightType;
  segments: FlightSegment[];
  class_options: ClassOption[];
}

// ============================================================================
// CUSTOM PACKAGE TYPES
// ============================================================================

/**
 * Package component types
 */
export type ComponentType = 'FLIGHT' | 'HOTEL' | 'ACTIVITY' | 'TRANSFER';

/**
 * Package component information
 */
export interface PackageComponent {
  type: ComponentType;
  details: Record<string, any>;
  price: number;
  optional: boolean;
}

/**
 * Customization option
 */
export interface CustomizationOption {
  name: string;
  description: string;
  price_impact: number;
  available: boolean;
}

/**
 * Custom package extending base package
 */
export interface CustomPackage extends BasePackage {
  type: 'CUSTOM_PACKAGE';
  components: PackageComponent[];
  fully_customizable: boolean;
  base_price: number;
  customization_options: CustomizationOption[];
}

// ============================================================================
// BOOKING SYSTEM TYPES
// ============================================================================

/**
 * Booking status enumeration
 */
export type BookingStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED';

/**
 * Traveler information
 */
export interface Traveler {
  first_name: string;
  last_name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  passport_number?: string;
  nationality: string;
  email: string;
  phone?: string;
  special_requirements?: string[];
}

/**
 * Booking pricing breakdown
 */
export interface BookingPricing {
  base_price: number;
  taxes: number;
  fees: number;
  discounts: number;
  agent_markup: number;
  total_price: number;
  currency: string;
  payment_method: string;
  commission_amount: number;
}

/**
 * Main booking interface
 */
export interface Booking {
  id: string;
  package_id: string;
  user_id: string; // customer
  travel_agent_id?: string;
  operator_id: string;
  booking_reference: string;
  status: BookingStatus;
  travelers: Traveler[];
  pricing: BookingPricing;
  booking_date: Date;
  travel_date: Date;
  created_at: Date;
  updated_at: Date;
  special_requests?: string[];
  notes?: string;
  cancellation_reason?: string;
}

// ============================================================================
// LOCATION & DESTINATION TYPES
// ============================================================================

/**
 * Location interface
 */
export interface Location {
  country: string;
  state: string;
  city: string;
  address: string;
  postal_code: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timezone: string;
  formatted_address: string;
}

/**
 * Destination interface
 */
export interface Destination {
  id: string;
  name: string;
  country: string;
  city: string;
  description: string;
  highlights: string[];
  best_time_to_visit: string[];
  weather_info: string;
  popular_activities: string[];
  images: string[];
  rating: number;
  visit_count: number;
}

// ============================================================================
// REVIEWS & RATINGS TYPES
// ============================================================================

/**
 * Review interface
 */
export interface Review {
  id: string;
  package_id: string;
  user_id: string;
  booking_id: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  pros: string[];
  cons: string[];
  images: string[];
  helpful_count: number;
  verified_booking: boolean;
  created_at: Date;
  response?: {
    operator_id: string;
    comment: string;
    responded_at: Date;
  };
}

// ============================================================================
// LEADS & CRM TYPES
// ============================================================================

/**
 * Lead status enumeration
 */
export type LeadStatus = 
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

/**
 * Lead interface
 */
export interface Lead {
  id: string;
  agent_id: string;
  customer_name: string;
  email: string;
  phone?: string;
  source: string;
  status: LeadStatus;
  budget: number;
  destination: string;
  travel_dates: {
    start: Date;
    end: Date;
  };
  requirements: string[];
  notes: string[];
  lead_score: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigned_date: Date;
  last_contact: Date;
  next_follow_up: Date;
}

// ============================================================================
// ITINERARY TYPES
// ============================================================================

/**
 * Itinerary package information
 */
export interface ItineraryPackage {
  package_id: string;
  package_type: PackageType;
  start_date: Date;
  end_date: Date;
  price: number;
}

/**
 * Custom itinerary item
 */
export interface CustomItem {
  name: string;
  description: string;
  date: Date;
  price: number;
  type: 'ACTIVITY' | 'ACCOMMODATION' | 'TRANSPORT' | 'MEAL';
}

/**
 * Itinerary interface
 */
export interface Itinerary {
  id: string;
  agent_id: string;
  lead_id: string;
  title: string;
  description: string;
  total_days: number;
  total_price: number;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';
  packages: ItineraryPackage[];
  custom_items: CustomItem[];
  created_at: Date;
  sent_to_customer_at?: Date;
  approved_at?: Date;
}

/**
 * Detailed itinerary day
 */
export interface ItineraryDay {
  day_number: number;
  date: Date;
  activities: Activity[];
  accommodation?: Hotel;
  meals: string[];
  transport?: TransportDetails;
  notes: string[];
  start_time: string;
  end_time: string;
}

// ============================================================================
// PRICING STRUCTURES
// ============================================================================

/**
 * Seasonal pricing
 */
export interface SeasonalPrice {
  season: string;
  start_date: Date;
  end_date: Date;
  price_multiplier: number; // 1.0 = base price, 1.2 = 20% increase
}

/**
 * Discount types
 */
export type DiscountType = 'EARLY_BIRD' | 'LAST_MINUTE' | 'GROUP' | 'LOYALTY' | 'CUSTOM';

/**
 * Discount interface
 */
export interface Discount {
  type: DiscountType;
  value: number;
  value_type: 'PERCENTAGE' | 'FIXED';
  conditions: string[];
  valid_from: Date;
  valid_until: Date;
}

/**
 * Package pricing structure
 */
export interface PackagePricing {
  base_price: number;
  currency: string;
  price_per_person: number;
  price_per_group: number;
  child_price: number;
  infant_price: number;
  senior_price: number;
  seasonal_pricing: SeasonalPrice[];
  discounts: Discount[];
  dynamic_pricing_enabled: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

/**
 * Theme types
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Component props
 */
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Form field props
 */
export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

/**
 * Search filters
 */
export interface SearchFilters {
  destination?: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  rooms?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  amenities?: string[];
  rating?: number;
}

// ============================================================================
// TYPE UNIONS AND UTILITIES
// ============================================================================

/**
 * Union type for all package types
 */
export type Package = 
  | ActivityPackage
  | TransferPackage
  | MultiCityPackage
  | MultiCityHotelPackage
  | FixedDeparturePackage
  | LandPackage
  | CruisePackage
  | HotelPackage
  | FlightPackage
  | CustomPackage;

/**
 * Type guards for package types
 */
export const isActivityPackage = (pkg: Package): pkg is ActivityPackage => 
  pkg.type === 'ACTIVITY';

export const isTransferPackage = (pkg: Package): pkg is TransferPackage => 
  pkg.type === 'TRANSFERS';

export const isMultiCityPackage = (pkg: Package): pkg is MultiCityPackage => 
  pkg.type === 'MULTI_CITY_PACKAGE';

export const isMultiCityHotelPackage = (pkg: Package): pkg is MultiCityHotelPackage => 
  pkg.type === 'MULTI_CITY_PACKAGE_WITH_HOTEL';

export const isFixedDeparturePackage = (pkg: Package): pkg is FixedDeparturePackage => 
  pkg.type === 'FIXED_DEPARTURE_WITH_FLIGHT';

export const isLandPackage = (pkg: Package): pkg is LandPackage => 
  pkg.type === 'LAND_PACKAGE';

export const isCruisePackage = (pkg: Package): pkg is CruisePackage => 
  pkg.type === 'CRUISE_PACKAGE';

export const isHotelPackage = (pkg: Package): pkg is HotelPackage => 
  pkg.type === 'HOTEL_ONLY';

export const isFlightPackage = (pkg: Package): pkg is FlightPackage => 
  pkg.type === 'FLIGHT_ONLY';

export const isCustomPackage = (pkg: Package): pkg is CustomPackage => 
  pkg.type === 'CUSTOM_PACKAGE';

// ============================================================================
// EXPORTS
// ============================================================================

// Export all types for easy importing
export type {
  // Core types
  User,
  UserRole,
  UserProfile,
  Address,
  
  // Tour operator types
  TourOperator,
  CompanyDetails,
  CommissionRates,
  License,
  Certification,
  
  // Travel agent types
  TravelAgent,
  AgencyDetails,
  
  // Package types
  BasePackage,
  PackageType,
  PackageStatus,
  DifficultyLevel,
  
  // Activity package
  ActivityPackage,
  TimeSlot,
  OperationalHours,
  PackageVariant,
  AgeRestrictions,
  Accessibility,
  FAQ,
  
  // Transfer package
  TransferPackage,
  VehicleType,
  TransferType,
  VehicleConfig,
  DriverInfo,
  
  // Multi-city packages
  MultiCityPackage,
  MultiCityHotelPackage,
  CityItinerary,
  TransportDetails,
  HotelCategory,
  MealPlan,
  RoomType,
  
  // Fixed departure package
  FixedDeparturePackage,
  DepartureDate,
  FlightDetails,
  GroupSize,
  GroupDiscount,
  
  // Land package
  LandPackage,
  ItineraryDay,
  TransportInfo,
  AccommodationInfo,
  
  // Cruise package
  CruisePackage,
  Port,
  CabinType,
  
  // Hotel package
  HotelPackage,
  
  // Flight package
  FlightPackage,
  FlightType,
  FlightSegment,
  ClassOption,
  
  // Custom package
  CustomPackage,
  ComponentType,
  PackageComponent,
  CustomizationOption,
  
  // Booking system
  Booking,
  BookingStatus,
  Traveler,
  BookingPricing,
  
  // Location & destination
  Location,
  Destination,
  
  // Reviews
  Review,
  
  // Leads & CRM
  Lead,
  LeadStatus,
  
  // Itinerary
  Itinerary,
  ItineraryPackage,
  CustomItem,
  
  // Pricing
  PackagePricing,
  SeasonalPrice,
  DiscountType,
  Discount,
  
  // Utility types
  ApiResponse,
  Theme,
  ComponentProps,
  FormFieldProps,
  SearchFilters,
};