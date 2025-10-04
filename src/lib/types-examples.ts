/**
 * Quick Reference Guide for Travel Booking Platform Types
 * This file provides examples and usage patterns for the comprehensive type system
 */

import type {
  User,
  UserRole,
  TourOperator,
  TravelAgent,
  Package,
  ActivityPackage,
  TransferPackage,
  MultiCityPackage,
  MultiCityHotelPackage,
  FixedDeparturePackage,
  LandPackage,
  CruisePackage,
  HotelPackage,
  FlightPackage,
  CustomPackage,
  Booking,
  Lead,
  Itinerary,
  PackagePricing,
  Location,
  Destination,
  Review,
} from './types';

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Creating a new user
 */
export const createUserExample = (): Partial<User> => ({
  email: 'user@example.com',
  name: 'John Doe',
  role: 'TRAVEL_AGENT',
  profile: {
    timezone: 'UTC',
    language: 'en',
    currency: 'USD',
    notification_preferences: {
      email: true,
      sms: false,
      push: true,
      marketing: false,
    },
  },
  phone: '+1234567890',
});

/**
 * Example: Creating a tour operator
 */
export const createTourOperatorExample = (): Partial<TourOperator> => ({
  company_name: 'Adventure Tours Inc.',
  company_details: {
    registration_number: 'REG123456',
    tax_id: 'TAX789012',
    business_type: 'Tour Operator',
    year_established: 2010,
    description: 'Leading adventure tour operator',
    website: 'https://adventuretours.com',
    social_media: {
      facebook: 'https://facebook.com/adventuretours',
      instagram: 'https://instagram.com/adventuretours',
    },
  },
  commission_rates: {
    default_rate: 15,
    agent_specific_rates: {},
    package_type_rates: {
      ACTIVITY: 20,
      LAND_PACKAGE: 12,
    },
  },
  is_verified: true,
});

/**
 * Example: Creating an activity package
 */
export const createActivityPackageExample = (): Partial<ActivityPackage> => ({
  title: 'Mountain Hiking Adventure',
  type: 'ACTIVITY',
  status: 'ACTIVE',
  description: 'A thrilling mountain hiking experience',
  short_description: 'Hike through scenic mountain trails',
  duration: 1,
  max_group_size: 12,
  min_age: 16,
  max_age: 65,
  difficulty_level: 'MODERATE',
  languages: ['English', 'Spanish'],
  inclusions: ['Professional guide', 'Equipment rental', 'Lunch'],
  exclusions: ['Transportation to starting point', 'Personal items'],
  operational_hours: {
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    start_time: '08:00',
    end_time: '17:00',
    time_slots: [
      {
        id: 'slot1',
        start_time: '08:00',
        end_time: '12:00',
        capacity: 12,
        available_spots: 8,
      },
    ],
  },
  variants: [
    {
      id: 'vip',
      name: 'VIP Experience',
      description: 'Private guide and premium equipment',
      price_adjustment: 100,
      features: ['Private guide', 'Premium equipment', 'Photo service'],
      max_capacity: 4,
    },
  ],
  age_restrictions: {
    min_age: 16,
    max_age: 65,
    child_policy: 'Children under 16 not permitted',
    infant_policy: 'Infants not permitted',
  },
  accessibility: {
    wheelchair_accessible: false,
    facilities: ['Restroom', 'Parking'],
    special_assistance: ['Walking sticks available'],
  },
  faq: [
    {
      question: 'What should I bring?',
      answer: 'Comfortable hiking boots, water bottle, and sunscreen',
      category: 'Preparation',
    },
  ],
});

/**
 * Example: Creating a transfer package
 */
export const createTransferPackageExample = (): Partial<TransferPackage> => ({
  title: 'Airport Transfer Service',
  type: 'TRANSFERS',
  status: 'ACTIVE',
  description: 'Reliable airport transfer service',
  transfer_type: 'ONE_WAY',
  vehicle_configs: [
    {
      type: 'SEDAN',
      name: 'Standard Sedan',
      capacity: 4,
      luggage_capacity: 2,
      features: ['Air conditioning', 'WiFi', 'Water bottles'],
      pricing: {
        base_price: 50,
        per_hour_rate: 25,
      },
      images: ['sedan1.jpg', 'sedan2.jpg'],
      description: 'Comfortable sedan for up to 4 passengers',
    },
  ],
  driver_info: {
    language: ['English', 'Spanish'],
    uniform: true,
    meet_greet: true,
    flight_tracking: true,
  },
});

/**
 * Example: Creating a multi-city package
 */
export const createMultiCityPackageExample = (): Partial<MultiCityPackage> => ({
  title: 'European Grand Tour',
  type: 'MULTI_CITY_PACKAGE',
  status: 'ACTIVE',
  description: 'Explore multiple European cities',
  duration: 14,
  cities: [
    {
      city: {
        country: 'France',
        state: 'Île-de-France',
        city: 'Paris',
        address: 'Paris, France',
        postal_code: '75001',
        coordinates: { lat: 48.8566, lng: 2.3522 },
        timezone: 'Europe/Paris',
        formatted_address: 'Paris, France',
      },
      nights: 3,
      activities: [],
      transport_between_cities: {
        type: 'TRAIN',
        class: 'Standard',
        provider: 'SNCF',
      },
    },
  ],
  transport_included: true,
});

/**
 * Example: Creating a booking
 */
export const createBookingExample = (): Partial<Booking> => ({
  package_id: 'pkg123',
  user_id: 'user456',
  travel_agent_id: 'agent789',
  operator_id: 'operator101',
  booking_reference: 'BK2024001',
  status: 'CONFIRMED',
  travelers: [
    {
      first_name: 'John',
      last_name: 'Doe',
      age: 30,
      gender: 'MALE',
      passport_number: 'P123456789',
      nationality: 'US',
      email: 'john@example.com',
      phone: '+1234567890',
    },
  ],
  pricing: {
    base_price: 500,
    taxes: 50,
    fees: 25,
    discounts: 0,
    agent_markup: 75,
    total_price: 650,
    currency: 'USD',
    payment_method: 'CREDIT_CARD',
    commission_amount: 75,
  },
  booking_date: new Date(),
  travel_date: new Date('2024-06-15'),
  special_requests: ['Vegetarian meals', 'Window seat'],
});

/**
 * Example: Creating a lead
 */
export const createLeadExample = (): Partial<Lead> => ({
  agent_id: 'agent123',
  customer_name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+1987654321',
  source: 'Website',
  status: 'NEW',
  budget: 5000,
  destination: 'Europe',
  travel_dates: {
    start: new Date('2024-07-01'),
    end: new Date('2024-07-15'),
  },
  requirements: ['Beach destinations', 'Family-friendly', 'All-inclusive'],
  notes: ['First-time international traveler'],
  lead_score: 85,
  priority: 'HIGH',
  assigned_date: new Date(),
  last_contact: new Date(),
  next_follow_up: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
});

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Type guard to check if a package is an activity package
 */
export function isActivityPackage(pkg: Package): pkg is ActivityPackage {
  return pkg.type === 'ACTIVITY';
}

/**
 * Type guard to check if a package is a transfer package
 */
export function isTransferPackage(pkg: Package): pkg is TransferPackage {
  return pkg.type === 'TRANSFERS';
}

/**
 * Type guard to check if a package is a multi-city package
 */
export function isMultiCityPackage(pkg: Package): pkg is MultiCityPackage {
  return pkg.type === 'MULTI_CITY_PACKAGE';
}

/**
 * Type guard to check if a package is a multi-city hotel package
 */
export function isMultiCityHotelPackage(pkg: Package): pkg is MultiCityHotelPackage {
  return pkg.type === 'MULTI_CITY_PACKAGE_WITH_HOTEL';
}

/**
 * Type guard to check if a package is a fixed departure package
 */
export function isFixedDeparturePackage(pkg: Package): pkg is FixedDeparturePackage {
  return pkg.type === 'FIXED_DEPARTURE_WITH_FLIGHT';
}

/**
 * Type guard to check if a package is a land package
 */
export function isLandPackage(pkg: Package): pkg is LandPackage {
  return pkg.type === 'LAND_PACKAGE';
}

/**
 * Type guard to check if a package is a cruise package
 */
export function isCruisePackage(pkg: Package): pkg is CruisePackage {
  return pkg.type === 'CRUISE_PACKAGE';
}

/**
 * Type guard to check if a package is a hotel package
 */
export function isHotelPackage(pkg: Package): pkg is HotelPackage {
  return pkg.type === 'HOTEL_ONLY';
}

/**
 * Type guard to check if a package is a flight package
 */
export function isFlightPackage(pkg: Package): pkg is FlightPackage {
  return pkg.type === 'FLIGHT_ONLY';
}

/**
 * Type guard to check if a package is a custom package
 */
export function isCustomPackage(pkg: Package): pkg is CustomPackage {
  return pkg.type === 'CUSTOM_PACKAGE';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate total price for a package with pricing details
 */
export function calculatePackagePrice(pricing: PackagePricing, travelers: number): number {
  let totalPrice = pricing.base_price * travelers;
  
  // Apply seasonal pricing if applicable
  const currentDate = new Date();
  const seasonalPrice = pricing.seasonal_pricing.find(
    (sp) => currentDate >= sp.valid_from && currentDate <= sp.valid_until
  );
  
  if (seasonalPrice) {
    totalPrice *= seasonalPrice.price_multiplier;
  }
  
  // Apply discounts
  for (const discount of pricing.discounts) {
    if (currentDate >= discount.valid_from && currentDate <= discount.valid_until) {
      if (discount.value_type === 'PERCENTAGE') {
        totalPrice *= (1 - discount.value / 100);
      } else {
        totalPrice -= discount.value;
      }
    }
  }
  
  return Math.max(0, totalPrice);
}

/**
 * Get package type display name
 */
export function getPackageTypeDisplayName(type: string): string {
  const typeMap: Record<string, string> = {
    ACTIVITY: 'Activity',
    TRANSFERS: 'Transfer',
    MULTI_CITY_PACKAGE: 'Multi-City Package',
    MULTI_CITY_PACKAGE_WITH_HOTEL: 'Multi-City Package with Hotel',
    FIXED_DEPARTURE_WITH_FLIGHT: 'Fixed Departure with Flight',
    LAND_PACKAGE: 'Land Package',
    CRUISE_PACKAGE: 'Cruise Package',
    HOTEL_ONLY: 'Hotel Only',
    FLIGHT_ONLY: 'Flight Only',
    CUSTOM_PACKAGE: 'Custom Package',
  };
  
  return typeMap[type] || type;
}

/**
 * Get booking status display name
 */
export function getBookingStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
  };
  
  return statusMap[status] || status;
}

/**
 * Get lead status display name
 */
export function getLeadStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    NEW: 'New',
    CONTACTED: 'Contacted',
    QUALIFIED: 'Qualified',
    PROPOSAL_SENT: 'Proposal Sent',
    NEGOTIATION: 'Negotiation',
    WON: 'Won',
    LOST: 'Lost',
  };
  
  return statusMap[status] || status;
}

