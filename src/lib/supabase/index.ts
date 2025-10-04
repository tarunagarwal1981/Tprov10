// Supabase Client Configuration
// This file provides a clean interface for all Supabase operations

export {
  // Client creation functions
  createSupabaseBrowserClient,
  
  // Error handling
  SupabaseError,
  withErrorHandling,
  
  // Helper functions
  getBrowserUser,
  signOutBrowser,
  
  // Default client
  supabase,
  
  // Type exports
  type SupabaseClientType,
} from './client';

// Database types
export type {
  Database,
  Tables,
  Enums,
  User,
  Destination,
  Hotel,
  Flight,
  Booking,
  Package,
  Activity,
  UserInsert,
  DestinationInsert,
  HotelInsert,
  FlightInsert,
  BookingInsert,
  PackageInsert,
  ActivityInsert,
  UserUpdate,
  DestinationUpdate,
  HotelUpdate,
  FlightUpdate,
  BookingUpdate,
  PackageUpdate,
  ActivityUpdate,
} from './types';

