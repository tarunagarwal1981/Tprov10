"use client";

import React, { useMemo, useRef, useState, useCallback } from "react";
import { useForm, FormProvider, useFieldArray, useFormContext } from "react-hook-form";
import Image from "next/image";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaClock, FaCheckCircle, FaEye, FaInfoCircle, FaDollarSign, FaSpinner, FaCopy } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// Minimal UI shadcn-compatible components from project
// If any of the above imports don't exist in your project, replace with existing primitives.

// TYPES
type TransportType = "FLIGHT" | "TRAIN" | "BUS" | "CAR";
type TransportClass = "ECONOMY" | "BUSINESS" | "FIRST" | "STANDARD";

type Flight = {
  id: string;
  departureCity: string;
  departureTime: string;
  arrivalCity: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
};

type TimeSlot = {
  time: string; // HH:MM format
  title: string; // Title for this time slot
  activityDescription: string; // Description of activities
  transfer: string; // Transfer information
};

type DayPlan = {
  cityId: string;
  cityName?: string;
  title?: string;
  description?: string;
  photoUrl?: string;
  hasFlights?: boolean;
  flights?: Flight[];
  timeSlots?: {
    morning: TimeSlot;
    afternoon: TimeSlot;
    evening: TimeSlot;
  };
};

type CityStop = {
  id: string;
  name: string;
  country?: string;
  nights: number;
  /** @deprecated This field is no longer used in the UI. Kept for backward compatibility. */
  highlights: string[];
  /** @deprecated This field is no longer used in the UI. Kept for backward compatibility. */
  activitiesIncluded: string[];
  expanded?: boolean;
};

type Connection = {
  fromCityId: string;
  toCityId: string;
  transportType: TransportType;
  transportClass: TransportClass;
  provider?: string;
  durationHours?: number;
  durationMinutes?: number;
  layoverNotes?: string;
};

type InclusionCategory = "Transport" | "Activities" | "Meals" | "Guide Services" | "Entry Fees" | "Insurance";

type InclusionItem = { id: string; category: InclusionCategory; text: string };
type ExclusionItem = { id: string; text: string };

type PricingMode = "FIXED" | "PER_PERSON" | "GROUP_TIERED";

type DepartureDate = { id: string; date: string; availableSeats?: number; price?: number; cutoffDate?: string };

type PricingDates = {
  mode: PricingMode;
  fixedPrice?: number;
  perPersonPrice?: number;
  groupMin?: number;
  groupMax?: number;
  departures: DepartureDate[];
  validityStart?: string;
  validityEnd?: string;
  seasonalNotes?: string;
};

type CancellationTier = { id: string; daysBefore: number; refundPercent: number };

type Policies = {
  cancellation: CancellationTier[];
  depositPercent?: number;
  balanceDueDays?: number;
  paymentMethods?: string[];
  visaRequirements?: string;
  insuranceRequirement?: "REQUIRED" | "OPTIONAL" | "NA";
  healthRequirements?: string;
  terms?: string;
};

type PricingPackageType = 'SIC' | 'PRIVATE_PACKAGE';

type PricingRow = {
  id: string;
  numberOfAdults: number;
  numberOfChildren: number;
  totalPrice: number;
};

type PrivatePackageRow = {
  id: string;
  numberOfAdults: number;
  numberOfChildren: number;
  carType: string;
  vehicleCapacity: number;
  totalPrice: number;
};

type PricingData = {
  pricingType: PricingPackageType;
  // Tabular pricing rows (for SIC pricing)
  pricingRows: PricingRow[];
  // Private package pricing rows (for PRIVATE_PACKAGE pricing)
  privatePackageRows: PrivatePackageRow[];
  // Child age restriction (optional checkbox)
  hasChildAgeRestriction: boolean;
  childMinAge?: number;
  childMaxAge?: number;
};

export type MultiCityPackageFormData = {
  basic: {
    title: string;
    shortDescription: string;
    destinationRegion?: string;
    packageValidityDate?: string;
    imageGallery: string[];
  };
  cities: CityStop[];
  connections: Connection[];
  days: DayPlan[];
  inclusions: InclusionItem[];
  exclusions: ExclusionItem[];
  pricing: PricingData;
  policies: Policies;
};

const DEFAULT_DATA: MultiCityPackageFormData = {
  basic: { title: "", shortDescription: "", destinationRegion: "", packageValidityDate: "", imageGallery: [] },
  cities: [],
  connections: [],
  days: [],
  inclusions: [],
  exclusions: [],
  pricing: { 
    pricingType: "SIC",
    pricingRows: [],
    privatePackageRows: [],
    hasChildAgeRestriction: false,
    childMinAge: undefined,
    childMaxAge: undefined,
  },
  policies: { cancellation: [], insuranceRequirement: "OPTIONAL" },
};

// HELPERS
const generateId = () => Math.random().toString(36).slice(2, 9);

// Form validation + autosave (aligned with other package forms)
type FormIssue = { tab: string; field: string; message: string; severity?: "error" | "warning" };
type FormValidation = { isValid: boolean; errors: FormIssue[]; warnings: FormIssue[] };

const useFormValidation = (data: MultiCityPackageFormData): FormValidation => {
  return useMemo(() => {
    const errors: FormIssue[] = [];
    const warnings: FormIssue[] = [];

    if (!data.basic.title.trim()) errors.push({ tab: "basic", field: "title", message: "Title is required", severity: "error" });
    if (!data.basic.shortDescription.trim()) errors.push({ tab: "basic", field: "shortDescription", message: "Short description is required", severity: "error" });

    if (data.cities.length === 0) errors.push({ tab: "basic", field: "cities", message: "Add at least one city", severity: "error" });
    if (data.cities.some(c => c.nights <= 0)) errors.push({ tab: "basic", field: "nights", message: "Each city must have at least 1 night", severity: "error" });

    if (data.days.length === 0) warnings.push({ tab: "itinerary", field: "days", message: "No days generated yet" });

    // Pricing validation
    if (data.pricing.pricingType === "SIC" && data.pricing.pricingRows.length === 0) {
      errors.push({ tab: "pricing", field: "pricingRows", message: "Add at least one pricing row", severity: "error" });
    }
    if (data.pricing.pricingType === "SIC" && data.pricing.hasChildAgeRestriction && (!data.pricing.childMinAge || !data.pricing.childMaxAge)) {
      errors.push({ tab: "pricing", field: "childAge", message: "Child min and max age are required when age restriction is enabled", severity: "error" });
    }
    if (data.pricing.pricingType === "PRIVATE_PACKAGE" && data.pricing.privatePackageRows.length === 0) {
      errors.push({ tab: "pricing", field: "privatePackageRows", message: "Add at least one private package pricing row", severity: "error" });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }, [data]);
};

type AutoSaveState = { isSaving: boolean; lastSaved: Date | null; hasUnsavedChanges: boolean; error: string | null };
const useAutoSave = (data: MultiCityPackageFormData, onSave?: (d: MultiCityPackageFormData) => Promise<void> | void, interval = 30000) => {
  const [state, setState] = useState<AutoSaveState>({ isSaving: false, lastSaved: null, hasUnsavedChanges: false, error: null });
  const lastPayloadRef = useRef<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const serialized = useMemo(() => JSON.stringify(data), [data]);

  React.useEffect(() => {
    const current = serialized;
    const nextUnsaved = current !== lastPayloadRef.current;
    setState(prev => (prev.hasUnsavedChanges === nextUnsaved ? prev : { ...prev, hasUnsavedChanges: nextUnsaved }));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!onSave) return;
      if (isSavingRef.current) return;
      if (current === lastPayloadRef.current) return;
      isSavingRef.current = true;
      setState(prev => (prev.isSaving ? prev : { ...prev, isSaving: true, error: null }));
      try {
        await onSave(data);
        lastPayloadRef.current = current;
        setState(prev => ({ ...prev, isSaving: false, lastSaved: new Date(), hasUnsavedChanges: false }));
      } catch (e) {
        setState(prev => ({ ...prev, isSaving: false, error: e instanceof Error ? e.message : "Save failed" }));
      }
      isSavingRef.current = false;
    }, interval);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [serialized, onSave, interval, data]);

  return state;
};

// SUB-COMPONENTS
const BasicInformationTab: React.FC = () => {
  const { register, control, setValue, watch } = useFormContext<MultiCityPackageFormData>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "cities" });

  const addCity = useCallback(() => {
    append({ id: generateId(), name: "", country: "", nights: 2, highlights: [], activitiesIncluded: [], expanded: true });
  }, [append]);

  // Keep days in sync when cities change
  const cities = watch("cities");
  const days = watch("days");
  
  React.useEffect(() => {
    // Auto-generate days based on cities and nights
    // For each city with N nights: create N+1 days (arrival + N full days with nights + departure)
    // For intermediate cities, the departure day is also the arrival day of the next city (counted once)
    // Example: City 1 (2 nights) + City 2 (2 nights) = 5 days total
    // Day 1: Arrival City 1, Night 1 City 1
    // Day 2: Full day City 1, Night 2 City 1
    // Day 3: Departure City 1 + Arrival City 2, Night 1 City 2
    // Day 4: Full day City 2, Night 2 City 2
    // Day 5: Departure City 2
    if (!cities || cities.length === 0) {
      setValue("days", []);
      return;
    }
    
    const newDays: DayPlan[] = [];
    let globalDayNumber = 1;
    
    cities.forEach((city, cityIndex) => {
      const nights = city.nights || 1;
      const isLastCity = cityIndex === cities.length - 1;
      const isFirstCity = cityIndex === 0;
      
      // For each city, create days based on nights
      // First city: needs arrival + nights + departure = nights + 1 days
      // Intermediate cities: arrival already counted (as previous city's departure), so needs nights + departure = nights days
      // Last city: arrival already counted (as previous city's departure), so needs nights + departure = nights days
      // Special case: if only one city, it needs nights + 1 days (arrival + nights + departure)
      const daysToCreate = isFirstCity && cities.length === 1 ? nights + 1 : isFirstCity ? nights + 1 : nights;
      
      for (let i = 0; i < daysToCreate; i++) {
        const isArrivalDay = isFirstCity && i === 0;
        // Departure day is the last day created for each city
        const isDepartureDay = i === daysToCreate - 1;
        // Calculate city-specific night number
        // For first city: Night 1 = i+1 (i=0 is arrival with Night 1)
        // For other cities: Night 1 is on transition day (previous city's departure), so Night 2 = i+2
        const cityNightNumber = isFirstCity ? (i + 1) : (i + 2);
        
        // Determine the day type label - always use the current city name
        let dayTitle = "";
        if (isArrivalDay) {
          dayTitle = `Arrival - ${city.name || 'City ' + (cityIndex + 1)}`;
        } else if (isDepartureDay && !isLastCity) {
          dayTitle = `Departure ${city.name || 'City ' + (cityIndex + 1)} / Arrival ${cities[cityIndex + 1]?.name || 'City ' + (cityIndex + 2)}`;
        } else if (isDepartureDay && isLastCity) {
          dayTitle = `Departure - ${city.name || 'City ' + (cityIndex + 1)}`;
        } else {
          dayTitle = `Day ${globalDayNumber} - ${city.name || 'City ' + (cityIndex + 1)} (Night ${cityNightNumber})`;
        }
        
        newDays.push({
          cityId: city.id,
          cityName: city.name || '', // Always set cityName, even if empty
          title: dayTitle,
          description: isArrivalDay 
            ? `Arrival in ${city.name || 'City ' + (cityIndex + 1)}. Check-in and orientation. Overnight stay (Night 1).`
            : isDepartureDay && !isLastCity
            ? `Departure from ${city.name || 'City ' + (cityIndex + 1)} and arrival in ${cities[cityIndex + 1]?.name || 'City ' + (cityIndex + 2)}. Overnight stay in ${cities[cityIndex + 1]?.name || 'City ' + (cityIndex + 2)} (Night 1).`
            : isDepartureDay && isLastCity
            ? `Final day in ${city.name || 'City ' + (cityIndex + 1)}. Check-out and departure.`
            : `Full day in ${city.name || 'City ' + (cityIndex + 1)}. Overnight stay (Night ${cityNightNumber}).`,
          photoUrl: "",
          hasFlights: false,
          flights: [],
          timeSlots: {
            morning: { time: "08:00", title: "", activityDescription: "", transfer: "" },
            afternoon: { time: "12:30", title: "", activityDescription: "", transfer: "" },
            evening: { time: "17:00", title: "", activityDescription: "", transfer: "" },
          },
        });
        
        globalDayNumber++;
      }
    });
    
    // Always update days when cities change - compare based on city IDs, names, and nights
    const currentDaysKey = JSON.stringify(
      (days || []).map((d: DayPlan) => ({ cityId: d.cityId, cityName: d.cityName || '' }))
    );
    const newDaysKey = JSON.stringify(
      newDays.map(d => ({ cityId: d.cityId, cityName: d.cityName || '' }))
    );
    
    // Update if structure changed, city names changed, or number of days changed
    if (currentDaysKey !== newDaysKey || newDays.length !== (days?.length || 0)) {
      setValue("days", newDays, { shouldDirty: true });
    }
  }, [cities, days, setValue]);

  // Initialize with one empty city by default
  React.useEffect(() => {
    if (fields.length === 0) {
      addCity();
    }
  }, [fields.length, addCity]);

  return (
    <div className="space-y-4">
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input {...register("basic.title")} placeholder="Grand Europe Multi-City Adventure" />
          </div>
          <div>
            <label className="text-sm font-medium">Short Description</label>
            <Textarea {...register("basic.shortDescription")} placeholder="A curated journey across multiple cities with handpicked experiences." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Destination Region</label>
              <Input {...register("basic.destinationRegion")} placeholder="Europe, Southeast Asia, etc." />
            </div>
            <div>
              <label className="text-sm font-medium">Package Validity Date</label>
              <Input 
                type="date" 
                {...register("basic.packageValidityDate")} 
                placeholder="Last date for bookings"
                className="package-text-fix"
              />
              <p className="text-xs text-gray-500 mt-1">Last date this package is valid for bookings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* City Stops Section */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle>City Stops</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* City Rows */}
          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                {/* Basic City Info Row */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF4B8C] text-white font-semibold flex-shrink-0 mt-6">
                    {idx + 1}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                    <div>
                      <label className="text-sm font-medium mb-1 block">City Name *</label>
                      <Input 
                        placeholder="e.g. Paris, Rome, Tokyo" 
                        defaultValue={field.name}
                        onChange={(e) => setValue(`cities.${idx}.name`, e.target.value)}
                        className="package-text-fix"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Country</label>
                      <Input 
                        placeholder="e.g. France, Italy, Japan" 
                        defaultValue={field.country}
                        onChange={(e) => setValue(`cities.${idx}.country`, e.target.value)}
                        className="package-text-fix"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Nights *</label>
                      <Input 
                        type="number" 
                        min={1} 
                        defaultValue={field.nights}
                        onChange={(e) => setValue(`cities.${idx}.nights`, Number(e.target.value || 1))}
                        className="package-text-fix"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-6">
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      onClick={() => move(idx, Math.max(0, idx - 1))}
                      disabled={idx === 0}
                    >
                      <FaArrowUp />
                    </Button>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      onClick={() => move(idx, Math.min(fields.length - 1, idx + 1))}
                      disabled={idx === fields.length - 1}
                    >
                      <FaArrowDown />
                    </Button>
                    <Button 
                      type="button"
                      variant="destructive" 
                      size="icon" 
                      onClick={() => remove(idx)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add City Button */}
          <Button 
            type="button"
            onClick={addCity}
            className="package-button-fix w-full"
            variant="outline"
          >
            <FaPlus className="mr-2" /> Add City
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Time Slot Editor Component
const TimeSlotEditor: React.FC<{ 
  dayIndex: number; 
  slotName: "morning" | "afternoon" | "evening";
  slot: TimeSlot;
  days: DayPlan[];
  setValue: any;
}> = ({ dayIndex, slotName, slot, days, setValue }) => {
  const updateTimeSlot = (updates: Partial<TimeSlot>) => {
    const d = [...days];
    if (!d[dayIndex]) return;
    if (!d[dayIndex]!.timeSlots) {
      d[dayIndex]!.timeSlots = {
        morning: { time: "08:00", title: "", activityDescription: "", transfer: "" },
        afternoon: { time: "12:30", title: "", activityDescription: "", transfer: "" },
        evening: { time: "17:00", title: "", activityDescription: "", transfer: "" },
      };
    }
    d[dayIndex]!.timeSlots![slotName] = { ...d[dayIndex]!.timeSlots![slotName], ...updates };
    setValue("days", d);
  };

  const slotLabels = {
    morning: { label: "🌅 Morning", bgColor: "bg-orange-50/30", defaultTime: "08:00" },
    afternoon: { label: "☀️ Afternoon", bgColor: "bg-yellow-50/30", defaultTime: "12:30" },
    evening: { label: "🌙 Evening", bgColor: "bg-purple-50/30", defaultTime: "17:00" },
  };

  const slotConfig = slotLabels[slotName];
  const displayTime = slot.time || slotConfig.defaultTime;
  
  // Convert 24h to 12h format for display
  const formatTimeForDisplay = (time24h: string) => {
    if (!time24h) return slotConfig.defaultTime === "08:00" ? "08:00 AM" : slotConfig.defaultTime === "12:30" ? "12:30 PM" : "05:00 PM";
    const [hours, minutes] = time24h.split(':');
    const hour = parseInt(hours || '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes || '00'} ${ampm}`;
  };

  return (
    <div className={`p-4 border rounded-lg ${slotConfig.bgColor}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{slotConfig.label}</span>
          <span className="text-xs text-gray-600">{formatTimeForDisplay(displayTime)}</span>
        </div>
        <Input
          type="time"
          value={slot.time || slotConfig.defaultTime}
          onChange={(e) => updateTimeSlot({ time: e.target.value })}
          className="package-text-fix text-sm w-32"
          placeholder="HH:MM"
        />
      </div>

      {/* Title Field */}
      <div className="mb-3">
        <label className="text-xs font-medium mb-1 block text-gray-700">Title</label>
        <Input
          placeholder="e.g., Morning Exploration, Afternoon Tour"
          value={slot.title || ""}
          onChange={(e) => updateTimeSlot({ title: e.target.value })}
          className="package-text-fix text-sm"
        />
      </div>

      {/* Activity Description Field */}
      <div className="mb-3">
        <label className="text-xs font-medium mb-1 block text-gray-700">Activity Description</label>
        <Textarea
          placeholder="Describe the activities for this time slot..."
          value={slot.activityDescription || ""}
          onChange={(e) => updateTimeSlot({ activityDescription: e.target.value })}
          className="package-text-fix text-sm min-h-[80px]"
          rows={3}
        />
      </div>

      {/* Transfer Field */}
      <div>
        <label className="text-xs font-medium mb-1 block text-gray-700">Transfer</label>
        <Input
          placeholder="e.g., Hotel pickup at 8:00 AM, Transfer to restaurant"
          value={slot.transfer || ""}
          onChange={(e) => updateTimeSlot({ transfer: e.target.value })}
          className="package-text-fix text-sm"
        />
      </div>
    </div>
  );
};

const ItineraryTab: React.FC = () => {
  const { watch, setValue, control } = useFormContext<MultiCityPackageFormData>();
  const days = watch("days") || [];

  const handlePhotoUpload = (dayIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // For now, we'll store the file name or create an object URL
    // In production, you'd upload to storage and get a URL
    const photoUrl = URL.createObjectURL(file);
    const d = [...days];
    if (d[dayIndex]) {
      d[dayIndex]!.photoUrl = photoUrl;
      setValue("days", d);
    }
  };

  // Initialize time slots for days that don't have them with default times
  React.useEffect(() => {
    const d = [...days];
    let updated = false;
    d.forEach((day, idx) => {
      if (!day.timeSlots) {
        d[idx]!.timeSlots = {
          morning: { time: "08:00", title: "", activityDescription: "", transfer: "" },
          afternoon: { time: "12:30", title: "", activityDescription: "", transfer: "" },
          evening: { time: "17:00", title: "", activityDescription: "", transfer: "" },
        };
        updated = true;
      } else {
        // Migrate old format to new format if needed
        const timeSlots = d[idx]!.timeSlots!;
        const slots = ['morning', 'afternoon', 'evening'] as const;
        const defaultTimes = { morning: '08:00', afternoon: '12:30', evening: '17:00' };
        
        slots.forEach(slotName => {
          const slot = timeSlots[slotName];
          if (slot) {
            // Check if old format (has activities/transfers arrays)
            if ('activities' in slot || 'transfers' in slot) {
              const oldSlot = slot as any;
              d[idx]!.timeSlots![slotName] = {
                time: oldSlot.time || defaultTimes[slotName],
                title: '',
                activityDescription: Array.isArray(oldSlot.activities) ? oldSlot.activities.join('. ') : '',
                transfer: Array.isArray(oldSlot.transfers) ? oldSlot.transfers.join('. ') : '',
              };
              updated = true;
            } else {
              // Ensure default times are set if empty
              if (!slot.time) {
                d[idx]!.timeSlots![slotName] = {
                  ...slot,
                  time: defaultTimes[slotName],
                };
                updated = true;
              }
              // Ensure all required fields exist
              if (!('title' in slot) || !('activityDescription' in slot) || !('transfer' in slot)) {
                const slotWithDefaults = slot as any;
                d[idx]!.timeSlots![slotName] = {
                  time: slotWithDefaults.time || defaultTimes[slotName],
                  title: 'title' in slotWithDefaults ? slotWithDefaults.title : '',
                  activityDescription: 'activityDescription' in slotWithDefaults ? slotWithDefaults.activityDescription : '',
                  transfer: 'transfer' in slotWithDefaults ? slotWithDefaults.transfer : '',
                };
                updated = true;
              }
            }
          } else {
            // Slot doesn't exist, create it
            d[idx]!.timeSlots![slotName] = {
              time: defaultTimes[slotName],
              title: '',
              activityDescription: '',
              transfer: '',
            };
            updated = true;
          }
        });
      }
    });
    if (updated) {
      setValue("days", d);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length, setValue]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaClock /> Day-by-Day Itinerary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {days.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max p-2">
                {days.map((day, i) => (
                  <React.Fragment key={i}>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#FF4B8C] text-white flex items-center justify-center font-semibold text-sm">
                        {i + 1}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{day.cityName}</div>
                    </div>
                    {i < days.length - 1 && <div className="w-16 h-0.5 bg-orange-200 mb-4" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaClock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium mb-1">No Days Yet</p>
              <p className="text-sm">Add cities in the Basic Info tab to auto-generate days</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Cards */}
      <div className="space-y-4">
        {days.map((day, dayIndex) => (
          <Card key={dayIndex} className="package-selector-glass package-shadow-fix">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary" className="text-base px-3 py-1">Day {dayIndex + 1}</Badge>
                <span className="text-base font-semibold text-gray-700 dark:text-gray-300">{day.cityName || "—"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title Field */}
              <div>
                <label className="text-sm font-medium mb-1 block">Title</label>
                <Input
                  placeholder="Enter a title for this day..."
                  defaultValue={day.title}
                  onChange={(e) => {
                    const d = [...days];
                    if (d[dayIndex]) {
                      d[dayIndex]!.title = e.target.value;
                      setValue("days", d);
                    }
                  }}
                  className="package-text-fix"
                />
              </div>

              {/* First/Last Day Suggestion */}
              {(dayIndex === 0 || dayIndex === days.length - 1) && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FaInfoCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-medium mb-1">
                        {dayIndex === 0 ? "First Day - Arrival" : "Last Day - Departure"}
                      </p>
                      <p className="text-xs">
                        {dayIndex === 0 
                          ? "Travel/flight timings may vary on arrival day. It's recommended not to add activities or transfers for this day."
                          : "Travel/flight timings may vary on departure day. It's recommended not to add activities or transfers for this day."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Slots Section */}
              <div>
                <label className="text-sm font-medium mb-3 block">Activities & Transfers by Time Slots</label>
                <div className="space-y-3">
                  {day.timeSlots && (
                    <>
                      <TimeSlotEditor
                        dayIndex={dayIndex}
                        slotName="morning"
                        slot={day.timeSlots.morning}
                        days={days}
                        setValue={setValue}
                      />
                      <TimeSlotEditor
                        dayIndex={dayIndex}
                        slotName="afternoon"
                        slot={day.timeSlots.afternoon}
                        days={days}
                        setValue={setValue}
                      />
                      <TimeSlotEditor
                        dayIndex={dayIndex}
                        slotName="evening"
                        slot={day.timeSlots.evening}
                        days={days}
                        setValue={setValue}
                      />
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};


const InclusionsExclusionsTab: React.FC = () => {
  const { control, watch, setValue } = useFormContext<MultiCityPackageFormData>();
  const inc = useFieldArray({ control, name: "inclusions" });
  const exc = useFieldArray({ control, name: "exclusions" });
  const [incText, setIncText] = useState("");
  const [incCat, setIncCat] = useState<InclusionCategory>("Transport");
  const [excText, setExcText] = useState("");

  // Standard inclusions for multi-city tours
  const standardInclusions = [
    { id: "accommodation", text: "Accommodation", category: "Transport" as InclusionCategory },
    { id: "breakfast", text: "Daily Breakfast", category: "Meals" as InclusionCategory },
    { id: "all_meals", text: "All Meals (Breakfast, Lunch, Dinner)", category: "Meals" as InclusionCategory },
    { id: "airport_transfer", text: "Airport Transfers", category: "Transport" as InclusionCategory },
    { id: "intercity_transport", text: "Intercity Transportation", category: "Transport" as InclusionCategory },
    { id: "tour_guide", text: "Professional Tour Guide", category: "Guide Services" as InclusionCategory },
    { id: "local_guide", text: "Local Guides", category: "Guide Services" as InclusionCategory },
    { id: "entry_fees", text: "Entry Fees to Attractions", category: "Entry Fees" as InclusionCategory },
    { id: "travel_insurance", text: "Travel Insurance", category: "Insurance" as InclusionCategory },
    { id: "visa_assistance", text: "Visa Assistance", category: "Activities" as InclusionCategory },
    { id: "welcome_dinner", text: "Welcome Dinner", category: "Meals" as InclusionCategory },
    { id: "farewell_dinner", text: "Farewell Dinner", category: "Meals" as InclusionCategory },
    { id: "city_tours", text: "City Tours", category: "Activities" as InclusionCategory },
    { id: "baggage_handling", text: "Baggage Handling", category: "Transport" as InclusionCategory },
    { id: "tour_manager", text: "Tour Manager", category: "Guide Services" as InclusionCategory },
  ];

  // Standard exclusions for multi-city tours
  const standardExclusions = [
    { id: "international_flights", text: "International Flights" },
    { id: "domestic_flights", text: "Domestic Flights" },
    { id: "personal_expenses", text: "Personal Expenses" },
    { id: "tips_gratuities", text: "Tips and Gratuities" },
    { id: "optional_activities", text: "Optional Activities" },
    { id: "travel_insurance", text: "Travel Insurance" },
    { id: "visa_fees", text: "Visa Fees" },
    { id: "airport_taxes", text: "Airport Taxes" },
    { id: "laundry", text: "Laundry Services" },
    { id: "phone_calls", text: "Phone Calls and Internet" },
    { id: "beverages", text: "Beverages (unless specified)" },
    { id: "porterage", text: "Porterage Fees" },
    { id: "single_supplement", text: "Single Room Supplement" },
  ];

  const inclusions = watch("inclusions");
  const exclusions = watch("exclusions");

  const toggleStandardInclusion = (item: typeof standardInclusions[0]) => {
    const existingIndex = inclusions.findIndex(
      (inc: InclusionItem) => inc.text === item.text
    );
    
    if (existingIndex >= 0) {
      inc.remove(existingIndex);
    } else {
      inc.append({ id: generateId(), category: item.category, text: item.text });
    }
  };

  const toggleStandardExclusion = (item: typeof standardExclusions[0]) => {
    const existingIndex = exclusions.findIndex(
      (exc: ExclusionItem) => exc.text === item.text
    );
    
    if (existingIndex >= 0) {
      exc.remove(existingIndex);
    } else {
      exc.append({ id: generateId(), text: item.text });
    }
  };

  const isInclusionSelected = (text: string) => {
    return inclusions.some((inc: InclusionItem) => inc.text === text);
  };

  const isExclusionSelected = (text: string) => {
    return exclusions.some((exc: ExclusionItem) => exc.text === text);
  };

  return (
    <div className="space-y-6">
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>What&apos;s Included</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Standard Inclusions */}
          <div>
            <h3 className="text-sm font-medium mb-3">Standard Inclusions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {standardInclusions.map((item) => (
                <label key={item.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={isInclusionSelected(item.text)}
                    onChange={() => toggleStandardInclusion(item)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{item.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Inclusions */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium mb-3">Custom Inclusions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Select onValueChange={(v) => setIncCat(v as InclusionCategory)}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {["Transport","Activities","Meals","Guide Services","Entry Fees","Insurance"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="md:col-span-3 flex gap-2">
                <Input value={incText} onChange={(e) => setIncText(e.target.value)} placeholder="Add custom inclusion" />
                <Button type="button" onClick={() => { if (incText.trim()) { inc.append({ id: generateId(), category: incCat, text: incText.trim() }); setIncText(""); } }}>Add</Button>
              </div>
            </div>
          </div>

          {/* Selected Inclusions */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium mb-3">Selected Inclusions ({inclusions.length})</h3>
            <div className="flex flex-wrap gap-2">
              {inc.fields.map((f, i) => (
                <Badge key={f.id} variant="outline" className="flex items-center gap-2">
                  <span className="text-xs">{(f as any).category}:</span>
                  <span>{(f as any).text}</span>
                  <button type="button" onClick={() => inc.remove(i)} aria-label="remove" className="text-xs">×</button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>What&apos;s Not Included</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Standard Exclusions */}
          <div>
            <h3 className="text-sm font-medium mb-3">Standard Exclusions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {standardExclusions.map((item) => (
                <label key={item.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={isExclusionSelected(item.text)}
                    onChange={() => toggleStandardExclusion(item)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{item.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Exclusions */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium mb-3">Custom Exclusions</h3>
            <div className="flex gap-2">
              <Input value={excText} onChange={(e) => setExcText(e.target.value)} placeholder="Add custom exclusion" />
              <Button type="button" onClick={() => { if (excText.trim()) { exc.append({ id: generateId(), text: excText.trim() }); setExcText(""); } }}>Add</Button>
            </div>
          </div>

          {/* Selected Exclusions */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium mb-3">Selected Exclusions ({exclusions.length})</h3>
            <div className="flex flex-wrap gap-2">
              {exc.fields.map((f, i) => (
                <Badge key={f.id} variant="secondary" className="flex items-center gap-2">
                  <span>{(f as any).text}</span>
                  <button type="button" onClick={() => exc.remove(i)} aria-label="remove" className="text-xs">×</button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PricingDatesTab: React.FC = () => {
  const { watch, setValue } = useFormContext<MultiCityPackageFormData>();
  const pricing = watch("pricing");

  // Initialize with one default pricing row when SIC pricing is selected
  React.useEffect(() => {
    if (pricing.pricingType === "SIC" && pricing.pricingRows.length === 0) {
      const defaultRow: PricingRow = {
        id: generateId(),
        numberOfAdults: 1,
        numberOfChildren: 0,
        totalPrice: 0,
      };
      setValue("pricing.pricingRows", [defaultRow]);
    }
  }, [pricing.pricingType, pricing.pricingRows.length, setValue]);

  // Initialize with one default private package row when PRIVATE_PACKAGE pricing is selected
  React.useEffect(() => {
    if (pricing.pricingType === "PRIVATE_PACKAGE" && pricing.privatePackageRows.length === 0) {
      const defaultRow: PrivatePackageRow = {
        id: generateId(),
        numberOfAdults: 1,
        numberOfChildren: 0,
        carType: "",
        vehicleCapacity: 4,
        totalPrice: 0,
      };
      setValue("pricing.privatePackageRows", [defaultRow]);
    }
  }, [pricing.pricingType, pricing.privatePackageRows.length, setValue]);

  const addPricingRow = () => {
    const newRow: PricingRow = {
      id: generateId(),
      numberOfAdults: 1,
      numberOfChildren: 0,
      totalPrice: 0,
    };
    setValue("pricing.pricingRows", [...pricing.pricingRows, newRow]);
  };

  const removePricingRow = (index: number) => {
    const rows = pricing.pricingRows.filter((_, i) => i !== index);
    setValue("pricing.pricingRows", rows);
  };

  const updatePricingRow = (index: number, field: keyof PricingRow, value: number) => {
    const rows = [...pricing.pricingRows];
    const currentRow = rows[index];
    if (currentRow) {
      rows[index] = { 
        id: currentRow.id,
        numberOfAdults: currentRow.numberOfAdults,
        numberOfChildren: currentRow.numberOfChildren,
        totalPrice: currentRow.totalPrice,
        [field]: value 
      } as PricingRow;
      setValue("pricing.pricingRows", rows);
    }
  };

  const addPrivatePackageRow = () => {
    const newRow: PrivatePackageRow = {
      id: generateId(),
      numberOfAdults: 1,
      numberOfChildren: 0,
      carType: "",
      vehicleCapacity: 4,
      totalPrice: 0,
    };
    setValue("pricing.privatePackageRows", [...pricing.privatePackageRows, newRow]);
  };

  const removePrivatePackageRow = (index: number) => {
    const rows = pricing.privatePackageRows.filter((_, i) => i !== index);
    setValue("pricing.privatePackageRows", rows);
  };

  const updatePrivatePackageRow = (index: number, field: keyof PrivatePackageRow, value: number | string) => {
    const rows = [...pricing.privatePackageRows];
    const currentRow = rows[index];
    if (currentRow) {
      rows[index] = { 
        id: currentRow.id,
        numberOfAdults: currentRow.numberOfAdults,
        numberOfChildren: currentRow.numberOfChildren,
        carType: currentRow.carType,
        vehicleCapacity: currentRow.vehicleCapacity,
        totalPrice: currentRow.totalPrice,
        [field]: value 
      } as PrivatePackageRow;
      setValue("pricing.privatePackageRows", rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pricing Type Selector */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>Pricing Model</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pricing-type"
                checked={pricing.pricingType === "SIC"}
                onChange={() => setValue("pricing.pricingType", "SIC")}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium">SIC Pricing</div>
                <div className="text-xs text-gray-500">Tabular pricing format</div>
              </div>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pricing-type"
                checked={pricing.pricingType === "PRIVATE_PACKAGE"}
                onChange={() => setValue("pricing.pricingType", "PRIVATE_PACKAGE")}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium">Private Package</div>
                <div className="text-xs text-gray-500">Tabular pricing with vehicle details</div>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* SIC Pricing: Tabular Format */}
      {pricing.pricingType === "SIC" && (
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
            <CardTitle>SIC Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {/* Pricing Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 font-medium text-xs">No. of Adults</th>
                    <th className="text-left py-2 px-3 font-medium text-xs">No. of Children</th>
                    <th className="text-left py-2 px-3 font-medium text-xs">Total Price (Adult + Child)</th>
                    <th className="text-left py-2 px-3 font-medium text-xs w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pricing.pricingRows.map((row, index) => (
                    <tr key={row.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-2 px-3">
              <Input
                type="number"
                min={0}
                          value={row.numberOfAdults}
                          onChange={(e) => updatePricingRow(index, "numberOfAdults", Number(e.target.value || 0))}
                          className="package-text-fix w-20 h-8 text-sm"
                        />
                      </td>
                      <td className="py-2 px-3">
              <Input
                type="number"
                min={0}
                          value={row.numberOfChildren}
                          onChange={(e) => updatePricingRow(index, "numberOfChildren", Number(e.target.value || 0))}
                          className="package-text-fix w-20 h-8 text-sm"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={row.totalPrice}
                          onChange={(e) => updatePricingRow(index, "totalPrice", Number(e.target.value || 0))}
                          className="package-text-fix w-28 h-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removePricingRow(index)}
                          className="h-8 w-8 p-0"
                          disabled={pricing.pricingRows.length === 1}
                        >
                          <FaTrash className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Pricing Row Button */}
            <div className="flex justify-end">
              <Button type="button" onClick={addPricingRow} className="package-button-fix">
                <FaPlus className="mr-2" /> Add Pricing Row
              </Button>
            </div>

            {/* Child Age Restriction (at the end) */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="child-age-restriction"
                  checked={pricing.hasChildAgeRestriction}
                  onChange={(e) => {
                    setValue("pricing.hasChildAgeRestriction", e.target.checked);
                    if (!e.target.checked) {
                      setValue("pricing.childMinAge", undefined);
                      setValue("pricing.childMaxAge", undefined);
                    }
                  }}
                  className="w-4 h-4"
                />
                <label htmlFor="child-age-restriction" className="text-xs font-medium cursor-pointer">
                  Child Age Restriction
                </label>
              </div>
              
              {pricing.hasChildAgeRestriction && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Child Min Age *</label>
                    <Input
                      type="number"
                      min={0}
                      value={pricing.childMinAge || ""}
                      onChange={(e) => setValue("pricing.childMinAge", Number(e.target.value || 0))}
                      className="package-text-fix h-8 text-sm"
                      placeholder="e.g., 3"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Child Max Age *</label>
                    <Input
                      type="number"
                      min={0}
                      value={pricing.childMaxAge || ""}
                      onChange={(e) => setValue("pricing.childMaxAge", Number(e.target.value || 0))}
                      className="package-text-fix h-8 text-sm"
                      placeholder="e.g., 12"
                    />
                  </div>
                </div>
              )}
            </div>
        </CardContent>
      </Card>
      )}

      {/* Private Package Pricing: Tabular Format */}
      {pricing.pricingType === "PRIVATE_PACKAGE" && (
        <Card className="package-selector-glass package-shadow-fix">
          <CardHeader>
            <CardTitle>Private Package Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pricing Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 font-medium text-xs">No. of Adults</th>
                    <th className="text-left py-2 px-3 font-medium text-xs">No. of Children</th>
                    <th className="text-left py-2 px-3 font-medium text-xs">Type of Car</th>
                    <th className="text-left py-2 px-3 font-medium text-xs">Vehicle Capacity</th>
                    <th className="text-left py-2 px-3 font-medium text-xs">Total Price</th>
                    <th className="text-left py-2 px-3 font-medium text-xs w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pricing.privatePackageRows.map((row, index) => (
                    <tr key={row.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          min={0}
                          value={row.numberOfAdults}
                          onChange={(e) => updatePrivatePackageRow(index, "numberOfAdults", Number(e.target.value || 0))}
                          className="package-text-fix w-20 h-8 text-sm"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          min={0}
                          value={row.numberOfChildren}
                          onChange={(e) => updatePrivatePackageRow(index, "numberOfChildren", Number(e.target.value || 0))}
                          className="package-text-fix w-20 h-8 text-sm"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          placeholder="e.g., Sedan, SUV"
                          value={row.carType}
                          onChange={(e) => updatePrivatePackageRow(index, "carType", e.target.value)}
                          className="package-text-fix w-24 h-8 text-sm"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          min={1}
                          value={row.vehicleCapacity}
                          onChange={(e) => updatePrivatePackageRow(index, "vehicleCapacity", Number(e.target.value || 1))}
                          className="package-text-fix w-20 h-8 text-sm"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={row.totalPrice}
                          onChange={(e) => updatePrivatePackageRow(index, "totalPrice", Number(e.target.value || 0))}
                          className="package-text-fix w-28 h-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removePrivatePackageRow(index)}
                          className="h-8 w-8 p-0"
                          disabled={pricing.privatePackageRows.length === 1}
                        >
                          <FaTrash className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Pricing Row Button */}
            <div className="flex justify-end">
              <Button type="button" onClick={addPrivatePackageRow} className="package-button-fix">
                <FaPlus className="mr-2" /> Add Pricing Row
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


const ReviewPublishTab: React.FC<{ onPreview?: () => void }> = ({ onPreview }) => {
  const { watch } = useFormContext<MultiCityPackageFormData>();
  const data = watch();
  const totalNights = data.cities.reduce((sum, c) => sum + (c.nights || 0), 0);
  return (
    <div className="space-y-6 package-scroll-fix">
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FaCheckCircle className="text-green-600" /> Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="font-medium">Title:</span> {data.basic.title || "—"}</div>
          <div><span className="font-medium">Region:</span> {data.basic.destinationRegion || "—"}</div>
          <div><span className="font-medium">Cities:</span> {data.cities.length} • <span className="font-medium">Nights:</span> {totalNights}</div>
          <div><span className="font-medium">Pricing Type:</span> {data.pricing.pricingType === "SIC" ? "SIC (Tabular)" : "Private Package (Tabular)"}</div>
          {data.pricing.pricingType === "SIC" && (
            <>
              <div><span className="font-medium">Pricing Rows:</span> {data.pricing.pricingRows.length}</div>
              {data.pricing.hasChildAgeRestriction && (
                <div><span className="font-medium">Child Age:</span> {data.pricing.childMinAge}-{data.pricing.childMaxAge} years</div>
              )}
            </>
          )}
          {data.pricing.pricingType === "PRIVATE_PACKAGE" && (
            <div><span className="font-medium">Private Package Rows:</span> {data.pricing.privatePackageRows.length}</div>
          )}
          {data.basic.packageValidityDate && (
            <div><span className="font-medium">Valid Until:</span> {data.basic.packageValidityDate}</div>
          )}
        </CardContent>
      </Card>

      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>Itinerary Timeline</CardTitle></CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <div className="flex items-center gap-4 min-w-max p-2">
              {data.days.map((day, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">{i + 1}</div>
                  <div className="text-xs text-gray-500 mt-1">{day.cityName}</div>
                  {i < data.days.length - 1 && <div className="w-16 h-1 bg-green-200" />}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={onPreview} className="package-button-fix"><FaEye className="mr-2" /> Preview</Button>
        <Button type="submit" className="package-button-fix">Publish</Button>
      </div>
    </div>
  );
};

// MAIN FORM
export const MultiCityPackageForm: React.FC<{
  initialData?: Partial<MultiCityPackageFormData>;
  onSave?: (data: MultiCityPackageFormData) => Promise<void> | void;
  onPublish?: (data: MultiCityPackageFormData) => Promise<void> | void;
  onPreview?: (data: MultiCityPackageFormData) => void;
  className?: string;
}> = ({ initialData, onSave, onPublish, onPreview, className }) => {
  const form = useForm<MultiCityPackageFormData>({ defaultValues: { ...DEFAULT_DATA, ...initialData } });
  const { handleSubmit, watch, reset } = form;
  const formData = watch();
  const [activeTab, setActiveTab] = useState("basic");
  const validation = useFormValidation(formData);

  // Reset form when initialData changes (for editing existing packages)
  React.useEffect(() => {
    if (initialData) {
      const mergedData = { ...DEFAULT_DATA, ...initialData };
      reset(mergedData);
      console.log("[MultiCityForm] Form reset with initialData:", {
        cities: mergedData.cities?.length || 0,
        days: mergedData.days?.length || 0,
        pricingType: mergedData.pricing?.pricingType,
      });
    }
  }, [initialData, reset]);
  // Auto-save disabled
  // const autoSave = useAutoSave(formData, onSave);

  const saveDraft = async (data: MultiCityPackageFormData) => { if (onSave) await onSave(data); };
  const publish = async (data: MultiCityPackageFormData) => { if (onPublish) await onPublish(data); };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: <FaInfoCircle className="h-4 w-4" />, badge: validation.errors.filter(e => e.tab === "basic").length, hasErrors: validation.errors.some(e => e.tab === "basic") },
    { id: "itinerary", label: "Itinerary", icon: <FaClock className="h-4 w-4" />, badge: validation.errors.filter(e => e.tab === "itinerary").length, hasErrors: validation.errors.some(e => e.tab === "itinerary") },
    { id: "inclusions", label: "Inclusions", icon: <FaCheckCircle className="h-4 w-4" />, badge: 0, hasErrors: false },
    { id: "pricing", label: "Pricing", icon: <FaDollarSign className="h-4 w-4" />, badge: validation.errors.filter(e => e.tab === "pricing").length, hasErrors: validation.errors.some(e => e.tab === "pricing") },
    { id: "review", label: "Review", icon: <FaEye className="h-4 w-4" />, badge: validation.errors.length, hasErrors: !validation.isValid },
  ];

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(publish)} className={cn("w-full package-text-fix", className)}>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Create Multi-City Package</h1>
              <p className="text-gray-600">Build an itinerary across multiple cities with intuitive tools.</p>
            </div>
            {/* Auto-save status and actions (aligned with other forms) */}
            {/* Auto-save status - DISABLED */}
            {/* <div className="flex items-center gap-4">
              <AnimatePresence>
                {autoSave.isSaving && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-2 text-sm text-blue-600">
                    <FaSpinner className="h-4 w-4 animate-spin" /> Saving...
                  </motion.div>
                )}
                {autoSave.lastSaved && !autoSave.isSaving && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-2 text-sm text-green-600">
                    <FaCheckCircle className="h-4 w-4" /> All changes saved
                  </motion.div>
                )}
                {autoSave.error && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-2 text-sm text-red-600">
                    {autoSave.error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div> */}
            <div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => onPreview?.(formData)} className="package-button-fix">Preview</Button>
                <Button type="button" variant="outline" onClick={() => saveDraft(formData)} className="package-button-fix">Save Draft</Button>
                <Button type="submit" disabled={!validation.isValid} className={cn("package-button-fix","bg-gradient-to-r from-[#FF6B35] to-[#FF4B8C] hover:from-[#E05A2A] hover:to-[#E04080]")}>Publish</Button>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6">
            <TabsList className="w-full gap-2">
              {tabs.map(t => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  icon={t.icon}
                  badge={t.badge}
                  badgeVariant={t.hasErrors ? "destructive" : "default"}
                  className={cn("package-button-fix package-animation-fix", t.hasErrors && "text-red-600 border-red-200")}
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="min-h-[600px]">
            <TabsContent value="basic"><BasicInformationTab /></TabsContent>
            <TabsContent value="itinerary"><ItineraryTab /></TabsContent>
            <TabsContent value="inclusions"><InclusionsExclusionsTab /></TabsContent>
            <TabsContent value="pricing"><PricingDatesTab /></TabsContent>
            <TabsContent value="review"><ReviewPublishTab onPreview={() => onPreview?.(formData)} /></TabsContent>
          </div>
        </Tabs>
      </form>
    </FormProvider>
  );
};

export default MultiCityPackageForm;


