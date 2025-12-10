/**
 * Time Slot Utilities
 * Client-side utilities for time slot calculations
 * (Moved from smartItineraryFilter to avoid database imports in client components)
 */

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface ActivityPackage {
  operational_hours?: any;
  duration_hours?: number;
  duration_minutes?: number;
}

/**
 * Get available time slots based on arrival time
 * - If arrival < 12:00 PM → show afternoon + evening
 * - If arrival 12:00 PM - 5:00 PM → show evening only
 * - If arrival > 5:00 PM → show next day morning
 */
export function getAvailableTimeSlots(arrivalTime: string | null): TimeSlot[] {
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
 * Filter activities by time slot availability
 */
export function filterActivitiesByTimeSlot<T extends ActivityPackage>(
  activities: T[],
  timeSlot: TimeSlot
): T[] {
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
 * Get slot end time
 */
function getSlotEndTime(timeSlot: TimeSlot): string {
  const slotEndTimes = {
    morning: '12:00',
    afternoon: '17:00',
    evening: '23:59',
  };
  return slotEndTimes[timeSlot];
}

/**
 * Filter activities by duration and available time
 */
export function filterByDuration<T extends ActivityPackage>(
  activities: T[],
  timeSlot: TimeSlot,
  currentTime: string | null
): T[] {
  if (!currentTime) {
    return activities;
  }

  const slotEndTime = getSlotEndTime(timeSlot);
  const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
  const [endHours, endMinutes] = slotEndTime.split(':').map(Number);
  
  const currentTotalMinutes = (currentHours || 0) * 60 + (currentMinutes || 0);
  const endTotalMinutes = (endHours || 0) * 60 + (endMinutes || 0);
  const availableMinutes = endTotalMinutes - currentTotalMinutes;

  return activities.filter(activity => {
    const durationHours = activity.duration_hours || 0;
    const durationMinutes = activity.duration_minutes || 0;
    const totalDurationMinutes = durationHours * 60 + durationMinutes;
    
    return totalDurationMinutes <= availableMinutes;
  });
}

