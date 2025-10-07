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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaPlane, FaTrain, FaBus, FaCar, FaClock, FaCheckCircle, FaEye, FaInfoCircle, FaMapMarkerAlt, FaDollarSign, FaShieldAlt, FaSpinner } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// Minimal UI shadcn-compatible components from project
// If any of the above imports don't exist in your project, replace with existing primitives.

// TYPES
type TransportType = "FLIGHT" | "TRAIN" | "BUS" | "CAR";
type TransportClass = "ECONOMY" | "BUSINESS" | "FIRST" | "STANDARD";

type MultiCityActivity = {
  time: string;
  description: string;
};

type DayPlan = {
  cityId: string;
  morning: MultiCityActivity[];
  afternoon: MultiCityActivity[];
  evening: MultiCityActivity[];
  meals: { breakfast: boolean; lunch: boolean; dinner: boolean };
  accommodationType?: string;
  notes?: string;
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

export type MultiCityPackageFormData = {
  basic: {
    title: string;
    shortDescription: string;
    destinationRegion?: string;
    imageGallery: string[];
  };
  cities: CityStop[];
  includeIntercityTransport: boolean;
  connections: Connection[];
  days: DayPlan[]; // computed from cities.nights but user-editable
  inclusions: InclusionItem[];
  exclusions: ExclusionItem[];
  addOns: AddOn[];
  pricing: PricingDates;
  policies: Policies;
};

const DEFAULT_DATA: MultiCityPackageFormData = {
  basic: { title: "", shortDescription: "", destinationRegion: "", imageGallery: [] },
  cities: [],
  includeIntercityTransport: false,
  connections: [],
  days: [],
  inclusions: [],
  exclusions: [],
  addOns: [],
  pricing: { mode: "FIXED", fixedPrice: 0, departures: [] },
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

    if (data.cities.length === 0) errors.push({ tab: "destinations", field: "cities", message: "Add at least one city", severity: "error" });
    if (data.cities.some(c => c.nights <= 0)) errors.push({ tab: "destinations", field: "nights", message: "Each city must have at least 1 night", severity: "error" });

    if (data.includeIntercityTransport && data.cities.length > 1) {
      const expected = data.cities.length - 1;
      if ((data.connections || []).length < expected) warnings.push({ tab: "transport", field: "connections", message: "Some connections are missing details" });
    }

    if (data.days.length === 0) warnings.push({ tab: "itinerary", field: "days", message: "No days generated yet" });

    if (data.pricing.mode === "FIXED" && !(data.pricing.fixedPrice && data.pricing.fixedPrice > 0)) errors.push({ tab: "pricing", field: "fixedPrice", message: "Enter a fixed price", severity: "error" });

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
  const { register } = useFormContext<MultiCityPackageFormData>();
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
          <div>
            <label className="text-sm font-medium">Destination Region</label>
            <Input {...register("basic.destinationRegion")} placeholder="Europe, Southeast Asia, etc." />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const DestinationsTab: React.FC = () => {
  const { control, setValue, watch } = useFormContext<MultiCityPackageFormData>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "cities" });
  const [open, setOpen] = useState(false);
  const [newCity, setNewCity] = useState({ name: "", country: "", nights: 2 });

  const addCity = () => {
    if (!newCity.name.trim()) return;
    append({ id: generateId(), name: newCity.name.trim(), country: newCity.country, nights: newCity.nights, highlights: [], activitiesIncluded: [], expanded: true });
    setOpen(false);
    setNewCity({ name: "", country: "", nights: 2 });
  };

  // Keep days in sync when cities change (simple heuristic)
  const cities = watch("cities");
  useMemo(() => {
    const totalNights = cities.reduce((sum, c) => sum + (c.nights || 0), 0);
    // only scaffold if empty - users can edit after
    setValue(
      "days",
      totalNights > 0
        ? Array.from({ length: totalNights }).map(() => ({ cityId: cities[0]?.id || "", morning: [], afternoon: [], evening: [], meals: { breakfast: false, lunch: false, dinner: false } }))
        : []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities.length, cities.map(c => c.nights).join("-")]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Destinations</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="package-button-fix"><FaPlus className="mr-2" /> Add City</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add City</DialogTitle>
              <DialogDescription>Search or type the city and set nights.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="City name" value={newCity.name} onChange={(e) => setNewCity(s => ({ ...s, name: e.target.value }))} />
              <Input placeholder="Country (optional)" value={newCity.country} onChange={(e) => setNewCity(s => ({ ...s, country: e.target.value }))} />
              <Input type="number" min={1} value={newCity.nights} onChange={(e) => setNewCity(s => ({ ...s, nights: Number(e.target.value || 1) }))} />
              <div className="flex justify-end"><Button onClick={addCity}>Add</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {fields.map((field, idx) => (
          <Card key={field.id} className="package-selector-glass package-shadow-fix">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">{idx + 1}</Badge>
                <span>{field.name}</span>
                {field.country && <span className="text-xs text-gray-500">{field.country}</span>}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => move(idx, Math.max(0, idx - 1))}><FaArrowUp /></Button>
                <Button variant="ghost" size="icon" onClick={() => move(idx, Math.min(fields.length - 1, idx + 1))}><FaArrowDown /></Button>
                <Button variant="destructive" size="icon" onClick={() => remove(idx)}><FaTrash /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Nights</label>
                  <Input type="number" min={1} defaultValue={field.nights} onChange={(e) => (e.target.value) && ( (field as any).nights = Number(e.target.value))} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Highlights</label>
                  <HighlightsEditor fieldIndex={idx} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Activities Included</label>
                <ActivitiesIncludedEditor fieldIndex={idx} />
              </div>
            </CardContent>
          </Card>
        ))}
        {fields.length === 0 && (
          <p className="text-sm text-gray-500">No cities added yet. Click "Add City" to begin.</p>
        )}
      </div>
    </div>
  );
};

const HighlightsEditor: React.FC<{ fieldIndex: number }> = ({ fieldIndex }) => {
  const { control } = useFormContext<MultiCityPackageFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: `cities.${fieldIndex}.highlights` as const });
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
  const { fields } = useFieldArray({ control, name: `cities.${fieldIndex}.activitiesIncluded` as const });
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

const TransportTab: React.FC = () => {
  const { register, control, watch, setValue } = useFormContext<MultiCityPackageFormData>();
  const include = watch("includeIntercityTransport");
  const cities = watch("cities");
  const { fields, append, remove } = useFieldArray({ control, name: "connections" });

  const cityPairs = useMemo(() => {
    const pairs: Array<{ from: CityStop; to: CityStop }> = [];
    for (let i = 0; i < cities.length - 1; i++) pairs.push({ from: cities[i], to: cities[i + 1] });
    return pairs;
  }, [cities]);

  const ensureConnections = () => {
    // ensure one connection per adjacent pair if include is ON
    if (!include) return;
    const existing = fields.slice();
    const next: Connection[] = cityPairs.map(p => {
      const match = existing.find(c => c.fromCityId === p.from.id && c.toCityId === p.to.id) as any;
      return match || { fromCityId: p.from.id, toCityId: p.to.id, transportType: "FLIGHT", transportClass: "ECONOMY" };
    }) as any;
    setValue("connections", next);
  };

  useMemo(() => { ensureConnections(); /* eslint-disable-next-line */ }, [include, cityPairs.map(p => p.from.id + p.to.id).join("|")]);

  const iconForType = (t: TransportType) => t === "FLIGHT" ? <FaPlane /> : t === "TRAIN" ? <FaTrain /> : t === "BUS" ? <FaBus /> : <FaCar />;

  return (
    <div className="space-y-4">
      <Card className="package-selector-glass package-shadow-fix">
        <CardContent className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <div className="font-medium">Include Inter-city Transport</div>
            <div className="text-sm text-gray-500">Add transport details between each city.</div>
          </div>
          <Switch checked={include} onCheckedChange={(val) => setValue("includeIntercityTransport", Boolean(val))} />
        </CardContent>
      </Card>

      {include && (
        <div className="space-y-3">
          {cityPairs.length === 0 && (
            <p className="text-sm text-gray-500">Add at least two cities to configure connections.</p>
          )}
          {cityPairs.map((pair, i) => (
            <Card key={pair.from.id + pair.to.id} className="package-selector-glass package-shadow-fix">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline">{pair.from.name}</Badge>
                  <span className="text-xs text-gray-500">→</span>
                  <Badge variant="outline">{pair.to.name}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-sm font-medium">Transport Type</label>
                  <Select onValueChange={(v) => setValue(`connections.${i}.transportType`, v as TransportType)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLIGHT">Flight</SelectItem>
                      <SelectItem value="TRAIN">Train</SelectItem>
                      <SelectItem value="BUS">Bus</SelectItem>
                      <SelectItem value="CAR">Car</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Class</label>
                  <Select onValueChange={(v) => setValue(`connections.${i}.transportClass`, v as TransportClass)}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ECONOMY">Economy</SelectItem>
                      <SelectItem value="BUSINESS">Business</SelectItem>
                      <SelectItem value="FIRST">First</SelectItem>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Provider/Airline</label>
                  <Input placeholder="Optional" onChange={(e) => setValue(`connections.${i}.provider`, e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Hours</label>
                    <Input type="number" min={0} onChange={(e) => setValue(`connections.${i}.durationHours`, Number(e.target.value || 0))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Minutes</label>
                    <Input type="number" min={0} max={59} onChange={(e) => setValue(`connections.${i}.durationMinutes`, Number(e.target.value || 0))} />
                  </div>
                </div>
                <div className="md:col-span-2 lg:col-span-4">
                  <label className="text-sm font-medium">Layover Info</label>
                  <Input placeholder="Optional notes about layovers" onChange={(e) => setValue(`connections.${i}.layoverNotes`, e.target.value)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const ItineraryTab: React.FC = () => {
  const { watch, setValue } = useFormContext<MultiCityPackageFormData>();
  const days = watch("days");
  const cities = watch("cities");

  const moveActivity = (fromDay: number, toDay: number, period: keyof DayPlan) => {
    const d = [...days];
    const fromList = d[fromDay][period];
    if (fromList.length === 0) return;
    const item = fromList.pop()!;
    d[toDay][period].push(item);
    setValue("days", d);
  };

  return (
    <div className="space-y-4">
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FaClock /> Itinerary Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <div className="flex items-center gap-4 min-w-max p-2">
              {days.map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center">{i + 1}</div>
                  <div className="w-24 h-1 bg-indigo-200" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {days.map((day, i) => (
          <Card key={i} className="package-selector-glass package-shadow-fix">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Day {i + 1} {cities.find(c => c.id === day.cityId)?.name && (<span className="text-sm text-gray-500">• {cities.find(c => c.id === day.cityId)?.name}</span>)}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["morning", "afternoon", "evening"].map((period) => (
                <div key={period}>
                  <div className="font-medium capitalize">{period}</div>
                  <ActivityList dayIndex={i} period={period as keyof DayPlan} />
                </div>
              ))}
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="font-medium">Meals Included</div>
                  <div className="flex gap-3 text-sm">
                    {(["breakfast", "lunch", "dinner"] as const).map(k => (
                      <label key={k} className="flex items-center gap-2">
                        <input type="checkbox" checked={day.meals[k]} onChange={(e) => {
                          const d = [...days];
                          d[i].meals[k] = e.target.checked;
                          setValue("days", d);
                        }} /> {k}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Accommodation Type</div>
                  <Input placeholder="e.g., 4-star hotel" onChange={(e) => { const d = [...days]; d[i].accommodationType = e.target.value; setValue("days", d); }} />
                </div>
                <div>
                  <div className="font-medium">Special Notes</div>
                  <Input placeholder="Notes" onChange={(e) => { const d = [...days]; d[i].notes = e.target.value; setValue("days", d); }} />
                </div>
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => moveActivity(i, Math.min(days.length - 1, i + 1), "afternoon")}>Move last afternoon → next day</Button>
                <Button type="button" variant="outline" onClick={() => { const d = [...days]; d.splice(i + 1, 0, { cityId: day.cityId, morning: [], afternoon: [], evening: [], meals: { breakfast: false, lunch: false, dinner: false } }); setValue("days", d); }}>Clone Day</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {days.length === 0 && <p className="text-sm text-gray-500">Add cities and nights to auto-generate days.</p>}
      </div>
    </div>
  );
};

const ActivityList: React.FC<{ dayIndex: number; period: keyof DayPlan }> = ({ dayIndex, period }) => {
  const { watch, setValue } = useFormContext<MultiCityPackageFormData>();
  const days = watch("days");
  const list = days[dayIndex]?.[period] as MultiCityActivity[];
  const [time, setTime] = useState("09:00");
  const [desc, setDesc] = useState("");
  const add = () => {
    const d = [...days];
    d[dayIndex][period].push({ time, description: desc || "Activity" });
    setValue("days", d);
    setDesc("");
  };
  const remove = (idx: number) => { const d = [...days]; d[dayIndex][period].splice(idx, 1); setValue("days", d); };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={time} onChange={(e) => setTime(e.target.value)} className="w-24" />
        <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" />
        <Button type="button" onClick={add}><FaPlus className="mr-1" /> Add</Button>
      </div>
      <div className="space-y-1">
        {list?.map((a, i) => (
          <div key={i} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
            <span className="text-gray-600">{a.time}</span>
            <span className="flex-1 ml-3">{a.description}</span>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><FaTrash /></Button>
          </div>
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
        <CardHeader><CardTitle>What's Included</CardTitle></CardHeader>
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
        <CardHeader><CardTitle>What's Not Included</CardTitle></CardHeader>
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
  return (
    <div className="space-y-6">
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>Package Pricing Options</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3 text-sm">
            {(["FIXED", "PER_PERSON", "GROUP_TIERED"] as PricingMode[]).map(m => (
              <label key={m} className="flex items-center gap-2">
                <input type="radio" name="pricing-mode" checked={pricing.mode === m} onChange={() => setValue("pricing.mode", m)} /> {m.replace("_"," ")}
              </label>
            ))}
          </div>
          {pricing.mode === "FIXED" && (
            <div>
              <label className="text-sm font-medium">Fixed Price</label>
              <Input type="number" defaultValue={pricing.fixedPrice} onChange={(e) => setValue("pricing.fixedPrice", Number(e.target.value || 0))} />
            </div>
          )}
          {pricing.mode === "PER_PERSON" && (
            <div>
              <label className="text-sm font-medium">Per Person Price</label>
              <Input type="number" defaultValue={pricing.perPersonPrice} onChange={(e) => setValue("pricing.perPersonPrice", Number(e.target.value || 0))} />
            </div>
          )}
          {pricing.mode === "GROUP_TIERED" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Min Group Size</label>
                <Input type="number" defaultValue={pricing.groupMin} onChange={(e) => setValue("pricing.groupMin", Number(e.target.value || 0))} />
              </div>
              <div>
                <label className="text-sm font-medium">Max Group Size</label>
                <Input type="number" defaultValue={pricing.groupMax} onChange={(e) => setValue("pricing.groupMax", Number(e.target.value || 0))} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>Available Dates</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input type="date" value={dep.date} onChange={(e) => setDep(s => ({ ...s, date: e.target.value }))} />
            <Input type="number" placeholder="Seats" value={dep.seats} onChange={(e) => setDep(s => ({ ...s, seats: Number(e.target.value || 0) }))} />
            <Input type="number" placeholder="Price" value={dep.price} onChange={(e) => setDep(s => ({ ...s, price: Number(e.target.value || 0) }))} />
            <Input type="date" value={dep.cutoff} onChange={(e) => setDep(s => ({ ...s, cutoff: e.target.value }))} />
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
                  <span className="font-medium">{d.date}</span> • Seats: {d.availableSeats ?? "-"} • ${Number(d.price || 0).toFixed(2)}
                  {d.cutoffDate ? <span className="text-xs text-gray-500"> • Cutoff: {d.cutoffDate}</span> : null}
                </div>
                <Button variant="destructive" size="icon" onClick={() => {
                  const next = pricing.departures.slice(); next.splice(i,1); setValue("pricing.departures", next);
                }}><FaTrash /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>Validity & Seasonal Variations</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium">Validity Start</label>
            <Input type="date" defaultValue={pricing.validityStart} onChange={(e) => setValue("pricing.validityStart", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Validity End</label>
            <Input type="date" defaultValue={pricing.validityEnd} onChange={(e) => setValue("pricing.validityEnd", e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <label className="text-sm font-medium">Seasonal Pricing Notes</label>
            <Textarea defaultValue={pricing.seasonalNotes} onChange={(e) => setValue("pricing.seasonalNotes", e.target.value)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PoliciesTab: React.FC = () => {
  const { watch, setValue, control } = useFormContext<MultiCityPackageFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: "policies.cancellation" });
  const policies = watch("policies");
  const [tier, setTier] = useState({ days: 30, refund: 100 });
  return (
    <div className="space-y-6">
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>Cancellation Policy (tiered)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input type="number" placeholder="Days before" value={tier.days} onChange={(e) => setTier(s => ({ ...s, days: Number(e.target.value || 0) }))} />
            <Input type="number" placeholder="Refund %" value={tier.refund} onChange={(e) => setTier(s => ({ ...s, refund: Number(e.target.value || 0) }))} />
            <Button type="button" onClick={() => append({ id: generateId(), daysBefore: tier.days, refundPercent: tier.refund })}>Add tier</Button>
          </div>
          <div className="space-y-2">
            {fields.map((f, i) => (
              <div key={f.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded px-3 py-2 text-sm">
                <div>{(f as any).daysBefore} days before: {(f as any).refundPercent}% refund</div>
                <Button variant="destructive" size="icon" onClick={() => remove(i)}><FaTrash /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>Payment Terms</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium">Deposit required (%)</label>
            <Input type="number" defaultValue={policies.depositPercent} onChange={(e) => setValue("policies.depositPercent", Number(e.target.value || 0))} />
          </div>
          <div>
            <label className="text-sm font-medium">Balance due (days before)</label>
            <Input type="number" defaultValue={policies.balanceDueDays} onChange={(e) => setValue("policies.balanceDueDays", Number(e.target.value || 0))} />
          </div>
          <div className="md:col-span-3">
            <label className="text-sm font-medium">Payment methods</label>
            <Input placeholder="e.g., Credit Card, Bank Transfer" defaultValue={(policies.paymentMethods || []).join(", ")} onChange={(e) => setValue("policies.paymentMethods", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
          </div>
        </CardContent>
      </Card>

      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>Other Requirements</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Visa Requirements</label>
            <Textarea defaultValue={policies.visaRequirements} onChange={(e) => setValue("policies.visaRequirements", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Insurance</label>
            <Select defaultValue={policies.insuranceRequirement || "OPTIONAL"} onValueChange={(v) => setValue("policies.insuranceRequirement", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="REQUIRED">Required</SelectItem>
                <SelectItem value="OPTIONAL">Optional</SelectItem>
                <SelectItem value="NA">Not Applicable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Health Requirements</label>
            <Textarea defaultValue={policies.healthRequirements} onChange={(e) => setValue("policies.healthRequirements", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Terms & Conditions</label>
            <Textarea defaultValue={policies.terms} onChange={(e) => setValue("policies.terms", e.target.value)} />
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
          <div><span className="font-medium">Cities:</span> {data.cities.length} • <span className="font-medium">Nights:</span> {totalNights}</div>
          <div><span className="font-medium">Pricing Mode:</span> {data.pricing.mode}</div>
        </CardContent>
      </Card>

      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>Itinerary Timeline</CardTitle></CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <div className="flex items-center gap-4 min-w-max p-2">
              {data.days.map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs">{i + 1}</div>
                  <div className="w-16 h-1 bg-green-200" />
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
  const autoSave = useAutoSave(formData, onSave);

  const saveDraft = async (data: MultiCityPackageFormData) => { if (onSave) await onSave(data); };
  const publish = async (data: MultiCityPackageFormData) => { if (onPublish) await onPublish(data); };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: <FaInfoCircle className="h-4 w-4" />, badge: validation.errors.filter(e => e.tab === "basic").length, hasErrors: validation.errors.some(e => e.tab === "basic") },
    { id: "destinations", label: "Destinations", icon: <FaMapMarkerAlt className="h-4 w-4" />, badge: validation.errors.filter(e => e.tab === "destinations").length, hasErrors: validation.errors.some(e => e.tab === "destinations") },
    { id: "transport", label: "Transport", icon: <FaPlane className="h-4 w-4" />, badge: validation.errors.filter(e => e.tab === "transport").length, hasErrors: validation.errors.some(e => e.tab === "transport") },
    { id: "itinerary", label: "Itinerary", icon: <FaClock className="h-4 w-4" />, badge: validation.errors.filter(e => e.tab === "itinerary").length, hasErrors: validation.errors.some(e => e.tab === "itinerary") },
    { id: "inclusions", label: "Inclusions", icon: <FaCheckCircle className="h-4 w-4" />, badge: 0, hasErrors: false },
    { id: "pricing", label: "Pricing", icon: <FaDollarSign className="h-4 w-4" />, badge: validation.errors.filter(e => e.tab === "pricing").length, hasErrors: validation.errors.some(e => e.tab === "pricing") },
    { id: "policies", label: "Policies", icon: <FaShieldAlt className="h-4 w-4" />, badge: 0, hasErrors: false },
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
            <div className="flex items-center gap-4">
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
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => onPreview?.(formData)} className="package-button-fix">Preview</Button>
                <Button type="button" variant="outline" onClick={() => saveDraft(formData)} className="package-button-fix">Save Draft</Button>
                <Button type="submit" disabled={!validation.isValid} className={cn("package-button-fix","bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700")}>Publish</Button>
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
            <TabsContent value="destinations"><DestinationsTab /></TabsContent>
            <TabsContent value="transport"><TransportTab /></TabsContent>
            <TabsContent value="itinerary"><ItineraryTab /></TabsContent>
            <TabsContent value="inclusions"><InclusionsExclusionsTab /></TabsContent>
            <TabsContent value="pricing"><PricingDatesTab /></TabsContent>
            <TabsContent value="policies"><PoliciesTab /></TabsContent>
            <TabsContent value="review"><ReviewPublishTab onPreview={() => onPreview?.(formData)} /></TabsContent>
          </div>
        </Tabs>
      </form>
    </FormProvider>
  );
};

export default MultiCityPackageForm;


