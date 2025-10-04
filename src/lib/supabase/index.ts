// Supabase Client Configuration
// This file provides a clean interface for all Supabase operations

export {
  // Client creation functions
  createSupabaseBrowserClient,
  createSupabaseServerClient,
  createSupabaseAdminClient,
  createSupabaseMiddlewareClient,
  
  // Error handling
  SupabaseError,
  withErrorHandling,
  
  // Helper functions
  getServerUser,
  getBrowserUser,
  signOutServer,
  signOutBrowser,
  
  // Default client
  supabase,
  
  // Type exports
  type SupabaseClientType,
  type SupabaseServerClientType,
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

