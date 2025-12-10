-- Supabase Schema Export
-- Generated: 2025-11-21T10:38:51.887Z

CREATE TABLE IF NOT EXISTS users (
  id TEXT,
  email TEXT,
  name TEXT,
  phone TEXT,
  role TEXT,
  profile JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS activity_packages (
  id TEXT,
  operator_id TEXT,
  title TEXT,
  short_description TEXT,
  full_description TEXT,
  status TEXT,
  destination_name TEXT,
  destination_address TEXT,
  destination_city TEXT,
  destination_country TEXT,
  destination_postal_code TEXT,
  destination_coordinates TEXT,
  duration_hours INTEGER,
  duration_minutes INTEGER,
  difficulty_level TEXT,
  languages_supported JSONB,
  tags JSONB,
  meeting_point_name TEXT,
  meeting_point_address TEXT,
  meeting_point_coordinates TEXT,
  meeting_point_instructions TEXT,
  operating_days JSONB,
  whats_included JSONB,
  whats_not_included JSONB,
  what_to_bring JSONB,
  important_information TEXT,
  minimum_age INTEGER,
  maximum_age TEXT,
  child_policy TEXT,
  infant_policy TEXT,
  age_verification_required BOOLEAN,
  wheelchair_accessible BOOLEAN,
  accessibility_facilities JSONB,
  special_assistance TEXT,
  cancellation_policy_type TEXT,
  cancellation_policy_custom TEXT,
  cancellation_refund_percentage INTEGER,
  cancellation_deadline_hours INTEGER,
  weather_policy TEXT,
  health_safety_requirements JSONB,
  health_safety_additional_info TEXT,
  base_price INTEGER,
  currency TEXT,
  price_type TEXT,
  child_price_type TEXT,
  child_price_value TEXT,
  infant_price TEXT,
  group_discounts JSONB,
  seasonal_pricing JSONB,
  dynamic_pricing_enabled BOOLEAN,
  dynamic_pricing_base_multiplier INTEGER,
  dynamic_pricing_demand_multiplier INTEGER,
  dynamic_pricing_season_multiplier INTEGER,
  slug TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS activity_package_images (
  id TEXT,
  package_id TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  storage_path TEXT,
  public_url TEXT,
  width TEXT,
  height TEXT,
  alt_text TEXT,
  caption TEXT,
  is_cover BOOLEAN,
  is_featured BOOLEAN,
  display_order INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS activity_package_time_slots (
  id TEXT,
  package_id TEXT,
  start_time TEXT,
  end_time TEXT,
  capacity INTEGER,
  is_active BOOLEAN,
  days JSONB,
  price_override TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS activity_package_variants (
  id TEXT,
  package_id TEXT,
  name TEXT,
  description TEXT,
  price_adjustment INTEGER,
  features JSONB,
  max_capacity INTEGER,
  is_active BOOLEAN,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS transfer_packages (
  id TEXT,
  operator_id TEXT,
  title TEXT,
  short_description TEXT,
  full_description TEXT,
  destination_name TEXT,
  destination_address TEXT,
  destination_city TEXT,
  destination_country TEXT,
  destination_coordinates JSONB,
  transfer_type TEXT,
  total_distance INTEGER,
  distance_unit TEXT,
  estimated_duration_hours INTEGER,
  estimated_duration_minutes INTEGER,
  route_points JSONB,
  meet_and_greet BOOLEAN,
  name_board BOOLEAN,
  driver_uniform BOOLEAN,
  flight_tracking BOOLEAN,
  luggage_assistance BOOLEAN,
  door_to_door_service BOOLEAN,
  contact_driver_in_advance BOOLEAN,
  contact_lead_time INTEGER,
  real_time_tracking BOOLEAN,
  languages_supported JSONB,
  tags JSONB,
  base_price INTEGER,
  currency TEXT,
  cancellation_policy_type TEXT,
  cancellation_refund_percentage INTEGER,
  cancellation_deadline_hours INTEGER,
  no_show_policy TEXT,
  terms_and_conditions TEXT,
  available_days JSONB,
  advance_booking_hours INTEGER,
  maximum_advance_booking_days INTEGER,
  instant_confirmation BOOLEAN,
  special_instructions TEXT,
  status TEXT,
  featured BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  pickup_date TEXT,
  pickup_time TEXT,
  return_date TEXT,
  return_time TEXT,
  pickup_location_name TEXT,
  pickup_location_address TEXT,
  pickup_location_coordinates TEXT,
  dropoff_location_name TEXT,
  dropoff_location_address TEXT,
  dropoff_location_coordinates TEXT,
  number_of_passengers INTEGER,
  number_of_luggage_pieces INTEGER
);

CREATE TABLE IF NOT EXISTS transfer_package_vehicles (
  id TEXT,
  package_id TEXT,
  vehicle_type TEXT,
  name TEXT,
  description TEXT,
  passenger_capacity INTEGER,
  luggage_capacity INTEGER,
  features JSONB,
  base_price INTEGER,
  is_active BOOLEAN,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  has_image BOOLEAN
);

CREATE TABLE IF NOT EXISTS transfer_hourly_pricing (
  id TEXT,
  package_id TEXT,
  hours INTEGER,
  vehicle_type TEXT,
  vehicle_name TEXT,
  max_passengers INTEGER,
  rate_usd INTEGER,
  description TEXT,
  features JSONB,
  is_active BOOLEAN,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS transfer_point_to_point_pricing (
  id TEXT,
  package_id TEXT,
  from_location TEXT,
  from_address TEXT,
  from_coordinates TEXT,
  to_location TEXT,
  to_address TEXT,
  to_coordinates TEXT,
  distance TEXT,
  distance_unit TEXT,
  estimated_duration_minutes TEXT,
  vehicle_type TEXT,
  vehicle_name TEXT,
  max_passengers INTEGER,
  cost_usd INTEGER,
  description TEXT,
  features JSONB,
  is_active BOOLEAN,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS multi_city_packages (
  id TEXT,
  operator_id TEXT,
  title TEXT,
  short_description TEXT,
  full_description TEXT,
  destination_region TEXT,
  include_intercity_transport BOOLEAN,
  pricing_mode TEXT,
  fixed_price TEXT,
  per_person_price TEXT,
  group_min TEXT,
  group_max TEXT,
  currency TEXT,
  validity_start TEXT,
  validity_end TEXT,
  seasonal_notes TEXT,
  deposit_percent INTEGER,
  balance_due_days INTEGER,
  payment_methods JSONB,
  visa_requirements TEXT,
  insurance_requirement TEXT,
  health_requirements TEXT,
  terms_and_conditions TEXT,
  total_nights INTEGER,
  total_days INTEGER,
  total_cities INTEGER,
  base_price INTEGER,
  status TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  package_validity_date TEXT
);

CREATE TABLE IF NOT EXISTS multi_city_package_cities (
  id TEXT,
  package_id TEXT,
  name TEXT,
  country TEXT,
  nights INTEGER,
  highlights JSONB,
  activities_included JSONB,
  city_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS multi_city_package_images (
  id TEXT,
  package_id TEXT,
  file_name TEXT,
  storage_path TEXT,
  public_url TEXT,
  file_size TEXT,
  mime_type TEXT,
  is_cover BOOLEAN,
  is_featured BOOLEAN,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS multi_city_package_inclusions (
  id TEXT,
  package_id TEXT,
  category TEXT,
  text TEXT,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS multi_city_package_exclusions (
  id TEXT,
  package_id TEXT,
  text TEXT,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS multi_city_package_cancellation_tiers (
  id TEXT,
  package_id TEXT,
  days_before INTEGER,
  refund_percent INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS multi_city_pricing_packages (
  id TEXT,
  package_id TEXT,
  pricing_type TEXT,
  package_name TEXT,
  description TEXT,
  adult_price TEXT,
  child_price TEXT,
  child_min_age INTEGER,
  child_max_age INTEGER,
  infant_price TEXT,
  infant_max_age TEXT,
  included_items TEXT,
  excluded_items TEXT,
  is_active BOOLEAN,
  is_featured BOOLEAN,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  has_child_age_restriction BOOLEAN
);

CREATE TABLE IF NOT EXISTS multi_city_pricing_rows (
  id TEXT,
  pricing_package_id TEXT,
  number_of_adults INTEGER,
  number_of_children INTEGER,
  total_price INTEGER,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS multi_city_private_package_rows (
  id TEXT,
  pricing_package_id TEXT,
  number_of_adults INTEGER,
  number_of_children INTEGER,
  car_type TEXT,
  vehicle_capacity INTEGER,
  total_price INTEGER,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS multi_city_hotel_packages (
  id TEXT,
  operator_id TEXT,
  title TEXT,
  short_description TEXT,
  destination_region TEXT,
  package_validity_date TEXT,
  base_price INTEGER,
  currency TEXT,
  deposit_percent INTEGER,
  balance_due_days INTEGER,
  payment_methods JSONB,
  visa_requirements TEXT,
  insurance_requirement TEXT,
  health_requirements TEXT,
  terms_and_conditions TEXT,
  status TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  adult_price INTEGER,
  total_nights INTEGER,
  total_cities INTEGER
);

CREATE TABLE IF NOT EXISTS multi_city_hotel_package_cities (
  id TEXT,
  package_id TEXT,
  name TEXT,
  country TEXT,
  nights INTEGER,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS multi_city_hotel_package_city_hotels (
  id TEXT,
  city_id TEXT,
  hotel_name TEXT,
  hotel_type TEXT,
  room_type TEXT,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  room_capacity_adults TEXT,
  room_capacity_children TEXT
);

CREATE TABLE IF NOT EXISTS multi_city_hotel_package_images (
  id TEXT,
  package_id TEXT,
  file_name TEXT,
  storage_path TEXT,
  public_url TEXT,
  file_size TEXT,
  mime_type TEXT,
  is_cover BOOLEAN,
  is_featured BOOLEAN,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS multi_city_hotel_package_inclusions (
  id TEXT,
  package_id TEXT,
  category TEXT,
  description TEXT,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS multi_city_hotel_package_exclusions (
  id TEXT,
  package_id TEXT,
  description TEXT,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS multi_city_hotel_pricing_packages (
  id TEXT,
  package_id TEXT,
  pricing_type TEXT,
  adult_price INTEGER,
  child_price INTEGER,
  child_min_age INTEGER,
  child_max_age INTEGER,
  infant_price INTEGER,
  infant_max_age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS itineraries (
  id TEXT,
  lead_id TEXT,
  agent_id TEXT,
  name TEXT,
  status TEXT,
  adults_count INTEGER,
  children_count INTEGER,
  infants_count INTEGER,
  start_date TEXT,
  end_date TEXT,
  total_price INTEGER,
  currency TEXT,
  lead_budget_min INTEGER,
  lead_budget_max INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  sent_at TEXT
);

CREATE TABLE IF NOT EXISTS itinerary_days (
  id TEXT,
  itinerary_id TEXT,
  day_number INTEGER,
  date TEXT,
  city_name TEXT,
  notes TEXT,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS itinerary_items (
  id TEXT,
  itinerary_id TEXT,
  day_id TEXT,
  package_type TEXT,
  package_id TEXT,
  operator_id TEXT,
  package_title TEXT,
  package_image_url TEXT,
  configuration JSONB,
  unit_price INTEGER,
  quantity INTEGER,
  total_price INTEGER,
  display_order INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS itinerary_queries (
  id TEXT,
  lead_id TEXT,
  agent_id TEXT,
  destinations JSONB,
  leaving_from TEXT,
  nationality TEXT,
  leaving_on TIMESTAMP WITH TIME ZONE,
  travelers JSONB,
  star_rating INTEGER,
  add_transfers BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT,
  agent_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  destination TEXT,
  trip_type TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  duration_days INTEGER,
  travelers_count INTEGER,
  travel_date_start TEXT,
  travel_date_end TEXT,
  source TEXT,
  priority TEXT,
  stage TEXT,
  assigned_to TEXT,
  requirements TEXT,
  notes TEXT,
  tags TEXT,
  marketplace_lead_id TEXT,
  is_purchased BOOLEAN,
  purchased_from_marketplace BOOLEAN,
  purchase_id TEXT,
  next_follow_up_date TEXT,
  last_contacted_at TEXT,
  converted_to_booking BOOLEAN,
  booking_id TEXT,
  estimated_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS lead_marketplace (
  id TEXT,
  title TEXT,
  destination TEXT,
  trip_type TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  duration_days INTEGER,
  travelers_count INTEGER,
  travel_date_start TIMESTAMP WITH TIME ZONE,
  travel_date_end TIMESTAMP WITH TIME ZONE,
  special_requirements TEXT,
  lead_quality_score INTEGER,
  lead_price INTEGER,
  status TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  detailed_requirements TEXT
);

