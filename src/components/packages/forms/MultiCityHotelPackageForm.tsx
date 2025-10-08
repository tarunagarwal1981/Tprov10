"use client";

import React, { useMemo, useRef, useState } from "react";
import { FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FaBed, FaConciergeBell, FaCheckCircle, FaDollarSign, FaEye, FaInfoCircle, FaMapMarkerAlt, FaPlane, FaPlus, FaShieldAlt, FaSpinner, FaStar } from "react-icons/fa";
import { Button as UIButton } from "@/components/ui/button";

// Reuse base data from MultiCity form with hotel additions
type HotelAmenity = "Wi-Fi" | "Pool" | "Gym" | "Spa" | "Restaurant" | "Room Service" | "Parking" | "Airport Shuttle" | "Business Center";
type RoomAmenity = "Balcony" | "Minibar" | "Air Conditioning" | "TV" | "Coffee Maker" | "Safe" | "Bathtub";

type RoomOption = {
  id: string;
  name: string;
  bed: "King" | "Queen" | "Twin" | "Double" | "Single";
  maxAdults: number;
  maxChildren: number;
  sizeSqm?: number;
  amenities: RoomAmenity[];
  images: string[];
  pricePerNight?: number;
  extraBedAvailable?: boolean;
  extraBedPrice?: number;
  view?: "City" | "Sea" | "Garden" | "Mountain" | "Pool";
};

type CityHotel = {
  hotelName: string;
  rating: number; // 1-5
  location: string;
  distanceKm?: number;
  images: string[];
  amenities: HotelAmenity[];
  description?: string;
  rooms: RoomOption[];
  mealPlan: "ROOM_ONLY" | "BB" | "HB" | "FB" | "AI";
  breakfastType?: "Buffet" | "Continental" | "À la carte";
  restaurantOptions?: string;
  dietary: Array<"Vegetarian" | "Vegan" | "Gluten-Free" | "Halal" | "Kosher" | "Allergies">;
};

type CityWithHotel = {
  cityId: string; // link to MultiCity city id
  category: "BUDGET" | "STANDARD" | "DELUXE" | "LUXURY" | "PREMIUM";
  hotels: CityHotel[]; // allow comparison / alternatives
  selectedIndex?: number; // which hotel chosen
};

type EnhancedDay = {
  accommodationHotelName?: string;
  checkIn?: string;
  checkOut?: string;
  mealPlanForDay?: string;
  facilitiesUsage?: string; // text/time ranges
};

type EnhancedPricing = {
  basePrice?: number;
  hotelCostsByCity: Array<{ cityId: string; total: number }>;
  mealPlanCosts?: number;
  roomUpgradeCosts?: number;
  singleSupplement?: number;
  childPricing?: Array<{ label: string; rule: string; price: number }>;
  totalPrice?: number;
};

export type MultiCityHotelFormData = {
  basic: {
    title: string;
    shortDescription: string;
    destinationRegion?: string;
    imageGallery: string[];
  };
  cities: Array<{ id: string; name: string; country?: string; nights: number; highlights?: string[] }>;
  includeIntercityTransport: boolean;
  hotels: CityWithHotel[];
  daysExtra: Record<number, EnhancedDay>;
  inclusions: Array<{ id: string; category: string; text: string }>;
  exclusions: Array<{ id: string; text: string }>;
  pricingExtra: EnhancedPricing;
  policies: {
    cancellation: Array<{ id: string; daysBefore: number; refundPercent: number }>;
    depositPercent?: number;
    balanceDueDays?: number;
    paymentMethods?: string[];
    visaRequirements?: string;
    insuranceRequirement?: "REQUIRED" | "OPTIONAL" | "NA";
    healthRequirements?: string;
    terms?: string;
  };
};

const DEFAULT_DATA: MultiCityHotelFormData = {
  basic: { title: "", shortDescription: "", destinationRegion: "", imageGallery: [] },
  cities: [],
  includeIntercityTransport: false,
  hotels: [],
  daysExtra: {},
  inclusions: [],
  exclusions: [],
  pricingExtra: { hotelCostsByCity: [] },
  policies: { cancellation: [], insuranceRequirement: "OPTIONAL" },
};

const generateId = () => Math.random().toString(36).slice(2, 9);

// Basic Info Tab
const BasicInformationTab: React.FC = () => {
  const { register } = useFormContext<MultiCityHotelFormData>();
  return (
    <div className="space-y-4">
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input {...register("basic.title")} placeholder="Grand Multi-City + Hotels" />
          </div>
          <div>
            <label className="text-sm font-medium">Short Description</label>
            <Textarea {...register("basic.shortDescription")} placeholder="Curated multi-city itinerary with handpicked stays." />
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

// Destinations Tab (with city management)
const DestinationsTab: React.FC = () => {
  const { control, setValue, watch } = useFormContext<MultiCityHotelFormData>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "cities" });
  const [open, setOpen] = useState(false);
  const [newCity, setNewCity] = useState({ name: "", country: "", nights: 2 });

  const addCity = () => {
    if (!newCity.name.trim()) return;
    append({ id: generateId(), name: newCity.name.trim(), country: newCity.country, nights: newCity.nights, highlights: [] });
    setOpen(false);
    setNewCity({ name: "", country: "", nights: 2 });
  };

  const cities = watch("cities");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Destinations</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <UIButton className="package-button-fix"><FaPlus className="mr-2" /> Add City</UIButton>
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
              <div className="flex justify-end"><UIButton onClick={addCity}>Add</UIButton></div>
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
                {(field as any).country && <span className="text-xs text-gray-500">{(field as any).country}</span>}
              </CardTitle>
              <div className="flex items-center gap-2">
                <UIButton variant="ghost" size="icon" onClick={() => move(idx, Math.max(0, idx - 1))}>↑</UIButton>
                <UIButton variant="ghost" size="icon" onClick={() => move(idx, Math.min(fields.length - 1, idx + 1))}>↓</UIButton>
                <UIButton variant="destructive" size="icon" onClick={() => remove(idx)}>✕</UIButton>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Nights</label>
                <Input type="number" min={1} defaultValue={(field as any).nights} onChange={(e) => { const cities = [...(watch("cities") as any[])]; cities[idx].nights = Number(e.target.value || 1); setValue("cities", cities as any); }} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Highlights</label>
                <CityHighlightsEditor index={idx} />
              </div>
            </CardContent>
          </Card>
        ))}
        {fields.length === 0 && (
          <p className="text-sm text-gray-500">No cities added yet. Click &quot;Add City&quot; to begin.</p>
        )}
      </div>
    </div>
  );
};

const CityHighlightsEditor: React.FC<{ index: number }> = ({ index }) => {
  const { control } = useFormContext<MultiCityHotelFormData>();
  // Cast name to any to accommodate nested dynamic array path
  const { fields, append, remove } = useFieldArray({ control: control as any, name: `cities.${index}.highlights` as any });
  const [value, setValue] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g., Old Town" />
        <UIButton type="button" onClick={() => { if (value.trim()) { append(value.trim() as any); setValue(""); } }}>Add</UIButton>
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

// Accommodation Details Tab
const AccommodationTab: React.FC = () => {
  const { watch, setValue, control } = useFormContext<MultiCityHotelFormData>();
  const cities = watch("cities");
  const { fields, append, remove } = useFieldArray({ control, name: "hotels" });

  const ensureCityRows = React.useCallback(() => {
    const list = fields as any[];
    const next = cities.map((c) => {
      const existing = list.find((h) => h.cityId === c.id);
      return existing || { id: generateId(), cityId: c.id, category: "STANDARD", hotels: [] };
    });
    setValue("hotels", next as any);
  }, [fields, cities, setValue]);

  React.useEffect(() => { ensureCityRows(); }, [ensureCityRows]);

  const CATEGORIES: Array<{ value: CityWithHotel["category"]; label: string; priceLevel: string }> = [
    { value: "BUDGET", label: "Budget", priceLevel: "$" },
    { value: "STANDARD", label: "Standard", priceLevel: "$" },
    { value: "DELUXE", label: "Deluxe", priceLevel: "$$" },
    { value: "LUXURY", label: "Luxury", priceLevel: "$$" },
    { value: "PREMIUM", label: "Premium", priceLevel: "$$$" },
  ];

  return (
    <div className="space-y-4">
      {fields.map((row, idx) => {
        const city = cities.find((c) => c.id === (row as any).cityId);
        return (
          <Card key={row.id} className="package-selector-glass package-shadow-fix">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaMapMarkerAlt /> {city?.name || "City"}
                <span className="text-xs text-gray-500">• {city?.nights || 0} nights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Hotel Category</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setValue(`hotels.${idx}.category`, cat.value)}
                      className={cn(
                        "border rounded-lg p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800",
                        (row as any).category === cat.value ? "border-indigo-500 ring-1 ring-indigo-200" : "border-gray-200"
                      )}
                    >
                      <div className="font-semibold flex items-center gap-2">
                        <FaBed /> {cat.label}
                      </div>
                      <div className="text-xs text-gray-500">{cat.priceLevel} category</div>
                    </button>
                  ))}
                </div>
              </div>

              <CityHotelList cityIndex={idx} />
            </CardContent>
          </Card>
        );
      })}
      {fields.length === 0 && <p className="text-sm text-gray-500">Add cities in the core Multi-City form to configure hotels.</p>}
    </div>
  );
};

const HOTEL_AMENITIES: HotelAmenity[] = ["Wi-Fi","Pool","Gym","Spa","Restaurant","Room Service","Parking","Airport Shuttle","Business Center"];
const ROOM_AMENITIES: RoomAmenity[] = ["Balcony","Minibar","Air Conditioning","TV","Coffee Maker","Safe","Bathtub"];

const CityHotelList: React.FC<{ cityIndex: number }> = ({ cityIndex }) => {
  const { watch, setValue, control } = useFormContext<MultiCityHotelFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: `hotels.${cityIndex}.hotels` as const });
  const selectedIndex = (watch(`hotels.${cityIndex}.selectedIndex`) as number | undefined) ?? 0;

  const addHotel = () => append({
    hotelName: "",
    rating: 4,
    location: "",
    distanceKm: 0,
    images: [],
    amenities: [],
    description: "",
    rooms: [],
    mealPlan: "BB",
    breakfastType: "Buffet",
    restaurantOptions: "",
    dietary: [],
  } as any);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Hotel Selection</div>
        <Button type="button" onClick={addHotel}><FaPlus className="mr-2" /> Add Hotel</Button>
      </div>

      {fields.map((f, i) => (
        <Card key={f.id} className={cn("border-2", selectedIndex === i ? "border-indigo-500" : "border-transparent")}> 
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <button type="button" className="rounded bg-indigo-50 px-2 py-1 text-xs" onClick={() => setValue(`hotels.${cityIndex}.selectedIndex`, i)}>Select</button>
              <Input defaultValue={(f as any).hotelName} placeholder="Hotel Name" onChange={(e) => setValue(`hotels.${cityIndex}.hotels.${i}.hotelName`, e.target.value)} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <div className="text-xs text-gray-500 mb-1">Rating</div>
                <Select defaultValue={String((f as any).rating || 4)} onValueChange={(v) => setValue(`hotels.${cityIndex}.hotels.${i}.rating`, Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} <FaStar className="inline" /></SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Location</div>
                <Input placeholder="Map pin/address" defaultValue={(f as any).location} onChange={(e) => setValue(`hotels.${cityIndex}.hotels.${i}.location`, e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Distance from Center (km)</div>
                <Input type="number" min={0} defaultValue={(f as any).distanceKm} onChange={(e) => setValue(`hotels.${cityIndex}.hotels.${i}.distanceKm`, Number(e.target.value || 0))} />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Meal Plan</div>
                <Select defaultValue={(f as any).mealPlan || "BB"} onValueChange={(v) => setValue(`hotels.${cityIndex}.hotels.${i}.mealPlan`, v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROOM_ONLY">Room Only</SelectItem>
                    <SelectItem value="BB">Bed & Breakfast</SelectItem>
                    <SelectItem value="HB">Half Board</SelectItem>
                    <SelectItem value="FB">Full Board</SelectItem>
                    <SelectItem value="AI">All Inclusive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-gray-500 mb-1">Breakfast Type</div>
                <Select defaultValue={(f as any).breakfastType || "Buffet"} onValueChange={(v) => setValue(`hotels.${cityIndex}.hotels.${i}.breakfastType`, v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Buffet","Continental","À la carte"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500 mb-1">Restaurant Options</div>
                <Input defaultValue={(f as any).restaurantOptions} onChange={(e) => setValue(`hotels.${cityIndex}.hotels.${i}.restaurantOptions`, e.target.value)} />
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">Dietary Accommodations</div>
              <div className="flex flex-wrap gap-2">
                {["Vegetarian","Vegan","Gluten-Free","Halal","Kosher","Allergies"].map(opt => {
                  const selected = ((f as any).dietary || []).includes(opt);
                  return (
                    <Button key={opt} type="button" variant={selected ? "default" : "outline"} onClick={() => {
                      const set = new Set<string>(((f as any).dietary || []));
                      if (set.has(opt)) set.delete(opt); else set.add(opt);
                      setValue(`hotels.${cityIndex}.hotels.${i}.dietary`, Array.from(set) as any);
                    }} className="h-8 px-3 text-xs">
                      {opt}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Hotel Amenities</div>
              <div className="flex flex-wrap gap-2">
                {HOTEL_AMENITIES.map(a => {
                  const selected = ((f as any).amenities || []).includes(a);
                  return (
                    <Button key={a} type="button" variant={selected ? "default" : "outline"} onClick={() => {
                      const set = new Set<string>(((f as any).amenities || []));
                      if (set.has(a)) set.delete(a); else set.add(a);
                      setValue(`hotels.${cityIndex}.hotels.${i}.amenities`, Array.from(set) as any);
                    }} className="h-8 px-3 text-xs">
                      {a}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Room Options</div>
              <RoomOptions cityIndex={cityIndex} hotelIndex={i} />
            </div>

            <div>
              <div className="text-sm font-medium">Hotel Description</div>
              <Textarea defaultValue={(f as any).description} onChange={(e) => setValue(`hotels.${cityIndex}.hotels.${i}.description`, e.target.value)} />
            </div>

            <div className="flex items-center justify-end">
              <Button type="button" variant="destructive" onClick={() => remove(i)}>Remove Hotel</Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {fields.length === 0 && (
        <p className="text-sm text-gray-500">No hotels added yet. Click &quot;Add Hotel&quot; to begin.</p>
      )}
    </div>
  );
};

const RoomOptions: React.FC<{ cityIndex: number; hotelIndex: number }> = ({ cityIndex, hotelIndex }) => {
  const { control, setValue, watch } = useFormContext<MultiCityHotelFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: `hotels.${cityIndex}.hotels.${hotelIndex}.rooms` as const });
  const addRoom = () => append({ id: generateId(), name: "", bed: "King", maxAdults: 2, maxChildren: 0, amenities: [], images: [], pricePerNight: 0 } as any);
  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={addRoom}><FaPlus className="mr-2" /> Add Room Type</Button>
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={f.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 bg-gray-50 dark:bg-gray-800 rounded p-2">
            <Input placeholder="Room Name" defaultValue={(f as any).name} onChange={(e) => setValue(`hotels.${cityIndex}.hotels.${hotelIndex}.rooms.${i}.name`, e.target.value)} />
            <Select defaultValue={(f as any).bed || "King"} onValueChange={(v) => setValue(`hotels.${cityIndex}.hotels.${hotelIndex}.rooms.${i}.bed`, v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["King","Queen","Twin","Double","Single"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Max Adults" defaultValue={(f as any).maxAdults} onChange={(e) => setValue(`hotels.${cityIndex}.hotels.${hotelIndex}.rooms.${i}.maxAdults`, Number(e.target.value || 0))} />
            <Input type="number" placeholder="Max Children" defaultValue={(f as any).maxChildren} onChange={(e) => setValue(`hotels.${cityIndex}.hotels.${hotelIndex}.rooms.${i}.maxChildren`, Number(e.target.value || 0))} />
            <Input type="number" placeholder="Room Size (sqm)" defaultValue={(f as any).sizeSqm} onChange={(e) => setValue(`hotels.${cityIndex}.hotels.${hotelIndex}.rooms.${i}.sizeSqm`, Number(e.target.value || 0))} />
            <Input type="number" placeholder="Price/Night" defaultValue={(f as any).pricePerNight} onChange={(e) => setValue(`hotels.${cityIndex}.hotels.${hotelIndex}.rooms.${i}.pricePerNight`, Number(e.target.value || 0))} />
            <div className="md:col-span-6">
              <div className="text-xs text-gray-500 mb-1">Room Amenities</div>
              <div className="flex flex-wrap gap-2">
                {ROOM_AMENITIES.map(a => {
                  const selected = (((f as any).amenities || []) as string[]).includes(a);
                  return (
                    <Button key={a} type="button" variant={selected ? "default" : "outline"} onClick={() => {
                      const set = new Set<string>(((f as any).amenities || []));
                      if (set.has(a)) set.delete(a); else set.add(a);
                      setValue(`hotels.${cityIndex}.hotels.${hotelIndex}.rooms.${i}.amenities`, Array.from(set) as any);
                    }} className="h-8 px-3 text-xs">
                      {a}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-6 grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Extra Bed</span>
                <Switch onCheckedChange={(v) => setValue(`hotels.${cityIndex}.hotels.${hotelIndex}.rooms.${i}.extraBedAvailable`, Boolean(v))} />
                <Input type="number" placeholder="Extra Bed Price" onChange={(e) => setValue(`hotels.${cityIndex}.hotels.${hotelIndex}.rooms.${i}.extraBedPrice`, Number(e.target.value || 0))} />
              </div>
              <Select onValueChange={(v) => setValue(`hotels.${cityIndex}.hotels.${hotelIndex}.rooms.${i}.view`, v as any)}>
                <SelectTrigger><SelectValue placeholder="Room View" /></SelectTrigger>
                <SelectContent>
                  {["City","Sea","Garden","Mountain","Pool"].map(x => <SelectItem key={x} value={x}>{x} View</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-6 flex items-center justify-end">
              <Button type="button" variant="destructive" onClick={() => remove(i)}>Remove Room</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced Itinerary Tab additions
const EnhancedItineraryTab: React.FC = () => {
  const { watch, setValue } = useFormContext<MultiCityHotelFormData>();
  const daysExtra = watch("daysExtra");
  const dayKeys = Object.keys(daysExtra).map(n => Number(n)).sort((a,b) => a-b);
  const addDayMeta = () => {
    const last: number = dayKeys.length > 0 ? (dayKeys[dayKeys.length - 1] as number) : 0;
    const idx = last + 1;
    const next = { ...daysExtra, [idx]: {} };
    setValue("daysExtra", next);
  };
  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" onClick={addDayMeta}><FaPlus className="mr-2" /> Add Day Meta</Button>
      {dayKeys.map((i) => (
        <Card key={i} className="package-selector-glass package-shadow-fix">
          <CardHeader><CardTitle>Day {i}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <Input placeholder="Accommodation for the night" defaultValue={daysExtra[i]?.accommodationHotelName} onChange={(e) => setValue(`daysExtra.${i}.accommodationHotelName` as any, e.target.value)} />
            <Input type="time" placeholder="Check-in" defaultValue={daysExtra[i]?.checkIn} onChange={(e) => setValue(`daysExtra.${i}.checkIn` as any, e.target.value)} />
            <Input type="time" placeholder="Check-out" defaultValue={daysExtra[i]?.checkOut} onChange={(e) => setValue(`daysExtra.${i}.checkOut` as any, e.target.value)} />
            <Input placeholder="Meal plan for the day" defaultValue={daysExtra[i]?.mealPlanForDay} onChange={(e) => setValue(`daysExtra.${i}.mealPlanForDay` as any, e.target.value)} />
            <div className="lg:col-span-4">
              <Textarea placeholder="Hotel facilities usage time / notes" defaultValue={daysExtra[i]?.facilitiesUsage} onChange={(e) => setValue(`daysExtra.${i}.facilitiesUsage` as any, e.target.value)} />
            </div>
          </CardContent>
        </Card>
      ))}
      {dayKeys.length === 0 && <p className="text-sm text-gray-500">No day metadata; add to specify accommodation and timings.</p>}
    </div>
  );
};

// Enhanced Pricing Tab
const EnhancedPricingTab: React.FC = () => {
  const { watch, setValue } = useFormContext<MultiCityHotelFormData>();
  const p = watch("pricingExtra");
  const [child, setChild] = useState({ label: "Child 6-11", rule: "No bed", price: 0 });
  return (
    <div className="space-y-6">
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>Base & Hotel Costs</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="text-sm font-medium">Base Package Price</div>
            <Input type="number" defaultValue={p.basePrice} onChange={(e) => setValue("pricingExtra.basePrice", Number(e.target.value || 0))} />
          </div>
          <div>
            <div className="text-sm font-medium">Meal Plan Costs</div>
            <Input type="number" defaultValue={p.mealPlanCosts} onChange={(e) => setValue("pricingExtra.mealPlanCosts", Number(e.target.value || 0))} />
          </div>
          <div>
            <div className="text-sm font-medium">Room Upgrade Costs</div>
            <Input type="number" defaultValue={p.roomUpgradeCosts} onChange={(e) => setValue("pricingExtra.roomUpgradeCosts", Number(e.target.value || 0))} />
          </div>
          <div>
            <div className="text-sm font-medium">Single Supplement</div>
            <Input type="number" defaultValue={p.singleSupplement} onChange={(e) => setValue("pricingExtra.singleSupplement", Number(e.target.value || 0))} />
          </div>
        </CardContent>
      </Card>

      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>Hotel Costs by City</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Button type="button" variant="outline" onClick={() => setValue("pricingExtra.hotelCostsByCity", [...(p.hotelCostsByCity || []), { cityId: generateId(), total: 0 }])}><FaPlus className="mr-2" /> Add City Cost</Button>
          <div className="space-y-2">
              {(p.hotelCostsByCity || []).map((row, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800 rounded p-2">
                <Input placeholder="City Id or Name" defaultValue={row.cityId} onChange={(e) => { const n = [...(p.hotelCostsByCity || [])]; (n[i] as any).cityId = e.target.value; setValue("pricingExtra.hotelCostsByCity" as any, n as any); }} />
                <Input type="number" placeholder="Total" defaultValue={row.total} onChange={(e) => { const n = [...(p.hotelCostsByCity || [])]; (n[i] as any).total = Number(e.target.value || 0); setValue("pricingExtra.hotelCostsByCity" as any, n as any); }} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>Child Pricing</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input placeholder="Label (e.g., 6-11)" value={child.label} onChange={(e) => setChild(s => ({ ...s, label: e.target.value }))} />
            <Input placeholder="Rule (e.g., No bed)" value={child.rule} onChange={(e) => setChild(s => ({ ...s, rule: e.target.value }))} />
            <Input type="number" placeholder="Price" value={child.price} onChange={(e) => setChild(s => ({ ...s, price: Number(e.target.value || 0) }))} />
          </div>
          <Button type="button" onClick={() => setValue("pricingExtra.childPricing", [ ...(p.childPricing || []), { ...child } ])}><FaPlus className="mr-2" /> Add Child Rule</Button>
          <div className="space-y-1 text-sm">
            {(p.childPricing || []).map((c, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded px-3 py-2">
                <div>{c.label} • {c.rule} • ${Number(c.price).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader><CardTitle>Total Package Price</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input type="number" placeholder="Calculated Total" defaultValue={p.totalPrice} onChange={(e) => setValue("pricingExtra.totalPrice", Number(e.target.value || 0))} />
        </CardContent>
      </Card>
    </div>
  );
};

// Auto-save + validation (lightweight)
type FormIssue = { tab: string; field: string; message: string; severity?: "error" | "warning" };
const useFormValidation = (data: MultiCityHotelFormData) => {
  return useMemo(() => {
    const errors: FormIssue[] = [];
    if (!data.basic.title.trim()) errors.push({ tab: "basic", field: "title", message: "Title is required", severity: "error" });
    if (!data.basic.shortDescription.trim()) errors.push({ tab: "basic", field: "shortDescription", message: "Short description is required", severity: "error" });
    if (data.cities.length === 0) errors.push({ tab: "destinations", field: "cities", message: "Add at least one city", severity: "error" });
    return { isValid: errors.length === 0, errors };
  }, [data]);
};

type AutoSaveState = { isSaving: boolean; lastSaved: Date | null; hasUnsavedChanges: boolean; error: string | null };
const useAutoSave = (data: MultiCityHotelFormData, onSave?: (d: MultiCityHotelFormData) => Promise<void> | void, interval = 30000) => {
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

// Main Form
export default function MultiCityHotelPackageForm({ className }: { className?: string }) {
  const form = useForm<MultiCityHotelFormData>({ defaultValues: DEFAULT_DATA });
  const { handleSubmit, watch } = form;
  const data = watch();
  const [activeTab, setActiveTab] = useState("basic");
  const validation = useFormValidation(data);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const onSave = async (d: MultiCityHotelFormData) => {
    setSaving(true);
    try {
      setLastSaved(new Date());
    } finally {
      setSaving(false);
    }
  };

  const autoSave = useAutoSave(data, onSave);

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSave)} className={cn("w-full package-text-fix", className)}>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Create Multi-City with Hotel</h1>
              <p className="text-gray-600">Full multi-city itinerary builder with hotel selection and pricing.</p>
            </div>
            <div className="flex items-center gap-4">
              <AnimatePresence>
                {(saving || autoSave.isSaving) && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-sm text-blue-600">
                    <FaSpinner className="h-4 w-4 animate-spin" /> Saving...
                  </motion.div>
                )}
                {(lastSaved || autoSave.lastSaved) && !(saving || autoSave.isSaving) && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-sm text-green-600">
                    <FaCheckCircle className="h-4 w-4" /> All changes saved
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => console.log("Preview", data)} className="package-button-fix">Preview</Button>
                <Button type="submit" className="package-button-fix">Save</Button>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6">
            <TabsList className="w-full gap-2">
              <TabsTrigger value="basic" icon={<FaInfoCircle className="h-4 w-4" />}>Basic Info</TabsTrigger>
              <TabsTrigger value="destinations" icon={<FaMapMarkerAlt className="h-4 w-4" />}>Destinations</TabsTrigger>
              <TabsTrigger value="accommodation" icon={<FaBed className="h-4 w-4" />}>Accommodation</TabsTrigger>
              <TabsTrigger value="itinerary" icon={<FaConciergeBell className="h-4 w-4" />}>Itinerary</TabsTrigger>
              <TabsTrigger value="pricing" icon={<FaDollarSign className="h-4 w-4" />}>Pricing</TabsTrigger>
              <TabsTrigger value="review" icon={<FaEye className="h-4 w-4" />}>Review</TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-[600px]">
            <TabsContent value="basic"><BasicInformationTab /></TabsContent>
            <TabsContent value="destinations"><DestinationsTab /></TabsContent>
            <TabsContent value="accommodation"><AccommodationTab /></TabsContent>
            <TabsContent value="itinerary"><EnhancedItineraryTab /></TabsContent>
            <TabsContent value="pricing"><EnhancedPricingTab /></TabsContent>
            <TabsContent value="review">
              <Card className="package-selector-glass package-shadow-fix">
                <CardHeader><CardTitle>Review & Publish</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div><span className="font-medium">Title:</span> {data.basic.title || "—"}</div>
                  <div><span className="font-medium">Cities:</span> {data.cities.length}</div>
                  <div><span className="font-medium">Hotel Sets:</span> {data.hotels.length}</div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </form>
    </FormProvider>
  );
}


