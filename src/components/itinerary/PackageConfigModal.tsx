'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiCar, FiUsers, FiDollarSign } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/useToast';

interface Package {
  id: string;
  title: string;
  destination_country: string;
  destination_city: string;
  package_type: 'activity' | 'transfer' | 'multi_city' | 'multi_city_hotel' | 'fixed_departure';
  operator_id: string;
  operator_name?: string;
  featured_image_url?: string;
  base_price?: number;
  currency?: string;
}

interface PackageConfigModalProps {
  package: Package;
  itineraryId: string;
  onClose: () => void;
  onPackageAdded: (item: any) => void;
}

export function PackageConfigModal({
  package: pkg,
  itineraryId,
  onClose,
  onPackageAdded,
}: PackageConfigModalProps) {
  const supabase = createClient();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [packageData, setPackageData] = useState<any>(null);
  const [config, setConfig] = useState<any>({});
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [itineraryInfo, setItineraryInfo] = useState<any>(null);

  // Fetch itinerary info (adults, children, infants)
  useEffect(() => {
    const fetchItinerary = async () => {
      const { data } = await supabase
        .from('itineraries' as any)
        .select('adults_count, children_count, infants_count, currency')
        .eq('id', itineraryId)
        .single();

      if (data) {
        setItineraryInfo(data);
      }
    };

    fetchItinerary();
  }, [itineraryId, supabase]);

  // Fetch package details
  useEffect(() => {
    const fetchPackage = async () => {
      setLoading(true);
      try {
        let query: any;
        
        if (pkg.package_type === 'activity') {
          query = supabase.from('activity_packages').select('*, pricing_options').eq('id', pkg.id).single();
        } else if (pkg.package_type === 'transfer') {
          query = supabase.from('transfer_packages').select('*, pricing_options').eq('id', pkg.id).single();
        } else if (pkg.package_type === 'multi_city') {
          query = supabase.from('multi_city_packages').select('*, pricing, cities, city_hotels').eq('id', pkg.id).single();
        } else if (pkg.package_type === 'multi_city_hotel') {
          query = supabase.from('multi_city_hotel_packages').select('*, pricing, cities, city_hotels').eq('id', pkg.id).single();
        } else if (pkg.package_type === 'fixed_departure') {
          query = supabase.from('fixed_departure_flight_packages').select('*, pricing, cities, city_hotels').eq('id', pkg.id).single();
        } else {
          throw new Error('Unknown package type');
        }

        const { data, error } = await query;

        if (error) throw error;
        if (data) {
          setPackageData(data);
          
          // Initialize default config based on package type
          if (pkg.package_type === 'activity') {
            setConfig({
              packageType: 'TICKET_ONLY',
              selectedVehicle: null,
              quantity: 1,
            });
          } else if (pkg.package_type === 'transfer') {
            setConfig({
              pricingType: 'point-to-point',
              selectedOption: null,
              hours: 1,
              quantity: 1,
            });
          } else if (pkg.package_type === 'multi_city' || pkg.package_type === 'multi_city_hotel' || pkg.package_type === 'fixed_departure') {
            setConfig({
              pricingType: data.pricing?.pricing_type || 'STANDARD',
              selectedVehicle: null,
              selectedHotels: [],
              quantity: 1,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching package:', err);
        toast.error('Failed to load package details');
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [pkg.id, pkg.package_type, supabase, toast]);

  // Calculate price in real-time
  useEffect(() => {
    if (!packageData || !itineraryInfo) return;

    let price = 0;

    if (pkg.package_type === 'activity') {
      // Handle pricing_options - can be JSONB array or object with nested arrays
      let pricingOptions: any[] = [];
      
      if (Array.isArray(packageData.pricing_options)) {
        pricingOptions = packageData.pricing_options;
      } else if (packageData.pricing_options?.ticketOnlyOptions || packageData.pricing_options?.ticketWithTransferOptions) {
        // Old format with nested arrays
        pricingOptions = [
          ...(packageData.pricing_options.ticketOnlyOptions || []).map((opt: any) => ({ ...opt, package_type: 'TICKET_ONLY' })),
          ...(packageData.pricing_options.ticketWithTransferOptions || []).map((opt: any) => ({ ...opt, package_type: opt.package_type || 'PRIVATE_TRANSFER' })),
        ];
      }

      const option = pricingOptions.find((opt: any) => opt.id === config.selectedOptionId);
      if (option) {
        const adultsPrice = (option.adult_price || option.adultPrice || 0) * (itineraryInfo.adults_count || 0);
        const childrenPrice = (option.child_price || option.childPrice || 0) * (itineraryInfo.children_count || 0);
        price = adultsPrice + childrenPrice;

        if ((option.package_type === 'PRIVATE_TRANSFER' || option.packageType === 'PRIVATE_TRANSFER') && config.selectedVehicle) {
          const vehicles = option.vehicles || [];
          const vehicle = vehicles.find((v: any) => v.id === config.selectedVehicle || v.vehicleType === config.selectedVehicle);
          if (vehicle) {
            price += vehicle.price || 0;
          }
        }
      } else if (pricingOptions.length === 0 && packageData.base_price) {
        // Fallback to base_price if no pricing options
        price = (packageData.base_price || 0) * ((itineraryInfo.adults_count || 0) + (itineraryInfo.children_count || 0));
      }
    } else if (pkg.package_type === 'transfer') {
      // Handle pricing_options for transfer packages
      let pricingOptions: any[] = [];
      
      if (Array.isArray(packageData.pricing_options)) {
        pricingOptions = packageData.pricing_options;
      } else if (packageData.hourly_pricing_options || packageData.point_to_point_pricing_options) {
        // Try alternative field names
        pricingOptions = [
          ...(packageData.hourly_pricing_options || []).map((opt: any) => ({ ...opt, type: 'hourly' })),
          ...(packageData.point_to_point_pricing_options || []).map((opt: any) => ({ ...opt, type: 'point-to-point' })),
        ];
      }

      const option = pricingOptions.find((opt: any) => opt.id === config.selectedOptionId);
      if (option) {
        if (option.type === 'hourly' || config.pricingType === 'hourly') {
          price = (option.rate_usd || option.rateUSD || 0) * (config.hours || 1);
        } else {
          price = option.cost_usd || option.costUSD || 0;
        }
      } else if (pricingOptions.length === 0 && packageData.base_price) {
        // Fallback to base_price
        price = packageData.base_price || 0;
      }
    } else if (pkg.package_type === 'multi_city' || pkg.package_type === 'multi_city_hotel' || pkg.package_type === 'fixed_departure') {
      const adultsPrice = (packageData.pricing?.adult_price || 0) * (itineraryInfo.adults_count || 0);
      const childrenPrice = (packageData.pricing?.child_price || 0) * (itineraryInfo.children_count || 0);
      const infantsPrice = (packageData.pricing?.infant_price || 0) * (itineraryInfo.infants_count || 0);
      price = adultsPrice + childrenPrice + infantsPrice;

      if (config.pricingType === 'GROUP' && config.selectedVehicle) {
        const vehicle = packageData.pricing?.vehicles?.find((v: any) => v.id === config.selectedVehicle);
        if (vehicle) {
          price += vehicle.price || 0;
        }
      }

      // Add hotel prices
      if (config.selectedHotels && Array.isArray(config.selectedHotels)) {
        config.selectedHotels.forEach((hotel: any) => {
          if (hotel.price && hotel.nights) {
            price += hotel.price * hotel.nights;
          }
        });
      }
    }

    setCalculatedPrice(price * (config.quantity || 1));
  }, [config, packageData, itineraryInfo, pkg.package_type]);

  const handleAddToItinerary = async () => {
    if (!packageData) return;

    setLoading(true);
    try {
      // Create itinerary item
      const { data: item, error } = await supabase
        .from('itinerary_items' as any)
        .insert({
          itinerary_id: itineraryId,
          day_id: null, // Unassigned initially
          package_type: pkg.package_type,
          package_id: pkg.id,
          operator_id: pkg.operator_id,
          package_title: pkg.title,
          package_image_url: pkg.featured_image_url,
          configuration: config,
          unit_price: calculatedPrice / (config.quantity || 1),
          quantity: config.quantity || 1,
          total_price: calculatedPrice,
          display_order: 0,
        })
        .select()
        .single();

      if (error) throw error;

      onPackageAdded(item);
      toast.success('Package added to itinerary');
      onClose();
    } catch (err) {
      console.error('Error adding package:', err);
      toast.error('Failed to add package to itinerary');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !packageData) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading package details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{pkg.title}</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            {pkg.destination_city && `${pkg.destination_city}, `}
            {pkg.destination_country} • {pkg.operator_name}
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Activity Package Configuration */}
          {pkg.package_type === 'activity' && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">Select Package Option</Label>
                {(() => {
                  // Handle different pricing_options formats
                  let pricingOptions: any[] = [];
                  
                  if (Array.isArray(packageData?.pricing_options)) {
                    pricingOptions = packageData.pricing_options;
                  } else if (packageData?.pricing_options?.ticketOnlyOptions || packageData?.pricing_options?.ticketWithTransferOptions) {
                    pricingOptions = [
                      ...(packageData.pricing_options.ticketOnlyOptions || []).map((opt: any) => ({ ...opt, package_type: 'TICKET_ONLY', id: opt.id || `ticket-${Date.now()}` })),
                      ...(packageData.pricing_options.ticketWithTransferOptions || []).map((opt: any) => ({ ...opt, package_type: opt.package_type || 'PRIVATE_TRANSFER', id: opt.id || `transfer-${Date.now()}` })),
                    ];
                  } else if (packageData?.base_price) {
                    // Fallback: create a default option from base_price
                    pricingOptions = [{
                      id: 'default',
                      activity_name: pkg.title,
                      package_type: 'TICKET_ONLY',
                      adult_price: packageData.base_price,
                      child_price: packageData.base_price * 0.7, // Estimate
                      childMinAge: 3,
                      childMaxAge: 12,
                    }];
                  }

                  if (pricingOptions.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No pricing options available for this package</p>
                        <p className="text-xs text-gray-400 mt-2">Using base price: ${packageData?.base_price?.toFixed(2) || '0.00'}</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <RadioGroup
                        value={config.selectedOptionId || pricingOptions[0]?.id || ''}
                        onValueChange={(value) => {
                          const option = pricingOptions.find((opt: any) => opt.id === value);
                          setConfig({
                            ...config,
                            selectedOptionId: value,
                            packageType: option?.package_type || option?.packageType || 'TICKET_ONLY',
                            selectedVehicle: null,
                          });
                        }}
                      >
                        {pricingOptions.map((option: any) => (
                          <div key={option.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                            <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                            <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                              <div className="font-medium">{option.activity_name || 'Option'}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {(option.package_type || option.packageType) === 'TICKET_ONLY' && 'Ticket Only'}
                                {(option.package_type || option.packageType) === 'PRIVATE_TRANSFER' && 'Private Transfer'}
                                {(option.package_type || option.packageType) === 'SHARED_TRANSFER' && 'Shared Transfer'}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="text-gray-600">
                                  Adult: ${(option.adult_price || option.adultPrice || 0).toFixed(2)}
                                </span>
                                <span className="text-gray-600">
                                  Child: ${(option.child_price || option.childPrice || 0).toFixed(2)}
                                </span>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>

                      {/* Vehicle Selection for Private Transfer */}
                      {(config.packageType === 'PRIVATE_TRANSFER' || config.selectedOptionId) && (() => {
                        // Get vehicles from selected option
                        let pricingOptionsForVehicles: any[] = [];
                        if (Array.isArray(packageData?.pricing_options)) {
                          pricingOptionsForVehicles = packageData.pricing_options;
                        } else if (packageData?.pricing_options?.ticketWithTransferOptions) {
                          pricingOptionsForVehicles = packageData.pricing_options.ticketWithTransferOptions || [];
                        }

                        const selectedOption = pricingOptionsForVehicles.find((opt: any) => opt.id === config.selectedOptionId);
                        const vehicles = selectedOption?.vehicles || [];

                        if (vehicles.length === 0) return null;

                        return (
                          <div className="mt-4">
                            <Label className="text-sm font-semibold mb-2 block">Select Vehicle</Label>
                            <Select
                              value={config.selectedVehicle || ''}
                              onValueChange={(value) => setConfig({ ...config, selectedVehicle: value })}
                            >
                              <SelectTrigger className="w-full bg-white">
                                <SelectValue placeholder="Choose a vehicle" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                {vehicles.map((vehicle: any) => (
                                  <SelectItem key={vehicle.id} value={vehicle.id} className="bg-white">
                                    <div className="flex items-center justify-between w-full">
                                      <span>
                                        {vehicle.vehicle_type === 'Others' ? vehicle.description : vehicle.vehicle_type}
                                        {vehicle.vehicle_category && ` (${vehicle.vehicle_category})`}
                                        {' • '}Max {vehicle.max_capacity} pax
                                      </span>
                                      <span className="ml-4 font-semibold text-green-600">
                                        ${vehicle.price?.toFixed(2) || '0.00'}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })()}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Transfer Package Configuration */}
          {pkg.package_type === 'transfer' && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">Select Transfer Option</Label>
                {(() => {
                  // Handle different pricing_options formats for transfer
                  let pricingOptions: any[] = [];
                  
                  if (Array.isArray(packageData?.pricing_options)) {
                    pricingOptions = packageData.pricing_options;
                  } else if (packageData?.hourly_pricing_options || packageData?.point_to_point_pricing_options) {
                    pricingOptions = [
                      ...(packageData.hourly_pricing_options || []).map((opt: any) => ({ ...opt, type: 'hourly' })),
                      ...(packageData.point_to_point_pricing_options || []).map((opt: any) => ({ ...opt, type: 'point-to-point' })),
                    ];
                  } else if (packageData?.base_price) {
                    // Fallback: create default option
                    pricingOptions = [{
                      id: 'default',
                      type: 'point-to-point',
                      from_location: 'Origin',
                      to_location: 'Destination',
                      cost_usd: packageData.base_price,
                      costUSD: packageData.base_price,
                      vehicle_name: 'Standard Vehicle',
                      max_passengers: 4,
                    }];
                  }

                  if (pricingOptions.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No pricing options available</p>
                      </div>
                    );
                  }

                  return (
                    <RadioGroup
                      value={config.selectedOptionId || pricingOptions[0]?.id || ''}
                      onValueChange={(value) => {
                        const option = pricingOptions.find((opt: any) => opt.id === value);
                        setConfig({
                          ...config,
                          selectedOptionId: value,
                          pricingType: option?.type || 'point-to-point',
                          hours: 1,
                        });
                      }}
                    >
                      {pricingOptions.map((option: any) => (
                    <div key={option.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">
                          {option.type === 'hourly' ? 'Hourly Rental' : 'One Way Transfer'}
                        </div>
                        {option.type === 'hourly' && (
                          <div className="text-sm text-gray-600 mt-1">
                            {option.vehicle_name || option.vehicleName} • ${(option.rate_usd || option.rateUSD || 0).toFixed(2)}/hr • Max {option.max_passengers || option.maxPassengers || 4} pax
                          </div>
                        )}
                        {option.type === 'point-to-point' && (
                          <div className="text-sm text-gray-600 mt-1">
                            {option.from_location || option.fromLocation} → {option.to_location || option.toLocation}
                            {' • '}{option.vehicle_name || option.vehicleName} • ${(option.cost_usd || option.costUSD || 0).toFixed(2)}
                          </div>
                        )}
                      </Label>
                    </div>
                  ))}
                    </RadioGroup>
                  );
                })()}

                {/* Hours input for hourly rentals */}
                {config.pricingType === 'hourly' && (
                  <div className="mt-4">
                    <Label htmlFor="hours">Number of Hours</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="1"
                      value={config.hours || 1}
                      onChange={(e) => setConfig({ ...config, hours: parseInt(e.target.value) || 1 })}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Multi-City Package Configuration */}
          {(pkg.package_type === 'multi_city' || pkg.package_type === 'multi_city_hotel' || pkg.package_type === 'fixed_departure') && packageData && (
            <div className="space-y-4">
              {/* Pricing Type */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Pricing Model</Label>
                <RadioGroup
                  value={config.pricingType || 'STANDARD'}
                  onValueChange={(value) => setConfig({ ...config, pricingType: value, selectedVehicle: null })}
                >
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 flex-1">
                      <RadioGroupItem value="STANDARD" id="standard" />
                      <Label htmlFor="standard" className="cursor-pointer flex-1">
                        <div className="font-medium">Standard Pricing</div>
                        <div className="text-xs text-gray-600">Per person pricing only</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 flex-1">
                      <RadioGroupItem value="GROUP" id="group" />
                      <Label htmlFor="group" className="cursor-pointer flex-1">
                        <div className="font-medium">Group Pricing</div>
                        <div className="text-xs text-gray-600">Per person + vehicle</div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Vehicle Selection for Group Pricing */}
              {config.pricingType === 'GROUP' && packageData.pricing?.vehicles && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Select Vehicle</Label>
                  <Select
                    value={config.selectedVehicle || ''}
                    onValueChange={(value) => setConfig({ ...config, selectedVehicle: value })}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Choose a vehicle" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {packageData.pricing.vehicles.map((vehicle: any) => (
                        <SelectItem key={vehicle.id} value={vehicle.id} className="bg-white">
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {vehicle.vehicle_type} • Max {vehicle.max_capacity} pax
                            </span>
                            <span className="ml-4 font-semibold text-green-600">
                              ${vehicle.price?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Hotel Selection - Inline, Minimal */}
              {(pkg.package_type === 'multi_city_hotel' || pkg.package_type === 'fixed_departure') && packageData.cities && (
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Hotel Selection</Label>
                  <div className="space-y-3">
                    {packageData.cities.map((city: any, index: number) => {
                      const hotels = city.hotels || [];
                      const selectedHotel = config.selectedHotels?.find((h: any) => h.cityId === city.id);

                      return (
                        <Card key={city.id || index} className="bg-white">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">
                                {city.city_name} ({city.nights || 0} nights)
                              </span>
                            </div>
                            <Select
                              value={selectedHotel?.hotelId || ''}
                              onValueChange={(hotelId) => {
                                const hotel = hotels.find((h: any) => h.id === hotelId);
                                const updatedHotels = config.selectedHotels || [];
                                const existingIndex = updatedHotels.findIndex((h: any) => h.cityId === city.id);
                                
                                const hotelData = {
                                  cityId: city.id,
                                  cityName: city.city_name,
                                  hotelId: hotelId,
                                  hotelName: hotel?.name || '',
                                  price: hotel?.price_per_night || 0,
                                  nights: city.nights || 1,
                                };

                                if (existingIndex >= 0) {
                                  updatedHotels[existingIndex] = hotelData;
                                } else {
                                  updatedHotels.push(hotelData);
                                }

                                setConfig({ ...config, selectedHotels: updatedHotels });
                              }}
                            >
                              <SelectTrigger className="w-full bg-white text-sm">
                                <SelectValue placeholder="Select hotel..." />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                {hotels.map((hotel: any) => (
                                  <SelectItem key={hotel.id} value={hotel.id} className="bg-white">
                                    <div className="flex items-center justify-between w-full">
                                      <span className="text-sm">{hotel.name}</span>
                                      <span className="ml-4 text-xs font-semibold text-green-600">
                                        ${hotel.price_per_night}/night
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {selectedHotel && (
                              <p className="text-xs text-gray-600 mt-1">
                                Total: ${(selectedHotel.price * selectedHotel.nights).toFixed(2)}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={config.quantity || 1}
              onChange={(e) => setConfig({ ...config, quantity: parseInt(e.target.value) || 1 })}
              className="mt-1"
            />
          </div>

          {/* Price Summary */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Total Price</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${calculatedPrice.toFixed(2)}
                  </p>
                  {config.quantity > 1 && (
                    <p className="text-xs text-gray-600 mt-1">
                      ${(calculatedPrice / config.quantity).toFixed(2)} × {config.quantity}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>Based on:</p>
                  <p>{itineraryInfo?.adults_count || 0} Adults</p>
                  <p>{itineraryInfo?.children_count || 0} Children</p>
                  <p>{itineraryInfo?.infants_count || 0} Infants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToItinerary}
              disabled={loading || calculatedPrice === 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {loading ? 'Adding...' : 'Add to Itinerary'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

