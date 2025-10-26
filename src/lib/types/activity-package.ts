/**
 * Activity Package Form Types
 * Comprehensive type definitions for the Activity Package creation form
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type DifficultyLevel = 'EASY' | 'MODERATE' | 'CHALLENGING' | 'DIFFICULT';
export type Language = 'EN' | 'ES' | 'FR' | 'DE' | 'IT' | 'PT' | 'RU' | 'ZH' | 'JA' | 'KO';
export type Tag = 'ADVENTURE' | 'FAMILY_FRIENDLY' | 'ROMANTIC' | 'CULTURAL' | 'NATURE' | 'SPORTS' | 'FOOD' | 'NIGHTLIFE' | 'EDUCATIONAL' | 'RELAXATION';
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY';
export type PriceType = 'PERSON' | 'GROUP';
export type FAQCategory = 'GENERAL' | 'BOOKING' | 'CANCELLATION' | 'WEATHER' | 'SAFETY' | 'ACCESSIBILITY';

// ============================================================================
// BASIC INFORMATION TYPES
// ============================================================================

export interface BasicInformation {
  title: string;
  shortDescription: string;
  fullDescription: string;
  destination: LocationInfo;
  duration: DurationInfo;
  // difficultyLevel: DifficultyLevel;
  // languagesSupported: Language[];
  // tags: Tag[];
  featuredImage: ImageInfo | null;
  imageGallery: ImageInfo[];
}

export interface LocationInfo {
  id?: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  city: string;
  country: string;
  postalCode?: string;
}

export interface DurationInfo {
  hours: number;
  minutes: number;
}

export interface ImageInfo {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isCover: boolean;
  order: number;
  uploadedAt: Date;
}

// ============================================================================
// ACTIVITY DETAILS TYPES
// ============================================================================

export interface ActivityDetails {
  operationalHours: OperationalHours;
  meetingPoint: MeetingPoint;
  whatToBring: string[];
  whatsIncluded: string[];
  whatsNotIncluded: string[];
  importantInformation: string;
}

export interface OperationalHours {
  operatingDays: DayOfWeek[];
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  capacity: number;
  isActive: boolean;
  days: DayOfWeek[];
}

export interface MeetingPoint {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  instructions: string;
  images: ImageInfo[];
}

// ============================================================================
// PACKAGE VARIANTS TYPES
// ============================================================================

export interface PackageVariants {
  variants: PackageVariant[];
}

export interface PackageVariant {
  id: string;
  name: string;
  description: string;
  priceAdjustment: number; // +/- from base price
  features: string[];
  maxCapacity: number;
  images: ImageInfo[];
  isActive: boolean;
  order: number;
}

// ============================================================================
// POLICIES & RESTRICTIONS TYPES
// ============================================================================

export interface PoliciesRestrictions {
  ageRestrictions: AgeRestrictions;
  accessibility: AccessibilityInfo;
  cancellationPolicy: CancellationPolicy;
  weatherPolicy: string;
  healthSafety: HealthSafetyInfo;
}

export interface AgeRestrictions {
  minimumAge: number;
  maximumAge?: number;
  childPolicy: string;
  infantPolicy: string;
  ageVerificationRequired: boolean;
}

export interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  facilities: AccessibilityFacility[];
  specialAssistance: string;
}

export type AccessibilityFacility = 'RESTROOMS' | 'PARKING' | 'ELEVATOR' | 'RAMP' | 'SIGN_LANGUAGE' | 'BRAILLE' | 'AUDIO_GUIDE';

export interface CancellationPolicy {
  type: 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'CUSTOM';
  customPolicy?: string;
  refundPercentage: number;
  cancellationDeadline: number; // hours before activity
}

export interface HealthSafetyInfo {
  requirements: HealthSafetyRequirement[];
  additionalInfo: string;
}

export interface HealthSafetyRequirement {
  id: string;
  requirement: string;
  isRequired: boolean;
  description: string;
}

// ============================================================================
// FAQ TYPES
// ============================================================================

export interface FAQSection {
  faqs: FAQItem[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  order: number;
}

// ============================================================================
// PRICING TYPES
// ============================================================================

export interface PricingInfo {
  basePrice: number;
  currency: Currency;
  priceType: PriceType;
  childPrice?: ChildPriceInfo;
  infantPrice?: number;
  groupDiscounts: GroupDiscount[];
  seasonalPricing: SeasonalPricing[];
  dynamicPricing: DynamicPricingInfo;
}

export interface ChildPriceInfo {
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
}

export interface GroupDiscount {
  id: string;
  minPeople: number;
  discountPercentage: number;
  description: string;
}

export interface SeasonalPricing {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  priceAdjustment: number; // +/- from base price
  description: string;
}

export interface DynamicPricingInfo {
  enabled: boolean;
  baseMultiplier: number;
  demandMultiplier: number;
  seasonMultiplier: number;
}

// ============================================================================
// ACTIVITY PRICING OPTIONS TYPES (New)
// ============================================================================

export type VehicleType = 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS' | 'MINIVAN';

// Ticket Only Pricing
export interface TicketOnlyPricingOption {
  id: string;
  optionName: string;
  description?: string;
  adultPrice: number;
  childPrice: number;
  childMinAge: number;
  childMaxAge: number;
  infantPrice?: number;
  infantMaxAge?: number;
  includedItems: string[];
  excludedItems: string[];
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
}

// Ticket with Transfer Pricing
export interface TicketWithTransferPricingOption {
  id: string;
  optionName: string;
  description?: string;
  vehicleType: VehicleType;
  vehicleName: string;
  maxCapacity: number;
  vehicleFeatures: string[];
  adultPrice: number;
  childPrice: number;
  childMinAge: number;
  childMaxAge: number;
  infantPrice?: number;
  infantMaxAge?: number;
  pickupLocation?: string;
  pickupInstructions?: string;
  dropoffLocation?: string;
  dropoffInstructions?: string;
  includedItems: string[];
  excludedItems: string[];
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
}

// Container for all pricing options
export interface ActivityPricingOptions {
  ticketOnlyOptions: TicketOnlyPricingOption[];
  ticketWithTransferOptions: TicketWithTransferPricingOption[];
}

// ============================================================================
// FORM STATE TYPES
// ============================================================================

export interface ActivityPackageFormData {
  basicInformation: BasicInformation;
  activityDetails: ActivityDetails;
  packageVariants: PackageVariants;
  policiesRestrictions: PoliciesRestrictions;
  faq: FAQSection;
  pricing: PricingInfo;
  pricingOptions?: ActivityPricingOptions | any[]; // Can be old format or new simplified array
}

export interface FormValidation {
  isValid: boolean;
  errors: FormError[];
  warnings: FormWarning[];
}

export interface FormError {
  tab: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface FormWarning {
  tab: string;
  field: string;
  message: string;
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  error: string | null;
}

// ============================================================================
// FORM PROPS TYPES
// ============================================================================

export interface ActivityPackageFormProps {
  initialData?: Partial<ActivityPackageFormData>;
  onSave?: (data: ActivityPackageFormData) => void;
  onPublish?: (data: ActivityPackageFormData) => void;
  onPreview?: (data: ActivityPackageFormData) => void;
  className?: string;
  mode?: 'create' | 'edit';
  packageId?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface TabInfo {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  isComplete: boolean;
  hasErrors: boolean;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface LocationSearchResult {
  placeId: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  city: string;
  country: string;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_FORM_DATA: ActivityPackageFormData = {
  basicInformation: {
    title: '',
    shortDescription: '',
    fullDescription: '',
    destination: {
      name: '',
      address: '',
      coordinates: { latitude: 0, longitude: 0 },
      city: '',
      country: '',
    },
    duration: { hours: 2, minutes: 0 },
    // difficultyLevel: 'EASY',
    // languagesSupported: ['EN'],
    // tags: [],
    featuredImage: null,
    imageGallery: [],
  },
  activityDetails: {
    operationalHours: {
      operatingDays: [],
      timeSlots: [],
    },
    meetingPoint: {
      name: '',
      address: '',
      coordinates: { latitude: 0, longitude: 0 },
      instructions: '',
      images: [],
    },
    whatToBring: [],
    whatsIncluded: [],
    whatsNotIncluded: [],
    importantInformation: '',
  },
  packageVariants: {
    variants: [],
  },
  policiesRestrictions: {
    ageRestrictions: {
      minimumAge: 0,
      childPolicy: '',
      infantPolicy: '',
      ageVerificationRequired: false,
    },
    accessibility: {
      wheelchairAccessible: false,
      facilities: [],
      specialAssistance: '',
    },
    cancellationPolicy: {
      type: 'MODERATE',
      refundPercentage: 80,
      cancellationDeadline: 24,
    },
    weatherPolicy: '',
    healthSafety: {
      requirements: [],
      additionalInfo: '',
    },
  },
  faq: {
    faqs: [],
  },
  pricing: {
    basePrice: 0,
    currency: 'USD',
    priceType: 'PERSON',
    groupDiscounts: [],
    seasonalPricing: [],
    dynamicPricing: {
      enabled: false,
      baseMultiplier: 1,
      demandMultiplier: 1,
      seasonMultiplier: 1,
    },
  },
  pricingOptions: {
    ticketOnlyOptions: [],
    ticketWithTransferOptions: [],
  },
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const REQUIRED_FIELDS = {
  basicInformation: ['title', 'shortDescription', 'destination', 'duration'],
  activityDetails: ['operationalHours', 'meetingPoint'],
  packageVariants: [],
  policiesRestrictions: ['cancellationPolicy'],
  faq: [],
  pricing: ['basePrice', 'currency'],
} as const;

export const FIELD_LIMITS = {
  title: { max: 100 },
  shortDescription: { max: 160 },
  fullDescription: { max: 2000 },
  importantInformation: { max: 1000 },
  question: { max: 200 },
  answer: { max: 1000 },
} as const;
