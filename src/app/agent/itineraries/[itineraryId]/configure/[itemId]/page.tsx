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

            return {
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
              activities: [],
              transfers: [],
            };
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

              // Extract activities and transfers from time_slots
              const timeSlots = dayPlan.time_slots || {
                morning: { time: "", activities: [], transfers: [] },
                afternoon: { time: "", activities: [], transfers: [] },
                evening: { time: "", activities: [], transfers: [] },
              };
              
              // Collect all activities and transfers from all time slots
              const allActivities: any[] = [];
              const allTransfers: any[] = [];
              
              ['morning', 'afternoon', 'evening'].forEach((slot: string) => {
                const slotData = timeSlots[slot as keyof typeof timeSlots];
                if (slotData?.activities) {
                  allActivities.push(...slotData.activities);
                }
                if (slotData?.transfers) {
                  allTransfers.push(...slotData.transfers);
                }
              });

              const cityData = cities.find((c: any) => c.id === dayPlan.city_id);
              return {
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
                activities: allActivities.map((act: string, idx: number) => ({
                  id: `activity-${dayPlan.day_number}-${idx}`,
                  package_id: packageId,
                  title: act,
                  price: 0, // Activities from time slots don't have prices
                })),
                transfers: allTransfers.map((trans: string, idx: number) => ({
                  id: `transfer-${dayPlan.day_number}-${idx}`,
                  package_id: packageId,
                  title: trans,
                  price: 0, // Transfers from time slots don't have prices
                })),
              };
            });

            setDays(packageDays);
          }

          // Load existing configuration from item
          const config = itemTyped.configuration || {};
          if (config.selectedHotels) {
            setDays(prevDays =>
              prevDays.map(day => {
                const hotelConfig = config.selectedHotels.find(
                  (h: any) => h.city_id === day.city_id
                );
                return {
                  ...day,
                  selected_hotel_id: hotelConfig?.hotel_id || day.selected_hotel_id,
                };
              })
            );
          }

          // Load activities and transfers from existing itinerary_items
          if (config.activities && Array.isArray(config.activities)) {
            // Fetch activity items from database
            const activityItemIds = config.activities
              .map((a: any) => a.activity_item_id)
              .filter((id: any) => id);
            
            if (activityItemIds.length > 0) {
              // Fetch activity items - we'll need to fetch them individually or create a batch endpoint
              // For now, we'll skip this and rely on the config
              const activityItems: any[] = [];

              if (activityItems.length > 0) {
                const activityItemsTyped = activityItems as unknown as Array<{
                  id: string;
                  package_id: string;
                  package_title: string;
                  total_price: number;
                }>;
                
                setDays(prevDays =>
                  prevDays.map(day => {
                    const dayActivities = config.activities
                      .filter((a: any) => a.city_id === day.city_id)
                      .map((a: any) => {
                        const item = activityItemsTyped.find((item) => item.id === a.activity_item_id);
                        return {
                          id: a.activity_item_id,
                          package_id: a.activity_package_id || item?.package_id || '',
                          title: a.activity_title || item?.package_title || '',
                          price: a.price || item?.total_price || 0,
                        };
                      });
                    return { ...day, activities: dayActivities };
                  })
                );
              }
            }
          }

          if (config.transfers && Array.isArray(config.transfers)) {
            // Fetch transfer items from database
            const transferItemIds = config.transfers
              .map((t: any) => t.transfer_item_id)
              .filter((id: any) => id);
            
            if (transferItemIds.length > 0) {
              // Fetch transfer items - we'll need to fetch them individually or create a batch endpoint
              // For now, we'll skip this and rely on the config
              const transferItems: any[] = [];

              if (transferItems.length > 0) {
                const transferItemsTyped = transferItems as unknown as Array<{
                  id: string;
                  package_id: string;
                  package_title: string;
                  total_price: number;
                }>;
                
                setDays(prevDays =>
                  prevDays.map(day => {
                    const dayTransfers = config.transfers
                      .filter((t: any) => t.city_id === day.city_id)
                      .map((t: any) => {
                        const item = transferItemsTyped.find((item) => item.id === t.transfer_item_id);
                        return {
                          id: t.transfer_item_id,
                          package_id: t.transfer_package_id || item?.package_id || '',
                          title: t.transfer_title || item?.package_title || '',
                          price: t.price || item?.total_price || 0,
                        };
                      });
                    return { ...day, transfers: dayTransfers };
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

          // Fetch pricing packages (for multi_city, we'll use a similar structure)
          // Note: This may need a different endpoint for multi_city packages
          const pricingPkg = null;
          const sicRows: any[] = [];
          const privateRows: any[] = [];

          setPackageData({
            ...(pkg as any),
            pricing_package: pricingPkg,
            sic_pricing_rows: sicRows,
            private_package_rows: privateRows,
          });

          // Auto-select transport option if PRIVATE_PACKAGE and no selection exists
          const config = itemTyped.configuration || {};
          if (!config.selectedPricingRowId && pricingPkg?.pricing_type === 'PRIVATE_PACKAGE' && privateRows.length > 0) {
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
          const dayPlansResponse = await fetch(`/api/packages/${packageId}/day-plans?type=multi_city`);
          let dayPlans: any[] = [];
          let dayPlansError = null;

          if (dayPlansResponse.ok) {
            const dayPlansData = await dayPlansResponse.json();
            dayPlans = dayPlansData.dayPlans || [];
          } else {
            dayPlansError = new Error('Failed to fetch day plans');
            console.error('Error fetching day plans:', dayPlansError);
          }

          console.log('[Configure] Fetched day plans:', { 
            packageId, 
            dayPlansCount: dayPlans?.length || 0, 
            dayPlans, 
            error: dayPlansError 
          });

          if (dayPlansError || dayPlans.length === 0) {
            // Fallback: if day plans don't exist, fetch cities and create basic days
            const citiesResponse = await fetch(`/api/packages/${packageId}/cities?type=multi_city`);
            if (!citiesResponse.ok) {
              throw new Error('Failed to fetch cities');
            }
            const citiesData = await citiesResponse.json();
            const cities = citiesData.cities || [];

          let dayNumber = 1;
          const packageDays: PackageDay[] = (cities || []).map((city: any) => ({
            id: `day-${dayNumber}`,
            day_number: dayNumber++,
            city_id: city.id,
            city_name: city.name,
            nights: city.nights,
            activities: [],
            transfers: [],
          }));

          setDays(packageDays);
          } else if (dayPlans && dayPlans.length > 0) {
            // Convert day plans to PackageDay format
            console.log('[Configure] Converting day plans to PackageDay format:', dayPlans.length, 'days');
            const packageDays: PackageDay[] = (dayPlans || []).map((dayPlan: any) => {
              // Extract activities and transfers from time_slots
              const timeSlots = dayPlan.time_slots || {
                morning: { time: "", activities: [], transfers: [] },
                afternoon: { time: "", activities: [], transfers: [] },
                evening: { time: "", activities: [], transfers: [] },
              };
              
              // Collect all activities and transfers from all time slots
              const allActivities: any[] = [];
              const allTransfers: any[] = [];
              
              ['morning', 'afternoon', 'evening'].forEach((slot: string) => {
                const slotData = timeSlots[slot as keyof typeof timeSlots];
                if (slotData?.activities) {
                  allActivities.push(...slotData.activities);
                }
                if (slotData?.transfers) {
                  allTransfers.push(...slotData.transfers);
                }
              });

              return {
                id: dayPlan.id || `day-${dayPlan.day_number}`,
                day_number: dayPlan.day_number,
                city_id: dayPlan.city_id || '',
                city_name: dayPlan.city_name || '',
                nights: 1, // Will be calculated from cities if needed
                activities: allActivities.map((act: string, idx: number) => ({
                  id: `activity-${dayPlan.day_number}-${idx}`,
                  package_id: packageId,
                  title: act,
                  price: 0, // Activities from time slots don't have prices
                })),
                transfers: allTransfers.map((trans: string, idx: number) => ({
                  id: `transfer-${dayPlan.day_number}-${idx}`,
                  package_id: packageId,
                  title: trans,
                  price: 0, // Transfers from time slots don't have prices
                })),
              };
            });

            console.log('[Configure] Converted package days:', packageDays.length, 'days');
            setDays(packageDays);
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

  // Calculate pricing when days, initial config, or itinerary info change
  useEffect(() => {
    if (!itineraryItem || !itineraryInfo || days.length === 0 || !packageData) return;

    const adults = itineraryInfo.adults_count || 0;
    const children = itineraryInfo.children_count || 0;
    const pkgData = packageData as any;
    const pricingType = initialConfig.pricingType || pkgData.pricing_package?.pricing_type || 'SIC';
    
    // Calculate base price from pricing rows
    let basePrice = 0;
    
    if (pricingType === 'SIC') {
      const sicRows = pkgData.sic_pricing_rows || [];
      let selectedRow = null;
      
      if (initialConfig.selectedPricingRowId) {
        selectedRow = sicRows.find((row: any) => row.id === initialConfig.selectedPricingRowId);
      }
      
      if (!selectedRow) {
        selectedRow = sicRows.find((row: any) => 
          row.number_of_adults === adults && row.number_of_children === children
        ) || sicRows.find((row: any) => 
          row.number_of_adults >= adults && row.number_of_children >= children
        ) || sicRows[sicRows.length - 1];
      }
      
      if (selectedRow) {
        basePrice = selectedRow.total_price || 0;
      }
    } else if (pricingType === 'PRIVATE_PACKAGE') {
      const privateRows = pkgData.private_package_rows || [];
      let selectedRow = null;
      
      if (initialConfig.selectedPricingRowId) {
        selectedRow = privateRows.find((row: any) => row.id === initialConfig.selectedPricingRowId);
      }
      
      if (!selectedRow) {
        selectedRow = privateRows.find((row: any) => 
          row.number_of_adults === adults && row.number_of_children === children
        ) || privateRows.find((row: any) => 
          row.number_of_adults >= adults && row.number_of_children >= children
        ) || privateRows[privateRows.length - 1];
      }
      
      if (selectedRow) {
        basePrice = selectedRow.total_price || 0;
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

  const handleAddActivity = (day: PackageDay) => {
    setSelectedDayForActivity(day);
    setShowActivityModal(true);
  };

  const handleAddTransfer = (day: PackageDay) => {
    setSelectedDayForTransfer(day);
    setShowTransferModal(true);
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
          configuration: pricingConfig,
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
          configuration: {},
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
      // Delete itinerary item
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
      // Delete itinerary item
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

          let { error: updateDayError } = await supabase
            .from('itinerary_days' as any)
            .update(updateData)
            .eq('id', existingDay.id);

          // If error is about time_slots column not existing, retry without it
          if (updateDayError && (updateDayError.message?.includes('time_slots') || updateDayError.code === '42703')) {
            console.warn('time_slots column not found, updating without it');
            const { error: retryError } = await supabase
              .from('itinerary_days' as any)
              .update({ city_name: day.city_name })
              .eq('id', existingDay.id);
            updateDayError = retryError;
          }

          if (updateDayError) throw updateDayError;
          dayIds.push(existingDay.id);
        } else {
          // Create new day - try with time_slots first, fallback without if column doesn't exist
          const insertData: any = {
            itinerary_id: itineraryId,
            day_number: currentDayNumber,
            city_name: day.city_name,
            display_order: currentDayNumber,
            time_slots: {
              morning: { time: '', activities: day.activities.filter(a => a.id).map(a => a.id), transfers: [] },
              afternoon: { time: '', activities: [], transfers: day.transfers.filter(t => t.id).map(t => t.id) },
              evening: { time: '', activities: [], transfers: [] },
            },
          };

          let { data: newDay, error: createDayError } = await supabase
            .from('itinerary_days' as any)
            .insert(insertData)
            .select('id')
            .single();

          // If error is about time_slots column not existing, retry without it
          if (createDayError && (createDayError.message?.includes('time_slots') || createDayError.code === '42703')) {
            console.warn('time_slots column not found, inserting without it');
            const { data: retryDay, error: retryError } = await supabase
              .from('itinerary_days' as any)
              .insert({
                itinerary_id: itineraryId,
                day_number: currentDayNumber,
                city_name: day.city_name,
                display_order: currentDayNumber,
              })
              .select('id')
              .single();
            newDay = retryDay;
            createDayError = retryError;
          }

          if (createDayError) throw createDayError;
          if (newDay) {
            dayIds.push((newDay as any).id);
          }
        }

        currentDayNumber++;
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
              {(packageData as any).pricing_package && (
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

                {/* Activities Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Activities
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddActivity(day)}
                    >
                      <FiPlus className="w-4 h-4 mr-2" />
                      Add Activity
                    </Button>
                  </div>
                  {day.activities.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No activities added yet</p>
                  ) : (
                    <div className="space-y-2">
                      {day.activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-600">${activity.price.toFixed(2)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveActivity(day, activity.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Transfers Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      Transfers
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTransfer(day)}
                    >
                      <FiPlus className="w-4 h-4 mr-2" />
                      Add Transfer
                    </Button>
                  </div>
                  {day.transfers.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No transfers added yet</p>
                  ) : (
                    <div className="space-y-2">
                      {day.transfers.map((transfer) => (
                        <div
                          key={transfer.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm text-gray-900">{transfer.title}</p>
                            <p className="text-xs text-gray-600">${transfer.price.toFixed(2)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTransfer(day, transfer.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
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
          timeSlot="afternoon"
          arrivalTime={null}
          enableSuggestions={false}
          adultsCount={itineraryInfo?.adults_count || 0}
          childrenCount={itineraryInfo?.children_count || 0}
          onSelect={handleActivitySelected}
        />
      )}

      {showTransferModal && selectedDayForTransfer && (
        <TransferSelectorModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedDayForTransfer(null);
          }}
          fromCity={selectedDayForTransfer.city_name}
          toCity=""
          onSelect={handleTransferSelected}
        />
      )}
    </div>
  );
}

