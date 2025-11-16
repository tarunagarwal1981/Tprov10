'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiMapPin, FiClock, FiDollarSign, FiStar, FiLoader } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { SmartItineraryFilter, TimeSlot, ActivityPackage, ActivityPricingPackage } from '@/lib/services/smartItineraryFilter';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ActivitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityName: string;
  timeSlot: TimeSlot;
  arrivalTime: string | null;
  enableSuggestions: boolean;
  operatorId?: string; // Filter by tour operator
  adultsCount?: number; // Number of adults for price calculation
  childrenCount?: number; // Number of children for price calculation
  onSelect: (activity: ActivityPackage, selectedPricingId?: string) => void;
}

export function ActivitySelectorModal({
  isOpen,
  onClose,
  cityName,
  timeSlot,
  arrivalTime,
  enableSuggestions,
  operatorId,
  adultsCount = 1,
  childrenCount = 0,
  onSelect,
}: ActivitySelectorModalProps) {
  const supabase = createClient();
  const filterService = new SmartItineraryFilter();

  const [activities, setActivities] = useState<ActivityPackage[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPricing, setSelectedPricing] = useState<Record<string, string>>({}); // activityId -> pricingId

  useEffect(() => {
    if (isOpen && cityName) {
      fetchActivities();
    }
  }, [isOpen, cityName]); // Removed operatorId from dependencies

  useEffect(() => {
    filterActivities();
  }, [activities, searchQuery, timeSlot, arrivalTime, enableSuggestions]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      console.log('[ActivitySelectorModal] Fetching activities for:', { cityName });
      // Fetch all published activities from all operators for this city
      const cityActivities = await filterService.getActivitiesForCity(cityName);
      console.log('[ActivitySelectorModal] Found activities:', cityActivities.length);
      setActivities(cityActivities);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = [...activities];

    // Filter by time slot availability
    filtered = filterService.filterActivitiesByTimeSlot(filtered, timeSlot);

    // Filter by arrival time if enabled
    if (enableSuggestions && arrivalTime) {
      const availableSlots = filterService.getAvailableTimeSlots(arrivalTime);
      if (!availableSlots.includes(timeSlot)) {
        filtered = [];
      } else {
        // Filter by duration
        filtered = filterService.filterByDuration(filtered, timeSlot, arrivalTime);
      }
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredActivities(filtered);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Select Activity for {cityName} - {timeSlot}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <FiX className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />

          {/* Info Banner */}
          {enableSuggestions && arrivalTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Smart Filtering:</strong> Showing activities available in {timeSlot} slot based on arrival time {arrivalTime}
              </p>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading activities...</span>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 font-medium">No activity packages available for {cityName}</p>
              <p className="text-sm text-gray-500 mt-2">
                No published activity packages found for this city.
                {enableSuggestions && arrivalTime && " Try a different time slot or disable smart suggestions."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredActivities.map((activity) => {
                const pricingOptions = activity.pricing_packages || [];
                const selectedPricingId = selectedPricing[activity.id];
                const selectedPricingOption = pricingOptions.find(p => p.id === selectedPricingId);
                
                // Calculate total price based on selected pricing option
                const calculateTotalPrice = (pricing: ActivityPricingPackage | undefined) => {
                  if (!pricing) {
                    return activity.base_price || 0;
                  }
                  const adultTotal = (pricing.adult_price || 0) * (adultsCount || 0);
                  const childTotal = (pricing.child_price || 0) * (childrenCount || 0);
                  const transferAdult = (pricing.transfer_price_adult || 0) * (adultsCount || 0);
                  const transferChild = (pricing.transfer_price_child || 0) * (childrenCount || 0);
                  return adultTotal + childTotal + transferAdult + transferChild;
                };
                
                const totalPrice = calculateTotalPrice(selectedPricingOption);

                return (
                  <Card
                    key={activity.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    {activity.featured_image_url && (
                      <div className="h-48 overflow-hidden rounded-t-lg">
                        <img
                          src={activity.featured_image_url}
                          alt={activity.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {activity.title}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FiMapPin className="w-4 h-4" />
                          <span>{activity.destination_city}</span>
                        </div>
                        {(activity.duration_hours || activity.duration_minutes) && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiClock className="w-4 h-4" />
                            <span>
                              {activity.duration_hours && `${activity.duration_hours}h `}
                              {activity.duration_minutes && `${activity.duration_minutes}m`}
                            </span>
                          </div>
                        )}
                        
                        {/* Pricing Options */}
                        {pricingOptions.length > 0 ? (
                          <div className="pt-2 border-t space-y-2">
                            <Label className="text-sm font-medium">Select Pricing Option</Label>
                            <RadioGroup
                              value={selectedPricingId || ''}
                              onValueChange={(value) => {
                                setSelectedPricing(prev => ({ ...prev, [activity.id]: value }));
                              }}
                            >
                              {pricingOptions.map((pricing) => {
                                const optionTotal = calculateTotalPrice(pricing);
                                return (
                                  <div key={pricing.id} className="flex items-start space-x-2 p-2 border rounded hover:bg-gray-50">
                                    <RadioGroupItem value={pricing.id} id={`pricing-${pricing.id}`} className="mt-1" />
                                    <Label htmlFor={`pricing-${pricing.id}`} className="flex-1 cursor-pointer">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="font-medium text-sm">{pricing.package_name}</div>
                                          {pricing.is_featured && (
                                            <Badge variant="secondary" className="text-xs mt-1">
                                              <FiStar className="w-3 h-3 mr-1" />
                                              Featured
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <div className="font-bold text-green-600">
                                            {activity.currency || 'USD'} {optionTotal.toFixed(2)}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {adultsCount || 0}A + {childrenCount || 0}C
                                          </div>
                                        </div>
                                      </div>
                                    </Label>
                                  </div>
                                );
                              })}
                            </RadioGroup>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-sm text-gray-600">Price</span>
                            <span className="text-lg font-bold text-green-600">
                              {activity.base_price
                                ? `${activity.currency || 'USD'} ${activity.base_price.toLocaleString()}`
                                : 'Contact for price'}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button 
                        className="w-full mt-4" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(activity, selectedPricingId);
                        }}
                        disabled={pricingOptions.length > 0 && !selectedPricingId}
                      >
                        Select Activity
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


