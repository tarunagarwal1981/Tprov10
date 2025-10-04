import { z } from 'zod';

// User validation schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Destination validation schemas
export const destinationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Destination name must be at least 2 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  rating: z.number().min(1).max(5),
  priceRange: z.enum(['budget', 'mid-range', 'luxury']),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
});

export const createDestinationSchema = destinationSchema.omit({
  id: true,
});

// Hotel validation schemas
export const hotelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Hotel name must be at least 2 characters'),
  destinationId: z.string().uuid(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  amenities: z.array(z.string()).min(1, 'At least one amenity is required'),
  rating: z.number().min(1).max(5),
  pricePerNight: z.number().positive('Price must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  checkInTime: z.string(),
  checkOutTime: z.string(),
});

export const createHotelSchema = hotelSchema.omit({
  id: true,
});

// Flight validation schemas
export const flightSchema = z.object({
  id: z.string().uuid(),
  airline: z.string().min(2, 'Airline must be at least 2 characters'),
  flightNumber: z
    .string()
    .min(3, 'Flight number must be at least 3 characters'),
  departure: z.object({
    airport: z.string().min(3, 'Airport code must be at least 3 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    time: z.date(),
    terminal: z.string().optional(),
  }),
  arrival: z.object({
    airport: z.string().min(3, 'Airport code must be at least 3 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    time: z.date(),
    terminal: z.string().optional(),
  }),
  duration: z.number().positive('Duration must be positive'),
  price: z.number().positive('Price must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  class: z.enum(['economy', 'business', 'first']),
  stops: z.number().min(0, 'Stops cannot be negative'),
});

export const createFlightSchema = flightSchema.omit({
  id: true,
});

// Booking validation schemas
export const bookingSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['hotel', 'flight', 'package']),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  totalAmount: z.number().positive('Total amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  bookingDate: z.date(),
  travelDate: z.date(),
  details: z.union([hotelSchema, flightSchema, z.any()]), // Package schema would be added separately
  passengers: z.array(z.any()).optional(), // Passenger schema would be added separately
});

export const createBookingSchema = bookingSchema.omit({
  id: true,
  bookingDate: true,
});

// Passenger validation schemas
export const passengerSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  dateOfBirth: z.date(),
  passportNumber: z.string().optional(),
  nationality: z.string().min(2, 'Nationality must be at least 2 characters'),
  seatPreference: z.string().optional(),
  mealPreference: z.string().optional(),
});

export const createPassengerSchema = passengerSchema.omit({
  id: true,
});

// Search filters validation schema
export const searchFiltersSchema = z.object({
  destination: z.string().optional(),
  checkIn: z.date().optional(),
  checkOut: z.date().optional(),
  guests: z.number().min(1).max(20).optional(),
  rooms: z.number().min(1).max(10).optional(),
  priceRange: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
    })
    .optional(),
  amenities: z.array(z.string()).optional(),
  rating: z.number().min(1).max(5).optional(),
});

// Form validation schemas
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Type exports for TypeScript
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type Destination = z.infer<typeof destinationSchema>;
export type CreateDestination = z.infer<typeof createDestinationSchema>;
export type Hotel = z.infer<typeof hotelSchema>;
export type CreateHotel = z.infer<typeof createHotelSchema>;
export type Flight = z.infer<typeof flightSchema>;
export type CreateFlight = z.infer<typeof createFlightSchema>;
export type Booking = z.infer<typeof bookingSchema>;
export type CreateBooking = z.infer<typeof createBookingSchema>;
export type Passenger = z.infer<typeof passengerSchema>;
export type CreatePassenger = z.infer<typeof createPassengerSchema>;
export type SearchFilters = z.infer<typeof searchFiltersSchema>;
export type ContactForm = z.infer<typeof contactFormSchema>;
export type Newsletter = z.infer<typeof newsletterSchema>;
