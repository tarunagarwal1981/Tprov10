"use client";

import React, { useMemo, useRef, useState } from "react";
import { useForm, FormProvider, useFieldArray, useFormContext } from "react-hook-form";
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

type DayPlan = {
  cityId: string;
  cityName?: string;
  description?: string;
  photoUrl?: string;
  hasFlights?: boolean;
  flights?: Flight[];
};

type CityStop = {
  id: string;
  name: string;
  country?: string;
  nights: number;
  highlights: string[];
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
type AddOn = { id: string; name: string; description?: string; price?: number };

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

type PricingPackageType = 'STANDARD' | 'GROUP';

type Vehicle = {
  id: string;
  vehicleType: string;
  maxCapacity: number;
  price: number;
  description?: string;
};

type PricingData = {
  pricingType: PricingPackageType;
  // Per person pricing (used by both STANDARD and GROUP)
  adultPrice: number;
  childPrice: number;
  childMinAge: number;
  childMaxAge: number;
  infantPrice: number;
  infantMaxAge: number;
  // Vehicle options (only for GROUP type)
  vehicles: Vehicle[];
  // Departure dates
  departures: DepartureDate[];
  validityStart?: string;
  validityEnd?: string;
  seasonalNotes?: string;
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
  includeIntercityTransport: boolean;
  connections: Connection[];
  days: DayPlan[];
  inclusions: InclusionItem[];
  exclusions: ExclusionItem[];
  addOns: AddOn[];
  pricing: PricingData;
  policies: Policies;
};

const DEFAULT_DATA: MultiCityPackageFormData = {
  basic: { title: "", shortDescription: "", destinationRegion: "", packageValidityDate: "", imageGallery: [] },
  cities: [],
  includeIntercityTransport: false,
  connections: [],
  days: [],
  inclusions: [],
  exclusions: [],
  addOns: [],
  pricing: { 
    pricingType: "STANDARD",
    adultPrice: 0,
    childPrice: 0,
    childMinAge: 3,
    childMaxAge: 12,
    infantPrice: 0,
    infantMaxAge: 2,
    vehicles: [],
    departures: [],
    validityStart: "",
    validityEnd: "",
    seasonalNotes: ""
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
    if (data.pricing.adultPrice <= 0) {
      errors.push({ tab: "pricing", field: "adultPrice", message: "Adult price is required", severity: "error" });
    }
    if (data.pricing.pricingType === "GROUP" && data.pricing.vehicles.length === 0) {
      errors.push({ tab: "pricing", field: "vehicles", message: "Add at least one vehicle option for group pricing", severity: "error" });
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

  const addCity = () => {
    append({ id: generateId(), name: "", country: "", nights: 2, highlights: [], activitiesIncluded: [], expanded: true });
  };

  // Keep days in sync when cities change
  const cities = watch("cities");
  const days = watch("days");
  
  React.useEffect(() => {
    // Auto-generate days based on cities and nights
    if (!cities || cities.length === 0) return;
    
    const newDays: DayPlan[] = [];
    cities.forEach((city) => {
      const nights = city.nights || 1;
      for (let i = 0; i < nights; i++) {
        newDays.push({
          cityId: city.id,
          cityName: city.name,
          description: "",
          photoUrl: "",
          hasFlights: false,
          flights: [],
        });
      }
    });
    
    // Only update if the structure changed
    if (JSON.stringify(newDays.map(d => ({ cityId: d.cityId, cityName: d.cityName }))) !== 
        JSON.stringify(days.map((d: DayPlan) => ({ cityId: d.cityId, cityName: d.cityName })))) {
      setValue("days", newDays);
    }
  }, [cities, setValue]);

  // Initialize with one empty city by default
  React.useEffect(() => {
    if (fields.length === 0) {
      addCity();
    }
  }, []);

  const includeTransport = watch("includeIntercityTransport");

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

      {/* Intercity Transport Toggle */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardContent className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <div className="font-medium">Include Inter-city Transport</div>
            <div className="text-sm text-gray-500">Add transport details between each city</div>
          </div>
          <Switch 
            checked={includeTransport} 
            onCheckedChange={(val) => setValue("includeIntercityTransport", Boolean(val))} 
          />
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

                {/* Highlights Section */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Highlights</label>
                  <HighlightsEditor fieldIndex={idx} />
                </div>

                {/* Activities Included Section */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Activities Included</label>
                  <ActivitiesIncludedEditor fieldIndex={idx} />
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


const HighlightsEditor: React.FC<{ fieldIndex: number }> = ({ fieldIndex }) => {
  const { control } = useFormContext<MultiCityPackageFormData>();
  const { fields, append, remove } = useFieldArray({ control: control as any, name: `cities.${fieldIndex}.highlights` as any });
  const [value, setValue] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g., Eiffel Tower" />
        <Button type="button" onClick={() => { if (value.trim()) { append(value.trim() as any); setValue(""); } }}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {fields.map((f, i) => (
          <Badge key={f.id} variant="secondary" className="flex items-center gap-2">
            <span>{(f as unknown as string) || "Item"}</span>
            <button type="button" onClick={() => remove(i)} aria-label="remove" className="text-xs">×</button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

const ACTIVITIES_LIBRARY = ["City Tour", "Museum Visit", "Cooking Class", "Wine Tasting", "Boat Cruise", "Hiking", "Cycling", "Food Tour"];

const ActivitiesIncludedEditor: React.FC<{ fieldIndex: number }> = ({ fieldIndex }) => {
  const { control, watch, setValue } = useFormContext<MultiCityPackageFormData>();
  const { fields } = useFieldArray({ control: control as any, name: `cities.${fieldIndex}.activitiesIncluded` as any });
  const selected = (watch(`cities.${fieldIndex}.activitiesIncluded`) as string[]) || [];
  const toggle = (name: string) => {
    const set = new Set(selected);
    if (set.has(name)) set.delete(name); else set.add(name);
    setValue(`cities.${fieldIndex}.activitiesIncluded`, Array.from(set));
  };
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIVITIES_LIBRARY.map(act => (
        <Button key={act} type="button" variant={selected.includes(act) ? "default" : "outline"} onClick={() => toggle(act)} className="h-8 px-3 text-xs">
          {act}
        </Button>
      ))}
    </div>
  );
};


const ItineraryTab: React.FC = () => {
  const { watch, setValue, control } = useFormContext<MultiCityPackageFormData>();
  const days = watch("days") || [];

  const addFlight = (dayIndex: number) => {
    const d = [...days];
    const day = d[dayIndex];
    if (!day) return;
    if (!day.flights) day.flights = [];
    day.flights.push({
      id: generateId(),
      departureCity: "",
      departureTime: "",
      arrivalCity: "",
      arrivalTime: "",
      airline: "",
      flightNumber: "",
    });
    setValue("days", d);
  };

  const removeFlight = (dayIndex: number, flightIndex: number) => {
    const d = [...days];
    const day = d[dayIndex];
    if (!day || !day.flights) return;
    day.flights.splice(flightIndex, 1);
    setValue("days", d);
  };

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
              {/* Description and Photo Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea
                    placeholder="Describe the activities and highlights for this day..."
                    defaultValue={day.description}
                    onChange={(e) => {
                      const d = [...days];
                      if (d[dayIndex]) {
                        d[dayIndex]!.description = e.target.value;
                        setValue("days", d);
                      }
                    }}
                    rows={4}
                    className="package-text-fix"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Photo</label>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(dayIndex, e)}
                      className="package-text-fix"
                    />
                    {day.photoUrl && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img 
                          src={day.photoUrl} 
                          alt={`Day ${dayIndex + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Add Flights Checkbox */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <input
                  type="checkbox"
                  id={`hasFlights-${dayIndex}`}
                  checked={day.hasFlights || false}
                  onChange={(e) => {
                    const d = [...days];
                    if (d[dayIndex]) {
                      d[dayIndex]!.hasFlights = e.target.checked;
                      if (e.target.checked && (!d[dayIndex]!.flights || d[dayIndex]!.flights!.length === 0)) {
                        // Add first flight automatically
                        d[dayIndex]!.flights = [{
                          id: generateId(),
                          departureCity: "",
                          departureTime: "",
                          arrivalCity: "",
                          arrivalTime: "",
                          airline: "",
                          flightNumber: "",
                        }];
                      }
                      setValue("days", d);
                    }
                  }}
                  className="w-4 h-4"
                />
                <label htmlFor={`hasFlights-${dayIndex}`} className="text-sm font-medium cursor-pointer">
                  Add Flights for this day
                </label>
              </div>

              {/* Flights Section */}
              {day.hasFlights && (
                <div className="space-y-3 pl-6 border-l-2 border-orange-300">
                  {(day.flights || []).map((flight, flightIndex) => (
                    <div key={flight.id} className="space-y-3 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Flight {flightIndex + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFlight(dayIndex, flightIndex)}
                        >
                          <FaTrash className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Row 1: Departure and Arrival Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs font-medium mb-1 block">Departure City</label>
                          <Input
                            placeholder="e.g. Paris"
                            defaultValue={flight.departureCity}
                            onChange={(e) => {
                              const d = [...days];
                              if (d[dayIndex]?.flights?.[flightIndex]) {
                                d[dayIndex]!.flights![flightIndex]!.departureCity = e.target.value;
                                setValue("days", d);
                              }
                            }}
                            className="package-text-fix text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Departure Time</label>
                          <Input
                            type="time"
                            defaultValue={flight.departureTime}
                            onChange={(e) => {
                              const d = [...days];
                              if (d[dayIndex]?.flights?.[flightIndex]) {
                                d[dayIndex]!.flights![flightIndex]!.departureTime = e.target.value;
                                setValue("days", d);
                              }
                            }}
                            className="package-text-fix text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Arrival City</label>
                          <Input
                            placeholder="e.g. Rome"
                            defaultValue={flight.arrivalCity}
                            onChange={(e) => {
                              const d = [...days];
                              if (d[dayIndex]?.flights?.[flightIndex]) {
                                d[dayIndex]!.flights![flightIndex]!.arrivalCity = e.target.value;
                                setValue("days", d);
                              }
                            }}
                            className="package-text-fix text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Arrival Time</label>
                          <Input
                            type="time"
                            defaultValue={flight.arrivalTime}
                            onChange={(e) => {
                              const d = [...days];
                              if (d[dayIndex]?.flights?.[flightIndex]) {
                                d[dayIndex]!.flights![flightIndex]!.arrivalTime = e.target.value;
                                setValue("days", d);
                              }
                            }}
                            className="package-text-fix text-sm"
                          />
                        </div>
                      </div>

                      {/* Row 2: Airline and Flight Number */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium mb-1 block">Airline</label>
                          <Input
                            placeholder="e.g. Air France"
                            defaultValue={flight.airline}
                            onChange={(e) => {
                              const d = [...days];
                              if (d[dayIndex]?.flights?.[flightIndex]) {
                                d[dayIndex]!.flights![flightIndex]!.airline = e.target.value;
                                setValue("days", d);
                              }
                            }}
                            className="package-text-fix text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Flight Number</label>
                          <Input
                            placeholder="e.g. AF1234"
                            defaultValue={flight.flightNumber}
                            onChange={(e) => {
                              const d = [...days];
                              if (d[dayIndex]?.flights?.[flightIndex]) {
                                d[dayIndex]!.flights![flightIndex]!.flightNumber = e.target.value;
                                setValue("days", d);
                              }
                            }}
                            className="package-text-fix text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Another Flight Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addFlight(dayIndex)}
                    className="package-button-fix"
                  >
                    <FaPlus className="mr-2 h-3 w-3" /> Add Another Flight
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};


const InclusionsExclusionsTab: React.FC = () => {
  const { control } = useFormContext<MultiCityPackageFormData>();
  const inc = useFieldArray({ control, name: "inclusions" });
  const exc = useFieldArray({ control, name: "exclusions" });
  const addons = useFieldArray({ control, name: "addOns" });
  const [incText, setIncText] = useState("");
  const [incCat, setIncCat] = useState<InclusionCategory>("Transport");
  const [excText, setExcText] = useState("");
  const [addOn, setAddOn] = useState({ name: "", description: "", price: 0 });
  return (
    <div className="space-y-6">
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>What&apos;s Included</CardTitle></CardHeader>
        <CardContent className="space-y-3">
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
              <Input value={incText} onChange={(e) => setIncText(e.target.value)} placeholder="Add inclusion" />
              <Button type="button" onClick={() => { if (incText.trim()) { inc.append({ id: generateId(), category: incCat, text: incText.trim() }); setIncText(""); } }}>Add</Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {inc.fields.map((f, i) => (
              <Badge key={f.id} variant="outline" className="flex items-center gap-2">
                <span className="text-xs">{(f as any).category}:</span>
                <span>{(f as any).text}</span>
                <button type="button" onClick={() => inc.remove(i)} aria-label="remove" className="text-xs">×</button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>What&apos;s Not Included</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={excText} onChange={(e) => setExcText(e.target.value)} placeholder="Add exclusion" />
            <Button type="button" onClick={() => { if (excText.trim()) { exc.append({ id: generateId(), text: excText.trim() }); setExcText(""); } }}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {exc.fields.map((f, i) => (
              <Badge key={f.id} variant="secondary" className="flex items-center gap-2">
                <span>{(f as any).text}</span>
                <button type="button" onClick={() => exc.remove(i)} aria-label="remove" className="text-xs">×</button>
              </Badge>
            ))}
          </div>
      </CardContent>
      </Card>

      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>Optional Add-ons</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input placeholder="Name" value={addOn.name} onChange={(e) => setAddOn(s => ({ ...s, name: e.target.value }))} />
            <Input placeholder="Description" value={addOn.description} onChange={(e) => setAddOn(s => ({ ...s, description: e.target.value }))} />
            <Input type="number" placeholder="Price" value={addOn.price} onChange={(e) => setAddOn(s => ({ ...s, price: Number(e.target.value || 0) }))} />
          </div>
          <Button type="button" onClick={() => { if (addOn.name.trim()) { addons.append({ id: generateId(), ...addOn }); setAddOn({ name: "", description: "", price: 0 }); } }}>Add Add-on</Button>
          <div className="space-y-2">
            {addons.fields.map((f, i) => (
              <div key={f.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded px-3 py-2">
                <div>
                  <div className="font-medium">{(f as any).name}</div>
                  <div className="text-xs text-gray-500">{(f as any).description || ""}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold">${Number((f as any).price || 0).toFixed(2)}</div>
                  <Button variant="destructive" size="icon" onClick={() => addons.remove(i)}><FaTrash /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PricingDatesTab: React.FC = () => {
  const { watch, setValue } = useFormContext<MultiCityPackageFormData>();
  const pricing = watch("pricing");
  const [dep, setDep] = useState({ date: "", seats: 0, price: 0, cutoff: "" });
  
  const [newVehicle, setNewVehicle] = useState({
    vehicleType: "",
    maxCapacity: 1,
    price: 0,
    description: "",
  });

  const addVehicle = () => {
    if (!newVehicle.vehicleType.trim() || newVehicle.price <= 0) return;
    const vehicle: Vehicle = {
      id: generateId(),
      ...newVehicle,
    };
    setValue("pricing.vehicles", [...pricing.vehicles, vehicle]);
    setNewVehicle({
      vehicleType: "",
      maxCapacity: 1,
      price: 0,
      description: "",
    });
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
                checked={pricing.pricingType === "STANDARD"}
                onChange={() => setValue("pricing.pricingType", "STANDARD")}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium">Standard Pricing</div>
                <div className="text-xs text-gray-500">Per person pricing only</div>
              </div>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pricing-type"
                checked={pricing.pricingType === "GROUP"}
                onChange={() => setValue("pricing.pricingType", "GROUP")}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium">Group Pricing</div>
                <div className="text-xs text-gray-500">Per person pricing + vehicle options</div>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Per Person Pricing (shown for both types) */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle>Per Person Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Adult Price */}
            <div>
              <label className="text-sm font-medium mb-1 block">Adult Price *</label>
              <Input
                type="number"
                min={0}
                value={pricing.adultPrice}
                onChange={(e) => setValue("pricing.adultPrice", Number(e.target.value || 0))}
                className="package-text-fix"
                placeholder="0"
              />
            </div>

            {/* Child Price */}
            <div>
              <label className="text-sm font-medium mb-1 block">Child Price</label>
              <Input
                type="number"
                min={0}
                value={pricing.childPrice}
                onChange={(e) => setValue("pricing.childPrice", Number(e.target.value || 0))}
                className="package-text-fix"
                placeholder="0"
              />
            </div>

            {/* Child Min Age */}
            <div>
              <label className="text-sm font-medium mb-1 block">Child Min Age</label>
              <Input
                type="number"
                min={0}
                value={pricing.childMinAge}
                onChange={(e) => setValue("pricing.childMinAge", Number(e.target.value || 3))}
                className="package-text-fix"
              />
            </div>

            {/* Child Max Age */}
            <div>
              <label className="text-sm font-medium mb-1 block">Child Max Age</label>
              <Input
                type="number"
                min={0}
                value={pricing.childMaxAge}
                onChange={(e) => setValue("pricing.childMaxAge", Number(e.target.value || 12))}
                className="package-text-fix"
              />
            </div>

            {/* Infant Price */}
            <div>
              <label className="text-sm font-medium mb-1 block">Infant Price</label>
              <Input
                type="number"
                min={0}
                value={pricing.infantPrice}
                onChange={(e) => setValue("pricing.infantPrice", Number(e.target.value || 0))}
                className="package-text-fix"
                placeholder="0"
              />
            </div>

            {/* Infant Max Age */}
            <div>
              <label className="text-sm font-medium mb-1 block">Infant Max Age</label>
              <Input
                type="number"
                min={0}
                value={pricing.infantMaxAge}
                onChange={(e) => setValue("pricing.infantMaxAge", Number(e.target.value || 2))}
                className="package-text-fix"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Options (only for GROUP pricing) */}
      {pricing.pricingType === "GROUP" && (
        <Card className="package-selector-glass package-shadow-fix">
          <CardHeader>
            <CardTitle>Vehicle Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add New Vehicle Form */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <h4 className="font-medium mb-3">Add Vehicle Option</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Vehicle Type *</label>
                  <Input
                    placeholder="e.g., Sedan, SUV, Van"
                    value={newVehicle.vehicleType}
                    onChange={(e) => setNewVehicle(s => ({ ...s, vehicleType: e.target.value }))}
                    className="package-text-fix"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Max Capacity *</label>
                  <Input
                    type="number"
                    min={1}
                    value={newVehicle.maxCapacity}
                    onChange={(e) => setNewVehicle(s => ({ ...s, maxCapacity: Number(e.target.value || 1) }))}
                    className="package-text-fix"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Price *</label>
                  <Input
                    type="number"
                    min={0}
                    value={newVehicle.price}
                    onChange={(e) => setNewVehicle(s => ({ ...s, price: Number(e.target.value || 0) }))}
                    className="package-text-fix"
                    placeholder="Total price for vehicle"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Description</label>
                  <Input
                    placeholder="Optional"
                    value={newVehicle.description}
                    onChange={(e) => setNewVehicle(s => ({ ...s, description: e.target.value }))}
                    className="package-text-fix"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Button type="button" onClick={addVehicle} className="package-button-fix">
                  <FaPlus className="mr-2" /> Add Vehicle
                </Button>
              </div>
            </div>

            {/* Existing Vehicles */}
            <div className="space-y-3">
              {pricing.vehicles.map((vehicle, idx) => (
                <div key={vehicle.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">{vehicle.vehicleType}</div>
                      {vehicle.description && <div className="text-xs text-gray-500">{vehicle.description}</div>}
                    </div>
                    <div className="text-sm text-gray-500">
                      Max {vehicle.maxCapacity} {vehicle.maxCapacity === 1 ? 'person' : 'people'}
                    </div>
                    <div className="font-semibold text-green-600">
                      ${vehicle.price}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const vehicles = pricing.vehicles.filter((_, i) => i !== idx);
                      setValue("pricing.vehicles", vehicles);
                    }}
                  >
                    <FaTrash />
                  </Button>
                </div>
              ))}
              {pricing.vehicles.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No vehicles added yet. Add at least one vehicle option.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Departure Dates */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>Departure Dates</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input type="date" value={dep.date} onChange={(e) => setDep(s => ({ ...s, date: e.target.value }))} placeholder="Date" />
            <Input type="number" placeholder="Available Seats" value={dep.seats} onChange={(e) => setDep(s => ({ ...s, seats: Number(e.target.value || 0) }))} />
            <Input type="number" placeholder="Price (optional)" value={dep.price} onChange={(e) => setDep(s => ({ ...s, price: Number(e.target.value || 0) }))} />
            <Input type="date" value={dep.cutoff} onChange={(e) => setDep(s => ({ ...s, cutoff: e.target.value }))} placeholder="Cutoff Date" />
          </div>
          <Button type="button" onClick={() => {
            if (!dep.date) return;
            const next = [...pricing.departures, { id: generateId(), date: dep.date, availableSeats: dep.seats, price: dep.price, cutoffDate: dep.cutoff }];
            setValue("pricing.departures", next);
            setDep({ date: "", seats: 0, price: 0, cutoff: "" });
          }}>Add Departure Date</Button>

          <div className="space-y-2">
            {pricing.departures.map((d, i) => (
              <div key={d.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded px-3 py-2">
                <div className="text-sm">
                  <span className="font-medium">{d.date}</span> • Seats: {d.availableSeats ?? "-"}
                  {d.price ? <span> • ${Number(d.price).toFixed(2)}</span> : null}
                  {d.cutoffDate ? <span className="text-xs text-gray-500"> • Cutoff: {d.cutoffDate}</span> : null}
                </div>
                <Button variant="destructive" size="icon" onClick={() => {
                  const next = pricing.departures.slice(); next.splice(i,1); setValue("pricing.departures", next);
                }}><FaTrash /></Button>
              </div>
            ))}
            {pricing.departures.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">No departure dates added</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Notes */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>Seasonal Information</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Seasonal Pricing Notes</label>
            <Textarea 
              defaultValue={pricing.seasonalNotes} 
              onChange={(e) => setValue("pricing.seasonalNotes", e.target.value)}
              placeholder="Add any seasonal pricing variations or notes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
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
          <div><span className="font-medium">Pricing Type:</span> {data.pricing.pricingType === "STANDARD" ? "Standard (Per Person)" : "Group (Per Person + Vehicles)"}</div>
          <div><span className="font-medium">Adult Price:</span> ${data.pricing.adultPrice}</div>
          {data.pricing.pricingType === "GROUP" && (
            <div><span className="font-medium">Vehicle Options:</span> {data.pricing.vehicles.length}</div>
          )}
          <div><span className="font-medium">Departure Dates:</span> {data.pricing.departures.length}</div>
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
  const { handleSubmit, watch } = form;
  const formData = watch();
  const [activeTab, setActiveTab] = useState("basic");
  const validation = useFormValidation(formData);
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


