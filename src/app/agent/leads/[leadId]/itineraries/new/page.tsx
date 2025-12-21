'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FiArrowLeft, FiClock, FiPlus, FiX, FiMapPin } from 'react-icons/fi';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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
      fetchData();
      fetchRepository();
    }
  }, [leadId, user?.id, queryId, itineraryId]);

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

      // Fetch query
      let fetchedQuery: ItineraryQuery | null = null;
      const queryResponse = await fetch(`/api/queries/${queryId || leadId}`);
      if (queryResponse.ok) {
        const { query: queryData } = await queryResponse.json();
        fetchedQuery = queryData;
        setQuery(queryData);
      }

      // Fetch itinerary if ID provided
      if (itineraryId) {
        const itineraryResponse = await fetch(`/api/itineraries/${itineraryId}?agentId=${user.id}`);
        if (itineraryResponse.ok) {
          const { itinerary: itineraryData } = await itineraryResponse.json();
          setItinerary(itineraryData);

          // Fetch days
          const daysResponse = await fetch(`/api/itineraries/${itineraryId}/days`);
          if (daysResponse.ok) {
            const { days: daysData } = await daysResponse.json();
            if (daysData && daysData.length > 0) {
              setDays(daysData);
            } else {
              // No days exist, generate from query
              if (fetchedQuery) {
                await generateDaysFromQuery(fetchedQuery, itineraryId);
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
              await generateDaysFromQuery(fetchedQuery, itineraryId);
            }
          }
        }
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
    if (!day) return;

    // Update day's time slot with activity
    const updatedDays = [...days];
    const existingDay = updatedDays[selectedDayIndex];
    if (!existingDay) return;
    
    const updatedDay: ItineraryDay = {
      ...existingDay,
      time_slots: existingDay.time_slots || {
        morning: { time: '08:00', activities: [], transfers: [] },
        afternoon: { time: '12:30', activities: [], transfers: [] },
        evening: { time: '17:00', activities: [], transfers: [] },
      },
    };

    const timeSlots = updatedDay.time_slots!;
    const currentActivities = timeSlots[selectedTimeSlot].activities || [];
    if (!currentActivities.includes(activity.id)) {
      timeSlots[selectedTimeSlot].activities = [...currentActivities, activity.id];
    }

    updatedDays[selectedDayIndex] = updatedDay;
    setDays(updatedDays);

    // Update day via API
    if (updatedDay.id) {
      await updateDay(updatedDay.id, updatedDay);
    }

    setActivityModalOpen(false);
    setSelectedDayIndex(null);
    setSelectedTimeSlot(null);
    toast.success('Activity added successfully');
  };

  const handleTransferSelect = async (transfer: TransferPackage) => {
    if (selectedDayIndex === null || !selectedTimeSlot || !itinerary) return;

    const day = days[selectedDayIndex];
    if (!day) return;

    // Update day's time slot with transfer
    const updatedDays = [...days];
    const existingDay = updatedDays[selectedDayIndex];
    if (!existingDay) return;
    
    const updatedDay: ItineraryDay = {
      ...existingDay,
      time_slots: existingDay.time_slots || {
        morning: { time: '08:00', activities: [], transfers: [] },
        afternoon: { time: '12:30', activities: [], transfers: [] },
        evening: { time: '17:00', activities: [], transfers: [] },
      },
    };

    const timeSlots = updatedDay.time_slots!;
    const currentTransfers = timeSlots[selectedTimeSlot].transfers || [];
    if (!currentTransfers.includes(transfer.id)) {
      timeSlots[selectedTimeSlot].transfers = [...currentTransfers, transfer.id];
    }

    updatedDays[selectedDayIndex] = updatedDay;
    setDays(updatedDays);

    // Update day via API
    if (updatedDay.id) {
      await updateDay(updatedDay.id, updatedDay);
    }

    setTransferModalOpen(false);
    setSelectedDayIndex(null);
    setSelectedTimeSlot(null);
    toast.success('Transfer added successfully');
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
        <h1 className="text-2xl font-bold text-gray-900">Create Itinerary</h1>
        <p className="text-gray-600 mt-2">
            Build day-wise itinerary for {lead?.customerName || 'customer'}
        </p>
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
                                {slot.activities.map((activityId) => {
                                  const activity = allActivities.find(a => a.id === activityId);
                                  return activity ? (
                                    <div
                                      key={activityId}
                                      className="flex items-center justify-between p-2 bg-white rounded border"
                                    >
                                      <span className="text-sm">{activity.title}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
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
                                            updatedDay.time_slots![timeSlot].activities.filter(id => id !== activityId);
                                          updatedDays[dayIndex] = updatedDay;
                                          setDays(updatedDays);
                                          if (updatedDay.id) {
                                            updateDay(updatedDay.id, updatedDay);
                                          }
                                        }}
                                      >
                                        <FiX className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ) : null;
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
                                {slot.transfers.map((transferId) => {
                                  const transfer = allTransfers.find(t => t.id === transferId);
                                  return transfer ? (
                                    <div
                                      key={transferId}
                                      className="flex items-center justify-between p-2 bg-white rounded border"
                                    >
                                      <span className="text-sm">{transfer.title}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
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
                                            updatedDay.time_slots![timeSlot].transfers.filter(id => id !== transferId);
                                          updatedDays[dayIndex] = updatedDay;
                                          setDays(updatedDays);
                                          if (updatedDay.id) {
                                            updateDay(updatedDay.id, updatedDay);
                                          }
                                        }}
                                      >
                                        <FiX className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ) : null;
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
      </div>
      </div>
  );
}
