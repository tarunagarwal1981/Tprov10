// Supabase Database Types
// This file should be generated using: supabase gen types typescript --linked > src/lib/supabase/types.ts
// For now, we'll define the types based on the existing schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone?: string
          role: 'SUPER_ADMIN' | 'ADMIN' | 'TOUR_OPERATOR' | 'TRAVEL_AGENT'
          profile: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string
          phone?: string
          role?: 'SUPER_ADMIN' | 'ADMIN' | 'TOUR_OPERATOR' | 'TRAVEL_AGENT'
          profile?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string
          role?: 'SUPER_ADMIN' | 'ADMIN' | 'TOUR_OPERATOR' | 'TRAVEL_AGENT'
          profile?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      destinations: {
        Row: {
          id: string
          name: string
          country: string
          city: string
          description: string
          images: string[]
          coordinates: Json
          rating: number
          price_range: 'budget' | 'mid-range' | 'luxury'
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          country: string
          city: string
          description: string
          images: string[]
          coordinates: Json
          rating: number
          price_range: 'budget' | 'mid-range' | 'luxury'
          tags: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          country?: string
          city?: string
          description?: string
          images?: string[]
          coordinates?: Json
          rating?: number
          price_range?: 'budget' | 'mid-range' | 'luxury'
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hotels: {
        Row: {
          id: string
          name: string
          destination_id: string
          description: string
          images: string[]
          amenities: string[]
          rating: number
          price_per_night: number
          currency: string
          coordinates: Json
          address: string
          check_in_time: string
          check_out_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          destination_id: string
          description: string
          images: string[]
          amenities: string[]
          rating: number
          price_per_night: number
          currency: string
          coordinates: Json
          address: string
          check_in_time: string
          check_out_time: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          destination_id?: string
          description?: string
          images?: string[]
          amenities?: string[]
          rating?: number
          price_per_night?: number
          currency?: string
          coordinates?: Json
          address?: string
          check_in_time?: string
          check_out_time?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotels_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          }
        ]
      }
      flights: {
        Row: {
          id: string
          airline: string
          flight_number: string
          departure: Json
          arrival: Json
          duration: number
          price: number
          currency: string
          class: 'economy' | 'business' | 'first'
          stops: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          airline: string
          flight_number: string
          departure: Json
          arrival: Json
          duration: number
          price: number
          currency: string
          class: 'economy' | 'business' | 'first'
          stops: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          airline?: string
          flight_number?: string
          departure?: Json
          arrival?: Json
          duration?: number
          price?: number
          currency?: string
          class?: 'economy' | 'business' | 'first'
          stops?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          type: 'hotel' | 'flight' | 'package'
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          total_amount: number
          currency: string
          booking_date: string
          travel_date: string
          details: Json
          passengers: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'hotel' | 'flight' | 'package'
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          total_amount: number
          currency: string
          booking_date: string
          travel_date: string
          details: Json
          passengers?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'hotel' | 'flight' | 'package'
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          total_amount?: number
          currency?: string
          booking_date?: string
          travel_date?: string
          details?: Json
          passengers?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      packages: {
        Row: {
          id: string
          name: string
          description: string
          destination_id: string
          duration: number
          price: number
          currency: string
          includes: string[]
          hotels: Json
          flights: Json
          activities: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          destination_id: string
          duration: number
          price: number
          currency: string
          includes: string[]
          hotels: Json
          flights: Json
          activities: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          destination_id?: string
          duration?: number
          price?: number
          currency?: string
          includes?: string[]
          hotels?: Json
          flights?: Json
          activities?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          }
        ]
      }
      activities: {
        Row: {
          id: string
          name: string
          description: string
          destination_id: string
          duration: number
          price: number
          currency: string
          images: string[]
          category: 'adventure' | 'cultural' | 'relaxation' | 'food' | 'nature'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          destination_id: string
          duration: number
          price: number
          currency: string
          images: string[]
          category: 'adventure' | 'cultural' | 'relaxation' | 'food' | 'nature'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          destination_id?: string
          duration?: number
          price?: number
          currency?: string
          images?: string[]
          category?: 'adventure' | 'cultural' | 'relaxation' | 'food' | 'nature'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
      booking_type: 'hotel' | 'flight' | 'package'
      price_range: 'budget' | 'mid-range' | 'luxury'
      flight_class: 'economy' | 'business' | 'first'
      activity_category: 'adventure' | 'cultural' | 'relaxation' | 'food' | 'nature'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type aliases for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table types
export type User = Tables<'users'>
export type Destination = Tables<'destinations'>
export type Hotel = Tables<'hotels'>
export type Flight = Tables<'flights'>
export type Booking = Tables<'bookings'>
export type Package = Tables<'packages'>
export type Activity = Tables<'activities'>

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type DestinationInsert = Database['public']['Tables']['destinations']['Insert']
export type HotelInsert = Database['public']['Tables']['hotels']['Insert']
export type FlightInsert = Database['public']['Tables']['flights']['Insert']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type PackageInsert = Database['public']['Tables']['packages']['Insert']
export type ActivityInsert = Database['public']['Tables']['activities']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type DestinationUpdate = Database['public']['Tables']['destinations']['Update']
export type HotelUpdate = Database['public']['Tables']['hotels']['Update']
export type FlightUpdate = Database['public']['Tables']['flights']['Update']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']
export type PackageUpdate = Database['public']['Tables']['packages']['Update']
export type ActivityUpdate = Database['public']['Tables']['activities']['Update']

