-- ============================================================================
-- CREATE ITINERARY FLIGHTS TABLE
-- This migration creates a table for storing flight information in itineraries
-- For now, flights are manually entered (APIs will be integrated later)
-- ============================================================================

CREATE TABLE IF NOT EXISTS itinerary_flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  
  -- Flight Details
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  arrival_date DATE NOT NULL,
  arrival_time TIME NOT NULL,
  
  -- Airline Information
  airline TEXT,
  flight_number TEXT,
  aircraft_type TEXT,
  
  -- Pricing
  price_per_person DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  total_price DECIMAL(10,2), -- Total for all travelers
  
  -- Additional Info
  booking_class TEXT, -- Economy, Business, First
  baggage_allowance TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_itinerary_flights_itinerary_id ON itinerary_flights(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_flights_departure_date ON itinerary_flights(departure_date);
CREATE INDEX IF NOT EXISTS idx_itinerary_flights_route ON itinerary_flights(from_city, to_city);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_itinerary_flights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_itinerary_flights_updated_at
    BEFORE UPDATE ON itinerary_flights
    FOR EACH ROW
    EXECUTE FUNCTION update_itinerary_flights_updated_at();

-- Add comments for documentation
COMMENT ON TABLE itinerary_flights IS 'Stores flight information for itineraries. Manual entry for now, APIs will be integrated later.';
COMMENT ON COLUMN itinerary_flights.from_city IS 'Departure city name';
COMMENT ON COLUMN itinerary_flights.to_city IS 'Arrival city name';
COMMENT ON COLUMN itinerary_flights.price_per_person IS 'Price per person for the flight';
COMMENT ON COLUMN itinerary_flights.total_price IS 'Total price for all travelers';


