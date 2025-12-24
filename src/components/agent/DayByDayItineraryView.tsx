'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiClock, FiPlus, FiX, FiMapPin, FiDollarSign, FiEdit2 } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ActivitySelectorModal } from '@/components/itinerary/ActivitySelectorModal';
import { TransferSelectorModal } from '@/components/itinerary/TransferSelectorModal';
import type { TimeSlot } from '@/lib/utils/timeSlots';
import type { ActivityPackage } from '@/lib/services/smartItineraryFilter';
import type { TransferPackage } from '@/lib/services/smartItineraryFilter';
import { useToast } from '@/hooks/useToast';

interface ItineraryDay {
  id: string;
  day_number: number;
  date: string | null;
  city_name: string;
  notes?: string;
  time_slots?: {
    morning: { time: string; activities: string[]; transfers: string[] };
    afternoon: { time: string; activities: string[]; transfers: string[] };
    evening: { time: string; activities: string[]; transfers: string[] };
  };
}

interface ItineraryItem {
  id: string;
  day_id: string | null;
  package_type: 'activity' | 'transfer' | 'multi_city' | 'multi_city_hotel' | 'fixed_departure';
  package_id: string;
  package_title: string;
  unit_price: number | null;
  quantity: number;
  total_price: number | null;
  configuration: any;
}

interface DayByDayItineraryViewProps {
  itineraryId: string;
  queryId: string | null;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  onDaysGenerated?: () => void;
  onPriceUpdated?: (totalPrice: number) => void;
}

export function DayByDayItineraryView({
  itineraryId,
  queryId,
  adultsCount,
  childrenCount,
  infantsCount,
  onDaysGenerated,
  onPriceUpdated,
}: DayByDayItineraryViewProps) {
  const toast = useToast();
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingDays, setGeneratingDays] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  // Repository for activities and transfers
  const [allActivities, setAllActivities] = useState<ActivityPackage[]>([]);
  const [allTransfers, setAllTransfers] = useState<TransferPackage[]>([]);
  const [loadingRepository, setLoadingRepository] = useState(false);

  // Modal states
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);

  // Use ref to store onPriceUpdated callback to prevent infinite loops
  // The callback may change on parent re-renders, but we only want to call it when items change
  const onPriceUpdatedRef = useRef(onPriceUpdated);
  const previousTotalRef = useRef<number>(0);
  useEffect(() => {
    onPriceUpdatedRef.current = onPriceUpdated;
  }, [onPriceUpdated]);

  // Fetch data
  useEffect(() => {
    if (itineraryId) {
      fetchDays();
      fetchItems();
      fetchRepository();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryId]); // fetchDays, fetchItems, fetchRepository are stable functions that don't need to be in deps

  // Calculate total price when items change and notify parent
  // Only depend on items, not onPriceUpdated, to prevent infinite loops
  useEffect(() => {
    // Ensure all items have total_price before calculating
    const normalizedItems = items.map(item => ({
      ...item,
      total_price: item.total_price ?? item.unit_price ?? 0,
    }));
    const total = normalizedItems.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
    
    // Only update and notify if price actually changed to prevent unnecessary updates and loops
    if (total !== previousTotalRef.current) {
      previousTotalRef.current = total;
      setTotalPrice(total);
      // Notify parent component of price update (database trigger will update total_price automatically)
      // Use ref to avoid dependency on callback that may change frequently
      onPriceUpdatedRef.current?.(total);
    }
  }, [items]); // Only depend on items - use ref to track previous total

  // Auto-generate days if query exists and no days
  useEffect(() => {
    if (queryId && days.length === 0 && !loading && !generatingDays) {
      generateDaysFromQuery();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryId, days.length, loading, generatingDays]); // generateDaysFromQuery is stable and doesn't need to be in deps

  const fetchDays = async () => {
    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/days`);
      if (response.ok) {
        const { days: daysData } = await response.json();
        setDays(daysData || []);
      }
    } catch (err) {
      console.error('Error fetching days:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/items`);
      if (response.ok) {
        const { items: itemsData } = await response.json();
        // Ensure all items have total_price set (default to 0 if null/undefined)
        const normalizedItems = (itemsData || []).map((item: ItineraryItem) => ({
          ...item,
          total_price: item.total_price ?? item.unit_price ?? 0,
          unit_price: item.unit_price ?? 0,
        }));
        setItems(normalizedItems);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  const fetchRepository = async () => {
    setLoadingRepository(true);
    try {
      // Fetch all activities
      const activitiesResponse = await fetch('/api/packages/search?type=activity&limit=1000');
      if (activitiesResponse.ok) {
        const { packages: activities } = await activitiesResponse.json();
        setAllActivities(activities || []);
      }

      // Fetch all transfers
      const transfersResponse = await fetch('/api/packages/search?type=transfer&limit=1000');
      if (transfersResponse.ok) {
        const { packages: transfers } = await transfersResponse.json();
        setAllTransfers(transfers || []);
      }
    } catch (err) {
      console.error('Error fetching repository:', err);
    } finally {
      setLoadingRepository(false);
    }
  };

  const generateDaysFromQuery = async () => {
    if (!queryId || generatingDays) return;

    setGeneratingDays(true);
    try {
      // Fetch query to get destinations
      const queryResponse = await fetch(`/api/queries/by-id/${queryId}`);
      if (!queryResponse.ok) {
        throw new Error('Failed to fetch query');
      }

      const { query: queryData } = await queryResponse.json();
      if (!queryData || !queryData.destinations || queryData.destinations.length === 0) {
        return;
      }

      // Generate days via API
      const response = await fetch(`/api/itineraries/${itineraryId}/days/generate-from-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: queryData.id,
          destinations: queryData.destinations,
          leavingOn: queryData.leaving_on,
        }),
      });

      if (response.ok) {
        const { days: createdDays } = await response.json();
        setDays(createdDays);
        toast.success(`Generated ${createdDays.length} days from query`);
        onDaysGenerated?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate days');
      }
    } catch (err) {
      console.error('Error generating days:', err);
      toast.error('Failed to generate days from query');
    } finally {
      setGeneratingDays(false);
    }
  };

  const handleAddActivity = (dayIndex: number, timeSlot: TimeSlot) => {
    setSelectedDayIndex(dayIndex);
    setSelectedTimeSlot(timeSlot);
    setActivityModalOpen(true);
  };

  const handleAddTransfer = (dayIndex: number, timeSlot: TimeSlot) => {
    setSelectedDayIndex(dayIndex);
    setSelectedTimeSlot(timeSlot);
    setTransferModalOpen(true);
  };

  const handleActivitySelect = async (activity: ActivityPackage, selectedPricingId?: string) => {
    if (selectedDayIndex === null || !selectedTimeSlot || !days[selectedDayIndex]) return;

    const day = days[selectedDayIndex];
    if (!day) return;

    try {
      // Calculate price based on selected pricing option
      const pricingOptions = activity.pricing_packages || [];
      const selectedPricing = pricingOptions.find(p => p.id === selectedPricingId);
      
      let calculatedPrice = activity.base_price || 0;
      if (selectedPricing) {
        calculatedPrice = 
          (selectedPricing.adult_price || 0) * adultsCount +
          (selectedPricing.child_price || 0) * childrenCount +
          (selectedPricing.infant_price || 0) * infantsCount +
          (selectedPricing.transfer_price_adult || 0) * adultsCount +
          (selectedPricing.transfer_price_child || 0) * childrenCount +
          (selectedPricing.transfer_price_infant || 0) * infantsCount;
      } else if (activity.base_price) {
        calculatedPrice = activity.base_price * (adultsCount + childrenCount);
      }

      // Create itinerary item
      const itemResponse = await fetch(`/api/itineraries/${itineraryId}/items/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId: day.id,
          packageType: 'activity',
          packageId: activity.id,
          operatorId: activity.operator_id,
          packageTitle: activity.title,
          packageImageUrl: activity.featured_image_url,
          configuration: {
            pricingPackageId: selectedPricingId,
            timeSlot: selectedTimeSlot,
          },
          unitPrice: calculatedPrice,
          quantity: 1,
          displayOrder: items.length,
        }),
      });

      if (!itemResponse.ok) {
        const error = await itemResponse.json();
        throw new Error(error.error || 'Failed to add activity');
      }

      const { item: newItem } = await itemResponse.json();

      // Add the new item to items state immediately with normalized total_price
      const normalizedNewItem: ItineraryItem = {
        ...newItem,
        total_price: newItem.total_price ?? newItem.unit_price ?? calculatedPrice,
        unit_price: newItem.unit_price ?? calculatedPrice,
      };
      setItems(prev => [...prev, normalizedNewItem]);

      // Update day's time slot
      const updatedDays = [...days];
      const existingDay = updatedDays[selectedDayIndex];
      if (!existingDay || !existingDay.id) {
        throw new Error('Day not found or missing ID');
      }
      const updatedDay: ItineraryDay = {
        ...existingDay,
        id: existingDay.id,
        day_number: existingDay.day_number,
        city_name: existingDay.city_name,
        time_slots: existingDay.time_slots || {
          morning: { time: '08:00', activities: [], transfers: [] },
          afternoon: { time: '12:30', activities: [], transfers: [] },
          evening: { time: '17:00', activities: [], transfers: [] },
        },
      };
      updatedDay.time_slots![selectedTimeSlot].activities.push(newItem.id);
      updatedDays[selectedDayIndex] = updatedDay;
      setDays(updatedDays);

      // Update day in database (don't wait, do it in background)
      updateDay(updatedDay.id, updatedDay).catch(err => {
        console.error('[DayByDayItineraryView] Error updating day:', err);
      });

      // Refresh items to get the latest from database (this will normalize all items)
      await fetchItems();

      setActivityModalOpen(false);
      setSelectedDayIndex(null);
      setSelectedTimeSlot(null);
      toast.success('Activity added successfully');
    } catch (err) {
      console.error('Error adding activity:', err);
      toast.error('Failed to add activity');
    }
  };

  const handleTransferSelect = async (transfer: TransferPackage) => {
    if (selectedDayIndex === null || !selectedTimeSlot || !days[selectedDayIndex]) return;

    const day = days[selectedDayIndex];
    if (!day) return;

    try {
      // Calculate price (transfers typically use base_price)
      const calculatedPrice = transfer.base_price || 0;

      // Create itinerary item
      const itemResponse = await fetch(`/api/itineraries/${itineraryId}/items/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId: day.id,
          packageType: 'transfer',
          packageId: transfer.id,
          operatorId: transfer.operator_id,
          packageTitle: transfer.title,
          packageImageUrl: null,
          configuration: {
            timeSlot: selectedTimeSlot,
          },
          unitPrice: calculatedPrice,
          quantity: 1,
          displayOrder: items.length,
        }),
      });

      if (!itemResponse.ok) {
        const error = await itemResponse.json();
        throw new Error(error.error || 'Failed to add transfer');
      }

      const { item: newItem } = await itemResponse.json();
      
      // Ensure the new item has total_price
      if (!newItem.total_price && newItem.unit_price) {
        newItem.total_price = newItem.unit_price * (newItem.quantity || 1);
      }

      // Add the new item to items state immediately with normalized total_price
      const normalizedNewItem: ItineraryItem = {
        ...newItem,
        total_price: newItem.total_price ?? newItem.unit_price ?? calculatedPrice,
        unit_price: newItem.unit_price ?? calculatedPrice,
      };
      setItems(prev => [...prev, normalizedNewItem]);

      // Update day's time slot
      const updatedDays = [...days];
      const existingDay = updatedDays[selectedDayIndex];
      if (!existingDay || !existingDay.id) {
        throw new Error('Day not found or missing ID');
      }
      const updatedDay: ItineraryDay = {
        ...existingDay,
        id: existingDay.id,
        day_number: existingDay.day_number,
        city_name: existingDay.city_name,
        time_slots: existingDay.time_slots || {
          morning: { time: '08:00', activities: [], transfers: [] },
          afternoon: { time: '12:30', activities: [], transfers: [] },
          evening: { time: '17:00', activities: [], transfers: [] },
        },
      };
      updatedDay.time_slots![selectedTimeSlot].transfers.push(newItem.id);
      updatedDays[selectedDayIndex] = updatedDay;
      setDays(updatedDays);

      // Update day in database (don't wait, do it in background)
      updateDay(updatedDay.id, updatedDay).catch(err => {
        console.error('[DayByDayItineraryView] Error updating day:', err);
      });

      // Refresh items to get the latest from database (this will normalize all items)
      await fetchItems();

      setTransferModalOpen(false);
      setSelectedDayIndex(null);
      setSelectedTimeSlot(null);
      toast.success('Transfer added successfully');
    } catch (err) {
      console.error('Error adding transfer:', err);
      toast.error('Failed to add transfer');
    }
  };

  const updateDay = async (dayId: string, day: ItineraryDay) => {
    try {
      // Ensure time_slots is properly formatted before sending
      const timeSlotsToSend = day.time_slots || {
        morning: { time: '08:00', activities: [], transfers: [] },
        afternoon: { time: '12:30', activities: [], transfers: [] },
        evening: { time: '17:00', activities: [], transfers: [] },
      };

      // Validate time_slots structure
      const validatedTimeSlots = {
        morning: {
          time: timeSlotsToSend.morning?.time || '08:00',
          activities: Array.isArray(timeSlotsToSend.morning?.activities) ? timeSlotsToSend.morning.activities : [],
          transfers: Array.isArray(timeSlotsToSend.morning?.transfers) ? timeSlotsToSend.morning.transfers : [],
        },
        afternoon: {
          time: timeSlotsToSend.afternoon?.time || '12:30',
          activities: Array.isArray(timeSlotsToSend.afternoon?.activities) ? timeSlotsToSend.afternoon.activities : [],
          transfers: Array.isArray(timeSlotsToSend.afternoon?.transfers) ? timeSlotsToSend.afternoon.transfers : [],
        },
        evening: {
          time: timeSlotsToSend.evening?.time || '17:00',
          activities: Array.isArray(timeSlotsToSend.evening?.activities) ? timeSlotsToSend.evening.activities : [],
          transfers: Array.isArray(timeSlotsToSend.evening?.transfers) ? timeSlotsToSend.evening.transfers : [],
        },
      };

      // Validate JSON before sending
      let requestBody;
      try {
        requestBody = JSON.stringify({
          cityName: day.city_name,
          date: day.date,
          notes: day.notes,
          timeSlots: validatedTimeSlots,
        });
        // Test that it's valid JSON
        JSON.parse(requestBody);
      } catch (jsonError) {
        console.error('[DayByDayItineraryView] Invalid JSON structure:', jsonError);
        console.error('[DayByDayItineraryView] validatedTimeSlots:', validatedTimeSlots);
        return;
      }

      const response = await fetch(`/api/itineraries/${itineraryId}/days/${dayId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText || 'Failed to update day' };
        }
        console.error('[DayByDayItineraryView] Error updating day time_slots:', error);
        console.error('[DayByDayItineraryView] Response status:', response.status);
        console.error('[DayByDayItineraryView] Request body sent:', requestBody);
        // Don't throw - just log, so the UI doesn't break
        return;
      }
      
      console.log('[DayByDayItineraryView] Day updated successfully');
    } catch (err) {
      console.error('[DayByDayItineraryView] Error updating day:', err);
      // Don't throw - just log, so the UI doesn't break
    }
  };

  const handleRemoveItem = async (itemId: string, dayIndex: number, timeSlot: TimeSlot, type: 'activity' | 'transfer') => {
    try {
      // Delete item
      const response = await fetch(`/api/itineraries/${itineraryId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      // Update day's time slot
      const updatedDays = [...days];
      const existingDay = updatedDays[dayIndex];
      if (!existingDay || !existingDay.id) {
        throw new Error('Day not found or missing ID');
      }
      const updatedDay: ItineraryDay = {
        ...existingDay,
        id: existingDay.id,
        day_number: existingDay.day_number,
        city_name: existingDay.city_name,
        time_slots: existingDay.time_slots || {
          morning: { time: '08:00', activities: [], transfers: [] },
          afternoon: { time: '12:30', activities: [], transfers: [] },
          evening: { time: '17:00', activities: [], transfers: [] },
        },
      };
      if (type === 'activity') {
        updatedDay.time_slots![timeSlot].activities = updatedDay.time_slots![timeSlot].activities.filter(id => id !== itemId);
      } else {
        updatedDay.time_slots![timeSlot].transfers = updatedDay.time_slots![timeSlot].transfers.filter(id => id !== itemId);
      }
      updatedDays[dayIndex] = updatedDay;
      setDays(updatedDays);
      await updateDay(updatedDay.id, updatedDay);

      // Refresh items
      await fetchItems();
      toast.success('Item removed successfully');
    } catch (err) {
      console.error('Error removing item:', err);
      toast.error('Failed to remove item');
    }
  };

  if (loading || generatingDays) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">
            {generatingDays ? 'Generating days from query...' : 'Loading itinerary...'}
          </p>
        </div>
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No days generated yet. Days will be created automatically from the query.</p>
      </div>
    );
  }

  const timeSlots: TimeSlot[] = ['morning', 'afternoon', 'evening'];
  const slotConfig = {
    morning: { label: '🌅 Morning', bgColor: 'bg-orange-50', defaultTime: '08:00' },
    afternoon: { label: '☀️ Afternoon', bgColor: 'bg-yellow-50', defaultTime: '12:30' },
    evening: { label: '🌙 Evening', bgColor: 'bg-purple-50', defaultTime: '17:00' },
  };

  return (
    <div className="space-y-6">
      {/* Total Price Display */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Itinerary Price</p>
              <p className="text-3xl font-bold text-green-600">${totalPrice.toFixed(2)}</p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>{adultsCount} Adults, {childrenCount} Children, {infantsCount} Infants</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Days Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiClock className="w-5 h-5" />
            Day-by-Day Itinerary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {days.map((day, i) => (
              <React.Fragment key={day.id}>
                <div className="flex flex-col items-center min-w-[80px]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center font-semibold text-sm">
                    {day.day_number}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 text-center max-w-[80px] truncate">
                    {day.city_name}
                  </div>
                </div>
                {i < days.length - 1 && <div className="w-16 h-0.5 bg-gray-300 mb-4" />}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Day Cards */}
      <div className="space-y-6">
        {days.map((day, dayIndex) => {
          const dayItems = items
            .filter(item => item.day_id === day.id)
            .map(item => ({
              ...item,
              total_price: item.total_price ?? item.unit_price ?? 0,
            }));
          const dayTotal = dayItems.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);

          return (
            <Card key={day.id} className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      Day {day.day_number}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <FiMapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-lg font-semibold">{day.city_name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Day Total</p>
                    <p className="text-xl font-bold text-green-600">${dayTotal.toFixed(2)}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Time Slots */}
                {timeSlots.map((timeSlot) => {
                  const slot = day.time_slots?.[timeSlot] || {
                    time: slotConfig[timeSlot].defaultTime,
                    activities: [],
                    transfers: [],
                  };
                  const config = slotConfig[timeSlot];

                  // Get items for this time slot - ensure all items are normalized
                  const slotActivityIds = slot.activities || [];
                  const slotTransferIds = slot.transfers || [];
                  const slotActivities = items
                    .filter(item => {
                      if (!item || !item.id) return false;
                      return item.package_type === 'activity' && slotActivityIds.includes(item.id);
                    })
                    .map(item => ({
                      ...item,
                      total_price: Number(item.total_price) || Number(item.unit_price) || 0,
                      unit_price: Number(item.unit_price) || 0,
                    }));
                  const slotTransfers = items
                    .filter(item => {
                      if (!item || !item.id) return false;
                      return item.package_type === 'transfer' && slotTransferIds.includes(item.id);
                    })
                    .map(item => ({
                      ...item,
                      total_price: Number(item.total_price) || Number(item.unit_price) || 0,
                      unit_price: Number(item.unit_price) || 0,
                    }));

                  return (
                    <div key={timeSlot} className={`p-4 border rounded-lg ${config.bgColor}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{config.label}</h4>
                        <Input
                          type="time"
                          value={slot.time}
                          onChange={(e) => {
                            const updatedDays = [...days];
                            const existingDay = updatedDays[dayIndex];
                            if (!existingDay || !existingDay.id) {
                              return;
                            }
                            const updatedDay: ItineraryDay = {
                              ...existingDay,
                              id: existingDay.id,
                              day_number: existingDay.day_number,
                              city_name: existingDay.city_name,
                              time_slots: existingDay.time_slots || {
                                morning: { time: '08:00', activities: [], transfers: [] },
                                afternoon: { time: '12:30', activities: [], transfers: [] },
                                evening: { time: '17:00', activities: [], transfers: [] },
                              },
                            };
                            updatedDay.time_slots![timeSlot].time = e.target.value;
                            updatedDays[dayIndex] = updatedDay;
                            setDays(updatedDays);
                            updateDay(updatedDay.id, updatedDay);
                          }}
                          className="w-32"
                        />
                      </div>

                      {/* Activities */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Activities</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddActivity(dayIndex, timeSlot)}
                          >
                            <FiPlus className="w-4 h-4 mr-1" />
                            Add Activity
                          </Button>
                        </div>
                        {slotActivities.length > 0 ? (
                          <div className="space-y-2">
                            {slotActivities.map((item) => {
                              const itemPrice = Number(item.total_price) || Number(item.unit_price) || 0;
                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-2 bg-white rounded border"
                                >
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">{item.package_title || 'Untitled'}</span>
                                    <span className="text-sm text-green-600 ml-2">
                                      ${itemPrice.toFixed(2)}
                                    </span>
                                  </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(item.id, dayIndex, timeSlot, 'activity')}
                                >
                                  <FiX className="w-4 h-4" />
                                </Button>
                              </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No activities added</p>
                        )}
                      </div>

                      {/* Transfers */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Transfers</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddTransfer(dayIndex, timeSlot)}
                          >
                            <FiPlus className="w-4 h-4 mr-1" />
                            Add Transfer
                          </Button>
                        </div>
                        {slotTransfers.length > 0 ? (
                          <div className="space-y-2">
                            {slotTransfers.map((item) => {
                              const itemPrice = Number(item.total_price) || Number(item.unit_price) || 0;
                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-2 bg-white rounded border"
                                >
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">{item.package_title || 'Untitled'}</span>
                                    <span className="text-sm text-green-600 ml-2">
                                      ${itemPrice.toFixed(2)}
                                    </span>
                                  </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(item.id, dayIndex, timeSlot, 'transfer')}
                                >
                                  <FiX className="w-4 h-4" />
                                </Button>
                              </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No transfers added</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity Selector Modal */}
      {selectedDayIndex !== null && selectedTimeSlot && days[selectedDayIndex] && (
        <ActivitySelectorModal
          isOpen={activityModalOpen}
          onClose={() => {
            setActivityModalOpen(false);
            setSelectedDayIndex(null);
            setSelectedTimeSlot(null);
          }}
          cityName={days[selectedDayIndex].city_name}
          timeSlot={selectedTimeSlot}
          arrivalTime={null}
          enableSuggestions={false}
          adultsCount={adultsCount}
          childrenCount={childrenCount}
          onSelect={handleActivitySelect}
        />
      )}

      {/* Transfer Selector Modal */}
      {selectedDayIndex !== null && selectedTimeSlot && days[selectedDayIndex] && (
        <TransferSelectorModal
          isOpen={transferModalOpen}
          onClose={() => {
            setTransferModalOpen(false);
            setSelectedDayIndex(null);
            setSelectedTimeSlot(null);
          }}
          fromCity={days[selectedDayIndex].city_name}
          toCity={days[selectedDayIndex].city_name}
          onSelect={handleTransferSelect}
        />
      )}
    </div>
  );
}
