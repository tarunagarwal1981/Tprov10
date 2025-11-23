/**
 * Smart Itinerary Filter Service
 * Provides intelligent filtering for activities, transfers, and other itinerary components
 * based on time, location, and other contextual factors.
 * 
 * MIGRATED: Now uses PostgreSQL directly via AWS RDS
 */

import { query, queryMany } from '@/lib/aws/database';

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface ActivityPackage {
  id: string;
  title: string;
  destination_city: string;
  destination_country: string;
  base_price: number;
  currency: string;
  duration_hours?: number;
  duration_minutes?: number;
  operational_hours?: any; // JSONB field
  operator_id: string;
  featured_image_url?: string;
  pricing_packages?: ActivityPricingPackage[]; // Pricing options for this activity
}

export interface ActivityPricingPackage {
  id: string;
  package_id: string;
  package_name: string;
  description?: string;
  adult_price: number;
  child_price: number;
  child_min_age: number;
  child_max_age: number;
  infant_price?: number;
  infant_max_age?: number;
  transfer_included: boolean;
  transfer_type?: 'SHARED' | 'PRIVATE';
  transfer_price_adult?: number;
  transfer_price_child?: number;
  transfer_price_infant?: number;
  included_items: string[];
  excluded_items?: string[];
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
}

export interface TransferPackage {
  id: string;
  title: string;
  from_location?: string;
  to_location?: string;
  pricing_mode: 'HOURLY' | 'POINT_TO_POINT';
  base_price: number;
  currency: string;
  operator_id: string;
}

export class SmartItineraryFilter {

  /**
   * Get available time slots based on arrival time
   * - If arrival < 12:00 PM → show afternoon + evening
   * - If arrival 12:00 PM - 5:00 PM → show evening only
   * - If arrival > 5:00 PM → show next day morning
   */
  getAvailableTimeSlots(arrivalTime: string | null): TimeSlot[] {
    if (!arrivalTime) {
      return ['morning', 'afternoon', 'evening'];
    }

    const [hours, minutes] = arrivalTime.split(':').map(Number);
    const totalMinutes = (hours || 0) * 60 + (minutes || 0);

    // Morning: 6:00 AM - 11:59 AM
    // Afternoon: 12:00 PM - 4:59 PM
    // Evening: 5:00 PM - 11:59 PM

    if (totalMinutes < 12 * 60) {
      // Arrival before noon - can do afternoon and evening
      return ['afternoon', 'evening'];
    } else if (totalMinutes < 17 * 60) {
      // Arrival between noon and 5 PM - only evening
      return ['evening'];
    } else {
      // Arrival after 5 PM - next day morning
      return [];
    }
  }

  /**
   * Filter activities by city
   */
  async getActivitiesForCity(
    cityName: string,
    country?: string,
    operatorId?: string // Kept for backward compatibility but not used for filtering
  ): Promise<ActivityPackage[]> {
    try {
      let sql = `
        SELECT id, title, destination_city, destination_country, base_price, currency, 
               operator_id, duration_hours, duration_minutes
        FROM activity_packages
        WHERE status = 'published'
      `;
      const params: any[] = [];
      let paramIndex = 1;

      // Filter by city or country
      if (cityName && country) {
        sql += ` AND (destination_city ILIKE $${paramIndex} OR destination_country ILIKE $${paramIndex + 1})`;
        params.push(`%${cityName}%`, `%${country}%`);
        paramIndex += 2;
      } else if (cityName) {
        sql += ` AND destination_city ILIKE $${paramIndex}`;
        params.push(`%${cityName}%`);
        paramIndex++;
      } else if (country) {
        sql += ` AND destination_country ILIKE $${paramIndex}`;
        params.push(`%${country}%`);
        paramIndex++;
      }

      sql += ` LIMIT 50`;

      const result = await query<ActivityPackage>(sql, params);
      const activities = result.rows;

      // Fetch pricing packages for each activity
      const activitiesWithPricing = await Promise.all(
        activities.map(async (activity) => {
          try {
            const pricingResult = await query<ActivityPricingPackage>(
              `SELECT * FROM activity_pricing_packages 
               WHERE package_id = $1 AND is_active = true 
               ORDER BY display_order ASC`,
              [activity.id]
            );

            return {
              ...activity,
              pricing_packages: pricingResult.rows,
            };
          } catch (err) {
            console.warn(`Error fetching pricing for activity ${activity.id}:`, err);
            return activity;
          }
        })
      );

      return activitiesWithPricing;
    } catch (error) {
      console.error('Error fetching activities:', error);
      console.error('Query details:', { cityName, country });
      return [];
    }
  }

  /**
   * Filter activities by time slot availability
   * Checks if activity is available in the specified time slot
   */
  filterActivitiesByTimeSlot(
    activities: ActivityPackage[],
    timeSlot: TimeSlot
  ): ActivityPackage[] {
    return activities.filter(activity => {
      // If no operational hours data, assume available
      if (!activity.operational_hours) {
        return true;
      }

      // Check if activity is available in the time slot
      const operationalHours = activity.operational_hours;
      
      // Check time slots array or specific time slot field
      if (Array.isArray(operationalHours.timeSlots)) {
        return operationalHours.timeSlots.some((slot: any) => 
          slot.slot?.toLowerCase() === timeSlot.toLowerCase()
        );
      }

      // Check if time slot field exists
      if (operationalHours[timeSlot]) {
        return true;
      }

      // Default: assume available if no specific restrictions
      return true;
    });
  }

  /**
   * Filter activities by duration and available time
   * Ensures activity can fit in the remaining time of the slot
   */
  filterByDuration(
    activities: ActivityPackage[],
    timeSlot: TimeSlot,
    currentTime: string | null
  ): ActivityPackage[] {
    if (!currentTime) {
      return activities;
    }

    const slotEndTime = this.getSlotEndTime(timeSlot);
    const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
    const currentTotalMinutes = (currentHours || 0) * 60 + (currentMinutes || 0);
    const endTotalMinutes = this.timeToMinutes(slotEndTime);

    return activities.filter(activity => {
      const durationMinutes = (activity.duration_hours || 0) * 60 + (activity.duration_minutes || 0);
      const activityEndTime = currentTotalMinutes + durationMinutes;
      return activityEndTime <= endTotalMinutes;
    });
  }

  /**
   * Get transfers for a route (from city to city)
   */
  async getTransfersForRoute(
    fromCity: string,
    toCity: string,
    operatorId?: string // Kept for backward compatibility but not used for filtering
  ): Promise<TransferPackage[]> {
    try {
      // Query transfers matching from or to location
      const sql = `
        SELECT id, title, from_location, to_location, pricing_mode, base_price, currency, operator_id
        FROM transfer_packages
        WHERE status = 'published'
          AND (from_location ILIKE $1 OR to_location ILIKE $2)
        LIMIT 50
      `;

      const result = await query<TransferPackage>(sql, [`%${fromCity}%`, `%${fromCity}%`]);
      const transfers = result.rows;

      // Filter by route match
      return transfers.filter(transfer => {
        // Point-to-point match
        if (transfer.pricing_mode === 'POINT_TO_POINT') {
          const fromMatch = transfer.from_location?.toLowerCase().includes(fromCity.toLowerCase());
          const toMatch = transfer.to_location?.toLowerCase().includes(toCity.toLowerCase());
          return fromMatch && toMatch;
        }

        // Hourly transfers can be configured for any route
        if (transfer.pricing_mode === 'HOURLY') {
          return true;
        }

        return false;
      });
    } catch (error) {
      console.error('Error fetching transfers:', error);
      return [];
    }
  }

  /**
   * Get transfers for airport to hotel
   */
  async getAirportTransfers(
    airportName: string,
    cityName: string,
    direction: 'arrival' | 'departure'
  ): Promise<TransferPackage[]> {
    const fromLocation = direction === 'arrival' ? airportName : cityName;
    const toLocation = direction === 'arrival' ? cityName : airportName;

    return this.getTransfersForRoute(fromLocation, toLocation);
  }

  /**
   * Get slot end time
   */
  private getSlotEndTime(timeSlot: TimeSlot): string {
    switch (timeSlot) {
      case 'morning':
        return '12:00'; // Noon
      case 'afternoon':
        return '17:00'; // 5 PM
      case 'evening':
        return '23:59'; // End of day
      default:
        return '23:59';
    }
  }

  /**
   * Convert time string to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }

  /**
   * Suggest activities based on city, time slot, and popularity
   */
  async suggestActivities(
    city: string,
    timeSlot: TimeSlot,
    limit: number = 5
  ): Promise<ActivityPackage[]> {
    const activities = await this.getActivitiesForCity(city);
    const filteredByTime = this.filterActivitiesByTimeSlot(activities, timeSlot);

    // Sort by rating/popularity (if available) or price
    // For now, just return first N
    return filteredByTime.slice(0, limit);
  }

  /**
   * Validate if activity can be added to time slot
   */
  canAddActivityToTimeSlot(
    activity: ActivityPackage,
    timeSlot: TimeSlot,
    currentTime: string | null,
    existingActivities: ActivityPackage[] = []
  ): { canAdd: boolean; reason?: string } {
    // Check time slot availability
    const availableSlots = this.getAvailableTimeSlots(currentTime);
    if (!availableSlots.includes(timeSlot)) {
      return {
        canAdd: false,
        reason: `Activity not available in ${timeSlot} slot based on arrival time`
      };
    }

    // Check if activity fits in time slot
    if (currentTime) {
      const filtered = this.filterByDuration([activity], timeSlot, currentTime);
      if (filtered.length === 0) {
        return {
          canAdd: false,
          reason: 'Activity duration exceeds available time in slot'
        };
      }
    }

    return { canAdd: true };
  }
}

