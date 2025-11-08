-- ============================================================================
-- ADD ROOM CAPACITY COLUMNS TO MULTI-CITY HOTEL PACKAGE CITY HOTELS
-- This migration adds room capacity fields (adults and children) to the
-- multi_city_hotel_package_city_hotels table
-- ============================================================================

-- Add room capacity columns to multi_city_hotel_package_city_hotels table
ALTER TABLE multi_city_hotel_package_city_hotels
ADD COLUMN IF NOT EXISTS room_capacity_adults INTEGER CHECK (room_capacity_adults IS NULL OR room_capacity_adults >= 0),
ADD COLUMN IF NOT EXISTS room_capacity_children INTEGER CHECK (room_capacity_children IS NULL OR room_capacity_children >= 0);

-- Add comments for documentation
COMMENT ON COLUMN multi_city_hotel_package_city_hotels.room_capacity_adults IS 'Maximum number of adults that can occupy this room type';
COMMENT ON COLUMN multi_city_hotel_package_city_hotels.room_capacity_children IS 'Maximum number of children that can occupy this room type';

