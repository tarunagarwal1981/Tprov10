'use client';

import React, { useState, useEffect } from 'react';
import { FiCalendar, FiMapPin, FiClock, FiCoffee, FiHome, FiPlus, FiX, FiEdit2, FiEye, FiPackage } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import { getAvailableTimeSlots, type TimeSlot } from '@/lib/utils/timeSlots';
import { ActivitySelectorModal } from './ActivitySelectorModal';
import { TransferSelectorModal } from './TransferSelectorModal';
import { HotelSelectorModal } from './HotelSelectorModal';
import { FlightEntryModal } from './FlightEntryModal';
import { ArrivalDetailsModal } from './ArrivalDetailsModal';

interface ItineraryDay {
  id: string;
  day_number: number;
  date: string | null;
  city_name: string | null;
  arrival_flight_id?: string | null;
  arrival_time?: string | null;
  departure_flight_id?: string | null;
  departure_time?: string | null;
  hotel_id?: string | null;
  hotel_name?: string | null;
  hotel_star_rating?: number | null;
  room_type?: string | null;
  meal_plan?: string | null;
  time_slots?: {
    morning: { time: string; activities: string[]; transfers: string[] };
    afternoon: { time: string; activities: string[]; transfers: string[] };
    evening: { time: string; activities: string[]; transfers: string[] };
  };
  lunch_included?: boolean;
  lunch_details?: string | null;
  dinner_included?: boolean;
  dinner_details?: string | null;
  arrival_description?: string | null;
  notes?: string | null;
}

interface ItineraryItem {
  id: string;
  itinerary_id?: string;
  day_id: string | null;
  package_type: 'activity' | 'transfer' | 'multi_city' | 'multi_city_hotel' | 'fixed_departure';
  package_id: string;
  operator_id: string;
  package_title: string;
  package_image_url: string | null;
  configuration: any;
  unit_price: number;
  quantity: number;
  total_price: number;
  display_order: number;
  notes?: string | null;
}

interface EnhancedItineraryBuilderProps {
  itineraryId: string;
  days: ItineraryDay[];
  items: ItineraryItem[];
  onDaysChange: (days: ItineraryDay[]) => void;
  onItemsChange: (items: ItineraryItem[]) => void;
  onEditPackage?: (itemId: string) => void;
}

export function EnhancedItineraryBuilder({
  itineraryId,
  days,
  items,
  onDaysChange,
  onItemsChange,
  onEditPackage,
}: EnhancedItineraryBuilderProps) {
  const supabase = createClient();
  // filterService methods now accessed via API routes

  const [selectedDay, setSelectedDay] = useState<ItineraryDay | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [enableSuggestions, setEnableSuggestions] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDayItems = (dayId: string) => {
    return items.filter(item => item.day_id === dayId);
  };

  const getTimeSlotItems = (day: ItineraryDay, timeSlot: TimeSlot) => {
    const dayItems = getDayItems(day.id);
    const timeSlotData = day.time_slots?.[timeSlot];
    if (!timeSlotData) return [];

    const activityIds = timeSlotData.activities || [];
    const transferIds = timeSlotData.transfers || [];

    return dayItems.filter(item => 
      activityIds.includes(item.id) || transferIds.includes(item.id)
    );
  };

  const handleAddActivity = (day: ItineraryDay, timeSlot: TimeSlot) => {
    setSelectedDay(day);
    setSelectedTimeSlot(timeSlot);
    setShowActivityModal(true);
  };

  const handleAddTransfer = (day: ItineraryDay, timeSlot: TimeSlot) => {
    setSelectedDay(day);
    setSelectedTimeSlot(timeSlot);
    setShowTransferModal(true);
  };

  const handleActivitySelected = async (activity: any) => {
    if (!selectedDay || !selectedTimeSlot) return;

    // Create itinerary item
    const { data: item, error } = await supabase
      .from('itinerary_items' as any)
      .insert({
        itinerary_id: itineraryId,
        day_id: selectedDay.id,
        package_type: 'activity',
        package_id: activity.id,
        operator_id: activity.operator_id,
        package_title: activity.title,
        package_image_url: activity.featured_image_url,
        configuration: {},
        unit_price: activity.base_price || 0,
        quantity: 1,
        total_price: activity.base_price || 0,
        display_order: items.length,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding activity:', error);
      return;
    }

    // Update day's time slot
    const updatedDays = days.map(d => {
      if (d.id === selectedDay.id) {
        const timeSlots = d.time_slots || {
          morning: { time: '', activities: [], transfers: [] },
          afternoon: { time: '', activities: [], transfers: [] },
          evening: { time: '', activities: [], transfers: [] },
        };
        
        timeSlots[selectedTimeSlot].activities.push((item as unknown as ItineraryItem).id);
        
        return {
          ...d,
          time_slots: timeSlots,
        };
      }
      return d;
    });

    // Update day in database
    await supabase
      .from('itinerary_days' as any)
      .update({ time_slots: updatedDays.find(d => d.id === selectedDay.id)?.time_slots })
      .eq('id', selectedDay.id);

    onDaysChange(updatedDays);
    onItemsChange([...items, item as unknown as ItineraryItem]);
    setShowActivityModal(false);
    setSelectedDay(null);
    setSelectedTimeSlot(null);
  };

  const getUnassignedItems = () => {
    return items.filter(item => !item.day_id);
  };

  const handleCreateFirstDay = async () => {
    try {
      const { data, error } = await supabase
        .from('itinerary_days' as any)
        .insert({
          itinerary_id: itineraryId,
          day_number: 1,
          display_order: 1,
          time_slots: {
            morning: { time: '', activities: [], transfers: [] },
            afternoon: { time: '', activities: [], transfers: [] },
            evening: { time: '', activities: [], transfers: [] },
          },
        })
        .select()
        .single();

      if (error) throw error;

      onDaysChange([data as unknown as ItineraryDay]);
    } catch (err) {
      console.error('Error creating first day:', err);
    }
  };

  const unassignedItems = getUnassignedItems();

  return (
    <div className="space-y-6">
      {/* Auto-suggestions toggle */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-700">Smart Suggestions</p>
          <p className="text-xs text-gray-500">Get activity recommendations based on arrival time and location</p>
        </div>
        <Button
          variant={enableSuggestions ? 'default' : 'outline'}
          size="sm"
          onClick={() => setEnableSuggestions(!enableSuggestions)}
        >
          {enableSuggestions ? 'Enabled' : 'Enable'}
        </Button>
      </div>

      {/* Show unassigned items or empty state when no days exist */}
      {days.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            {unassignedItems.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    You have {unassignedItems.length} package{unassignedItems.length > 1 ? 's' : ''} ready to assign
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create your first day to start organizing your itinerary
                  </p>
                </div>
                <Button onClick={handleCreateFirstDay} className="mb-6">
                  <FiPlus className="w-4 h-4 mr-2" />
                  Create First Day
                </Button>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 text-left">Unassigned Packages:</p>
                  {unassignedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-3 text-left"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{item.package_title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.package_type === 'activity' ? 'Activity' : 
                           item.package_type === 'transfer' ? 'Transfer' :
                           item.package_type === 'multi_city' ? 'Multi-City' :
                           item.package_type === 'multi_city_hotel' ? 'Multi-City Hotel' :
                           'Fixed Departure'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        ${item.total_price.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <FiCalendar className="w-12 h-12 mx-auto text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900">No days created yet</h3>
                <p className="text-sm text-gray-600">
                  Create your first day to start building your itinerary
                </p>
                <Button onClick={handleCreateFirstDay}>
                  <FiPlus className="w-4 h-4 mr-2" />
                  Create First Day
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Days */}
      {days.map((day, index) => {
        const isFirstDay = index === 0;
        const isLastDay = index === days.length - 1;
        const availableTimeSlots = isFirstDay && day.arrival_time
          ? getAvailableTimeSlots(day.arrival_time)
          : ['morning', 'afternoon', 'evening'] as TimeSlot[];

        return (
          <Card key={day.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {day.day_number}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Day {day.day_number}: {formatDate(day.date)}
                    </h3>
                    {day.city_name && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <FiMapPin className="w-4 h-4" />
                        {day.city_name}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <FiEdit2 className="w-4 h-4 mr-2" />
                  Change Day
                </Button>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Arrival Section (First Day Only) */}
              {isFirstDay && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Arrival in {day.city_name}</h4>
                      {!day.arrival_time && (
                        <p className="text-sm text-red-600 font-medium">Arrival information is missing</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDay(day);
                        setShowArrivalModal(true);
                      }}
                    >
                      {day.arrival_time ? 'Update' : 'Add'} Arrival Details
                    </Button>
                  </div>
                  {day.arrival_description && (
                    <p className="text-sm text-gray-700">{day.arrival_description}</p>
                  )}
                </div>
              )}

              {/* Time Slots */}
              <div className="space-y-4">
                {(['morning', 'afternoon', 'evening'] as TimeSlot[]).map((timeSlot) => {
                  const isAvailable = availableTimeSlots.includes(timeSlot);
                  const timeSlotItems = getTimeSlotItems(day, timeSlot);
                  const timeSlotData = day.time_slots?.[timeSlot];

                  return (
                    <div key={timeSlot} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-gray-900 capitalize">{timeSlot}</h5>
                        {!isAvailable && isFirstDay && (
                          <Badge variant="secondary" className="text-xs">
                            Not available (arrival time)
                          </Badge>
                        )}
                      </div>

                      {/* Activities and Transfers */}
                      <div className="space-y-2 mb-3">
                        {timeSlotItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">{item.package_title}</p>
                              {item.configuration?.start_time && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Starts at {item.configuration.start_time}
                                  {item.configuration.duration && ` (Duration: ${item.configuration.duration})`}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {item.package_type === 'activity' ? 'Activity' : 'Transfer'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Remove item logic
                                }}
                              >
                                <FiX className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Buttons */}
                      {isAvailable && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddActivity(day, timeSlot)}
                            className="flex-1"
                          >
                            <FiPlus className="w-4 h-4 mr-2" />
                            Add Activity
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddTransfer(day, timeSlot)}
                            className="flex-1"
                          >
                            <FiPlus className="w-4 h-4 mr-2" />
                            Add Transfer
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* Meals */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FiCoffee className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">Lunch</span>
                  </div>
                  {day.lunch_included ? (
                    <Badge variant="default" className="text-xs">Included</Badge>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-xs">
                      + Add
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FiCoffee className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">Dinner</span>
                  </div>
                  {day.dinner_included ? (
                    <Badge variant="default" className="text-xs">Included</Badge>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-xs">
                      + Add
                    </Button>
                  )}
                </div>
              </div>

              {/* Accommodation */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <FiHome className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Overnight stay at {day.hotel_name || 'No hotel selected'}
                    </p>
                    {day.hotel_star_rating && (
                      <p className="text-xs text-gray-600 mt-1">
                        {day.hotel_star_rating} star • {day.room_type || 'Standard Room'} • {day.meal_plan || 'Room Only'}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDay(day);
                    setShowHotelModal(true);
                  }}
                >
                  {day.hotel_name ? 'Change' : 'Select'} Hotel
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button variant="outline" size="sm">
                  Change Day
                </Button>
                {isFirstDay && (
                  <Button variant="outline" size="sm">
                    Change Arrival in {day.city_name}
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  Add Activity in {day.city_name}
                </Button>
                {!isLastDay && (
                  <Button variant="outline" size="sm">
                    Change Transfer to {days[index + 1]?.city_name}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Unassigned Items Section (when days exist but items are unassigned) */}
      {days.length > 0 && unassignedItems.length > 0 && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardHeader className="bg-amber-100 border-b border-amber-200">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiPackage className="w-5 h-5 text-amber-700" />
                <h3 className="text-lg font-bold text-gray-900">
                  Unassigned Packages ({unassignedItems.length})
                </h3>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              These packages have been added to your itinerary but haven&apos;t been assigned to a specific day yet.
            </p>
            <div className="space-y-3">
              {unassignedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {item.package_image_url && (
                      <img
                        src={item.package_image_url}
                        alt={item.package_title}
                        className="w-16 h-16 rounded-md object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{item.package_title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {item.package_type === 'activity' ? 'Activity' : 
                           item.package_type === 'transfer' ? 'Transfer' :
                           item.package_type === 'multi_city' ? 'Multi-City' :
                           item.package_type === 'multi_city_hotel' ? 'Multi-City Hotel' :
                           'Fixed Departure'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-green-600">
                      ${item.total_price.toFixed(2)}
                    </span>
                    {(item.package_type === 'multi_city' || item.package_type === 'multi_city_hotel') ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          if (onEditPackage) {
                            onEditPackage(item.id);
                          } else {
                            window.location.href = `/agent/itineraries/${itineraryId}/configure/${item.id}`;
                          }
                        }}
                      >
                        <FiEdit2 className="w-4 h-4 mr-2" />
                        {item.configuration?.selectedHotels || item.configuration?.activities || item.configuration?.transfers
                          ? 'Edit Configuration'
                          : 'Configure Package'}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          // Assign to first day by default (user can change later)
                          if (days.length > 0 && days[0]) {
                            const firstDay = days[0];
                            try {
                              const { error } = await supabase
                                .from('itinerary_items' as any)
                                .update({ day_id: firstDay.id })
                                .eq('id', item.id);
                              
                              if (error) throw error;
                              
                              onItemsChange(items.map(i => 
                                i.id === item.id ? { ...i, day_id: firstDay.id } : i
                              ));
                            } catch (err) {
                              console.error('Error assigning item:', err);
                            }
                          }
                        }}
                      >
                        Assign to Day {days[0]?.day_number || 1}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showActivityModal && selectedDay && selectedTimeSlot && (
        <ActivitySelectorModal
          isOpen={showActivityModal}
          onClose={() => {
            setShowActivityModal(false);
            setSelectedDay(null);
            setSelectedTimeSlot(null);
          }}
          cityName={selectedDay.city_name || ''}
          timeSlot={selectedTimeSlot}
          arrivalTime={selectedDay.arrival_time || null}
          enableSuggestions={enableSuggestions}
          onSelect={handleActivitySelected}
        />
      )}

      {showTransferModal && selectedDay && selectedTimeSlot && (
        <TransferSelectorModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedDay(null);
            setSelectedTimeSlot(null);
          }}
          fromCity={selectedDay.city_name || ''}
          toCity={days.find(d => d.day_number === selectedDay.day_number + 1)?.city_name || ''}
          onSelect={(transfer) => {
            // Handle transfer selection
            setShowTransferModal(false);
          }}
        />
      )}

      {showHotelModal && selectedDay && (
        <HotelSelectorModal
          isOpen={showHotelModal}
          onClose={() => {
            setShowHotelModal(false);
            setSelectedDay(null);
          }}
          cityName={selectedDay.city_name || ''}
          starRating={undefined} // From query
          onSelect={(hotel) => {
            // Handle hotel selection
            setShowHotelModal(false);
          }}
        />
      )}

      {showArrivalModal && selectedDay && (
        <ArrivalDetailsModal
          isOpen={showArrivalModal}
          onClose={() => {
            setShowArrivalModal(false);
            setSelectedDay(null);
          }}
          day={selectedDay}
          onSave={(arrivalData) => {
            // Handle arrival data save
            setShowArrivalModal(false);
          }}
        />
      )}
    </div>
  );
}

