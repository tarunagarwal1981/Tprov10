/**
 * TypeScript Type Definitions
 * Comprehensive type definitions for the travel booking application
 */

// ============================================================================
// CORE USER TYPES
// ============================================================================

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TOUR_OPERATOR' | 'TRAVEL_AGENT' | 'SUB_AGENT' | 'OPERATIONS' | 'SALES' | 'USER';

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

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// ============================================================================
// LOCATION AND GEOGRAPHY TYPES
// ============================================================================

export interface Location {
  id: string;
  name: string;
  type: 'CITY' | 'COUNTRY' | 'REGION' | 'LANDMARK';
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
  description?: string;
}

export interface Destination {
  id: string;
  name: string;
  location: Location;
  description: string;
  highlights: string[];
  best_time_to_visit: string[];
  images: string[];
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// CONTACT AND COMMUNICATION TYPES
// ============================================================================

export interface ContactInfo {
  email: string;
  phone: string;
  website?: string;
  address: string;
  city: string;
  country: string;
  postal_code?: string;
}

// ============================================================================
// ACTIVITY TYPES
// ============================================================================

export type ActivityCategory = 
  | 'ADVENTURE' 
  | 'CULTURAL' 
  | 'NATURE' 
  | 'SPORTS' 
  | 'ENTERTAINMENT' 
  | 'EDUCATIONAL' 
  | 'RELAXATION' 
  | 'FOOD_DRINK' 
  | 'SHOPPING' 
  | 'NIGHTLIFE';

export type DifficultyLevel = 'EASY' | 'MODERATE' | 'CHALLENGING' | 'EXPERT';

export interface Activity {
  id: string;
  name: string;
  description: string;
  location: Location;
  duration: number; // in hours
  category: ActivityCategory;
  difficulty_level: DifficultyLevel;
  price_per_person: number;
  max_participants: number;
  includes: string[];
  excludes: string[];
  requirements: string[];
  images: string[];
  contact_info: ContactInfo;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// HOTEL TYPES
// ============================================================================

export type HotelCategory = 'BUDGET' | 'STANDARD' | 'DELUXE' | 'LUXURY' | 'PREMIUM';

export interface HotelPolicies {
  check_in_time: string;
  check_out_time: string;
  cancellation_policy: string;
  pet_policy?: string;
  smoking_policy?: string;
  age_restrictions?: string;
}

export interface Hotel {
  id: string;
  name: string;
  location: Location;
  category: HotelCategory;
  rating: number;
  amenities: string[];
  description: string;
  images: string[];
  contact_info: ContactInfo;
  policies: HotelPolicies;
  created_at: Date;
  updated_at: Date;
}

export type RoomType = 'SINGLE' | 'DOUBLE' | 'TWIN' | 'SUITE' | 'FAMILY';

export interface RoomDetails {
  room_type: RoomType;
  bed_type: string;
  amenities: string[];
  price_per_night: number;
}

export type MealPlan = 'ROOM_ONLY' | 'BED_BREAKFAST' | 'HALF_BOARD' | 'FULL_BOARD' | 'ALL_INCLUSIVE';

// ============================================================================
// TRANSPORT TYPES
// ============================================================================

export interface TransportDetails {
  type: 'FLIGHT' | 'TRAIN' | 'BUS' | 'CAR' | 'BOAT';
  departure_location: Location;
  arrival_location: Location;
  departure_time: Date;
  arrival_time: Date;
  duration: number; // in minutes
  price_per_person: number;
  booking_reference?: string;
  notes?: string;
}

// ============================================================================
// PACKAGE TYPES
// ============================================================================

export interface BasePackage {
  id: string;
  name: string;
  description: string;
  destination: Destination;
  duration_days: number;
  price_per_person: number;
  min_participants: number;
  max_participants: number;
  includes: string[];
  excludes: string[];
  cancellation_policy: string;
  booking_deadline: Date;
  departure_dates: Date[];
  images: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CityItinerary {
  city: Location;
  nights: number;
  hotels?: Hotel[];
  activities: Activity[];
  transport_between_cities?: TransportDetails;
}

export interface MultiCityPackage extends BasePackage {
  type: 'MULTI_CITY_PACKAGE';
  cities: CityItinerary[];
  transport_included: boolean;
  transport_details?: TransportDetails;
}

export interface MultiCityHotelPackage extends BasePackage {
  type: 'MULTI_CITY_PACKAGE_WITH_HOTEL';
  cities: CityItinerary[];
  transport_included: boolean;
  transport_details?: TransportDetails;
  hotel_category: HotelCategory;
  room_types: RoomType[];
  meal_plan: MealPlan;
}

export interface FixedDeparturePackage extends BasePackage {
  type: 'FIXED_DEPARTURE_PACKAGE';
  departure_location: Location;
  return_location: Location;
  transport_included: boolean;
  transport_details?: TransportDetails;
}

export interface FixedDepartureWithFlightPackage extends BasePackage {
  type: 'FIXED_DEPARTURE_WITH_FLIGHT_PACKAGE';
  departure_location: Location;
  return_location: Location;
  flight_details: TransportDetails;
  hotel_category: HotelCategory;
  room_types: RoomType[];
  meal_plan: MealPlan;
}

export interface LandPackage extends BasePackage {
  type: 'LAND_PACKAGE';
  accommodation?: Hotel;
  transport_included: boolean;
  transport_details?: TransportDetails;
}

export interface HotelPackage extends BasePackage {
  type: 'HOTEL_PACKAGE';
  hotel: Hotel;
  room_types: RoomType[];
  meal_plan: MealPlan;
  hotel_category: HotelCategory;
}

export interface ActivityPackage extends BasePackage {
  type: 'ACTIVITY_PACKAGE';
  activities: Activity[];
  transport_included: boolean;
  transport_details?: TransportDetails;
}

export interface AccommodationInfo {
  hotel: Hotel;
  nights: number;
  room_type: string;
  meal_plan: MealPlan;
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  user_id: string;
  package_id: string;
  package_type: string;
  participants: number;
  total_price: number;
  status: BookingStatus;
  booking_date: Date;
  travel_date: Date;
  special_requests?: string;
  contact_info: ContactInfo;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// TOUR OPERATOR TYPES
// ============================================================================

export interface TourOperator {
  id: string;
  user_id: string;
  company_name: string;
  license_number: string;
  contact_info: ContactInfo;
  specialties: string[];
  commission_rates: CommissionRates;
  company_details: CompanyDetails;
  licenses: License[];
  certifications: Certification[];
  created_at: Date;
  updated_at: Date;
}

export interface CompanyDetails {
  legal_name: string;
  registration_number: string;
  tax_id: string;
  address: Address;
  website: string;
  established_year: number;
  employee_count: number;
}

export interface CommissionRates {
  standard_rate: number;
  volume_discounts: {
    min_bookings: number;
    discount_percentage: number;
  }[];
  special_rates: {
    package_type: string;
    rate: number;
  }[];
}

export interface License {
  type: string;
  number: string;
  issuing_authority: string;
  issue_date: Date;
  expiry_date: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
}

export interface Certification {
  name: string;
  issuing_organization: string;
  issue_date: Date;
  expiry_date?: Date;
  credential_id: string;
}

// ============================================================================
// TRAVEL AGENT TYPES
// ============================================================================

export interface TravelAgent {
  id: string;
  user_id: string;
  agency_name: string;
  license_number: string;
  contact_info: ContactInfo;
  specialties: string[];
  commission_rates: CommissionRates;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// UNION TYPES
// ============================================================================

export type Package = 
  | MultiCityPackage
  | MultiCityHotelPackage
  | FixedDeparturePackage
  | FixedDepartureWithFlightPackage
  | LandPackage
  | HotelPackage
  | ActivityPackage;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isMultiCityPackage = (pkg: Package): pkg is MultiCityPackage => 
  pkg.type === 'MULTI_CITY_PACKAGE';

export const isMultiCityHotelPackage = (pkg: Package): pkg is MultiCityHotelPackage => 
  pkg.type === 'MULTI_CITY_PACKAGE_WITH_HOTEL';

export const isFixedDeparturePackage = (pkg: Package): pkg is FixedDeparturePackage => 
  pkg.type === 'FIXED_DEPARTURE_PACKAGE';

export const isFixedDepartureWithFlightPackage = (pkg: Package): pkg is FixedDepartureWithFlightPackage => 
  pkg.type === 'FIXED_DEPARTURE_WITH_FLIGHT_PACKAGE';

export const isLandPackage = (pkg: Package): pkg is LandPackage => 
  pkg.type === 'LAND_PACKAGE';

export const isHotelPackage = (pkg: Package): pkg is HotelPackage => 
  pkg.type === 'HOTEL_PACKAGE';

export const isActivityPackage = (pkg: Package): pkg is ActivityPackage => 
  pkg.type === 'ACTIVITY_PACKAGE';

// ============================================================================
// DATABASE TYPES (for AWS Lambda Database Service)
// ============================================================================
// Note: Database operations are handled via AWS Lambda database service
// Types are defined inline in API routes and services