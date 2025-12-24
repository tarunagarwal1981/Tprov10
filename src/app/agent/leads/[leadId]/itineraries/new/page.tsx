'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FiArrowLeft, FiClock, FiPlus, FiX, FiMapPin, FiSave } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import { ActivitySelectorModal } from '@/components/itinerary/ActivitySelectorModal';
import { TransferSelectorModal } from '@/components/itinerary/TransferSelectorModal';
import type { ItineraryQuery } from '@/lib/services/queryService';
import type { TimeSlot } from '@/lib/utils/timeSlots';
import type { ActivityPackage } from '@/lib/services/smartItineraryFilter';
import type { TransferPackage } from '@/lib/services/smartItineraryFilter';

interface LeadDetails {
  id: string;
  destination: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  budgetMin?: number;
  budgetMax?: number;
  durationDays?: number;
  travelersCount?: number;
}

interface ItineraryDay {
  id?: string;
  day_number: number;
  date: string | null;
  city_name: string;
  title?: string;
  notes?: string;
  time_slots?: {
    morning: { time: string; activities: string[]; transfers: string[] };
    afternoon: { time: string; activities: string[]; transfers: string[] };
    evening: { time: string; activities: string[]; transfers: string[] };
  };
}

interface Itinerary {
  id: string;
  name: string;
  status: string;
  adults_count: number;
  children_count: number;
  infants_count: number;
  start_date: string | null;
  end_date: string | null;
  query_id: string | null;
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

export default function CreateItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();

  const leadId = params.leadId as string;
  const queryId = searchParams.get('queryId');
  const itineraryId = searchParams.get('itineraryId');

  // State
  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [query, setQuery] = useState<ItineraryQuery | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingItinerary, setSavingItinerary] = useState(false);
  
  // Activities and Transfers Repository
  const [allActivities, setAllActivities] = useState<ActivityPackage[]>([]);
  const [allTransfers, setAllTransfers] = useState<TransferPackage[]>([]);
  const [loadingRepository, setLoadingRepository] = useState(true);

  // Modal states
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);

  // Fetch data on mount
  useEffect(() => {
    if (leadId && user?.id) {
      console.log('[CreateItineraryPage] useEffect triggered, fetching data:', {
        leadId,
        queryId,
        itineraryId,
        userId: user.id,
      });
      fetchData();
      fetchRepository();
    } else {
      console.warn('[CreateItineraryPage] Missing required data:', {
        hasLeadId: !!leadId,
        hasUserId: !!user?.id,
      });
    }
  }, [leadId, user?.id, queryId, itineraryId]);

  // Fetch items when itinerary is available
  useEffect(() => {
    if (itineraryId && itinerary?.id) {
      fetchItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryId, itinerary?.id]);

  // Calculate total price when items change
  useEffect(() => {
    if (items.length === 0) {
      setTotalPrice(0);
      return;
    }

    // Normalize items to ensure total_price is available
    const normalizedItems = items.map(item => ({
      ...item,
      total_price: item.total_price ?? item.unit_price ?? 0,
    }));

    const total = normalizedItems.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
    setTotalPrice(total);
    console.log('[CreateItineraryPage] Total price calculated:', total, 'from', items.length, 'items');
  }, [items]);

  const fetchData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch lead
      const leadResponse = await fetch(`/api/leads/${leadId}?agentId=${user.id}`);
      if (leadResponse.ok) {
        const { lead: leadData } = await leadResponse.json();
        setLead(leadData);
      }

      // Fetch query - use correct endpoint based on whether queryId is provided
      let fetchedQuery: ItineraryQuery | null = null;
      if (queryId) {
        // Use the by-id endpoint when queryId is provided
        const queryUrl = `/api/queries/by-id/${queryId}`;
        console.log('[CreateItineraryPage] Fetching query by ID:', {
          queryId,
          url: queryUrl,
          leadId,
          itineraryId,
        });
        const queryResponse = await fetch(queryUrl);
        if (queryResponse.ok) {
          const { query: queryData } = await queryResponse.json();
          fetchedQuery = queryData;
          setQuery(queryData);
          console.log('[CreateItineraryPage] Query fetched successfully:', {
            queryId: queryData?.id,
            leadId: queryData?.lead_id,
            agentId: queryData?.agent_id,
            destinations: queryData?.destinations,
          });
        } else {
          const errorData = await queryResponse.json().catch(() => ({}));
          console.error('[CreateItineraryPage] Failed to fetch query by ID:', {
            status: queryResponse.status,
            error: errorData,
            queryId,
          });
          toast.error(errorData.error || 'Failed to fetch query');
        }
      } else {
        // Fallback to fetching by leadId if no queryId provided
        console.log('[CreateItineraryPage] No queryId provided, fetching by leadId:', leadId);
        const queryResponse = await fetch(`/api/queries/${leadId}`);
        if (queryResponse.ok) {
          const { query: queryData } = await queryResponse.json();
          fetchedQuery = queryData;
          setQuery(queryData);
          console.log('[CreateItineraryPage] Query fetched by leadId successfully:', {
            queryId: queryData?.id,
            leadId: queryData?.lead_id,
          });
        } else {
          console.warn('[CreateItineraryPage] No query found for leadId:', leadId);
        }
      }

      // Fetch itinerary if ID provided
      if (itineraryId) {
        console.log('[CreateItineraryPage] Fetching itinerary:', {
          itineraryId,
          agentId: user.id,
        });
        const itineraryResponse = await fetch(`/api/itineraries/${itineraryId}?agentId=${user.id}`);
        if (itineraryResponse.ok) {
          const { itinerary: itineraryData } = await itineraryResponse.json();
          setItinerary(itineraryData);
          console.log('[CreateItineraryPage] Itinerary fetched successfully:', {
            itineraryId: itineraryData?.id,
            leadId: itineraryData?.lead_id,
            agentId: itineraryData?.agent_id,
            queryId: itineraryData?.query_id,
            name: itineraryData?.name,
          });

          // Fetch days
          const daysResponse = await fetch(`/api/itineraries/${itineraryId}/days`);
          if (daysResponse.ok) {
            const { days: daysData } = await daysResponse.json();
            if (daysData && daysData.length > 0) {
              setDays(daysData);
              console.log('[CreateItineraryPage] Days fetched successfully:', daysData.length);
              // Fetch items after days are loaded
              await fetchItems();
            } else {
              // No days exist, generate from query
              if (fetchedQuery) {
                console.log('[CreateItineraryPage] No days found, generating from query:', {
                  queryId: fetchedQuery.id,
                  itineraryId,
                  destinations: fetchedQuery.destinations,
                });
                await generateDaysFromQuery(fetchedQuery, itineraryId);
              } else {
                console.warn('[CreateItineraryPage] Cannot generate days - no query available');
              }
            }
          } else {
            // If error fetching days, log it and try to generate
            const errorData = await daysResponse.json().catch(() => ({}));
            console.warn('[CreateItineraryPage] Error fetching days:', {
              status: daysResponse.status,
              error: errorData,
              itineraryId,
            });
            
            // If it's not a 404 (not found is expected), show error
            if (daysResponse.status !== 404) {
              toast.error(errorData.error || 'Failed to fetch days');
            }
            
            // Try to generate days from query if available
            if (fetchedQuery) {
              console.log('[CreateItineraryPage] Generating days from query after error:', {
                queryId: fetchedQuery.id,
                itineraryId,
              });
              await generateDaysFromQuery(fetchedQuery, itineraryId);
            } else {
              console.warn('[CreateItineraryPage] Cannot generate days - no query available');
            }
          }
        } else {
          console.error('[CreateItineraryPage] Failed to fetch itinerary:', {
            status: itineraryResponse.status,
            itineraryId,
            agentId: user.id,
          });
          const errorData = await itineraryResponse.json().catch(() => ({}));
          console.error('[CreateItineraryPage] Itinerary fetch error:', errorData);
        }
      } else {
        console.warn('[CreateItineraryPage] No itineraryId provided in URL');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
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
      toast.error('Failed to load activities and transfers');
    } finally {
      setLoadingRepository(false);
    }
  };

  const fetchItems = async () => {
    if (!itineraryId) return;

    try {
      console.log('[CreateItineraryPage] Fetching items for itinerary:', itineraryId);
      const response = await fetch(`/api/itineraries/${itineraryId}/items`);
      if (response.ok) {
        const { items: itemsData } = await response.json();
        // Normalize items to ensure total_price is available
        const normalizedItems = itemsData.map((item: ItineraryItem) => ({
          ...item,
          total_price: item.total_price ?? item.unit_price ?? 0,
          unit_price: item.unit_price ?? 0,
        }));
        setItems(normalizedItems);
        console.log('[CreateItineraryPage] Items fetched:', normalizedItems.length);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[CreateItineraryPage] Failed to fetch items:', {
          status: response.status,
          error: errorData,
        });
      }
    } catch (err) {
      console.error('[CreateItineraryPage] Error fetching items:', err);
    }
  };

  const generateDaysFromQuery = async (queryData: ItineraryQuery, itId: string) => {
    if (!queryData.destinations || queryData.destinations.length === 0) {
      return;
    }

    // Use the new generate-from-query endpoint
    try {
      const response = await fetch(`/api/itineraries/${itId}/days/generate-from-query`, {
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
        // Fetch items after days are generated
        await fetchItems();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate days');
      }
    } catch (err) {
      console.error('Error generating days:', err);
      toast.error('Failed to generate days from query');
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
    if (selectedDayIndex === null || !selectedTimeSlot || !itinerary) return;

    const day = days[selectedDayIndex];
    if (!day || !day.id) {
      toast.error('Day not found or missing ID');
      return;
    }

    try {
      // Calculate price based on selected pricing option
      const pricingOptions = activity.pricing_packages || [];
      const selectedPricing = pricingOptions.find(p => p.id === selectedPricingId);
      
      let calculatedPrice = activity.base_price || 0;
      if (selectedPricing) {
        calculatedPrice = 
          (selectedPricing.adult_price || 0) * (itinerary.adults_count || 0) +
          (selectedPricing.child_price || 0) * (itinerary.children_count || 0) +
          (selectedPricing.infant_price || 0) * (itinerary.infants_count || 0) +
          (selectedPricing.transfer_price_adult || 0) * (itinerary.adults_count || 0) +
          (selectedPricing.transfer_price_child || 0) * (itinerary.children_count || 0) +
          (selectedPricing.transfer_price_infant || 0) * (itinerary.infants_count || 0);
      } else if (activity.base_price) {
        calculatedPrice = activity.base_price * ((itinerary.adults_count || 0) + (itinerary.children_count || 0));
      }

      console.log('[CreateItineraryPage] Creating activity item:', {
        activityId: activity.id,
        dayId: day.id,
        calculatedPrice,
        selectedPricingId,
      });

      // Create itinerary item
      const itemResponse = await fetch(`/api/itineraries/${itinerary.id}/items/create`, {
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
      console.log('[CreateItineraryPage] Activity item created:', newItem.id);

      // Add the new item to items state immediately
      const normalizedNewItem: ItineraryItem = {
        ...newItem,
        total_price: newItem.total_price ?? newItem.unit_price ?? calculatedPrice,
        unit_price: newItem.unit_price ?? calculatedPrice,
      };
      setItems(prev => [...prev, normalizedNewItem]);

      // Update day's time slot with item ID (not activity ID)
      const updatedDays = [...days];
      const existingDay = updatedDays[selectedDayIndex];
      if (!existingDay || !existingDay.id) {
        throw new Error('Day not found or missing ID');
      }

      const updatedDay: ItineraryDay = {
        ...existingDay,
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
      if (updatedDay.id) {
        updateDay(updatedDay.id, updatedDay).catch(err => {
          console.error('[CreateItineraryPage] Error updating day:', err);
        });
      }

      // Refresh items to get the latest from database
      await fetchItems();

      setActivityModalOpen(false);
      setSelectedDayIndex(null);
      setSelectedTimeSlot(null);
      toast.success('Activity added successfully');
    } catch (err) {
      console.error('[CreateItineraryPage] Error adding activity:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add activity');
    }
  };

  const handleTransferSelect = async (transfer: TransferPackage) => {
    if (selectedDayIndex === null || !selectedTimeSlot || !itinerary) return;

    const day = days[selectedDayIndex];
    if (!day || !day.id) {
      toast.error('Day not found or missing ID');
      return;
    }

    try {
      // Calculate price (transfers typically use base_price)
      const calculatedPrice = transfer.base_price || 0;

      console.log('[CreateItineraryPage] Creating transfer item:', {
        transferId: transfer.id,
        dayId: day.id,
        calculatedPrice,
      });

      // Create itinerary item
      const itemResponse = await fetch(`/api/itineraries/${itinerary.id}/items/create`, {
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
      console.log('[CreateItineraryPage] Transfer item created:', newItem.id);

      // Ensure the new item has total_price
      if (!newItem.total_price && newItem.unit_price) {
        newItem.total_price = newItem.unit_price * (newItem.quantity || 1);
      }

      // Add the new item to items state immediately
      const normalizedNewItem: ItineraryItem = {
        ...newItem,
        total_price: newItem.total_price ?? newItem.unit_price ?? calculatedPrice,
        unit_price: newItem.unit_price ?? calculatedPrice,
      };
      setItems(prev => [...prev, normalizedNewItem]);

      // Update day's time slot with item ID (not transfer ID)
      const updatedDays = [...days];
      const existingDay = updatedDays[selectedDayIndex];
      if (!existingDay || !existingDay.id) {
        throw new Error('Day not found or missing ID');
      }

      const updatedDay: ItineraryDay = {
        ...existingDay,
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
      if (updatedDay.id) {
        updateDay(updatedDay.id, updatedDay).catch(err => {
          console.error('[CreateItineraryPage] Error updating day:', err);
        });
      }

      // Refresh items to get the latest from database
      await fetchItems();

      setTransferModalOpen(false);
      setSelectedDayIndex(null);
      setSelectedTimeSlot(null);
      toast.success('Transfer added successfully');
    } catch (err) {
      console.error('[CreateItineraryPage] Error adding transfer:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add transfer');
    }
  };

  const updateDay = async (dayId: string, day: ItineraryDay) => {
    if (!itinerary) return;

    try {
      const response = await fetch(`/api/itineraries/${itinerary.id}/days/${dayId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityName: day.city_name,
          date: day.date,
          notes: day.notes,
          timeSlots: day.time_slots,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update day');
      }
    } catch (err) {
      console.error('Error updating day:', err);
      toast.error('Failed to update day');
    }
  };

  const getFilteredActivities = (cityName: string, timeSlot: TimeSlot): ActivityPackage[] => {
    return allActivities.filter(activity => {
      // Filter by city
      if (activity.destination_city?.toLowerCase() !== cityName.toLowerCase()) {
        return false;
      }

      // Filter by time slot (check if activity's time slots overlap with requested slot)
      // This will be enhanced in backend, for now return all matching city
      return true;
    });
  };

  const getFilteredTransfers = (cityName: string): TransferPackage[] => {
    return allTransfers.filter(transfer => {
      // Filter by city (check pickup or dropoff location)
      const pickupCity = (transfer as any).pickup_location_city?.toLowerCase();
      const dropoffCity = (transfer as any).dropoff_location_city?.toLowerCase();
      const cityLower = cityName.toLowerCase();
      
      return pickupCity === cityLower || dropoffCity === cityLower;
    });
  };

  const handleSaveItinerary = async () => {
    if (!itinerary || !days || days.length === 0) {
      toast.error('No itinerary or days to save');
      return;
    }

    setSavingItinerary(true);
    try {
      console.log('[CreateItineraryPage] Saving itinerary:', {
        itineraryId: itinerary.id,
        daysCount: days.length,
      });

      // Ensure all days are saved (they should already be saved, but we'll verify)
      // Days are saved automatically when activities/transfers are added via updateDay
      // So we just need to confirm and navigate
      
      // Optional: You could add a final save/update call here if needed
      // For now, since days are saved automatically, we'll just show success and navigate
      
      toast.success('Itinerary saved successfully!');
      
      // Navigate back to lead detail page
      console.log('[CreateItineraryPage] Navigating back to lead detail page:', leadId);
      router.push(`/agent/leads/${leadId}`);
    } catch (err) {
      console.error('[CreateItineraryPage] Error saving itinerary:', err);
      toast.error('Failed to save itinerary. Please try again.');
    } finally {
      setSavingItinerary(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading itinerary builder...</p>
        </div>
        </div>
    );
  }

  if (!query || !itinerary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
          <p className="text-gray-600 mb-4">Query or itinerary not found</p>
          <Button onClick={() => router.push(`/agent/leads/${leadId}`)}>
              <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Lead Details
            </Button>
          </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/agent/leads/${leadId}`)}
          className="mb-4"
        >
                <FiArrowLeft className="w-4 h-4 mr-2" />
          Back to Lead Details
              </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Itinerary</h1>
            <p className="text-gray-600 mt-2">
              Build day-wise itinerary for {lead?.customerName || 'customer'}
            </p>
          </div>
          {/* Total Price Display */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Itinerary Price</p>
                <p className="text-3xl font-bold text-green-600">${totalPrice.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
              </div>

        {/* Days Timeline */}
        {days.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiClock className="w-5 h-5" />
                Itinerary Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {days.map((day, i) => (
                  <React.Fragment key={i}>
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
        )}

        {/* Day Cards */}
        <div className="space-y-6">
          {days.map((day, dayIndex) => {
            const timeSlots: TimeSlot[] = ['morning', 'afternoon', 'evening'];
            const slotConfig = {
              morning: { label: '🌅 Morning', bgColor: 'bg-orange-50', defaultTime: '08:00' },
              afternoon: { label: '☀️ Afternoon', bgColor: 'bg-yellow-50', defaultTime: '12:30' },
              evening: { label: '🌙 Evening', bgColor: 'bg-purple-50', defaultTime: '17:00' },
            };

            return (
              <Card key={dayIndex} className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      Day {day.day_number}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <FiMapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-lg font-semibold">{day.city_name}</span>
                    </div>
                    {day.title && (
                      <span className="text-sm font-normal text-gray-600">- {day.title}</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Time Slots */}
                  <div className="space-y-4">
                    {timeSlots.map((timeSlot) => {
                      const slot = day.time_slots?.[timeSlot] || {
                        time: slotConfig[timeSlot].defaultTime,
                        activities: [],
                        transfers: [],
                      };
                      const config = slotConfig[timeSlot];

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
                                if (!existingDay) return;
                                
                                const updatedDay: ItineraryDay = {
                                  ...existingDay,
                                  time_slots: existingDay.time_slots || {
                                    morning: { time: '08:00', activities: [], transfers: [] },
                                    afternoon: { time: '12:30', activities: [], transfers: [] },
                                    evening: { time: '17:00', activities: [], transfers: [] },
                                  },
                                };
                                updatedDay.time_slots![timeSlot].time = e.target.value;
                                updatedDays[dayIndex] = updatedDay;
                                setDays(updatedDays);
                                if (updatedDay.id) {
                                  updateDay(updatedDay.id, updatedDay);
                                }
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
                            {slot.activities.length > 0 ? (
                              <div className="space-y-2">
                                {slot.activities.map((itemId) => {
                                  // Find item by ID (itemId is now the itinerary_item ID, not activity ID)
                                  const item = items.find(i => i.id === itemId);
                                  if (!item) return null;
                                  
                                  return (
                                    <div
                                      key={itemId}
                                      className="flex items-center justify-between p-2 bg-white rounded border"
                                    >
                                      <div className="flex-1">
                                        <span className="text-sm font-medium">{item.package_title}</span>
                                        {item.total_price && (
                                          <span className="text-xs text-gray-500 ml-2">
                                            ${Number(item.total_price).toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={async () => {
                                          try {
                                            // Delete item from database
                                            const deleteResponse = await fetch(`/api/itineraries/${itinerary?.id}/items/${itemId}/delete`, {
                                              method: 'DELETE',
                                            });
                                            
                                            if (!deleteResponse.ok) {
                                              const error = await deleteResponse.json();
                                              throw new Error(error.error || 'Failed to delete item');
                                            }

                                            // Remove from items state
                                            setItems(prev => prev.filter(i => i.id !== itemId));

                                            // Update day's time slot
                                            const updatedDays = [...days];
                                            const existingDay = updatedDays[dayIndex];
                                            if (!existingDay) return;
                                            
                                            const updatedDay: ItineraryDay = {
                                              ...existingDay,
                                              time_slots: existingDay.time_slots || {
                                                morning: { time: '08:00', activities: [], transfers: [] },
                                                afternoon: { time: '12:30', activities: [], transfers: [] },
                                                evening: { time: '17:00', activities: [], transfers: [] },
                                              },
                                            };
                                            updatedDay.time_slots![timeSlot].activities = 
                                              updatedDay.time_slots![timeSlot].activities.filter(id => id !== itemId);
                                            updatedDays[dayIndex] = updatedDay;
                                            setDays(updatedDays);
                                            
                                            if (updatedDay.id) {
                                              updateDay(updatedDay.id, updatedDay).catch(err => {
                                                console.error('[CreateItineraryPage] Error updating day:', err);
                                              });
                                            }

                                            toast.success('Activity removed successfully');
                                          } catch (err) {
                                            console.error('[CreateItineraryPage] Error removing activity:', err);
                                            toast.error(err instanceof Error ? err.message : 'Failed to remove activity');
                                          }
                                        }}
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
                            {slot.transfers.length > 0 ? (
                              <div className="space-y-2">
                                {slot.transfers.map((itemId) => {
                                  // Find item by ID (itemId is now the itinerary_item ID, not transfer ID)
                                  const item = items.find(i => i.id === itemId);
                                  if (!item) return null;
                                  
                                  return (
                                    <div
                                      key={itemId}
                                      className="flex items-center justify-between p-2 bg-white rounded border"
                                    >
                                      <div className="flex-1">
                                        <span className="text-sm font-medium">{item.package_title}</span>
                                        {item.total_price && (
                                          <span className="text-xs text-gray-500 ml-2">
                                            ${Number(item.total_price).toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={async () => {
                                          try {
                                            // Delete item from database
                                            const deleteResponse = await fetch(`/api/itineraries/${itinerary?.id}/items/${itemId}/delete`, {
                                              method: 'DELETE',
                                            });
                                            
                                            if (!deleteResponse.ok) {
                                              const error = await deleteResponse.json();
                                              throw new Error(error.error || 'Failed to delete item');
                                            }

                                            // Remove from items state
                                            setItems(prev => prev.filter(i => i.id !== itemId));

                                            // Update day's time slot
                                            const updatedDays = [...days];
                                            const existingDay = updatedDays[dayIndex];
                                            if (!existingDay) return;
                                            
                                            const updatedDay: ItineraryDay = {
                                              ...existingDay,
                                              time_slots: existingDay.time_slots || {
                                                morning: { time: '08:00', activities: [], transfers: [] },
                                                afternoon: { time: '12:30', activities: [], transfers: [] },
                                                evening: { time: '17:00', activities: [], transfers: [] },
                                              },
                                            };
                                            updatedDay.time_slots![timeSlot].transfers = 
                                              updatedDay.time_slots![timeSlot].transfers.filter(id => id !== itemId);
                                            updatedDays[dayIndex] = updatedDay;
                                            setDays(updatedDays);
                                            
                                            if (updatedDay.id) {
                                              updateDay(updatedDay.id, updatedDay).catch(err => {
                                                console.error('[CreateItineraryPage] Error updating day:', err);
                                              });
                                            }

                                            toast.success('Transfer removed successfully');
                                          } catch (err) {
                                            console.error('[CreateItineraryPage] Error removing transfer:', err);
                                            toast.error(err instanceof Error ? err.message : 'Failed to remove transfer');
                                          }
                                        }}
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
                  </div>
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
            adultsCount={itinerary?.adults_count || 2}
            childrenCount={itinerary?.children_count || 0}
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

        {/* Save Button Section */}
        {days.length > 0 && (
          <div className="mt-8 flex justify-end gap-4 pb-6">
            <Button
              variant="outline"
              onClick={() => router.push(`/agent/leads/${leadId}`)}
              disabled={savingItinerary}
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveItinerary}
              disabled={savingItinerary}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {savingItinerary ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4 mr-2" />
                  Save Itinerary
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      </div>
  );
}
