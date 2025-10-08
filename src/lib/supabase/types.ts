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
          role: 'SUPER_ADMIN' | 'ADMIN' | 'TOUR_OPERATOR' | 'TRAVEL_AGENT' | 'USER'
          profile: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string
          phone?: string
          role?: 'SUPER_ADMIN' | 'ADMIN' | 'TOUR_OPERATOR' | 'TRAVEL_AGENT' | 'USER'
          profile?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string
          role?: 'SUPER_ADMIN' | 'ADMIN' | 'TOUR_OPERATOR' | 'TRAVEL_AGENT' | 'USER'
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
      activity_packages: {
        Row: {
          id: string
          operator_id: string
          title: string
          short_description: string
          full_description: string
          status: 'draft' | 'published' | 'archived' | 'suspended'
          destination_name: string
          destination_address: string
          destination_city: string
          destination_country: string
          destination_postal_code: string | null
          destination_coordinates: string
          duration_hours: number
          duration_minutes: number
          difficulty_level: 'EASY' | 'MODERATE' | 'CHALLENGING' | 'DIFFICULT'
          languages_supported: ('EN' | 'ES' | 'FR' | 'DE' | 'IT' | 'PT' | 'RU' | 'ZH' | 'JA' | 'KO')[]
          tags: ('ADVENTURE' | 'FAMILY_FRIENDLY' | 'ROMANTIC' | 'CULTURAL' | 'NATURE' | 'SPORTS' | 'FOOD' | 'NIGHTLIFE' | 'EDUCATIONAL' | 'RELAXATION')[]
          meeting_point_name: string
          meeting_point_address: string
          meeting_point_coordinates: string
          meeting_point_instructions: string | null
          operating_days: ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN')[]
          whats_included: string[]
          whats_not_included: string[]
          what_to_bring: string[]
          important_information: string | null
          minimum_age: number
          maximum_age: number | null
          child_policy: string | null
          infant_policy: string | null
          age_verification_required: boolean
          wheelchair_accessible: boolean
          accessibility_facilities: ('RESTROOMS' | 'PARKING' | 'ELEVATOR' | 'RAMP' | 'SIGN_LANGUAGE' | 'BRAILLE' | 'AUDIO_GUIDE')[]
          special_assistance: string | null
          cancellation_policy_type: 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'CUSTOM'
          cancellation_policy_custom: string | null
          cancellation_refund_percentage: number
          cancellation_deadline_hours: number
          weather_policy: string | null
          health_safety_requirements: Json
          health_safety_additional_info: string | null
          base_price: number
          currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY'
          price_type: 'PERSON' | 'GROUP'
          child_price_type: 'PERCENTAGE' | 'FIXED' | null
          child_price_value: number | null
          infant_price: number | null
          group_discounts: Json
          seasonal_pricing: Json
          dynamic_pricing_enabled: boolean
          dynamic_pricing_base_multiplier: number
          dynamic_pricing_demand_multiplier: number
          dynamic_pricing_season_multiplier: number
          slug: string | null
          meta_title: string | null
          meta_description: string | null
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          operator_id: string
          title: string
          short_description: string
          full_description: string
          status?: 'draft' | 'published' | 'archived' | 'suspended'
          destination_name: string
          destination_address: string
          destination_city: string
          destination_country: string
          destination_postal_code?: string | null
          destination_coordinates: string
          duration_hours?: number
          duration_minutes?: number
          difficulty_level?: 'EASY' | 'MODERATE' | 'CHALLENGING' | 'DIFFICULT'
          languages_supported?: ('EN' | 'ES' | 'FR' | 'DE' | 'IT' | 'PT' | 'RU' | 'ZH' | 'JA' | 'KO')[]
          tags?: ('ADVENTURE' | 'FAMILY_FRIENDLY' | 'ROMANTIC' | 'CULTURAL' | 'NATURE' | 'SPORTS' | 'FOOD' | 'NIGHTLIFE' | 'EDUCATIONAL' | 'RELAXATION')[]
          meeting_point_name: string
          meeting_point_address: string
          meeting_point_coordinates: string
          meeting_point_instructions?: string | null
          operating_days?: ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN')[]
          whats_included?: string[]
          whats_not_included?: string[]
          what_to_bring?: string[]
          important_information?: string | null
          minimum_age?: number
          maximum_age?: number | null
          child_policy?: string | null
          infant_policy?: string | null
          age_verification_required?: boolean
          wheelchair_accessible?: boolean
          accessibility_facilities?: ('RESTROOMS' | 'PARKING' | 'ELEVATOR' | 'RAMP' | 'SIGN_LANGUAGE' | 'BRAILLE' | 'AUDIO_GUIDE')[]
          special_assistance?: string | null
          cancellation_policy_type?: 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'CUSTOM'
          cancellation_policy_custom?: string | null
          cancellation_refund_percentage?: number
          cancellation_deadline_hours?: number
          weather_policy?: string | null
          health_safety_requirements?: Json
          health_safety_additional_info?: string | null
          base_price?: number
          currency?: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY'
          price_type?: 'PERSON' | 'GROUP'
          child_price_type?: 'PERCENTAGE' | 'FIXED' | null
          child_price_value?: number | null
          infant_price?: number | null
          group_discounts?: Json
          seasonal_pricing?: Json
          dynamic_pricing_enabled?: boolean
          dynamic_pricing_base_multiplier?: number
          dynamic_pricing_demand_multiplier?: number
          dynamic_pricing_season_multiplier?: number
          slug?: string | null
          meta_title?: string | null
          meta_description?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          operator_id?: string
          title?: string
          short_description?: string
          full_description?: string
          status?: 'draft' | 'published' | 'archived' | 'suspended'
          destination_name?: string
          destination_address?: string
          destination_city?: string
          destination_country?: string
          destination_postal_code?: string | null
          destination_coordinates?: unknown
          duration_hours?: number
          duration_minutes?: number
          difficulty_level?: 'EASY' | 'MODERATE' | 'CHALLENGING' | 'DIFFICULT'
          languages_supported?: ('EN' | 'ES' | 'FR' | 'DE' | 'IT' | 'PT' | 'RU' | 'ZH' | 'JA' | 'KO')[]
          tags?: ('ADVENTURE' | 'FAMILY_FRIENDLY' | 'ROMANTIC' | 'CULTURAL' | 'NATURE' | 'SPORTS' | 'FOOD' | 'NIGHTLIFE' | 'EDUCATIONAL' | 'RELAXATION')[]
          meeting_point_name?: string
          meeting_point_address?: string
          meeting_point_coordinates?: unknown
          meeting_point_instructions?: string | null
          operating_days?: ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN')[]
          whats_included?: string[]
          whats_not_included?: string[]
          what_to_bring?: string[]
          important_information?: string | null
          minimum_age?: number
          maximum_age?: number | null
          child_policy?: string | null
          infant_policy?: string | null
          age_verification_required?: boolean
          wheelchair_accessible?: boolean
          accessibility_facilities?: ('RESTROOMS' | 'PARKING' | 'ELEVATOR' | 'RAMP' | 'SIGN_LANGUAGE' | 'BRAILLE' | 'AUDIO_GUIDE')[]
          special_assistance?: string | null
          cancellation_policy_type?: 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'CUSTOM'
          cancellation_policy_custom?: string | null
          cancellation_refund_percentage?: number
          cancellation_deadline_hours?: number
          weather_policy?: string | null
          health_safety_requirements?: Json
          health_safety_additional_info?: string | null
          base_price?: number
          currency?: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY'
          price_type?: 'PERSON' | 'GROUP'
          child_price_type?: 'PERCENTAGE' | 'FIXED' | null
          child_price_value?: number | null
          infant_price?: number | null
          group_discounts?: Json
          seasonal_pricing?: Json
          dynamic_pricing_enabled?: boolean
          dynamic_pricing_base_multiplier?: number
          dynamic_pricing_demand_multiplier?: number
          dynamic_pricing_season_multiplier?: number
          slug?: string | null
          meta_title?: string | null
          meta_description?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_packages_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_package_images: {
        Row: {
          id: string
          package_id: string
          file_name: string
          file_size: number
          mime_type: string
          storage_path: string
          public_url: string
          width: number | null
          height: number | null
          alt_text: string | null
          caption: string | null
          is_cover: boolean
          is_featured: boolean
          display_order: number
          uploaded_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          package_id: string
          file_name: string
          file_size: number
          mime_type: string
          storage_path: string
          public_url: string
          width?: number | null
          height?: number | null
          alt_text?: string | null
          caption?: string | null
          is_cover?: boolean
          is_featured?: boolean
          display_order?: number
          uploaded_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          file_name?: string
          file_size?: number
          mime_type?: string
          storage_path?: string
          public_url?: string
          width?: number | null
          height?: number | null
          alt_text?: string | null
          caption?: string | null
          is_cover?: boolean
          is_featured?: boolean
          display_order?: number
          uploaded_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_package_images_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "activity_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_package_time_slots: {
        Row: {
          id: string
          package_id: string
          start_time: string
          end_time: string
          capacity: number
          is_active: boolean
          days: ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN')[]
          price_override: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          package_id: string
          start_time: string
          end_time: string
          capacity?: number
          is_active?: boolean
          days?: ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN')[]
          price_override?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          start_time?: string
          end_time?: string
          capacity?: number
          is_active?: boolean
          days?: ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN')[]
          price_override?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_package_time_slots_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "activity_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_package_variants: {
        Row: {
          id: string
          package_id: string
          name: string
          description: string | null
          price_adjustment: number
          features: string[]
          max_capacity: number
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          package_id: string
          name: string
          description?: string | null
          price_adjustment?: number
          features?: string[]
          max_capacity?: number
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          name?: string
          description?: string | null
          price_adjustment?: number
          features?: string[]
          max_capacity?: number
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_package_variants_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "activity_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_package_faqs: {
        Row: {
          id: string
          package_id: string
          question: string
          answer: string
          category: 'GENERAL' | 'BOOKING' | 'CANCELLATION' | 'WEATHER' | 'SAFETY' | 'ACCESSIBILITY'
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          package_id: string
          question: string
          answer: string
          category?: 'GENERAL' | 'BOOKING' | 'CANCELLATION' | 'WEATHER' | 'SAFETY' | 'ACCESSIBILITY'
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          question?: string
          answer?: string
          category?: 'GENERAL' | 'BOOKING' | 'CANCELLATION' | 'WEATHER' | 'SAFETY' | 'ACCESSIBILITY'
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_package_faqs_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "activity_packages"
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
export type ActivityPackage = Tables<'activity_packages'>
export type ActivityPackageImage = Tables<'activity_package_images'>
export type ActivityPackageTimeSlot = Tables<'activity_package_time_slots'>
export type ActivityPackageVariant = Tables<'activity_package_variants'>
export type ActivityPackageFAQ = Tables<'activity_package_faqs'>

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type DestinationInsert = Database['public']['Tables']['destinations']['Insert']
export type HotelInsert = Database['public']['Tables']['hotels']['Insert']
export type FlightInsert = Database['public']['Tables']['flights']['Insert']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type PackageInsert = Database['public']['Tables']['packages']['Insert']
export type ActivityInsert = Database['public']['Tables']['activities']['Insert']
export type ActivityPackageInsert = Database['public']['Tables']['activity_packages']['Insert']
export type ActivityPackageImageInsert = Database['public']['Tables']['activity_package_images']['Insert']
export type ActivityPackageTimeSlotInsert = Database['public']['Tables']['activity_package_time_slots']['Insert']
export type ActivityPackageVariantInsert = Database['public']['Tables']['activity_package_variants']['Insert']
export type ActivityPackageFAQInsert = Database['public']['Tables']['activity_package_faqs']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type DestinationUpdate = Database['public']['Tables']['destinations']['Update']
export type HotelUpdate = Database['public']['Tables']['hotels']['Update']
export type FlightUpdate = Database['public']['Tables']['flights']['Update']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']
export type PackageUpdate = Database['public']['Tables']['packages']['Update']
export type ActivityUpdate = Database['public']['Tables']['activities']['Update']
export type ActivityPackageUpdate = Database['public']['Tables']['activity_packages']['Update']
export type ActivityPackageImageUpdate = Database['public']['Tables']['activity_package_images']['Update']
export type ActivityPackageTimeSlotUpdate = Database['public']['Tables']['activity_package_time_slots']['Update']
export type ActivityPackageVariantUpdate = Database['public']['Tables']['activity_package_variants']['Update']
export type ActivityPackageFAQUpdate = Database['public']['Tables']['activity_package_faqs']['Update']

