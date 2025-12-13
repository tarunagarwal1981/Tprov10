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
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();

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
      if (!itemId || !itineraryId) return;

      setLoading(true);
      try {
        // Fetch itinerary info (adults, children, infants)
        const { data: itineraryData, error: itineraryError } = await supabase
          .from('itineraries' as any)
          .select('id, lead_id, adults_count, children_count, infants_count')
          .eq('id', itineraryId)
          .single();

        if (itineraryError) throw itineraryError;
        setItineraryInfo(itineraryData);

        // Fetch itinerary item
        const { data: item, error: itemError } = await supabase
          .from('itinerary_items' as any)
          .select('*')
          .eq('id', itemId)
          .single();

        if (itemError) throw itemError;
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
          const { data: pkg, error: pkgError } = await supabase
            .from('multi_city_hotel_packages' as any)
            .select('*')
            .eq('id', packageId)
            .single();

          if (pkgError) throw pkgError;

          // Fetch pricing packages
          const { data: pricingPackages, error: pricingError } = await supabase
            .from('multi_city_hotel_pricing_packages' as any)
            .select('*')
            .eq('package_id', packageId)
            .order('created_at', { ascending: true });

          if (pricingError && pricingError.code !== 'PGRST116') {
            console.warn('Error fetching pricing packages:', pricingError);
          }

          const pricingPkg = (pricingPackages?.[0] as any) || null;
          let sicRows: any[] = [];
          let privateRows: any[] = [];

          if (pricingPkg) {
            if (pricingPkg.pricing_type === 'SIC') {
              const { data: rows } = await supabase
                .from('multi_city_hotel_pricing_rows' as any)
                .select('*')
                .eq('pricing_package_id', pricingPkg.id)
                .order('display_order', { ascending: true });
              sicRows = (rows as any[]) || [];
            } else if (pricingPkg.pricing_type === 'PRIVATE_PACKAGE') {
              const { data: rows } = await supabase
                .from('multi_city_hotel_private_package_rows' as any)
                .select('*')
                .eq('pricing_package_id', pricingPkg.id)
                .order('display_order', { ascending: true });
              privateRows = (rows as any[]) || [];
            }
          }

          setPackageData({
            ...(pkg as any),
            pricing_package: pricingPkg,
            sic_pricing_rows: sicRows,
            private_package_rows: privateRows,
          });

          // Fetch day plans from the database (not cities - day plans have all the days)
          const { data: dayPlans, error: dayPlansError } = await supabase
            .from('multi_city_hotel_package_day_plans' as any)
            .select('id, package_id, city_id, day_number, city_name, title, description, photo_url, has_flights, time_slots')
            .eq('package_id', packageId)
            .order('day_number', { ascending: true });

          if (dayPlansError) {
            console.error('Error fetching day plans:', dayPlansError);
            // Fallback: if day plans don't exist, fetch cities and create basic days
          const { data: cities, error: citiesError } = await supabase
            .from('multi_city_hotel_package_cities' as any)
            .select('id, name, nights, display_order')
            .eq('package_id', packageId)
            .order('display_order', { ascending: true });

          if (citiesError) throw citiesError;

          // Fetch hotels for each city
          const cityIds = (cities || []).map((c: any) => c.id);
          const { data: hotels, error: hotelsError } = await supabase
            .from('multi_city_hotel_package_city_hotels' as any)
            .select('*')
            .in('city_id', cityIds)
            .order('display_order', { ascending: true });

          if (hotelsError) throw hotelsError;

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
            const { data: citiesData, error: citiesError } = await supabase
              .from('multi_city_hotel_package_cities' as any)
              .select('id, name, nights, display_order')
              .eq('package_id', packageId)
              .order('display_order', { ascending: true });

            if (citiesError) throw citiesError;
            const cities = (citiesData as any[]) || [];

            // Fetch hotels for each city
            const cityIds = (cities || []).map((c: any) => c.id);
            const { data: hotels, error: hotelsError } = await supabase
              .from('multi_city_hotel_package_city_hotels' as any)
              .select('*')
              .in('city_id', cityIds)
              .order('display_order', { ascending: true });

            if (hotelsError) throw hotelsError;

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
              const { data: activityItems } = await supabase
                .from('itinerary_items' as any)
                .select('id, package_id, package_title, total_price')
                .in('id', activityItemIds);

              if (activityItems) {
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
              const { data: transferItems } = await supabase
                .from('itinerary_items' as any)
                .select('id, package_id, package_title, total_price')
                .in('id', transferItemIds);

              if (transferItems) {
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
          const { data: pkg, error: pkgError } = await supabase
            .from('multi_city_packages' as any)
            .select('*')
            .eq('id', packageId)
            .single();

          if (pkgError) throw pkgError;

          // Fetch pricing packages
          const { data: pricingPackages, error: pricingError } = await supabase
            .from('multi_city_pricing_packages' as any)
            .select('*')
            .eq('package_id', packageId)
            .order('created_at', { ascending: true });

          if (pricingError && pricingError.code !== 'PGRST116') {
            console.warn('Error fetching pricing packages:', pricingError);
          }

          const pricingPkg = (pricingPackages?.[0] as any) || null;
          let sicRows: any[] = [];
          let privateRows: any[] = [];

          if (pricingPkg) {
            if (pricingPkg.pricing_type === 'SIC') {
              const { data: rows } = await supabase
                .from('multi_city_pricing_rows' as any)
                .select('*')
                .eq('pricing_package_id', pricingPkg.id)
                .order('display_order', { ascending: true });
              sicRows = (rows as any[]) || [];
            } else if (pricingPkg.pricing_type === 'PRIVATE_PACKAGE') {
              const { data: rows } = await supabase
                .from('multi_city_private_package_rows' as any)
                .select('*')
                .eq('pricing_package_id', pricingPkg.id)
                .order('display_order', { ascending: true });
              privateRows = (rows as any[]) || [];
            }
          }

          setPackageData({
            ...(pkg as any),
            pricing_package: pricingPkg,
            sic_pricing_rows: sicRows,
            private_package_rows: privateRows,
          });

          // Fetch day plans from the database (not cities - day plans have all the days)
          const { data: dayPlans, error: dayPlansError } = await supabase
            .from('multi_city_package_day_plans' as any)
            .select('id, package_id, city_id, day_number, city_name, title, description, photo_url, has_flights, time_slots')
            .eq('package_id', packageId)
            .order('day_number', { ascending: true });

          console.log('[Configure] Fetched day plans:', { 
            packageId, 
            dayPlansCount: dayPlans?.length || 0, 
            dayPlans, 
            error: dayPlansError 
          });

          if (dayPlansError) {
            console.error('Error fetching day plans:', dayPlansError);
            // Fallback: if day plans don't exist, fetch cities and create basic days
          const { data: cities, error: citiesError } = await supabase
            .from('multi_city_package_cities' as any)
            .select('id, name, nights, city_order')
            .eq('package_id', packageId)
            .order('city_order', { ascending: true });

          if (citiesError) throw citiesError;

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
        const { data: pricingOption, error: pricingError } = await supabase
          .from('activity_pricing_packages' as any)
          .select('*')
          .eq('id', selectedPricingId)
          .single();

        if (pricingError) {
          console.error('Error fetching pricing option:', pricingError);
        } else if (pricingOption) {
          const pricing = pricingOption as any;
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

      // Create itinerary item for activity
      const { data: activityItem, error } = await supabase
        .from('itinerary_items' as any)
        .insert({
          itinerary_id: itineraryId,
          day_id: null, // Will be assigned when saving
          package_type: 'activity',
          package_id: activity.id,
          operator_id: activity.operator_id || itineraryItem.operator_id,
          package_title: activity.title,
          package_image_url: activity.featured_image_url,
          configuration: pricingConfig,
          unit_price: calculatedPrice,
          quantity: 1,
          total_price: calculatedPrice,
          display_order: 0,
        })
        .select()
        .single();

      if (error) throw error;
      if (!activityItem) throw new Error('Failed to create activity item');

      const activityItemTyped = activityItem as unknown as { id: string };

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
      const { data: transferItem, error } = await supabase
        .from('itinerary_items' as any)
        .insert({
          itinerary_id: itineraryId,
          day_id: null, // Will be assigned when saving
          package_type: 'transfer',
          package_id: transfer.id,
          operator_id: transfer.operator_id || itineraryItem.operator_id,
          package_title: transfer.title,
          package_image_url: transfer.featured_image_url,
          configuration: {},
          unit_price: transfer.base_price || 0,
          quantity: 1,
          total_price: transfer.base_price || 0,
          display_order: 0,
        })
        .select()
        .single();

      if (error) throw error;
      if (!transferItem) throw new Error('Failed to create transfer item');

      const transferItemTyped = transferItem as unknown as { id: string };

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
      const { error } = await supabase
        .from('itinerary_items' as any)
        .delete()
        .eq('id', activityId);

      if (error) throw error;

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
      const { error } = await supabase
        .from('itinerary_items' as any)
        .delete()
        .eq('id', transferId);

      if (error) throw error;

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
      const { error: updateError } = await supabase
        .from('itinerary_items' as any)
        .update({
          configuration,
          total_price: pricing.total,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (updateError) throw updateError;

      // Create/update itinerary days
      // Check if days already exist for this itinerary
      const { data: existingDays } = await supabase
        .from('itinerary_days' as any)
        .select('id, day_number')
        .eq('itinerary_id', itineraryId)
        .order('day_number', { ascending: true });

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
          // Update existing day
          const { error: updateDayError } = await supabase
            .from('itinerary_days' as any)
            .update({
              city_name: day.city_name,
              time_slots: {
                morning: { time: '', activities: day.activities.filter(a => a.id).map(a => a.id), transfers: [] },
                afternoon: { time: '', activities: [], transfers: day.transfers.filter(t => t.id).map(t => t.id) },
                evening: { time: '', activities: [], transfers: [] },
              },
            })
            .eq('id', existingDay.id);

          if (updateDayError) throw updateDayError;
          dayIds.push(existingDay.id);
        } else {
          // Create new day
          const { data: newDay, error: createDayError } = await supabase
            .from('itinerary_days' as any)
            .insert({
              itinerary_id: itineraryId,
              day_number: currentDayNumber,
              city_name: day.city_name,
              display_order: currentDayNumber,
              time_slots: {
                morning: { time: '', activities: day.activities.filter(a => a.id).map(a => a.id), transfers: [] },
                afternoon: { time: '', activities: [], transfers: day.transfers.filter(t => t.id).map(t => t.id) },
                evening: { time: '', activities: [], transfers: [] },
              },
            })
            .select('id')
            .single();

          if (createDayError) throw createDayError;
          if (newDay) {
            dayIds.push((newDay as any).id);
          }
        }

        currentDayNumber++;
      }

      // Update itinerary item with first day_id (for reference)
      if (dayIds.length > 0) {
        await supabase
          .from('itinerary_items' as any)
          .update({ day_id: dayIds[0] })
          .eq('id', itemId);
      }

      // Link activities and transfers to their respective days
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const dayId = dayIds[i];
        
        if (!dayId || !day) continue;

        // Update activity items with day_id
        for (const activity of day.activities) {
          await supabase
            .from('itinerary_items' as any)
            .update({ day_id: dayId })
            .eq('id', activity.id);
        }

        // Update transfer items with day_id
        for (const transfer of day.transfers) {
          await supabase
            .from('itinerary_items' as any)
            .update({ day_id: dayId })
            .eq('id', transfer.id);
        }
      }

      // Calculate total itinerary price (sum of all items)
      const { data: allItems } = await supabase
        .from('itinerary_items' as any)
        .select('total_price')
        .eq('itinerary_id', itineraryId);

      const totalItineraryPrice = (allItems || []).reduce(
        (sum: number, item: any) => sum + (parseFloat(item.total_price) || 0),
        0
      );

      // Update itinerary with total price and timestamp
      const { error: itineraryUpdateError } = await supabase
        .from('itineraries' as any)
        .update({
          total_price: totalItineraryPrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itineraryId);

      if (itineraryUpdateError) {
        console.error('Error updating itinerary:', itineraryUpdateError);
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
                      return (
                        <div
                          key={row.id}
                          onClick={() => setInitialConfig({ 
                            ...initialConfig, 
                            selectedPricingRowId: row.id,
                            selectedVehicle: row.id,
                          })}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                          } ${isMatching ? 'ring-2 ring-green-500' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{row.car_type}</div>
                              <div className="text-sm text-gray-600">
                                Capacity: {row.vehicle_capacity} • {row.number_of_adults} Adult{row.number_of_adults !== 1 ? 's' : ''}
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

