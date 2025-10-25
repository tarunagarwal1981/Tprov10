/**
 * Transfer Package Form Types
 * Comprehensive type definitions for the Transfer Package creation form
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type TransferType = 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_STOP';
export type VehicleType = 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS';
export type DistanceUnit = 'KM' | 'MILES';
export type Language = 'EN' | 'ES' | 'FR' | 'DE' | 'IT' | 'PT' | 'RU' | 'ZH' | 'JA' | 'KO';
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY';

// ============================================================================
// BASIC INFORMATION TYPES (Reused from Activity Package)
// ============================================================================

export interface BasicInformation {
  title: string;
  shortDescription: string;
  fullDescription: string;
  destination: LocationInfo;
  duration: DurationInfo;
  languagesSupported: Language[];
  tags: Tag[];
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

export type Tag = 'AIRPORT' | 'HOTEL' | 'CITY' | 'INTERCITY' | 'LUXURY' | 'ECONOMY' | 'FAMILY' | 'BUSINESS';

// ============================================================================
// TRANSFER DETAILS TYPES
// ============================================================================

export interface TransferDetails {
  transferType: TransferType;
  oneWayDetails?: OneWayTransferDetails;
  roundTripDetails?: RoundTripTransferDetails;
  multiStopDetails?: MultiStopTransferDetails;
  routeInfo: RouteInfo;
  vehicles: VehicleDetail[];
}

export interface VehicleDetail {
  id: string;
  vehicleName: string;
  vehicleType?: VehicleType;
  maxCapacity: number;
  vehicleImage?: ImageInfo | null;
  order: number;
}

export interface OneWayTransferDetails {
  pickupLocation: LocationInfo;
  dropoffLocation: LocationInfo;
  pickupDate: string;
  pickupTime: string;
  numberOfPassengers: number;
  numberOfLuggagePieces: number;
  estimatedDuration: DurationInfo;
  distance: number;
  distanceUnit: DistanceUnit;
}

export interface RoundTripTransferDetails extends OneWayTransferDetails {
  returnDate: string;
  returnTime: string;
  waitTimeAtDestination?: DurationInfo;
}

export interface MultiStopTransferDetails {
  pickupLocation: LocationInfo;
  dropoffLocation: LocationInfo;
  stops: TransferStop[];
  totalDistance: number;
  distanceUnit: DistanceUnit;
  estimatedDuration: DurationInfo;
}

export interface TransferStop {
  id: string;
  location: LocationInfo;
  duration: DurationInfo;
  order: number;
  description?: string;
}

export interface RouteInfo {
  totalDistance: number;
  distanceUnit: DistanceUnit;
  estimatedDuration: DurationInfo;
  routePoints: RoutePoint[];
  alternativeRoutes?: AlternativeRoute[];
  trafficConditions?: TrafficCondition[];
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  type: 'PICKUP' | 'DROPOFF' | 'STOP';
  name: string;
  order: number;
}

export interface AlternativeRoute {
  id: string;
  name: string;
  distance: number;
  duration: DurationInfo;
  routePoints: RoutePoint[];
}

export interface TrafficCondition {
  segment: string;
  condition: 'LIGHT' | 'MODERATE' | 'HEAVY' | 'SEVERE';
  delay: DurationInfo;
}

// ============================================================================
// VEHICLE OPTIONS TYPES
// ============================================================================

export interface VehicleOptions {
  vehicles: VehicleConfiguration[];
}

export interface VehicleConfiguration {
  id: string;
  vehicleType: VehicleType;
  name: string;
  description: string;
  passengerCapacity: number;
  luggageCapacity: number;
  features: VehicleFeature[];
  images: ImageInfo[];
  basePrice: number;
  isActive: boolean;
  order: number;
}

export type VehicleFeature = 
  | 'AIR_CONDITIONING'
  | 'WIFI'
  | 'PHONE_CHARGER'
  | 'WATER_BOTTLES'
  | 'CHILD_SEAT'
  | 'WHEELCHAIR_ACCESSIBLE'
  | 'GPS_NAVIGATION'
  | 'PREMIUM_SOUND_SYSTEM'
  | 'LEATHER_SEATS'
  | 'BLUETOOTH'
  | 'USB_CHARGING'
  | 'REFRIGERATOR'
  | 'TV_SCREENS'
  | 'MASSAGE_SEATS';

// ============================================================================
// DRIVER & SERVICE TYPES
// ============================================================================

export interface DriverService {
  meetAndGreet: boolean;
  nameBoard: boolean;
  driverUniform: boolean;
  flightTracking: boolean;
  driverLanguages: Language[];
  luggageAssistance: boolean;
  doorToDoorService: boolean;
  contactDriverInAdvance: boolean;
  contactLeadTime: number; // hours
  realTimeTracking: boolean;
  additionalServices: AdditionalService[];
}

export interface AdditionalService {
  id: string;
  name: string;
  description: string;
  price: number;
  isIncluded: boolean;
}

// ============================================================================
// PRICING & POLICIES TYPES
// ============================================================================

export interface PricingPolicies {
  basePricing: VehiclePricing[];
  hourlyPricingOptions: HourlyPricingOption[];
  pointToPointPricingOptions: PointToPointPricingOption[];
  additionalCharges: AdditionalCharge[];
  cancellationPolicy: CancellationPolicy;
  noShowPolicy: string;
  termsAndConditions: string;
}

export interface VehiclePricing {
  vehicleId: string;
  basePrice: number;
  distanceBasedPricing: DistanceBasedPricing[];
  timeBasedPricing: TimeBasedPricing[];
}

export interface DistanceBasedPricing {
  minDistance: number;
  maxDistance: number;
  pricePerKm: number;
}

export interface TimeBasedPricing {
  timeRange: {
    start: string; // HH:MM
    end: string; // HH:MM
  };
  surchargePercentage: number;
  description: string;
}

// ============================================================================
// TRANSFER PRICING OPTIONS TYPES
// ============================================================================

export interface HourlyPricingOption {
  id: string;
  hours: number;
  vehicleType: VehicleType;
  vehicleName: string;
  maxPassengers: number;
  rateUSD: number;
  description?: string;
  features: VehicleFeature[];
  isActive: boolean;
  displayOrder: number;
}

export interface PointToPointPricingOption {
  id: string;
  fromLocation: string;
  fromAddress?: string;
  fromCoordinates?: {
    latitude: number;
    longitude: number;
  };
  toLocation: string;
  toAddress?: string;
  toCoordinates?: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  distanceUnit: DistanceUnit;
  estimatedDurationMinutes?: number;
  vehicleType: VehicleType;
  vehicleName: string;
  maxPassengers: number;
  costUSD: number;
  description?: string;
  features: VehicleFeature[];
  isActive: boolean;
  displayOrder: number;
}

export interface AdditionalCharge {
  id: string;
  name: string;
  description: string;
  type: 'FIXED' | 'PER_HOUR' | 'PERCENTAGE' | 'PER_ITEM';
  amount: number;
  isActive: boolean;
}

export interface CancellationPolicy {
  type: 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'CUSTOM';
  customPolicy?: string;
  refundPercentage: number;
  cancellationDeadline: number; // hours before transfer
}

// ============================================================================
// AVAILABILITY & BOOKING TYPES
// ============================================================================

export interface AvailabilityBooking {
  availableDays: DayOfWeek[];
  availableTimeSlots: TimeSlot[];
  advanceBookingRequired: number; // hours
  maximumAdvanceBooking: number; // days
  instantConfirmation: boolean;
  specialInstructions: string;
  bookingRestrictions: BookingRestriction[];
}

export interface TimeSlot {
  id: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isActive: boolean;
  days: DayOfWeek[];
}

export interface BookingRestriction {
  id: string;
  type: 'DATE_RANGE' | 'SPECIFIC_DATES' | 'HOLIDAYS';
  startDate?: Date;
  endDate?: Date;
  specificDates?: Date[];
  description: string;
  isActive: boolean;
}

// ============================================================================
// FORM STATE TYPES
// ============================================================================

export interface TransferPackageFormData {
  basicInformation: BasicInformation;
  transferDetails: TransferDetails;
  vehicleOptions: VehicleOptions;
  driverService: DriverService;
  pricingPolicies: PricingPolicies;
  availabilityBooking: AvailabilityBooking;
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

export interface TransferPackageFormProps {
  initialData?: Partial<TransferPackageFormData>;
  onSave?: (data: TransferPackageFormData) => void;
  onPublish?: (data: TransferPackageFormData) => void;
  onPreview?: (data: TransferPackageFormData) => void;
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

export interface VehicleComparison {
  vehicles: VehicleConfiguration[];
  selectedFeatures: VehicleFeature[];
}

export interface SmartPricingSuggestion {
  vehicleId: string;
  suggestedPrice: number;
  reasoning: string;
  factors: PricingFactor[];
}

export interface PricingFactor {
  name: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  value: number;
  description: string;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_TRANSFER_FORM_DATA: TransferPackageFormData = {
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
    duration: { hours: 1, minutes: 0 },
    languagesSupported: ['EN'],
    tags: [],
    featuredImage: null,
    imageGallery: [],
  },
  transferDetails: {
    transferType: 'ONE_WAY',
    oneWayDetails: {
      pickupLocation: {
        name: '',
        address: '',
        coordinates: { latitude: 0, longitude: 0 },
        city: '',
        country: '',
      },
      dropoffLocation: {
        name: '',
        address: '',
        coordinates: { latitude: 0, longitude: 0 },
        city: '',
        country: '',
      },
      pickupDate: '',
      pickupTime: '',
      numberOfPassengers: 1,
      numberOfLuggagePieces: 0,
      estimatedDuration: { hours: 1, minutes: 0 },
      distance: 0,
      distanceUnit: 'KM',
    },
    roundTripDetails: {
      pickupLocation: {
        name: '',
        address: '',
        coordinates: { latitude: 0, longitude: 0 },
        city: '',
        country: '',
      },
      dropoffLocation: {
        name: '',
        address: '',
        coordinates: { latitude: 0, longitude: 0 },
        city: '',
        country: '',
      },
      pickupDate: '',
      pickupTime: '',
      numberOfPassengers: 1,
      numberOfLuggagePieces: 0,
      estimatedDuration: { hours: 1, minutes: 0 },
      distance: 0,
      distanceUnit: 'KM',
      returnDate: '',
      returnTime: '',
    },
    routeInfo: {
      totalDistance: 0,
      distanceUnit: 'KM',
      estimatedDuration: { hours: 1, minutes: 0 },
      routePoints: [],
    },
    vehicles: [],
  },
  vehicleOptions: {
    vehicles: [],
  },
  driverService: {
    meetAndGreet: false,
    nameBoard: false,
    driverUniform: true,
    flightTracking: false,
    driverLanguages: ['EN'],
    luggageAssistance: true,
    doorToDoorService: true,
    contactDriverInAdvance: false,
    contactLeadTime: 2,
    realTimeTracking: false,
    additionalServices: [],
  },
  pricingPolicies: {
    basePricing: [],
    hourlyPricingOptions: [],
    pointToPointPricingOptions: [],
    additionalCharges: [],
    cancellationPolicy: {
      type: 'MODERATE',
      refundPercentage: 80,
      cancellationDeadline: 24,
    },
    noShowPolicy: '',
    termsAndConditions: '',
  },
  availabilityBooking: {
    availableDays: [],
    availableTimeSlots: [],
    advanceBookingRequired: 2,
    maximumAdvanceBooking: 30,
    instantConfirmation: true,
    specialInstructions: '',
    bookingRestrictions: [],
  },
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const REQUIRED_FIELDS = {
  basicInformation: ['title'],
  transferDetails: ['transferType', 'pickupLocation', 'dropoffLocation', 'vehicles'],
  vehicleOptions: ['vehicles'],
  driverService: [],
  pricingPolicies: ['cancellationPolicy'],
  availabilityBooking: ['availableDays'],
} as const;

export const FIELD_LIMITS = {
  title: { max: 100 },
  shortDescription: { max: 160 },
  fullDescription: { max: 2000 },
  specialInstructions: { max: 1000 },
  termsAndConditions: { max: 5000 },
} as const;

// ============================================================================
// VEHICLE FEATURE OPTIONS
// ============================================================================

export const VEHICLE_FEATURES: { value: VehicleFeature; label: string; icon: string; category: string }[] = [
  { value: 'AIR_CONDITIONING', label: 'Air Conditioning', icon: '❄️', category: 'Comfort' },
  { value: 'WIFI', label: 'Wi-Fi', icon: '📶', category: 'Connectivity' },
  { value: 'PHONE_CHARGER', label: 'Phone Charger', icon: '🔌', category: 'Connectivity' },
  { value: 'WATER_BOTTLES', label: 'Water Bottles', icon: '💧', category: 'Amenities' },
  { value: 'CHILD_SEAT', label: 'Child Seat', icon: '👶', category: 'Safety' },
  { value: 'WHEELCHAIR_ACCESSIBLE', label: 'Wheelchair Accessible', icon: '♿', category: 'Accessibility' },
  { value: 'GPS_NAVIGATION', label: 'GPS Navigation', icon: '🗺️', category: 'Navigation' },
  { value: 'PREMIUM_SOUND_SYSTEM', label: 'Premium Sound System', icon: '🔊', category: 'Entertainment' },
  { value: 'LEATHER_SEATS', label: 'Leather Seats', icon: '🪑', category: 'Comfort' },
  { value: 'BLUETOOTH', label: 'Bluetooth', icon: '📱', category: 'Connectivity' },
  { value: 'USB_CHARGING', label: 'USB Charging', icon: '🔋', category: 'Connectivity' },
  { value: 'REFRIGERATOR', label: 'Refrigerator', icon: '🧊', category: 'Amenities' },
  { value: 'TV_SCREENS', label: 'TV Screens', icon: '📺', category: 'Entertainment' },
  { value: 'MASSAGE_SEATS', label: 'Massage Seats', icon: '💆', category: 'Luxury' },
];

export const VEHICLE_TYPES: { value: VehicleType; label: string; icon: string; description: string }[] = [
  { value: 'SEDAN', label: 'Sedan', icon: '🚗', description: 'Comfortable 4-seater car' },
  { value: 'SUV', label: 'SUV', icon: '🚙', description: 'Spacious 6-8 seater vehicle' },
  { value: 'VAN', label: 'Van', icon: '🚐', description: 'Large capacity vehicle' },
  { value: 'BUS', label: 'Bus', icon: '🚌', description: 'High capacity transport' },
  { value: 'LUXURY', label: 'Luxury', icon: '🏎️', description: 'Premium luxury vehicle' },
  { value: 'MINIBUS', label: 'Minibus', icon: '🚐', description: 'Medium capacity bus' },
];
