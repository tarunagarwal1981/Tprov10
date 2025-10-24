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
      activity_ticket_only_pricing: {
        Row: {
          id: string
          package_id: string
          option_name: string
          description: string | null
          adult_price: number
          child_price: number
          child_min_age: number
          child_max_age: number
          infant_price: number | null
          infant_max_age: number | null
          included_items: string[]
          excluded_items: string[]
          is_active: boolean
          is_featured: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          package_id: string
          option_name: string
          description?: string | null
          adult_price: number
          child_price: number
          child_min_age?: number
          child_max_age?: number
          infant_price?: number | null
          infant_max_age?: number | null
          included_items?: string[]
          excluded_items?: string[]
          is_active?: boolean
          is_featured?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          option_name?: string
          description?: string | null
          adult_price?: number
          child_price?: number
          child_min_age?: number
          child_max_age?: number
          infant_price?: number | null
          infant_max_age?: number | null
          included_items?: string[]
          excluded_items?: string[]
          is_active?: boolean
          is_featured?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_ticket_only_pricing_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "activity_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_ticket_with_transfer_pricing: {
        Row: {
          id: string
          package_id: string
          option_name: string
          description: string | null
          vehicle_type: string
          vehicle_name: string
          max_capacity: number
          vehicle_features: string[]
          adult_price: number
          child_price: number
          child_min_age: number
          child_max_age: number
          infant_price: number | null
          infant_max_age: number | null
          pickup_location: string | null
          pickup_instructions: string | null
          dropoff_location: string | null
          dropoff_instructions: string | null
          included_items: string[]
          excluded_items: string[]
          is_active: boolean
          is_featured: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          package_id: string
          option_name: string
          description?: string | null
          vehicle_type: string
          vehicle_name: string
          max_capacity: number
          vehicle_features?: string[]
          adult_price: number
          child_price: number
          child_min_age?: number
          child_max_age?: number
          infant_price?: number | null
          infant_max_age?: number | null
          pickup_location?: string | null
          pickup_instructions?: string | null
          dropoff_location?: string | null
          dropoff_instructions?: string | null
          included_items?: string[]
          excluded_items?: string[]
          is_active?: boolean
          is_featured?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          option_name?: string
          description?: string | null
          vehicle_type?: string
          vehicle_name?: string
          max_capacity?: number
          vehicle_features?: string[]
          adult_price?: number
          child_price?: number
          child_min_age?: number
          child_max_age?: number
          infant_price?: number | null
          infant_max_age?: number | null
          pickup_location?: string | null
          pickup_instructions?: string | null
          dropoff_location?: string | null
          dropoff_instructions?: string | null
          included_items?: string[]
          excluded_items?: string[]
          is_active?: boolean
          is_featured?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_ticket_with_transfer_pricing_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "activity_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      multi_city_packages: {
        Row: {
          id: string
          operator_id: string
          title: string
          short_description: string
          full_description: string | null
          destination_region: string | null
          include_intercity_transport: boolean
          pricing_mode: 'FIXED' | 'PER_PERSON' | 'GROUP_TIERED'
          fixed_price: number | null
          per_person_price: number | null
          group_min: number | null
          group_max: number | null
          currency: string
          validity_start: string | null
          validity_end: string | null
          seasonal_notes: string | null
          deposit_percent: number
          balance_due_days: number
          payment_methods: string[] | null
          visa_requirements: string | null
          insurance_requirement: 'REQUIRED' | 'OPTIONAL' | 'NA'
          health_requirements: string | null
          terms_and_conditions: string | null
          total_nights: number
          total_days: number
          total_cities: number
          base_price: number | null
          status: 'draft' | 'published' | 'archived' | 'suspended'
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          operator_id: string
          title: string
          short_description: string
          full_description?: string | null
          destination_region?: string | null
          include_intercity_transport?: boolean
          pricing_mode?: 'FIXED' | 'PER_PERSON' | 'GROUP_TIERED'
          fixed_price?: number | null
          per_person_price?: number | null
          group_min?: number | null
          group_max?: number | null
          currency?: string
          validity_start?: string | null
          validity_end?: string | null
          seasonal_notes?: string | null
          deposit_percent?: number
          balance_due_days?: number
          payment_methods?: string[] | null
          visa_requirements?: string | null
          insurance_requirement?: 'REQUIRED' | 'OPTIONAL' | 'NA'
          health_requirements?: string | null
          terms_and_conditions?: string | null
          total_nights?: number
          total_days?: number
          total_cities?: number
          base_price?: number | null
          status?: 'draft' | 'published' | 'archived' | 'suspended'
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          operator_id?: string
          title?: string
          short_description?: string
          full_description?: string | null
          destination_region?: string | null
          include_intercity_transport?: boolean
          pricing_mode?: 'FIXED' | 'PER_PERSON' | 'GROUP_TIERED'
          fixed_price?: number | null
          per_person_price?: number | null
          group_min?: number | null
          group_max?: number | null
          currency?: string
          validity_start?: string | null
          validity_end?: string | null
          seasonal_notes?: string | null
          deposit_percent?: number
          balance_due_days?: number
          payment_methods?: string[] | null
          visa_requirements?: string | null
          insurance_requirement?: 'REQUIRED' | 'OPTIONAL' | 'NA'
          health_requirements?: string | null
          terms_and_conditions?: string | null
          total_nights?: number
          total_days?: number
          total_cities?: number
          base_price?: number | null
          status?: 'draft' | 'published' | 'archived' | 'suspended'
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_city_packages_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      multi_city_package_images: {
        Row: {
          id: string
          package_id: string
          file_name: string
          storage_path: string
          public_url: string
          file_size: number | null
          mime_type: string | null
          is_cover: boolean
          is_featured: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          file_name: string
          storage_path: string
          public_url: string
          file_size?: number | null
          mime_type?: string | null
          is_cover?: boolean
          is_featured?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          file_name?: string
          storage_path?: string
          public_url?: string
          file_size?: number | null
          mime_type?: string | null
          is_cover?: boolean
          is_featured?: boolean
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_city_package_images_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "multi_city_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      multi_city_package_cities: {
        Row: {
          id: string
          package_id: string
          name: string
          country: string | null
          nights: number
          highlights: string[] | null
          activities_included: string[] | null
          city_order: number
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          name: string
          country?: string | null
          nights: number
          highlights?: string[] | null
          activities_included?: string[] | null
          city_order: number
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          name?: string
          country?: string | null
          nights?: number
          highlights?: string[] | null
          activities_included?: string[] | null
          city_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_city_package_cities_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "multi_city_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      multi_city_package_connections: {
        Row: {
          id: string
          package_id: string
          from_city_id: string
          to_city_id: string
          transport_type: 'FLIGHT' | 'TRAIN' | 'BUS' | 'CAR'
          transport_class: 'ECONOMY' | 'BUSINESS' | 'FIRST' | 'STANDARD' | null
          duration_hours: number | null
          carrier_name: string | null
          departure_time: string | null
          arrival_time: string | null
          price_included: boolean
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          from_city_id: string
          to_city_id: string
          transport_type: 'FLIGHT' | 'TRAIN' | 'BUS' | 'CAR'
          transport_class?: 'ECONOMY' | 'BUSINESS' | 'FIRST' | 'STANDARD' | null
          duration_hours?: number | null
          carrier_name?: string | null
          departure_time?: string | null
          arrival_time?: string | null
          price_included?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          from_city_id?: string
          to_city_id?: string
          transport_type?: 'FLIGHT' | 'TRAIN' | 'BUS' | 'CAR'
          transport_class?: 'ECONOMY' | 'BUSINESS' | 'FIRST' | 'STANDARD' | null
          duration_hours?: number | null
          carrier_name?: string | null
          departure_time?: string | null
          arrival_time?: string | null
          price_included?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_city_package_connections_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "multi_city_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multi_city_package_connections_from_city_id_fkey"
            columns: ["from_city_id"]
            isOneToOne: false
            referencedRelation: "multi_city_package_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multi_city_package_connections_to_city_id_fkey"
            columns: ["to_city_id"]
            isOneToOne: false
            referencedRelation: "multi_city_package_cities"
            referencedColumns: ["id"]
          }
        ]
      }
      multi_city_package_inclusions: {
        Row: {
          id: string
          package_id: string
          category: 'Transport' | 'Activities' | 'Meals' | 'Guide Services' | 'Entry Fees' | 'Insurance'
          text: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          category: 'Transport' | 'Activities' | 'Meals' | 'Guide Services' | 'Entry Fees' | 'Insurance'
          text: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          category?: 'Transport' | 'Activities' | 'Meals' | 'Guide Services' | 'Entry Fees' | 'Insurance'
          text?: string
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_city_package_inclusions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "multi_city_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      multi_city_package_exclusions: {
        Row: {
          id: string
          package_id: string
          text: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          text: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          text?: string
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_city_package_exclusions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "multi_city_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      multi_city_package_cancellation_tiers: {
        Row: {
          id: string
          package_id: string
          days_before: number
          refund_percent: number
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          days_before: number
          refund_percent: number
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          days_before?: number
          refund_percent?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_city_package_cancellation_tiers_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "multi_city_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      multi_city_package_departures: {
        Row: {
          id: string
          package_id: string
          departure_date: string
          available_seats: number | null
          price: number | null
          cutoff_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          departure_date: string
          available_seats?: number | null
          price?: number | null
          cutoff_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          departure_date?: string
          available_seats?: number | null
          price?: number | null
          cutoff_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_city_package_departures_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "multi_city_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      multi_city_package_day_plans: {
        Row: {
          id: string
          package_id: string
          city_id: string
          day_number: number
          title: string
          description: string | null
          overnight_city: string | null
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          city_id: string
          day_number: number
          title: string
          description?: string | null
          overnight_city?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          city_id?: string
          day_number?: number
          title?: string
          description?: string | null
          overnight_city?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_city_package_day_plans_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "multi_city_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multi_city_package_day_plans_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "multi_city_package_cities"
            referencedColumns: ["id"]
          }
        ]
      }
      multi_city_package_day_activities: {
        Row: {
          id: string
          day_plan_id: string
          time_slot: string | null
          title: string
          description: string | null
          duration_minutes: number | null
          activity_order: number
          created_at: string
        }
        Insert: {
          id?: string
          day_plan_id: string
          time_slot?: string | null
          title: string
          description?: string | null
          duration_minutes?: number | null
          activity_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          day_plan_id?: string
          time_slot?: string | null
          title?: string
          description?: string | null
          duration_minutes?: number | null
          activity_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_city_package_day_activities_day_plan_id_fkey"
            columns: ["day_plan_id"]
            isOneToOne: false
            referencedRelation: "multi_city_package_day_plans"
            referencedColumns: ["id"]
          }
        ]
      }
      multi_city_package_addons: {
        Row: {
          id: string
          package_id: string
          name: string
          description: string | null
          price: number
          is_active: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          name: string
          description?: string | null
          price?: number
          is_active?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          name?: string
          description?: string | null
          price?: number
          is_active?: boolean
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_city_package_addons_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "multi_city_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      transfer_packages: {
        Row: {
          id: string
          operator_id: string
          title: string
          short_description: string
          full_description: string | null
          destination_name: string
          destination_address: string | null
          destination_city: string | null
          destination_country: string | null
          destination_coordinates: Json | null
          transfer_type: 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_STOP'
          total_distance: number | null
          distance_unit: 'KM' | 'MILES'
          estimated_duration_hours: number | null
          estimated_duration_minutes: number | null
          route_points: Json | null
          meet_and_greet: boolean
          name_board: boolean
          driver_uniform: boolean
          flight_tracking: boolean
          luggage_assistance: boolean
          door_to_door_service: boolean
          contact_driver_in_advance: boolean
          contact_lead_time: number
          real_time_tracking: boolean
          languages_supported: string[]
          tags: string[]
          base_price: number
          currency: string
          cancellation_policy_type: 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'CUSTOM'
          cancellation_refund_percentage: number
          cancellation_deadline_hours: number
          no_show_policy: string | null
          terms_and_conditions: string | null
          available_days: string[]
          advance_booking_hours: number
          maximum_advance_booking_days: number
          instant_confirmation: boolean
          special_instructions: string | null
          status: 'draft' | 'published' | 'archived' | 'suspended'
          featured: boolean
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          operator_id: string
          title: string
          short_description: string
          full_description?: string | null
          destination_name: string
          destination_address?: string | null
          destination_city?: string | null
          destination_country?: string | null
          destination_coordinates?: Json | null
          transfer_type: 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_STOP'
          total_distance?: number | null
          distance_unit?: 'KM' | 'MILES'
          estimated_duration_hours?: number | null
          estimated_duration_minutes?: number | null
          route_points?: Json | null
          meet_and_greet?: boolean
          name_board?: boolean
          driver_uniform?: boolean
          flight_tracking?: boolean
          luggage_assistance?: boolean
          door_to_door_service?: boolean
          contact_driver_in_advance?: boolean
          contact_lead_time?: number
          real_time_tracking?: boolean
          languages_supported?: string[]
          tags?: string[]
          base_price: number
          currency?: string
          cancellation_policy_type?: 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'CUSTOM'
          cancellation_refund_percentage?: number
          cancellation_deadline_hours?: number
          no_show_policy?: string | null
          terms_and_conditions?: string | null
          available_days?: string[]
          advance_booking_hours?: number
          maximum_advance_booking_days?: number
          instant_confirmation?: boolean
          special_instructions?: string | null
          status?: 'draft' | 'published' | 'archived' | 'suspended'
          featured?: boolean
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          operator_id?: string
          title?: string
          short_description?: string
          full_description?: string | null
          destination_name?: string
          destination_address?: string | null
          destination_city?: string | null
          destination_country?: string | null
          destination_coordinates?: Json | null
          transfer_type?: 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_STOP'
          total_distance?: number | null
          distance_unit?: 'KM' | 'MILES'
          estimated_duration_hours?: number | null
          estimated_duration_minutes?: number | null
          route_points?: Json | null
          meet_and_greet?: boolean
          name_board?: boolean
          driver_uniform?: boolean
          flight_tracking?: boolean
          luggage_assistance?: boolean
          door_to_door_service?: boolean
          contact_driver_in_advance?: boolean
          contact_lead_time?: number
          real_time_tracking?: boolean
          languages_supported?: string[]
          tags?: string[]
          base_price?: number
          currency?: string
          cancellation_policy_type?: 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'CUSTOM'
          cancellation_refund_percentage?: number
          cancellation_deadline_hours?: number
          no_show_policy?: string | null
          terms_and_conditions?: string | null
          available_days?: string[]
          advance_booking_hours?: number
          maximum_advance_booking_days?: number
          instant_confirmation?: boolean
          special_instructions?: string | null
          status?: 'draft' | 'published' | 'archived' | 'suspended'
          featured?: boolean
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfer_packages_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      transfer_package_images: {
        Row: {
          id: string
          package_id: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          storage_path: string
          public_url: string | null
          alt_text: string | null
          is_cover: boolean
          is_featured: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          package_id: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          storage_path: string
          public_url?: string | null
          alt_text?: string | null
          is_cover?: boolean
          is_featured?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          file_name?: string
          file_size?: number | null
          mime_type?: string | null
          storage_path?: string
          public_url?: string | null
          alt_text?: string | null
          is_cover?: boolean
          is_featured?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_package_images_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "transfer_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      transfer_package_vehicles: {
        Row: {
          id: string
          package_id: string
          vehicle_type: 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS'
          name: string
          description: string | null
          passenger_capacity: number
          luggage_capacity: number
          features: string[]
          base_price: number
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          package_id: string
          vehicle_type: 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS'
          name: string
          description?: string | null
          passenger_capacity: number
          luggage_capacity: number
          features?: string[]
          base_price: number
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          vehicle_type?: 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS'
          name?: string
          description?: string | null
          passenger_capacity?: number
          luggage_capacity?: number
          features?: string[]
          base_price?: number
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_package_vehicles_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "transfer_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      transfer_vehicle_images: {
        Row: {
          id: string
          vehicle_id: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          storage_path: string
          public_url: string | null
          alt_text: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          storage_path: string
          public_url?: string | null
          alt_text?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          file_name?: string
          file_size?: number | null
          mime_type?: string | null
          storage_path?: string
          public_url?: string | null
          alt_text?: string | null
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_vehicle_images_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "transfer_package_vehicles"
            referencedColumns: ["id"]
          }
        ]
      }
      transfer_package_stops: {
        Row: {
          id: string
          package_id: string
          location_name: string
          location_address: string | null
          location_coordinates: Json | null
          duration_hours: number
          duration_minutes: number
          description: string | null
          stop_order: number
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          location_name: string
          location_address?: string | null
          location_coordinates?: Json | null
          duration_hours?: number
          duration_minutes?: number
          description?: string | null
          stop_order: number
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          location_name?: string
          location_address?: string | null
          location_coordinates?: Json | null
          duration_hours?: number
          duration_minutes?: number
          description?: string | null
          stop_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_package_stops_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "transfer_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      transfer_additional_services: {
        Row: {
          id: string
          package_id: string
          name: string
          description: string | null
          price: number
          is_included: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          name: string
          description?: string | null
          price: number
          is_included?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          name?: string
          description?: string | null
          price?: number
          is_included?: boolean
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_additional_services_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "transfer_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      transfer_pricing_rules: {
        Row: {
          id: string
          vehicle_id: string
          rule_type: 'DISTANCE_BASED' | 'TIME_BASED' | 'ADDITIONAL_CHARGE'
          min_distance: number | null
          max_distance: number | null
          price_per_km: number | null
          time_start: string | null
          time_end: string | null
          surcharge_percentage: number | null
          charge_name: string | null
          charge_description: string | null
          charge_type: string | null
          charge_amount: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          rule_type: 'DISTANCE_BASED' | 'TIME_BASED' | 'ADDITIONAL_CHARGE'
          min_distance?: number | null
          max_distance?: number | null
          price_per_km?: number | null
          time_start?: string | null
          time_end?: string | null
          surcharge_percentage?: number | null
          charge_name?: string | null
          charge_description?: string | null
          charge_type?: string | null
          charge_amount?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          rule_type?: 'DISTANCE_BASED' | 'TIME_BASED' | 'ADDITIONAL_CHARGE'
          min_distance?: number | null
          max_distance?: number | null
          price_per_km?: number | null
          time_start?: string | null
          time_end?: string | null
          surcharge_percentage?: number | null
          charge_name?: string | null
          charge_description?: string | null
          charge_type?: string | null
          charge_amount?: number | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_pricing_rules_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "transfer_package_vehicles"
            referencedColumns: ["id"]
          }
        ]
      }
      transfer_time_slots: {
        Row: {
          id: string
          package_id: string
          start_time: string
          end_time: string
          available_days: string[]
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          start_time: string
          end_time: string
          available_days: string[]
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          start_time?: string
          end_time?: string
          available_days?: string[]
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_time_slots_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "transfer_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      transfer_booking_restrictions: {
        Row: {
          id: string
          package_id: string
          restriction_type: 'DATE_RANGE' | 'SPECIFIC_DATES' | 'HOLIDAYS'
          start_date: string | null
          end_date: string | null
          specific_dates: Json | null
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          restriction_type: 'DATE_RANGE' | 'SPECIFIC_DATES' | 'HOLIDAYS'
          start_date?: string | null
          end_date?: string | null
          specific_dates?: Json | null
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          restriction_type?: 'DATE_RANGE' | 'SPECIFIC_DATES' | 'HOLIDAYS'
          start_date?: string | null
          end_date?: string | null
          specific_dates?: Json | null
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_booking_restrictions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "transfer_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      transfer_hourly_pricing: {
        Row: {
          id: string
          package_id: string
          hours: number
          vehicle_type: 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS'
          vehicle_name: string
          max_passengers: number
          rate_usd: number
          description: string | null
          features: string[]
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          package_id: string
          hours: number
          vehicle_type: 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS'
          vehicle_name: string
          max_passengers: number
          rate_usd: number
          description?: string | null
          features?: string[]
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          hours?: number
          vehicle_type?: 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS'
          vehicle_name?: string
          max_passengers?: number
          rate_usd?: number
          description?: string | null
          features?: string[]
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_hourly_pricing_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "transfer_packages"
            referencedColumns: ["id"]
          }
        ]
      }
      transfer_point_to_point_pricing: {
        Row: {
          id: string
          package_id: string
          from_location: string
          from_address: string | null
          from_coordinates: Json | null
          to_location: string
          to_address: string | null
          to_coordinates: Json | null
          distance: number | null
          distance_unit: 'KM' | 'MILES'
          estimated_duration_minutes: number | null
          vehicle_type: 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS'
          vehicle_name: string
          max_passengers: number
          cost_usd: number
          description: string | null
          features: string[]
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          package_id: string
          from_location: string
          from_address?: string | null
          from_coordinates?: Json | null
          to_location: string
          to_address?: string | null
          to_coordinates?: Json | null
          distance?: number | null
          distance_unit?: 'KM' | 'MILES'
          estimated_duration_minutes?: number | null
          vehicle_type: 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS'
          vehicle_name: string
          max_passengers: number
          cost_usd: number
          description?: string | null
          features?: string[]
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          from_location?: string
          from_address?: string | null
          from_coordinates?: Json | null
          to_location?: string
          to_address?: string | null
          to_coordinates?: Json | null
          distance?: number | null
          distance_unit?: 'KM' | 'MILES'
          estimated_duration_minutes?: number | null
          vehicle_type?: 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS'
          vehicle_name?: string
          max_passengers?: number
          cost_usd?: number
          description?: string | null
          features?: string[]
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_point_to_point_pricing_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "transfer_packages"
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
      package_status: 'draft' | 'published' | 'archived' | 'suspended'
      pricing_mode: 'FIXED' | 'PER_PERSON' | 'GROUP_TIERED'
      transport_type: 'FLIGHT' | 'TRAIN' | 'BUS' | 'CAR'
      transport_class: 'ECONOMY' | 'BUSINESS' | 'FIRST' | 'STANDARD'
      inclusion_category: 'Transport' | 'Activities' | 'Meals' | 'Guide Services' | 'Entry Fees' | 'Insurance'
      insurance_requirement: 'REQUIRED' | 'OPTIONAL' | 'NA'
      transfer_type: 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_STOP'
      vehicle_type: 'SEDAN' | 'SUV' | 'VAN' | 'BUS' | 'LUXURY' | 'MINIBUS'
      transfer_policy_type: 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'CUSTOM'
      distance_unit: 'KM' | 'MILES'
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
export type MultiCityPackage = Tables<'multi_city_packages'>
export type MultiCityPackageImage = Tables<'multi_city_package_images'>
export type MultiCityPackageCity = Tables<'multi_city_package_cities'>
export type MultiCityPackageConnection = Tables<'multi_city_package_connections'>
export type MultiCityPackageInclusion = Tables<'multi_city_package_inclusions'>
export type MultiCityPackageExclusion = Tables<'multi_city_package_exclusions'>
export type MultiCityPackageCancellationTier = Tables<'multi_city_package_cancellation_tiers'>
export type MultiCityPackageDeparture = Tables<'multi_city_package_departures'>
export type MultiCityPackageDayPlan = Tables<'multi_city_package_day_plans'>
export type MultiCityPackageDayActivity = Tables<'multi_city_package_day_activities'>
export type MultiCityPackageAddon = Tables<'multi_city_package_addons'>
export type TransferPackage = Tables<'transfer_packages'>
export type TransferPackageImage = Tables<'transfer_package_images'>
export type TransferPackageVehicle = Tables<'transfer_package_vehicles'>
export type TransferVehicleImage = Tables<'transfer_vehicle_images'>
export type TransferPackageStop = Tables<'transfer_package_stops'>
export type TransferAdditionalService = Tables<'transfer_additional_services'>
export type TransferPricingRule = Tables<'transfer_pricing_rules'>
export type TransferTimeSlot = Tables<'transfer_time_slots'>
export type TransferBookingRestriction = Tables<'transfer_booking_restrictions'>

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
export type MultiCityPackageInsert = Database['public']['Tables']['multi_city_packages']['Insert']
export type MultiCityPackageImageInsert = Database['public']['Tables']['multi_city_package_images']['Insert']
export type MultiCityPackageCityInsert = Database['public']['Tables']['multi_city_package_cities']['Insert']
export type MultiCityPackageConnectionInsert = Database['public']['Tables']['multi_city_package_connections']['Insert']
export type MultiCityPackageInclusionInsert = Database['public']['Tables']['multi_city_package_inclusions']['Insert']
export type MultiCityPackageExclusionInsert = Database['public']['Tables']['multi_city_package_exclusions']['Insert']
export type MultiCityPackageCancellationTierInsert = Database['public']['Tables']['multi_city_package_cancellation_tiers']['Insert']
export type MultiCityPackageDepartureInsert = Database['public']['Tables']['multi_city_package_departures']['Insert']
export type MultiCityPackageDayPlanInsert = Database['public']['Tables']['multi_city_package_day_plans']['Insert']
export type MultiCityPackageDayActivityInsert = Database['public']['Tables']['multi_city_package_day_activities']['Insert']
export type MultiCityPackageAddonInsert = Database['public']['Tables']['multi_city_package_addons']['Insert']
export type TransferPackageInsert = Database['public']['Tables']['transfer_packages']['Insert']
export type TransferPackageImageInsert = Database['public']['Tables']['transfer_package_images']['Insert']
export type TransferPackageVehicleInsert = Database['public']['Tables']['transfer_package_vehicles']['Insert']
export type TransferVehicleImageInsert = Database['public']['Tables']['transfer_vehicle_images']['Insert']
export type TransferPackageStopInsert = Database['public']['Tables']['transfer_package_stops']['Insert']
export type TransferAdditionalServiceInsert = Database['public']['Tables']['transfer_additional_services']['Insert']
export type TransferPricingRuleInsert = Database['public']['Tables']['transfer_pricing_rules']['Insert']
export type TransferTimeSlotInsert = Database['public']['Tables']['transfer_time_slots']['Insert']
export type TransferBookingRestrictionInsert = Database['public']['Tables']['transfer_booking_restrictions']['Insert']

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
export type MultiCityPackageUpdate = Database['public']['Tables']['multi_city_packages']['Update']
export type MultiCityPackageImageUpdate = Database['public']['Tables']['multi_city_package_images']['Update']
export type MultiCityPackageCityUpdate = Database['public']['Tables']['multi_city_package_cities']['Update']
export type MultiCityPackageConnectionUpdate = Database['public']['Tables']['multi_city_package_connections']['Update']
export type MultiCityPackageInclusionUpdate = Database['public']['Tables']['multi_city_package_inclusions']['Update']
export type MultiCityPackageExclusionUpdate = Database['public']['Tables']['multi_city_package_exclusions']['Update']
export type MultiCityPackageCancellationTierUpdate = Database['public']['Tables']['multi_city_package_cancellation_tiers']['Update']
export type MultiCityPackageDepartureUpdate = Database['public']['Tables']['multi_city_package_departures']['Update']
export type MultiCityPackageDayPlanUpdate = Database['public']['Tables']['multi_city_package_day_plans']['Update']
export type MultiCityPackageDayActivityUpdate = Database['public']['Tables']['multi_city_package_day_activities']['Update']
export type MultiCityPackageAddonUpdate = Database['public']['Tables']['multi_city_package_addons']['Update']
export type TransferPackageUpdate = Database['public']['Tables']['transfer_packages']['Update']
export type TransferPackageImageUpdate = Database['public']['Tables']['transfer_package_images']['Update']
export type TransferPackageVehicleUpdate = Database['public']['Tables']['transfer_package_vehicles']['Update']
export type TransferVehicleImageUpdate = Database['public']['Tables']['transfer_vehicle_images']['Update']
export type TransferPackageStopUpdate = Database['public']['Tables']['transfer_package_stops']['Update']
export type TransferAdditionalServiceUpdate = Database['public']['Tables']['transfer_additional_services']['Update']
export type TransferPricingRuleUpdate = Database['public']['Tables']['transfer_pricing_rules']['Update']
export type TransferTimeSlotUpdate = Database['public']['Tables']['transfer_time_slots']['Update']
export type TransferBookingRestrictionUpdate = Database['public']['Tables']['transfer_booking_restrictions']['Update']

