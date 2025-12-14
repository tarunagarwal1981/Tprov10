'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiPlus, FiHome, FiMapPin, FiCalendar, FiDollarSign, FiSave } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import { ActivitySelectorModal } from '@/components/itinerary/ActivitySelectorModal';
import { TransferSelectorModal } from '@/components/itinerary/TransferSelectorModal';

interface TimeSlotItems {
  activities: Array<{
    id: string;
    package_id: string;
    title: string;
    price: number;
  }>;
  transfers: Array<{
    id: string;
    package_id: string;
    title: string;
    price: number;
  }>;
}

interface PackageDay {
  id: string;
  day_number: number;
  city_id: string;
  city_name: string;
  nights: number;
  hotels?: Array<{
    id: string;
    hotel_name: string;
    hotel_type: string;
    room_type: string;
    price?: number;
    adult_price?: number;
    child_price?: number;
  }>;
  selected_hotel_id?: string | null;
  timeSlots: {
    morning: TimeSlotItems;
    afternoon: TimeSlotItems;
    evening: TimeSlotItems;
  };
  // Legacy support - computed from timeSlots
  activities: Array<{
    id: string;
    package_id: string;
    title: string;
    price: number;
  }>;
  transfers: Array<{
    id: string;
    package_id: string;
    title: string;
    price: number;
  }>;
}

interface PricingBreakdown {
  basePrice: number;
  hotelPrice: number;
  activitiesPrice: number;
  transfersPrice: number;
  total: number;
}

// Helper function to create a day with default timeSlots
function createDayWithTimeSlots(dayData: Partial<PackageDay>): PackageDay {
  return {
    id: dayData.id || '',
    day_number: dayData.day_number || 0,
    city_id: dayData.city_id || '',
    city_name: dayData.city_name || '',
    nights: dayData.nights || 0,
    hotels: dayData.hotels || [],
    selected_hotel_id: dayData.selected_hotel_id || null,
    timeSlots: dayData.timeSlots || {
      morning: { activities: [], transfers: [] },
      afternoon: { activities: [], transfers: [] },
      evening: { activities: [], transfers: [] },
    },
    activities: dayData.activities || [],
    transfers: dayData.transfers || [],
  };
}

export default function PackageConfigurationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const itineraryId = params.itineraryId as string;
  const itemId = params.itemId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itineraryItem, setItineraryItem] = useState<any>(null);
  const [packageData, setPackageData] = useState<any>(null);
  const [days, setDays] = useState<PackageDay[]>([]);
  const [itineraryInfo, setItineraryInfo] = useState<any>(null);
  const [initialConfig, setInitialConfig] = useState<any>({
    pricingType: 'SIC',
    selectedPricingRowId: null,
    selectedVehicle: null,
    quantity: 1,
  });
  const [pricing, setPricing] = useState<PricingBreakdown>({
    basePrice: 0,
    hotelPrice: 0,
    activitiesPrice: 0,
    transfersPrice: 0,
    total: 0,
  });
  const [selectedDayForActivity, setSelectedDayForActivity] = useState<PackageDay | null>(null);
  const [selectedTimeSlotForActivity, setSelectedTimeSlotForActivity] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');
  const [selectedDayForTransfer, setSelectedDayForTransfer] = useState<PackageDay | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Fetch itinerary item and package data
  useEffect(() => {
    const fetchData = async () => {
      if (!itemId || !itineraryId || itemId === 'null' || itemId === 'undefined') {
        console.error('Invalid itemId or itineraryId:', { itemId, itineraryId });
        toast.error('Invalid itinerary item. Please try again.');
        router.push(`/agent/leads`);
        return;
      }

      setLoading(true);
      try {
        // Fetch itinerary info (adults, children, infants) - use API route instead of Supabase
        if (!user?.id) {
          throw new Error('User not authenticated');
        }
        
        const itineraryResponse = await fetch(`/api/itineraries/${itineraryId}?agentId=${user.id}`);
        if (!itineraryResponse.ok) {
          throw new Error('Failed to fetch itinerary');
        }
        const itineraryData = await itineraryResponse.json();
        setItineraryInfo(itineraryData.itinerary);

        // Fetch itinerary item
        const itemResponse = await fetch(`/api/itineraries/${itineraryId}/items/${itemId}`);
        if (!itemResponse.ok) {
          throw new Error('Failed to fetch itinerary item');
        }
        const itemData = await itemResponse.json();
        const item = itemData.item;
        if (!item) throw new Error('Itinerary item not found');
        
        const itemTyped = item as unknown as {
          id: string;
          package_type: string;
          package_id: string;
          configuration: any;
          [key: string]: any;
        };
        
        setItineraryItem(itemTyped);

        // Load initial configuration from item
        const config = itemTyped.configuration || {};
        setInitialConfig({
          pricingType: config.pricingType || 'SIC',
          selectedPricingRowId: config.selectedPricingRowId || null,
          selectedVehicle: config.selectedVehicle || null,
          quantity: config.quantity || 1,
        });

        const packageType = itemTyped.package_type;
        const packageId = itemTyped.package_id;

        // Fetch package data based on type
        if (packageType === 'multi_city_hotel') {
          // Fetch package
          const pkgResponse = await fetch(`/api/packages/${packageId}?type=multi_city_hotel`);
          if (!pkgResponse.ok) {
            throw new Error('Failed to fetch package');
          }
          const pkgData = await pkgResponse.json();
          const pkg = pkgData.package;

          // Fetch pricing packages
          const pricingResponse = await fetch(`/api/packages/${packageId}/pricing?type=multi_city_hotel`);
          if (!pricingResponse.ok) {
            console.warn('Error fetching pricing packages');
          }
          const pricingData = await pricingResponse.json();
          const pricingPkg = pricingData.pricingPackage || null;
          const sicRows = pricingData.sicRows || [];
          const privateRows = pricingData.privateRows || [];

          setPackageData({
            ...(pkg as any),
            pricing_package: pricingPkg,
            sic_pricing_rows: sicRows,
            private_package_rows: privateRows,
          });
          
          // Load saved configuration or set defaults for multi_city_hotel
          const config = itemTyped.configuration || {};
          
          // Set pricing type from saved config or package
          const savedPricingType = config.pricingType || pricingPkg?.pricing_type || 'SIC';
          setInitialConfig((prev: typeof initialConfig) => ({
            ...prev,
            pricingType: savedPricingType,
            selectedPricingRowId: config.selectedPricingRowId || null,
            selectedVehicle: config.selectedVehicle || null,
            quantity: config.quantity || 1,
          }));

          // Fetch day plans from the database (not cities - day plans have all the days)
          const dayPlansResponse = await fetch(`/api/packages/${packageId}/day-plans?type=multi_city_hotel`);
          let dayPlans: any[] = [];
          let dayPlansError = null;

          if (dayPlansResponse.ok) {
            const dayPlansData = await dayPlansResponse.json();
            dayPlans = dayPlansData.dayPlans || [];
          } else {
            dayPlansError = new Error('Failed to fetch day plans');
            console.error('Error fetching day plans:', dayPlansError);
          }

          if (dayPlansError || dayPlans.length === 0) {
            // Fallback: if day plans don't exist, fetch cities and create basic days
            const citiesResponse = await fetch(`/api/packages/${packageId}/cities?type=multi_city_hotel`);
            if (!citiesResponse.ok) {
              throw new Error('Failed to fetch cities');
            }
            const citiesData = await citiesResponse.json();
            const cities = citiesData.cities || [];

          // Fetch hotels for each city
            const cityIds = cities.map((c: any) => c.id);
            const hotelsResponse = await fetch(`/api/packages/${packageId}/hotels?cityIds=${cityIds.join(',')}`);
            if (!hotelsResponse.ok) {
              throw new Error('Failed to fetch hotels');
            }
            const hotelsData = await hotelsResponse.json();
            const hotels = hotelsData.hotels || [];

          // Group hotels by city
          const hotelsByCity: Record<string, any[]> = {};
          (hotels || []).forEach((hotel: any) => {
            if (!hotelsByCity[hotel.city_id]) {
              hotelsByCity[hotel.city_id] = [];
            }
            const cityHotels = hotelsByCity[hotel.city_id];
            if (cityHotels) {
              cityHotels.push(hotel);
            }
          });

            // Calculate cheapest hotel for each city
          const itineraryTyped = itineraryData as unknown as { adults_count?: number; children_count?: number } | null;
          const adults = itineraryTyped?.adults_count || 0;
          const children = itineraryTyped?.children_count || 0;
          
          let dayNumber = 1;
          const packageDays: PackageDay[] = (cities || []).map((city: any) => {
            const cityHotels = hotelsByCity[city.id] || [];
            
            let cheapestHotel: any = null;
            let cheapestPrice = Infinity;
            
            cityHotels.forEach((hotel: any) => {
              const adultPrice = parseFloat(hotel.adult_price || 0);
              const childPrice = parseFloat(hotel.child_price || 0);
              const nights = city.nights || 1;
              const totalPrice = (adultPrice * adults + childPrice * children) * nights;
              
              if (totalPrice < cheapestPrice) {
                cheapestPrice = totalPrice;
                cheapestHotel = hotel;
              }
            });

            return createDayWithTimeSlots({
              id: `day-${dayNumber}`,
              day_number: dayNumber++,
              city_id: city.id,
              city_name: city.name,
              nights: city.nights,
              hotels: cityHotels.map((h: any) => ({
                id: h.id,
                hotel_name: h.hotel_name,
                hotel_type: h.hotel_type || '',
                room_type: h.room_type,
                adult_price: parseFloat(h.adult_price || 0),
                child_price: parseFloat(h.child_price || 0),
              })),
              selected_hotel_id: cheapestHotel ? cheapestHotel.id : (cityHotels[0]?.id || null),
            });
          });

          setDays(packageDays);
          } else {
            // Fetch cities and hotels for mapping hotels to days
            const citiesResponse = await fetch(`/api/packages/${packageId}/cities?type=multi_city_hotel`);
            if (!citiesResponse.ok) {
              throw new Error('Failed to fetch cities');
            }
            const citiesData = await citiesResponse.json();
            const cities = citiesData.cities || [];

            // Fetch hotels for each city
            const cityIds = cities.map((c: any) => c.id);
            const hotelsResponse = await fetch(`/api/packages/${packageId}/hotels?cityIds=${cityIds.join(',')}`);
            if (!hotelsResponse.ok) {
              throw new Error('Failed to fetch hotels');
            }
            const hotelsData = await hotelsResponse.json();
            const hotels = hotelsData.hotels || [];

            // Group hotels by city
            const hotelsByCity: Record<string, any[]> = {};
            (hotels || []).forEach((hotel: any) => {
              if (!hotelsByCity[hotel.city_id]) {
                hotelsByCity[hotel.city_id] = [];
              }
              const cityHotels = hotelsByCity[hotel.city_id];
              if (cityHotels) {
                cityHotels.push(hotel);
              }
            });

            // Calculate cheapest hotel for each city
            const itineraryTyped = itineraryData as unknown as { adults_count?: number; children_count?: number } | null;
            const adults = itineraryTyped?.adults_count || 0;
            const children = itineraryTyped?.children_count || 0;

            // Convert day plans to PackageDay format
            const packageDays: PackageDay[] = (dayPlans || []).map((dayPlan: any) => {
              const cityHotels = hotelsByCity[dayPlan.city_id] || [];
              
              // Calculate cheapest hotel for this city
              let cheapestHotel: any = null;
              let cheapestPrice = Infinity;
              
              cityHotels.forEach((hotel: any) => {
                const adultPrice = parseFloat(hotel.adult_price || 0);
                const childPrice = parseFloat(hotel.child_price || 0);
                const cityData = cities.find((c: any) => c.id === dayPlan.city_id);
                const nights = cityData?.nights || 1;
                const totalPrice = (adultPrice * adults + childPrice * children) * nights;
                
                if (totalPrice < cheapestPrice) {
                  cheapestPrice = totalPrice;
                  cheapestHotel = hotel;
                }
              });

              // Extract activities and transfers from time_slots (operator-defined)
              const timeSlots = dayPlan.time_slots || {
                morning: { time: "", activities: [], transfers: [] },
                afternoon: { time: "", activities: [], transfers: [] },
                evening: { time: "", activities: [], transfers: [] },
              };
              
              // Convert operator-defined activities/transfers (strings) to display format
              const convertOperatorItems = (items: string[]): Array<{ id: string; package_id: string; title: string; price: number }> => {
                return items.map((item, idx) => ({
                  id: `operator-item-${dayPlan.id}-${idx}-${Date.now()}`,
                  package_id: '',
                  title: item,
                  price: 0, // Operator-defined items don't have prices
                }));
              };

              const cityData = cities.find((c: any) => c.id === dayPlan.city_id);
              return createDayWithTimeSlots({
                id: dayPlan.id || `day-${dayPlan.day_number}`,
                day_number: dayPlan.day_number,
                city_id: dayPlan.city_id || '',
                city_name: dayPlan.city_name || '',
                nights: cityData?.nights || 1,
                hotels: cityHotels.map((h: any) => ({
                  id: h.id,
                  hotel_name: h.hotel_name,
                  hotel_type: h.hotel_type || '',
                  room_type: h.room_type,
                  adult_price: parseFloat(h.adult_price || 0),
                  child_price: parseFloat(h.child_price || 0),
                })),
                selected_hotel_id: cheapestHotel ? cheapestHotel.id : (cityHotels[0]?.id || null),
                timeSlots: {
                  morning: {
                    activities: convertOperatorItems(timeSlots.morning?.activities || []),
                    transfers: convertOperatorItems(timeSlots.morning?.transfers || []),
                  },
                  afternoon: {
                    activities: convertOperatorItems(timeSlots.afternoon?.activities || []),
                    transfers: convertOperatorItems(timeSlots.afternoon?.transfers || []),
                  },
                  evening: {
                    activities: convertOperatorItems(timeSlots.evening?.activities || []),
                    transfers: convertOperatorItems(timeSlots.evening?.transfers || []),
                  },
                },
                // Legacy arrays - combine all time slots
                activities: [
                  ...convertOperatorItems(timeSlots.morning?.activities || []),
                  ...convertOperatorItems(timeSlots.afternoon?.activities || []),
                  ...convertOperatorItems(timeSlots.evening?.activities || []),
                ],
                transfers: [
                  ...convertOperatorItems(timeSlots.morning?.transfers || []),
                  ...convertOperatorItems(timeSlots.afternoon?.transfers || []),
                  ...convertOperatorItems(timeSlots.evening?.transfers || []),
                ],
              });
            });

            setDays(packageDays);
            
            // Load activities and transfers from itinerary_items after days are set
            const itemsResponse = await fetch(`/api/itineraries/${itineraryId}/items`);
            if (itemsResponse.ok) {
              const itemsData = await itemsResponse.json();
              const allItems = itemsData.items || [];
              
              // Separate activities and transfers
              const activityItems = allItems.filter((item: any) => item.package_type === 'activity');
              const transferItems = allItems.filter((item: any) => item.package_type === 'transfer');
              
              // Get itinerary days to map items to days
              const daysResponse = await fetch(`/api/itineraries/${itineraryId}/days`);
              if (daysResponse.ok) {
                const daysData = await daysResponse.json();
                const itineraryDays = daysData.days || [];
                
                // Load saved hotel selections
                const config = itemTyped.configuration || {};
                
                // Map items to days based on day_id
                setDays(prevDays =>
                  prevDays.map(day => {
                    // Find matching itinerary day by city_name or day_number
                    const itineraryDay = itineraryDays.find((id: any) => 
                      id.city_name === day.city_name || 
                      id.day_number === day.day_number
                    );
                    
                    // Load saved hotel selection
                    const hotelConfig = config.selectedHotels?.find(
                      (h: any) => h.city_id === day.city_id
                    );
                    
                    if (itineraryDay) {
                      // Group activities and transfers by time slot from itinerary_items (agent-added)
                      const activitiesBySlot: Record<string, any[]> = { morning: [], afternoon: [], evening: [] };
                      const transfersBySlot: Record<string, any[]> = { morning: [], afternoon: [], evening: [] };
                      
                      activityItems
                        .filter((item: any) => item.day_id === itineraryDay.id)
                        .forEach((item: any) => {
                          const timeSlot: 'morning' | 'afternoon' | 'evening' = (item.configuration?.timeSlot || 'afternoon') as 'morning' | 'afternoon' | 'evening';
                          const slot = activitiesBySlot[timeSlot];
                          if (slot) {
                            slot.push({
                              id: item.id,
                              package_id: item.package_id,
                              title: item.package_title,
                              price: item.unit_price || 0,
                            });
                          }
                        });
                      
                      transferItems
                        .filter((item: any) => item.day_id === itineraryDay.id)
                        .forEach((item: any) => {
                          const timeSlot: 'morning' | 'afternoon' | 'evening' = (item.configuration?.timeSlot || 'afternoon') as 'morning' | 'afternoon' | 'evening';
                          const slot = transfersBySlot[timeSlot];
                          if (slot) {
                            slot.push({
                              id: item.id,
                              package_id: item.package_id,
                              title: item.package_title,
                              price: item.unit_price || 0,
                            });
                          }
                        });
                      
                      // Merge operator-defined items (from day.timeSlots) with agent-added items (from itinerary_items)
                      // Operator items are already in day.timeSlots, so we add agent items to them
                      const morningActivities = [...(day.timeSlots?.morning?.activities || []), ...(activitiesBySlot.morning || [])];
                      const morningTransfers = [...(day.timeSlots?.morning?.transfers || []), ...(transfersBySlot.morning || [])];
                      const afternoonActivities = [...(day.timeSlots?.afternoon?.activities || []), ...(activitiesBySlot.afternoon || [])];
                      const afternoonTransfers = [...(day.timeSlots?.afternoon?.transfers || []), ...(transfersBySlot.afternoon || [])];
                      const eveningActivities = [...(day.timeSlots?.evening?.activities || []), ...(activitiesBySlot.evening || [])];
                      const eveningTransfers = [...(day.timeSlots?.evening?.transfers || []), ...(transfersBySlot.evening || [])];
                      
                      return { 
                        ...day, 
                        timeSlots: {
                          morning: { 
                            activities: morningActivities,
                            transfers: morningTransfers,
                          },
                          afternoon: { 
                            activities: afternoonActivities,
                            transfers: afternoonTransfers,
                          },
                          evening: { 
                            activities: eveningActivities,
                            transfers: eveningTransfers,
                          },
                        },
                        activities: [
                          ...(day.activities || []),
                          ...(activitiesBySlot.morning || []),
                          ...(activitiesBySlot.afternoon || []),
                          ...(activitiesBySlot.evening || []),
                        ],
                        transfers: [
                          ...(day.transfers || []),
                          ...(transfersBySlot.morning || []),
                          ...(transfersBySlot.afternoon || []),
                          ...(transfersBySlot.evening || []),
                        ],
                        selected_hotel_id: hotelConfig?.hotel_id || day.selected_hotel_id,
                      };
                    }
                    
                    return {
                      ...day,
                      timeSlots: day.timeSlots || {
                        morning: { activities: [], transfers: [] },
                        afternoon: { activities: [], transfers: [] },
                        evening: { activities: [], transfers: [] },
                      },
                      selected_hotel_id: hotelConfig?.hotel_id || day.selected_hotel_id,
                    };
                  })
                );
              }
            }
          }
        } else if (packageType === 'multi_city') {
          // Fetch package
          const pkgResponse = await fetch(`/api/packages/${packageId}?type=multi_city`);
          if (!pkgResponse.ok) {
            throw new Error('Failed to fetch package');
          }
          const pkgData = await pkgResponse.json();
          const pkg = pkgData.package;

          // Fetch pricing packages for multi_city
          const pricingResponse = await fetch(`/api/packages/${packageId}/pricing?type=multi_city`);
          let pricingPkg = null;
          let sicRows: any[] = [];
          let privateRows: any[] = [];
          
          if (pricingResponse.ok) {
            const pricingData = await pricingResponse.json();
            pricingPkg = pricingData.pricingPackage;
            sicRows = pricingData.sicRows || [];
            privateRows = pricingData.privateRows || [];
            console.log('[Configure] Pricing fetched:', { 
              pricingType: pricingPkg?.pricing_type, 
              sicRowsCount: sicRows.length, 
              privateRowsCount: privateRows.length 
            });
          } else {
            console.warn('[Configure] Failed to fetch pricing:', await pricingResponse.text());
          }

          setPackageData({
            ...(pkg as any),
            pricing_package: pricingPkg,
            sic_pricing_rows: sicRows,
            private_package_rows: privateRows,
          });
          
          // Load saved configuration or set defaults
          const config = itemTyped.configuration || {};
          
          // Set pricing type from saved config or package
          const savedPricingType = config.pricingType || pricingPkg?.pricing_type || 'SIC';
          setInitialConfig((prev: typeof initialConfig) => ({
            ...prev,
            pricingType: savedPricingType,
            selectedPricingRowId: config.selectedPricingRowId || null,
            selectedVehicle: config.selectedVehicle || null,
            quantity: config.quantity || 1,
          }));

          // Auto-select transport option if PRIVATE_PACKAGE and no selection exists
          if (!config.selectedPricingRowId && savedPricingType === 'PRIVATE_PACKAGE' && privateRows.length > 0) {
            const itineraryTyped = itineraryData as unknown as { adults_count?: number; children_count?: number } | null;
            const adults = itineraryTyped?.adults_count || 0;
            const children = itineraryTyped?.children_count || 0;
            const totalTravelers = adults + children;
            
            // Find first vehicle with capacity >= total travelers
            const suitableVehicle = privateRows.find((row: any) => 
              row.vehicle_capacity >= totalTravelers
            );
            
            if (suitableVehicle) {
              setInitialConfig({
                pricingType: 'PRIVATE_PACKAGE',
                selectedPricingRowId: suitableVehicle.id,
                selectedVehicle: suitableVehicle.id,
                quantity: config.quantity || 1,
              });
            }
          }

          // Fetch day plans from the database (not cities - day plans have all the days)
          console.log('[Configure] Fetching day plans for multi_city package:', packageId);
          const dayPlansResponse = await fetch(`/api/packages/${packageId}/day-plans?type=multi_city`);
          let dayPlans: any[] = [];
          let dayPlansError = null;

          if (dayPlansResponse.ok) {
            const dayPlansData = await dayPlansResponse.json();
            dayPlans = dayPlansData.dayPlans || [];
            console.log('[Configure] Day plans fetched successfully:', dayPlans.length, 'plans');
          } else {
            const errorText = await dayPlansResponse.text();
            dayPlansError = new Error(`Failed to fetch day plans: ${errorText}`);
            console.error('[Configure] Error fetching day plans:', dayPlansError);
          }

          console.log('[Configure] Fetched day plans:', { 
            packageId, 
            dayPlansCount: dayPlans?.length || 0, 
            dayPlans, 
            error: dayPlansError 
          });

          if (dayPlansError || dayPlans.length === 0) {
            // Fallback: if day plans don't exist, fetch cities and create basic days
            console.log('[Configure] No day plans found, fetching cities as fallback...');
            const citiesResponse = await fetch(`/api/packages/${packageId}/cities?type=multi_city`);
            if (!citiesResponse.ok) {
              const errorText = await citiesResponse.text();
              console.error('[Configure] Failed to fetch cities:', errorText);
              throw new Error(`Failed to fetch cities: ${errorText}`);
            }
            const citiesData = await citiesResponse.json();
            const cities = citiesData.cities || [];
            console.log('[Configure] Cities fetched:', cities.length, 'cities', cities);

          let dayNumber = 1;
          const packageDays: PackageDay[] = (cities || []).map((city: any) => 
            createDayWithTimeSlots({
              id: `day-${dayNumber}`,
              day_number: dayNumber++,
              city_id: city.id,
              city_name: city.name,
              nights: city.nights,
            })
          );

          setDays(packageDays);
          } else if (dayPlans && dayPlans.length > 0) {
            // Convert day plans to PackageDay format
            console.log('[Configure] Converting day plans to PackageDay format:', dayPlans.length, 'days');
            const packageDays: PackageDay[] = (dayPlans || []).map((dayPlan: any) => {
              // Extract activities and transfers from time_slots (operator-defined)
              const timeSlots = dayPlan.time_slots || {
                morning: { time: "", activities: [], transfers: [] },
                afternoon: { time: "", activities: [], transfers: [] },
                evening: { time: "", activities: [], transfers: [] },
              };
              
              // Convert operator-defined activities/transfers (strings) to display format
              // These are informational items from the package, not actual itinerary items
              const convertOperatorItems = (items: string[]): Array<{ id: string; package_id: string; title: string; price: number }> => {
                return items.map((item, idx) => ({
                  id: `operator-item-${dayPlan.id}-${idx}-${Date.now()}`,
                  package_id: '',
                  title: item,
                  price: 0, // Operator-defined items don't have prices
                }));
              };

              return createDayWithTimeSlots({
                id: dayPlan.id || `day-${dayPlan.day_number}`,
                day_number: dayPlan.day_number,
                city_id: dayPlan.city_id || '',
                city_name: dayPlan.city_name || '',
                nights: 1, // Will be calculated from cities if needed
                timeSlots: {
                  morning: {
                    activities: convertOperatorItems(timeSlots.morning?.activities || []),
                    transfers: convertOperatorItems(timeSlots.morning?.transfers || []),
                  },
                  afternoon: {
                    activities: convertOperatorItems(timeSlots.afternoon?.activities || []),
                    transfers: convertOperatorItems(timeSlots.afternoon?.transfers || []),
                  },
                  evening: {
                    activities: convertOperatorItems(timeSlots.evening?.activities || []),
                    transfers: convertOperatorItems(timeSlots.evening?.transfers || []),
                  },
                },
                // Legacy arrays - combine all time slots
                activities: [
                  ...convertOperatorItems(timeSlots.morning?.activities || []),
                  ...convertOperatorItems(timeSlots.afternoon?.activities || []),
                  ...convertOperatorItems(timeSlots.evening?.activities || []),
                ],
                transfers: [
                  ...convertOperatorItems(timeSlots.morning?.transfers || []),
                  ...convertOperatorItems(timeSlots.afternoon?.transfers || []),
                  ...convertOperatorItems(timeSlots.evening?.transfers || []),
                ],
              });
            });

            console.log('[Configure] Converted package days:', packageDays.length, 'days');
            setDays(packageDays);
            
            // Load activities and transfers from itinerary_items after days are set
            const itemsResponse = await fetch(`/api/itineraries/${itineraryId}/items`);
            if (itemsResponse.ok) {
              const itemsData = await itemsResponse.json();
              const allItems = itemsData.items || [];
              
              // Separate activities and transfers
              const activityItems = allItems.filter((item: any) => item.package_type === 'activity');
              const transferItems = allItems.filter((item: any) => item.package_type === 'transfer');
              
              // Get itinerary days to map items to days
              const daysResponse = await fetch(`/api/itineraries/${itineraryId}/days`);
              if (daysResponse.ok) {
                const daysData = await daysResponse.json();
                const itineraryDays = daysData.days || [];
                
                // Map items to days based on day_id
                setDays(prevDays =>
                  prevDays.map(day => {
                    // Find matching itinerary day by city_name or day_number
                    const itineraryDay = itineraryDays.find((id: any) => 
                      id.city_name === day.city_name || 
                      id.day_number === day.day_number
                    );
                    
                    if (itineraryDay) {
                      // Group activities and transfers by time slot
                      const activitiesBySlot: Record<string, any[]> = { morning: [], afternoon: [], evening: [] };
                      const transfersBySlot: Record<string, any[]> = { morning: [], afternoon: [], evening: [] };
                      
                      activityItems
                        .filter((item: any) => item.day_id === itineraryDay.id)
                        .forEach((item: any) => {
                          const timeSlot: 'morning' | 'afternoon' | 'evening' = (item.configuration?.timeSlot || 'afternoon') as 'morning' | 'afternoon' | 'evening';
                          const slot = activitiesBySlot[timeSlot];
                          if (slot) {
                            slot.push({
                              id: item.id,
                              package_id: item.package_id,
                              title: item.package_title,
                              price: item.unit_price || 0,
                            });
                          }
                        });
                      
                      transferItems
                        .filter((item: any) => item.day_id === itineraryDay.id)
                        .forEach((item: any) => {
                          const timeSlot: 'morning' | 'afternoon' | 'evening' = (item.configuration?.timeSlot || 'afternoon') as 'morning' | 'afternoon' | 'evening';
                          const slot = transfersBySlot[timeSlot];
                          if (slot) {
                            slot.push({
                              id: item.id,
                              package_id: item.package_id,
                              title: item.package_title,
                              price: item.unit_price || 0,
                            });
                          }
                        });
                      
                      // Merge operator-defined items (from day.timeSlots) with agent-added items (from itinerary_items)
                      const morningActivities: Array<{ id: string; package_id: string; title: string; price: number }> = [
                        ...(day.timeSlots?.morning?.activities || []),
                        ...(activitiesBySlot.morning || [])
                      ];
                      const morningTransfers: Array<{ id: string; package_id: string; title: string; price: number }> = [
                        ...(day.timeSlots?.morning?.transfers || []),
                        ...(transfersBySlot.morning || [])
                      ];
                      const afternoonActivities: Array<{ id: string; package_id: string; title: string; price: number }> = [
                        ...(day.timeSlots?.afternoon?.activities || []),
                        ...(activitiesBySlot.afternoon || [])
                      ];
                      const afternoonTransfers: Array<{ id: string; package_id: string; title: string; price: number }> = [
                        ...(day.timeSlots?.afternoon?.transfers || []),
                        ...(transfersBySlot.afternoon || [])
                      ];
                      const eveningActivities: Array<{ id: string; package_id: string; title: string; price: number }> = [
                        ...(day.timeSlots?.evening?.activities || []),
                        ...(activitiesBySlot.evening || [])
                      ];
                      const eveningTransfers: Array<{ id: string; package_id: string; title: string; price: number }> = [
                        ...(day.timeSlots?.evening?.transfers || []),
                        ...(transfersBySlot.evening || [])
                      ];
                      
                      const allActivities = [
                        ...(day.activities || []),
                        ...(activitiesBySlot.morning || []),
                        ...(activitiesBySlot.afternoon || []),
                        ...(activitiesBySlot.evening || []),
                      ];
                      const allTransfers = [
                        ...(day.transfers || []),
                        ...(transfersBySlot.morning || []),
                        ...(transfersBySlot.afternoon || []),
                        ...(transfersBySlot.evening || []),
                      ];
                      
                      return { 
                        ...day, 
                        timeSlots: {
                          morning: { 
                            activities: morningActivities,
                            transfers: morningTransfers,
                          },
                          afternoon: { 
                            activities: afternoonActivities,
                            transfers: afternoonTransfers,
                          },
                          evening: { 
                            activities: eveningActivities,
                            transfers: eveningTransfers,
                          },
                        },
                        activities: allActivities, 
                        transfers: allTransfers,
                      };
                    }
                    
                    return day;
                  })
                );
              }
            }
          } else {
            // No day plans found - show empty state
            console.warn('[Configure] No day plans found for package:', packageId);
            setDays([]);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load package configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemId, itineraryId]);

  // Calculate pricing when days, initial config, itinerary info, or packageData change
  useEffect(() => {
    if (!itineraryItem || !itineraryInfo || !packageData) return;

    const adults = itineraryInfo.adults_count || 0;
    const children = itineraryInfo.children_count || 0;
    const pkgData = packageData as any;
    const pricingType = initialConfig.pricingType || pkgData.pricing_package?.pricing_type || 'SIC';
    
    // Calculate base price from pricing rows
    let basePrice = 0;
    
    if (pricingType === 'SIC') {
      const sicRows = pkgData.sic_pricing_rows || [];
      let selectedRow: any = null;
      
      if (initialConfig.selectedPricingRowId) {
        selectedRow = sicRows.find((row: any) => row.id === initialConfig.selectedPricingRowId);
      }
      
      if (!selectedRow && sicRows.length > 0) {
        // Try to find exact match first
        selectedRow = sicRows.find((row: any) => 
          row.number_of_adults === adults && row.number_of_children === children
        );
        
        // If no exact match, find closest match (at least enough capacity)
        if (!selectedRow) {
          selectedRow = sicRows.find((row: any) => 
            row.number_of_adults >= adults && row.number_of_children >= children
          );
        }
        
        // If still no match, use the last row (usually highest capacity)
        if (!selectedRow) {
          selectedRow = sicRows[sicRows.length - 1];
        }
        
        // Auto-select this row if found
        if (selectedRow && !initialConfig.selectedPricingRowId) {
          setInitialConfig((prev: typeof initialConfig) => ({
            ...prev,
            selectedPricingRowId: selectedRow.id,
          }));
        }
      }
      
      if (selectedRow) {
        basePrice = parseFloat(selectedRow.total_price) || 0;
      }
    } else if (pricingType === 'PRIVATE_PACKAGE') {
      const privateRows = pkgData.private_package_rows || [];
      let selectedRow: any = null;
      
      if (initialConfig.selectedPricingRowId) {
        selectedRow = privateRows.find((row: any) => row.id === initialConfig.selectedPricingRowId);
      }
      
      if (!selectedRow && privateRows.length > 0) {
        const totalTravelers = adults + children;
        
        // Try to find exact match first
        selectedRow = privateRows.find((row: any) => 
          row.number_of_adults === adults && row.number_of_children === children &&
          row.vehicle_capacity >= totalTravelers
        );
        
        // If no exact match, find vehicle with sufficient capacity
        if (!selectedRow) {
          selectedRow = privateRows.find((row: any) => 
            row.vehicle_capacity >= totalTravelers
          );
        }
        
        // If still no match, use the last row
        if (!selectedRow) {
          selectedRow = privateRows[privateRows.length - 1];
        }
        
        // Auto-select this row if found
        if (selectedRow && !initialConfig.selectedPricingRowId) {
          setInitialConfig((prev: typeof initialConfig) => ({
            ...prev,
            selectedPricingRowId: selectedRow.id,
            selectedVehicle: selectedRow.id,
          }));
        }
      }
      
      if (selectedRow) {
        basePrice = parseFloat(selectedRow.total_price) || 0;
      }
    }

    // Apply quantity
    basePrice = basePrice * (initialConfig.quantity || 1);

    let hotelPrice = 0;
    let activitiesPrice = 0;
    let transfersPrice = 0;

    days.forEach(day => {
      // Hotel pricing (if applicable) - calculate from adult_price and child_price
      if (day.selected_hotel_id && day.hotels) {
        const selectedHotel = day.hotels.find(h => h.id === day.selected_hotel_id);
        if (selectedHotel) {
          const adultPrice = (selectedHotel as any).adult_price || 0;
          const childPrice = (selectedHotel as any).child_price || 0;
          const nights = day.nights || 1;
          hotelPrice += (adultPrice * adults + childPrice * children) * nights;
        }
      }

      // Activities pricing
      day.activities.forEach(activity => {
        activitiesPrice += activity.price || 0;
      });

      // Transfers pricing
      day.transfers.forEach(transfer => {
        transfersPrice += transfer.price || 0;
      });
    });

    const total = basePrice + hotelPrice + activitiesPrice + transfersPrice;

    setPricing({
      basePrice,
      hotelPrice,
      activitiesPrice,
      transfersPrice,
      total,
    });
  }, [days, itineraryItem, itineraryInfo, initialConfig, packageData]);

  const handleHotelChange = (day: PackageDay, hotelId: string) => {
    setDays(prevDays =>
      prevDays.map(d =>
        d.id === day.id ? { ...d, selected_hotel_id: hotelId } : d
      )
    );
  };

  const handleAddActivity = (day: PackageDay, timeSlot: 'morning' | 'afternoon' | 'evening' = 'afternoon') => {
    setSelectedDayForActivity(day);
    setSelectedTimeSlotForActivity(timeSlot);
    setShowActivityModal(true);
  };

  const handleActivitySelected = async (activity: any, selectedPricingId?: string) => {
    if (!selectedDayForActivity || !itineraryItem) return;

    try {
      let calculatedPrice = activity.base_price || 0;
      let pricingConfig: any = {};

      // If pricing option is selected, fetch it and calculate price
      if (selectedPricingId) {
        const pricingResponse = await fetch(`/api/activities/${activity.id}/pricing/${selectedPricingId}`);

        if (!pricingResponse.ok) {
          console.error('Error fetching pricing option');
        } else {
          const pricingData = await pricingResponse.json();
          const pricing = pricingData.pricingPackage;
          
          if (pricing) {
          const adults = itineraryInfo?.adults_count || 0;
          const children = itineraryInfo?.children_count || 0;
          
          // Calculate total price
          const adultTotal = (pricing.adult_price || 0) * adults;
          const childTotal = (pricing.child_price || 0) * children;
          const transferAdult = (pricing.transfer_price_adult || 0) * adults;
          const transferChild = (pricing.transfer_price_child || 0) * children;
          
          calculatedPrice = adultTotal + childTotal + transferAdult + transferChild;
          pricingConfig = {
            pricing_package_id: selectedPricingId,
            pricing_package_name: pricing.package_name,
            adult_price: pricing.adult_price,
            child_price: pricing.child_price,
            transfer_included: pricing.transfer_included,
          };
          }
        }
      }

      // Create itinerary item for activity
      const activityItemResponse = await fetch(`/api/itineraries/${itineraryId}/items/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId: null, // Will be assigned when saving
          packageType: 'activity',
          packageId: activity.id,
          operatorId: activity.operator_id || itineraryItem.operator_id,
          packageTitle: activity.title,
          packageImageUrl: activity.featured_image_url,
          configuration: { ...pricingConfig, timeSlot: selectedTimeSlotForActivity },
          unitPrice: calculatedPrice,
          quantity: 1,
          displayOrder: 0,
        }),
      });

      if (!activityItemResponse.ok) {
        const errorData = await activityItemResponse.json();
        throw new Error(errorData.error || 'Failed to create activity item');
      }

      const activityItemData = await activityItemResponse.json();
      if (!activityItemData.item || !activityItemData.item.id) {
        throw new Error('Failed to create activity item');
      }

      const activityItemTyped = { id: activityItemData.item.id };

      setDays(prevDays =>
        prevDays.map(day =>
          day.id === selectedDayForActivity.id
            ? {
                ...day,
                timeSlots: {
                  ...day.timeSlots,
                  [selectedTimeSlotForActivity]: {
                    ...day.timeSlots[selectedTimeSlotForActivity],
                    activities: [
                      ...day.timeSlots[selectedTimeSlotForActivity].activities,
                      {
                        id: activityItemTyped.id,
                        package_id: activity.id,
                        title: activity.title,
                        price: calculatedPrice,
                      },
                    ],
                  },
                },
                // Update legacy activities array for backward compatibility
                activities: [
                  ...day.activities,
                  {
                    id: activityItemTyped.id,
                    package_id: activity.id,
                    title: activity.title,
                    price: calculatedPrice,
                  },
                ],
              }
            : day
        )
      );

      setShowActivityModal(false);
      setSelectedDayForActivity(null);
      toast.success('Activity added');
    } catch (err) {
      console.error('Error adding activity:', err);
      toast.error('Failed to add activity');
    }
  };

  const handleAddTransfer = (day: PackageDay, timeSlot: 'morning' | 'afternoon' | 'evening' = 'afternoon') => {
    setSelectedDayForTransfer(day);
    setSelectedTimeSlotForActivity(timeSlot);
    setShowTransferModal(true);
  };


  const handleTransferSelected = async (transfer: any) => {
    if (!selectedDayForTransfer || !itineraryItem) return;

    try {
      // Create itinerary item for transfer
      const transferItemResponse = await fetch(`/api/itineraries/${itineraryId}/items/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId: null, // Will be assigned when saving
          packageType: 'transfer',
          packageId: transfer.id,
          operatorId: transfer.operator_id || itineraryItem.operator_id,
          packageTitle: transfer.title,
          packageImageUrl: transfer.featured_image_url,
          configuration: { timeSlot: selectedTimeSlotForActivity },
          unitPrice: transfer.base_price || 0,
          quantity: 1,
          displayOrder: 0,
        }),
      });

      if (!transferItemResponse.ok) {
        const errorData = await transferItemResponse.json();
        throw new Error(errorData.error || 'Failed to create transfer item');
      }

      const transferItemData = await transferItemResponse.json();
      if (!transferItemData.item || !transferItemData.item.id) {
        throw new Error('Failed to create transfer item');
      }

      const transferItemTyped = { id: transferItemData.item.id };

      setDays(prevDays =>
        prevDays.map(day =>
          day.id === selectedDayForTransfer.id
            ? {
                ...day,
                timeSlots: {
                  ...day.timeSlots,
                  [selectedTimeSlotForActivity]: {
                    ...day.timeSlots[selectedTimeSlotForActivity],
                    transfers: [
                      ...day.timeSlots[selectedTimeSlotForActivity].transfers,
                      {
                        id: transferItemTyped.id,
                        package_id: transfer.id,
                        title: transfer.title,
                        price: transfer.base_price || 0,
                      },
                    ],
                  },
                },
                transfers: [
                  ...day.transfers,
                  {
                    id: transferItemTyped.id,
                    package_id: transfer.id,
                    title: transfer.title,
                    price: transfer.base_price || 0,
                  },
                ],
              }
            : day
        )
      );

      setShowTransferModal(false);
      setSelectedDayForTransfer(null);
      toast.success('Transfer added');
    } catch (err) {
      console.error('Error adding transfer:', err);
      toast.error('Failed to add transfer');
    }
  };

  const handleRemoveActivity = async (day: PackageDay, activityId: string) => {
    try {
      // Check if this is an operator-defined item (starts with 'operator-item-')
      // Operator-defined items are just informational and don't need to be deleted from database
      if (activityId.startsWith('operator-item-')) {
        setDays(prevDays =>
          prevDays.map(d =>
            d.id === day.id
              ? {
                  ...d,
                  timeSlots: {
                    morning: { ...d.timeSlots.morning, activities: d.timeSlots.morning.activities.filter(a => a.id !== activityId) },
                    afternoon: { ...d.timeSlots.afternoon, activities: d.timeSlots.afternoon.activities.filter(a => a.id !== activityId) },
                    evening: { ...d.timeSlots.evening, activities: d.timeSlots.evening.activities.filter(a => a.id !== activityId) },
                  },
                  activities: d.activities.filter(a => a.id !== activityId),
                }
              : d
          )
        );
        toast.success('Activity removed');
        return;
      }

      // Delete itinerary item from database
      const deleteResponse = await fetch(`/api/itineraries/${itineraryId}/items/${activityId}/delete`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.error || 'Failed to delete activity item');
      }

      setDays(prevDays =>
        prevDays.map(d =>
          d.id === day.id
            ? {
                ...d,
                timeSlots: {
                  morning: { ...d.timeSlots.morning, activities: d.timeSlots.morning.activities.filter(a => a.id !== activityId) },
                  afternoon: { ...d.timeSlots.afternoon, activities: d.timeSlots.afternoon.activities.filter(a => a.id !== activityId) },
                  evening: { ...d.timeSlots.evening, activities: d.timeSlots.evening.activities.filter(a => a.id !== activityId) },
                },
                activities: d.activities.filter(a => a.id !== activityId),
              }
            : d
        )
      );
      toast.success('Activity removed');
    } catch (err) {
      console.error('Error removing activity:', err);
      toast.error('Failed to remove activity');
    }
  };

  const handleRemoveTransfer = async (day: PackageDay, transferId: string) => {
    try {
      // Check if this is an operator-defined item (starts with 'operator-item-')
      // Operator-defined items are just informational and don't need to be deleted from database
      if (transferId.startsWith('operator-item-')) {
        setDays(prevDays =>
          prevDays.map(d =>
            d.id === day.id
              ? {
                  ...d,
                  timeSlots: {
                    morning: { ...d.timeSlots.morning, transfers: d.timeSlots.morning.transfers.filter(t => t.id !== transferId) },
                    afternoon: { ...d.timeSlots.afternoon, transfers: d.timeSlots.afternoon.transfers.filter(t => t.id !== transferId) },
                    evening: { ...d.timeSlots.evening, transfers: d.timeSlots.evening.transfers.filter(t => t.id !== transferId) },
                  },
                  transfers: d.transfers.filter(t => t.id !== transferId),
                }
              : d
          )
        );
        toast.success('Transfer removed');
        return;
      }

      // Delete itinerary item from database
      const deleteResponse = await fetch(`/api/itineraries/${itineraryId}/items/${transferId}/delete`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.error || 'Failed to delete transfer item');
      }

      setDays(prevDays =>
        prevDays.map(d =>
          d.id === day.id
            ? {
                ...d,
                timeSlots: {
                  morning: { ...d.timeSlots.morning, transfers: d.timeSlots.morning.transfers.filter(t => t.id !== transferId) },
                  afternoon: { ...d.timeSlots.afternoon, transfers: d.timeSlots.afternoon.transfers.filter(t => t.id !== transferId) },
                  evening: { ...d.timeSlots.evening, transfers: d.timeSlots.evening.transfers.filter(t => t.id !== transferId) },
                },
                transfers: d.transfers.filter(t => t.id !== transferId),
              }
            : d
        )
      );
      toast.success('Transfer removed');
    } catch (err) {
      console.error('Error removing transfer:', err);
      toast.error('Failed to remove transfer');
    }
  };

  const handleSave = async () => {
    if (!itineraryItem || !user) return;

    setSaving(true);
    try {
      // Build configuration object with all customizations
      const selectedHotels = days
        .filter(d => d.selected_hotel_id)
        .map(d => ({
          city_id: d.city_id,
          city_name: d.city_name,
          hotel_id: d.selected_hotel_id,
          nights: d.nights,
        }));

      const activities = days.flatMap(d =>
        d.activities.map(a => ({
          city_id: d.city_id,
          city_name: d.city_name,
          activity_item_id: a.id, // itinerary_item id
          activity_package_id: a.package_id,
          activity_title: a.title,
          price: a.price,
        }))
      );

      const transfers = days.flatMap(d =>
        d.transfers.map(t => ({
          city_id: d.city_id,
          city_name: d.city_name,
          transfer_item_id: t.id, // itinerary_item id
          transfer_package_id: t.package_id,
          transfer_title: t.title,
          price: t.price,
        }))
      );

      // Build configuration with initial config and all customizations
      const configuration = {
        pricingType: initialConfig.pricingType,
        selectedPricingRowId: initialConfig.selectedPricingRowId,
        selectedVehicle: initialConfig.selectedVehicle,
        quantity: initialConfig.quantity,
        selectedHotels,
        activities,
        transfers,
        lastUpdated: new Date().toISOString(),
      };

      // Update itinerary item with all customizations
      const updateItemResponse = await fetch(`/api/itineraries/${itineraryId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configuration,
          unitPrice: pricing.total,
          quantity: 1,
        }),
      });

      if (!updateItemResponse.ok) {
        const errorData = await updateItemResponse.json();
        throw new Error(errorData.error || 'Failed to update itinerary item');
      }

      // Create/update itinerary days
      // Check if days already exist for this itinerary
      const existingDaysResponse = await fetch(`/api/itineraries/${itineraryId}/days`);
      if (!existingDaysResponse.ok) {
        throw new Error('Failed to fetch existing days');
      }
      const existingDaysData = await existingDaysResponse.json();
      const existingDays = existingDaysData.days || [];

      const existingDayNumbers = (existingDays || []).map((d: any) => d.day_number);
      let currentDayNumber = existingDayNumbers.length > 0 
        ? Math.max(...existingDayNumbers) + 1 
        : 1;

      // Create itinerary days for each package day
      const dayIds: string[] = [];
      const existingDaysTyped = (existingDays || []) as unknown as Array<{ id: string; day_number: number }>;
      
      try {
      for (const day of days) {
        // Check if day already exists
        const existingDay = existingDaysTyped.find((d) => d.day_number === currentDayNumber);
        
        if (existingDay) {
          // Update existing day - try with time_slots first, fallback without if column doesn't exist
          const updateData: any = {
            city_name: day.city_name,
            time_slots: {
              morning: { time: '', activities: day.activities.filter(a => a.id).map(a => a.id), transfers: [] },
              afternoon: { time: '', activities: [], transfers: day.transfers.filter(t => t.id).map(t => t.id) },
              evening: { time: '', activities: [], transfers: [] },
            },
          };

            let updateDayError = null;
            try {
              const updateResponse = await fetch(`/api/itineraries/${itineraryId}/days/${existingDay.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  cityName: updateData.city_name,
                  timeSlots: updateData.time_slots,
                }),
              });

              if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                updateDayError = new Error(errorData.error || 'Failed to update day');
              }
            } catch (err) {
              updateDayError = err instanceof Error ? err : new Error('Failed to update day');
            }

          // If error is about time_slots column not existing, retry without it
            if (updateDayError && (updateDayError.message?.includes('time_slots') || (updateDayError as any).code === '42703')) {
            console.warn('time_slots column not found, updating without it');
              let retryError = null;
              try {
                const retryResponse = await fetch(`/api/itineraries/${itineraryId}/days/${existingDay.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    cityName: updateData.city_name,
                  }),
                });

                if (!retryResponse.ok) {
                  const errorData = await retryResponse.json();
                  retryError = new Error(errorData.error || 'Failed to update day');
                }
              } catch (err) {
                retryError = err instanceof Error ? err : new Error('Failed to update day');
              }

              if (retryError) {
                throw retryError;
          }
            } else if (updateDayError) {
              throw updateDayError;
            }
          dayIds.push(existingDay.id);
        } else {
          // Create new day - try with time_slots first, fallback without if column doesn't exist
            let createDayError = null;
            try {
              const createResponse = await fetch(`/api/itineraries/${itineraryId}/days/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  cityName: day.city_name,
                  dayNumber: currentDayNumber,
                  timeSlots: {
              morning: { time: '', activities: day.activities.filter(a => a.id).map(a => a.id), transfers: [] },
              afternoon: { time: '', activities: [], transfers: day.transfers.filter(t => t.id).map(t => t.id) },
              evening: { time: '', activities: [], transfers: [] },
            },
                }),
              });

              if (!createResponse.ok) {
                const errorData = await createResponse.json();
                createDayError = new Error(errorData.error || 'Failed to create day');
              } else {
                const { day: createdDay } = await createResponse.json();
                dayIds.push(createdDay.id);
              }
            } catch (err) {
              createDayError = err instanceof Error ? err : new Error('Failed to create day');
            }

          // If error is about time_slots column not existing, retry without it
            if (createDayError && (createDayError.message?.includes('time_slots') || (createDayError as any).code === '42703')) {
              console.warn('time_slots column not found, creating without it');
              try {
                const retryResponse = await fetch(`/api/itineraries/${itineraryId}/days/create`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    cityName: day.city_name,
                    dayNumber: currentDayNumber,
                  }),
                });

                if (!retryResponse.ok) {
                  const errorData = await retryResponse.json();
                  throw new Error(errorData.error || 'Failed to create day');
                } else {
                  const { day: createdDay } = await retryResponse.json();
                  dayIds.push(createdDay.id);
                }
              } catch (err) {
                throw err instanceof Error ? err : new Error('Failed to create day');
          }
            } else if (createDayError) {
              throw createDayError;
          }
        }

        currentDayNumber++;
        }
      } catch (err) {
        console.error('Error saving days:', err);
        toast.error('Failed to save days');
        throw err;
      }

      // Update itinerary item with first day_id (for reference)
      if (dayIds.length > 0) {
        await fetch(`/api/itineraries/${itineraryId}/items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dayId: dayIds[0],
          }),
        });
      }

      // Link activities and transfers to their respective days
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const dayId = dayIds[i];
        
        if (!dayId || !day) continue;

        // Update activity items with day_id
        for (const activity of day.activities) {
          await fetch(`/api/itineraries/${itineraryId}/items/${activity.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dayId: dayId,
            }),
          });
        }

        // Update transfer items with day_id
        for (const transfer of day.transfers) {
          await fetch(`/api/itineraries/${itineraryId}/items/${transfer.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dayId: dayId,
            }),
          });
        }
      }

      // Calculate total itinerary price (sum of all items)
      // We'll use the pricing.total we already calculated
      const totalItineraryPrice = pricing.total;

      // Update itinerary with total price and timestamp
      const itineraryUpdateResponse = await fetch(`/api/itineraries/${itineraryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalPrice: totalItineraryPrice,
        }),
      });

      if (!itineraryUpdateResponse.ok) {
        const errorData = await itineraryUpdateResponse.json();
        console.error('Error updating itinerary:', errorData.error);
        // Don't throw, just log - the item is already saved
      }

      toast.success('Package configuration saved successfully');
      // Redirect to lead page
      if (itineraryInfo?.lead_id) {
        router.push(`/agent/leads/${itineraryInfo.lead_id}`);
      } else {
        router.push('/agent/leads');
      }
    } catch (err) {
      console.error('Error saving configuration:', err);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading package configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              if (itineraryInfo?.lead_id) {
                router.push(`/agent/leads/${itineraryInfo.lead_id}`);
              } else {
                router.push('/agent/leads');
              }
            }}
            className="mb-4"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Lead
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {itineraryItem?.package_title || 'Configure Package'}
              </h1>
              <p className="text-gray-600 mt-2">Configure pricing, hotels, activities, and transfers</p>
            </div>
            {/* Total Cost Display */}
            <div className="bg-white rounded-lg shadow-md p-4 border-2 border-green-500 min-w-[200px]">
              <div className="text-sm text-gray-600 mb-1">Total Package Cost</div>
              <div className="text-3xl font-bold text-green-600">
                ${pricing.total.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {itineraryInfo?.adults_count || 0} Adults, {itineraryInfo?.children_count || 0} Children
              </div>
            </div>
          </div>
        </div>

        {/* Initial Configuration Section - Always Visible */}
        {packageData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Package Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pricing Type Selection */}
              {((packageData as any).pricing_package || (packageData as any).sic_pricing_rows?.length > 0 || (packageData as any).private_package_rows?.length > 0) && (
                <div>
                  <Label className="text-base font-semibold mb-3 block">Pricing Type</Label>
                  <RadioGroup
                    value={initialConfig.pricingType || 'SIC'}
                    onValueChange={(value) => {
                      setInitialConfig({
                        ...initialConfig,
                        pricingType: value as 'SIC' | 'PRIVATE_PACKAGE',
                        selectedPricingRowId: null, // Reset selection when type changes
                      });
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SIC" id="sic" />
                      <Label htmlFor="sic" className="cursor-pointer">
                        SIC (Seat-In-Coach) - Shared transportation
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PRIVATE_PACKAGE" id="private" />
                      <Label htmlFor="private" className="cursor-pointer">
                        Private Package - Private vehicle transportation
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* SIC Pricing Rows */}
              {initialConfig.pricingType === 'SIC' && (packageData as any).sic_pricing_rows && (packageData as any).sic_pricing_rows.length > 0 && (
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Select Pricing (Based on {itineraryInfo?.adults_count || 0} Adults, {itineraryInfo?.children_count || 0} Children)
                  </Label>
                  <div className="space-y-2">
                    {((packageData as any).sic_pricing_rows || []).map((row: any) => {
                      const isSelected = initialConfig.selectedPricingRowId === row.id;
                      const isMatching = row.number_of_adults === (itineraryInfo?.adults_count || 0) && 
                                        row.number_of_children === (itineraryInfo?.children_count || 0);
                      return (
                        <div
                          key={row.id}
                          onClick={() => setInitialConfig({ ...initialConfig, selectedPricingRowId: row.id })}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                          } ${isMatching ? 'ring-2 ring-green-500' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {row.number_of_adults} Adult{row.number_of_adults !== 1 ? 's' : ''}
                                {row.number_of_children > 0 && `, ${row.number_of_children} Child${row.number_of_children !== 1 ? 'ren' : ''}`}
                              </div>
                              {isMatching && (
                                <Badge className="mt-1 bg-green-100 text-green-700">Matches your group</Badge>
                              )}
                            </div>
                            <div className="text-lg font-semibold text-green-600">
                              ${row.total_price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PRIVATE_PACKAGE Pricing Rows */}
              {initialConfig.pricingType === 'PRIVATE_PACKAGE' && (packageData as any).private_package_rows && (packageData as any).private_package_rows.length > 0 && (
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Select Vehicle & Pricing (Based on {itineraryInfo?.adults_count || 0} Adults, {itineraryInfo?.children_count || 0} Children)
                  </Label>
                  <div className="space-y-2">
                    {((packageData as any).private_package_rows || []).map((row: any) => {
                      const isSelected = initialConfig.selectedPricingRowId === row.id;
                      const isMatching = row.number_of_adults === (itineraryInfo?.adults_count || 0) && 
                                        row.number_of_children === (itineraryInfo?.children_count || 0);
                      
                      // Calculate total travelers
                      const totalTravelers = (itineraryInfo?.adults_count || 0) + (itineraryInfo?.children_count || 0);
                      const hasInsufficientCapacity = row.vehicle_capacity < totalTravelers;
                      
                      return (
                        <div
                          key={row.id}
                          onClick={() => {
                            if (!hasInsufficientCapacity) {
                              setInitialConfig({ 
                            ...initialConfig, 
                            selectedPricingRowId: row.id,
                            selectedVehicle: row.id,
                              });
                            }
                          }}
                          className={`p-3 border rounded-lg transition-colors ${
                            hasInsufficientCapacity 
                              ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                              : isSelected 
                                ? 'border-blue-500 bg-blue-50 cursor-pointer' 
                                : 'hover:bg-gray-50 cursor-pointer'
                          } ${isMatching && !hasInsufficientCapacity ? 'ring-2 ring-green-500' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{row.car_type}</div>
                              <div className="text-sm text-gray-600">
                                Capacity: {row.vehicle_capacity} • {row.number_of_adults} Adult{row.number_of_adults !== 1 ? 's' : ''}
                                {row.number_of_children > 0 && `, ${row.number_of_children} Child${row.number_of_children !== 1 ? 'ren' : ''}`}
                              </div>
                              {hasInsufficientCapacity && (
                                <Badge className="mt-1 bg-red-100 text-red-700">
                                  Insufficient capacity (needs {totalTravelers}+)
                                </Badge>
                              )}
                              {isMatching && !hasInsufficientCapacity && (
                                <Badge className="mt-1 bg-green-100 text-green-700">Matches your group</Badge>
                              )}
                            </div>
                            <div className="text-lg font-semibold text-green-600">
                              ${row.total_price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Input */}
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={initialConfig.quantity || 1}
                  onChange={(e) => setInitialConfig({ ...initialConfig, quantity: parseInt(e.target.value) || 1 })}
                  className="mt-1 max-w-xs"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Summary */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Price</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Base Package:</span>
                    <span>${pricing.basePrice.toFixed(2)}</span>
                  </div>
                  {pricing.hotelPrice > 0 && (
                    <div className="flex justify-between">
                      <span>Hotels:</span>
                      <span>${pricing.hotelPrice.toFixed(2)}</span>
                    </div>
                  )}
                  {pricing.activitiesPrice > 0 && (
                    <div className="flex justify-between">
                      <span>Activities:</span>
                      <span>${pricing.activitiesPrice.toFixed(2)}</span>
                    </div>
                  )}
                  {pricing.transfersPrice > 0 && (
                    <div className="flex justify-between">
                      <span>Transfers:</span>
                      <span>${pricing.transfersPrice.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">
                  ${pricing.total.toFixed(2)}
                </p>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <FiSave className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Days Configuration - Scrollable */}
        <div className="space-y-6 pb-8">
          {days.length === 0 && !loading ? (
            <Card className="border-2 border-dashed border-gray-300 p-8 text-center">
              <FiCalendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No days found</h3>
              <p className="text-sm text-gray-600">Loading package days...</p>
            </Card>
          ) : (
            days.map((day) => (
            <Card key={day.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {day.day_number}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Day {day.day_number}: {day.city_name}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <FiMapPin className="w-4 h-4" />
                        {day.nights} night{day.nights !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                {/* Hotel Selection (if applicable) */}
                {day.hotels && day.hotels.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      <FiHome className="w-4 h-4 inline mr-2" />
                      Select Hotel
                    </label>
                    <Select
                      value={day.selected_hotel_id || ''}
                      onValueChange={(value) => handleHotelChange(day, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a hotel" />
                      </SelectTrigger>
                      <SelectContent>
                        {day.hotels.map((hotel) => (
                          <SelectItem key={hotel.id} value={hotel.id}>
                            {hotel.hotel_name} - {hotel.hotel_type} ({hotel.room_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Time Slots Section */}
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-700 block">
                    Daily Schedule
                  </label>
                  
                  {/* Morning Slot */}
                  <div className="border rounded-lg p-4 bg-orange-50/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">🌅 Morning</span>
                        <span className="text-xs text-gray-600">08:00 AM</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddActivity(day, 'morning')}
                          className="text-xs h-7"
                        >
                          <FiPlus className="w-3 h-3 mr-1" />
                          Activity
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddTransfer(day, 'morning')}
                          className="text-xs h-7"
                        >
                          <FiPlus className="w-3 h-3 mr-1" />
                          Transfer
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {day.timeSlots.morning.activities.length === 0 && day.timeSlots.morning.transfers.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No items scheduled</p>
                      ) : (
                        <>
                          {day.timeSlots.morning.activities.map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div>
                                <p className="text-xs font-medium text-gray-900">
                                  Activity: {activity.title}
                                  {activity.id.startsWith('operator-item-') && (
                                    <Badge variant="outline" className="ml-2 text-xs">Package</Badge>
                                  )}
                                </p>
                                {activity.price > 0 ? (
                                  <p className="text-xs text-gray-600">${activity.price.toFixed(2)}</p>
                                ) : activity.id.startsWith('operator-item-') ? (
                                  <p className="text-xs text-gray-500 italic">Included in package</p>
                                ) : null}
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveActivity(day, activity.id)} className="h-6 text-xs">
                                Remove
                              </Button>
                            </div>
                          ))}
                          {day.timeSlots.morning.transfers.map((transfer) => (
                            <div key={transfer.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div>
                                <p className="text-xs font-medium text-gray-900">
                                  Transfer: {transfer.title}
                                  {transfer.id.startsWith('operator-item-') && (
                                    <Badge variant="outline" className="ml-2 text-xs">Package</Badge>
                                  )}
                                </p>
                                {transfer.price > 0 ? (
                                  <p className="text-xs text-gray-600">${transfer.price.toFixed(2)}</p>
                                ) : transfer.id.startsWith('operator-item-') ? (
                                  <p className="text-xs text-gray-500 italic">Included in package</p>
                                ) : null}
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveTransfer(day, transfer.id)} className="h-6 text-xs">
                                Remove
                              </Button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Afternoon Slot */}
                  <div className="border rounded-lg p-4 bg-yellow-50/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">☀️ Afternoon</span>
                        <span className="text-xs text-gray-600">12:30 PM</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddActivity(day, 'afternoon')}
                          className="text-xs h-7"
                        >
                          <FiPlus className="w-3 h-3 mr-1" />
                          Activity
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddTransfer(day, 'afternoon')}
                          className="text-xs h-7"
                        >
                          <FiPlus className="w-3 h-3 mr-1" />
                          Transfer
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {day.timeSlots.afternoon.activities.length === 0 && day.timeSlots.afternoon.transfers.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No items scheduled</p>
                      ) : (
                        <>
                          {day.timeSlots.afternoon.activities.map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div>
                                <p className="text-xs font-medium text-gray-900">Activity: {activity.title}</p>
                                <p className="text-xs text-gray-600">${activity.price.toFixed(2)}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveActivity(day, activity.id)} className="h-6 text-xs">
                                Remove
                              </Button>
                            </div>
                          ))}
                          {day.timeSlots.afternoon.transfers.map((transfer) => (
                            <div key={transfer.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div>
                                <p className="text-xs font-medium text-gray-900">Transfer: {transfer.title}</p>
                                <p className="text-xs text-gray-600">${transfer.price.toFixed(2)}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveTransfer(day, transfer.id)} className="h-6 text-xs">
                                Remove
                              </Button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Evening Slot */}
                  <div className="border rounded-lg p-4 bg-purple-50/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">🌙 Evening</span>
                        <span className="text-xs text-gray-600">05:00 PM</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddActivity(day, 'evening')}
                          className="text-xs h-7"
                        >
                          <FiPlus className="w-3 h-3 mr-1" />
                          Activity
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddTransfer(day, 'evening')}
                          className="text-xs h-7"
                        >
                          <FiPlus className="w-3 h-3 mr-1" />
                          Transfer
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {day.timeSlots.evening.activities.length === 0 && day.timeSlots.evening.transfers.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No items scheduled</p>
                      ) : (
                        <>
                          {day.timeSlots.evening.activities.map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div>
                                <p className="text-xs font-medium text-gray-900">Activity: {activity.title}</p>
                                <p className="text-xs text-gray-600">${activity.price.toFixed(2)}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveActivity(day, activity.id)} className="h-6 text-xs">
                                Remove
                              </Button>
                            </div>
                          ))}
                          {day.timeSlots.evening.transfers.map((transfer) => (
                            <div key={transfer.id} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div>
                                <p className="text-xs font-medium text-gray-900">Transfer: {transfer.title}</p>
                                <p className="text-xs text-gray-600">${transfer.price.toFixed(2)}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveTransfer(day, transfer.id)} className="h-6 text-xs">
                                Remove
                              </Button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
          )}
        </div>
      </div>

      {/* Modals */}
      {showActivityModal && selectedDayForActivity && (
        <ActivitySelectorModal
          isOpen={showActivityModal}
          onClose={() => {
            setShowActivityModal(false);
            setSelectedDayForActivity(null);
          }}
          cityName={selectedDayForActivity.city_name}
          timeSlot={selectedTimeSlotForActivity}
          arrivalTime={null}
          enableSuggestions={false}
          adultsCount={itineraryInfo?.adults_count || 0}
          childrenCount={itineraryInfo?.children_count || 0}
          onSelect={handleActivitySelected}
        />
      )}

      {showTransferModal && selectedDayForTransfer && (() => {
        // Find next day's city for transfer destination
        const currentDayIndex = days.findIndex(d => d.id === selectedDayForTransfer.id);
        const nextDay = currentDayIndex >= 0 && currentDayIndex < days.length - 1 ? days[currentDayIndex + 1] : null;
        const toCity = nextDay?.city_name || selectedDayForTransfer.city_name; // Fallback to same city if last day
        
        return (
          <TransferSelectorModal
            isOpen={showTransferModal}
            onClose={() => {
              setShowTransferModal(false);
              setSelectedDayForTransfer(null);
            }}
            fromCity={selectedDayForTransfer.city_name}
            toCity={toCity}
            onSelect={handleTransferSelected}
          />
        );
      })()}
    </div>
  );
}

