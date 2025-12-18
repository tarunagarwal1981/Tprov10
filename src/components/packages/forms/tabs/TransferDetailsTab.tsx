"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaRoute,
  FaMapMarkerAlt,
  FaPlus,
  FaTrash,
  FaGripVertical,
  FaClock,
  FaRuler,
  FaCalendarAlt,
  FaExchangeAlt,
  FaMap,
  FaCar,
  FaPlane,
  FaHotel,
  FaEdit,
  FaInfoCircle,
  FaImage,
  FaDollarSign,
  FaMoon,
  FaSuitcase,
  FaBaby,
  FaShieldAlt,
  FaFileAlt,
  FaUsers,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ImageUpload } from "@/components/packages/ImageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  TransferPackageFormData,
  TransferType,
  DistanceUnit,
  VehicleDetail,
  VehicleType,
  VEHICLE_TYPES,
  HourlyPricingOption,
  PointToPointPricingOption,
} from "@/lib/types/transfer-package";
import { TransferPricingOptionsManager } from "./TransferPricingOptionsManager";

// Transfer type options
const TRANSFER_TYPES: { value: TransferType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'ONE_WAY',
    label: 'One-Way Transfer',
    icon: <FaCar className="h-6 w-6" />,
    description: 'Single journey from pickup to dropoff location'
  },
  {
    value: 'ROUND_TRIP',
    label: 'Round Trip',
    icon: <FaExchangeAlt className="h-6 w-6" />,
    description: 'Return journey with pickup and dropoff at same locations'
  },
  // {
  //   value: 'MULTI_STOP',
  //   label: 'Multi-Stop Transfer',
  //   icon: <FaRoute className="h-6 w-6" />,
  //   description: 'Multiple stops along the route with flexible itinerary'
  // },
];

// Location autocomplete component
const LocationAutocomplete: React.FC<{
  value: any;
  onChange: (location: any) => void;
  placeholder: string;
  label: string;
  icon?: React.ReactNode;
}> = ({ value, onChange, placeholder, label, icon }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Mock API call - replace with actual location service
      const mockSuggestions = [
        {
          id: '1',
          name: `${query} Airport`,
          address: `${query} International Airport, ${query}`,
          coordinates: { latitude: 40.7128, longitude: -74.0060 },
          city: query,
          country: 'USA',
          type: 'AIRPORT'
        },
        {
          id: '2',
          name: `${query} Hotel District`,
          address: `${query} Downtown, ${query}`,
          coordinates: { latitude: 40.7589, longitude: -73.9851 },
          city: query,
          country: 'USA',
          type: 'HOTEL'
        },
        {
          id: '3',
          name: `${query} City Center`,
          address: `${query} City Center, ${query}`,
          coordinates: { latitude: 40.7505, longitude: -73.9934 },
          city: query,
          country: 'USA',
          type: 'CITY'
        }
      ];
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Location search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelect = useCallback((location: any) => {
    onChange(location);
    setSearchQuery(location.name);
    setSuggestions([]);
  }, [onChange]);

  return (
    <div className="relative">
      <FormLabel className="flex items-center gap-2">
        {icon}
        {label}
      </FormLabel>
      <div className="relative">
        <Input
          value={searchQuery || value?.name || ''}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          placeholder={placeholder}
          className="package-text-fix"
        />
        
        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {suggestion.type === 'AIRPORT' && <FaPlane className="h-4 w-4 text-blue-600" />}
                    {suggestion.type === 'HOTEL' && <FaHotel className="h-4 w-4 text-green-600" />}
                    {suggestion.type === 'CITY' && <FaMapMarkerAlt className="h-4 w-4 text-purple-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {suggestion.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {suggestion.address}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {value && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="flex items-center gap-2">
            <FaMapMarkerAlt className="h-4 w-4 text-green-600" />
            <div>
              <p className="font-medium text-sm">{value.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{value.address}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Vehicle Detail Row Component
const VehicleDetailRow: React.FC<{
  vehicle: VehicleDetail;
  index: number;
  onUpdate: (vehicle: VehicleDetail) => void;
  onRemove: (id: string) => void;
  control: any;
}> = ({ vehicle, index, onUpdate, onRemove, control }) => {
  const [localVehicle, setLocalVehicle] = useState<VehicleDetail>(vehicle);

  // Update local state when vehicle prop changes
  useEffect(() => {
    setLocalVehicle(vehicle);
  }, [vehicle]);

  const handleFieldChange = useCallback((field: keyof VehicleDetail, value: any) => {
    const updated = { ...localVehicle, [field]: value };
    setLocalVehicle(updated);
    onUpdate(updated);
  }, [localVehicle, onUpdate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 space-y-3"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <FaCar className="h-4 w-4 text-blue-600" />
          Vehicle {index + 1}
        </h4>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onRemove(vehicle.id)}
          className="package-button-fix text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-7 w-7 p-0"
        >
          <FaTrash className="h-3 w-3" />
        </Button>
      </div>

      {/* Compact row with Name, Type, and Capacity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Vehicle Name */}
        <div>
          <Label className="text-xs font-medium mb-1 block">
            Vehicle Name *
          </Label>
          <Input
            value={localVehicle.vehicleName}
            onChange={(e) => handleFieldChange('vehicleName', e.target.value)}
            placeholder="e.g., Mercedes S-Class"
            className="package-text-fix h-9 text-sm"
          />
        </div>

        {/* Vehicle Type */}
        <div>
          <Label className="text-xs font-medium mb-1 block">
            Vehicle Type
          </Label>
          <Select
            value={localVehicle.vehicleType || undefined}
            onValueChange={(value) => handleFieldChange('vehicleType', value as VehicleType)}
          >
            <SelectTrigger className="package-text-fix bg-white dark:bg-gray-800 h-9 text-sm">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              {VEHICLE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{type.icon}</span>
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vehicle Max Capacity */}
        <div>
          <Label className="text-xs font-medium mb-1 block">
            Max Capacity *
          </Label>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentValue = localVehicle.maxCapacity || 1;
                  if (currentValue > 1) {
                    handleFieldChange('maxCapacity', currentValue - 1);
                  }
                }}
                className="package-button-fix h-9 w-8 px-0 border-0 border-r border-gray-200 dark:border-gray-700 rounded-none"
              >
                -
              </Button>
              <Input
                type="number"
                min="1"
                max="50"
                value={localVehicle.maxCapacity}
                onChange={(e) => handleFieldChange('maxCapacity', parseInt(e.target.value) || 1)}
                className="package-text-fix text-center w-16 h-9 text-sm border-0 rounded-none shadow-none focus-visible:ring-0"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentValue = localVehicle.maxCapacity || 1;
                  if (currentValue < 50) {
                    handleFieldChange('maxCapacity', currentValue + 1);
                  }
                }}
                className="package-button-fix h-9 w-8 px-0 border-0 border-l border-gray-200 dark:border-gray-700 rounded-none"
              >
                +
              </Button>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
              <FaUsers className="h-3 w-3 inline mr-1" />
              pax
            </span>
          </div>
        </div>

      </div>

      {/* Vehicle Image - separate row */}
      <div>
        <Label className="text-xs font-medium mb-1 block">
          Vehicle Image (Optional)
        </Label>
        <ImageUpload
          images={localVehicle.vehicleImage ? [localVehicle.vehicleImage] : []}
          onImagesChange={(images) => {
            handleFieldChange('vehicleImage', images.length > 0 ? images[0] : null);
          }}
          maxImages={1}
          allowMultiple={false}
          showMetadata={false}
          className="package-animation-fix"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Upload an image specific to this vehicle
        </p>
      </div>
    </motion.div>
  );
};

export const TransferDetailsTab: React.FC = () => {
  const { control, watch, setValue } = useFormContext<TransferPackageFormData>();
  const watchedData = watch('transferDetails');

  // Initialize with one empty vehicle row if none exist
  useEffect(() => {
    if (!watchedData.vehicles || watchedData.vehicles.length === 0) {
      const newVehicle: VehicleDetail = {
        id: Date.now().toString(),
        vehicleName: '',
        vehicleType: undefined,
        maxCapacity: 1,
        vehicleImage: null,
        order: 1,
      };
      setValue('transferDetails.vehicles', [newVehicle]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount - intentionally empty deps

  return (
    <div className="space-y-2 package-scroll-fix">
      {/* Title */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FaInfoCircle className="h-3 w-3 text-blue-600" />
            Title
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2 px-3">
          <FormField
            control={control}
            name="basicInformation.title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter your transfer package title"
                    maxLength={100}
                    className="package-text-fix"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Description (Optional) */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-sm">Description</CardTitle>
        </CardHeader>
        <CardContent className="pb-2 px-3">
          <FormField
            control={control}
            name="basicInformation.shortDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Brief description for cards and listings (max 160 characters)"
                    maxLength={160}
                    rows={3}
                    className="package-text-fix"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Destination */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FaMapMarkerAlt className="h-3 w-3 text-red-600" />
            Destination *
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2 px-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              control={control}
              name="basicInformation.destination.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Bali, Dubai, Bangkok"
                      className="package-text-fix"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="basicInformation.destination.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Indonesia, UAE, Thailand"
                      className="package-text-fix"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Package Images */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FaImage className="h-3 w-3 text-pink-600" />
            Package Images
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2 px-3">
          <FormField
            control={control}
            name="basicInformation.imageGallery"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image Gallery (Optional)</FormLabel>
                <FormControl>
                  <ImageUpload
                    images={field.value || []}
                    onImagesChange={(images) => {
                      field.onChange(images);
                    }}
                    maxImages={10}
                    allowMultiple={true}
                    showMetadata={false}
                    className="package-animation-fix"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Transfer Details - Round Trip */}
      {watchedData.transferType === 'ROUND_TRIP' && (
        <Card className="package-selector-glass package-shadow-fix">
          <CardHeader className="pb-1 pt-2 px-3">
            <CardTitle className="text-sm">Round Trip Transfer Details</CardTitle>
          </CardHeader>
          <CardContent className="pb-2 px-3">
            <div className="space-y-3">
              {/* Same as One-Way */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={control}
                  name="transferDetails.roundTripDetails.pickupLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <LocationAutocomplete
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Enter pickup location"
                          label="Pickup Location"
                          icon={<FaMapMarkerAlt className="h-4 w-4 text-green-600" />}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="transferDetails.roundTripDetails.dropoffLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <LocationAutocomplete
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Enter dropoff location"
                          label="Dropoff Location"
                          icon={<FaMapMarkerAlt className="h-4 w-4 text-red-600" />}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pickup Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="transferDetails.roundTripDetails.pickupDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Date *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="package-text-fix"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="transferDetails.roundTripDetails.pickupTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Time *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="time"
                          className="package-text-fix"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Passengers and Luggage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="transferDetails.roundTripDetails.numberOfPassengers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. of Passengers *</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentValue = parseInt(String(field.value || 1)) || 1;
                              if (currentValue > 1) {
                                field.onChange(currentValue - 1);
                              }
                            }}
                            className="package-button-fix"
                          >
                            -
                          </Button>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            max="50"
                            value={field.value || 1}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            className="package-text-fix text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentValue = parseInt(String(field.value || 1)) || 1;
                              if (currentValue < 50) {
                                field.onChange(currentValue + 1);
                              }
                            }}
                            className="package-button-fix"
                          >
                            +
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="transferDetails.roundTripDetails.numberOfLuggagePieces"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Luggage Pieces *</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentValue = parseInt(String(field.value || 0)) || 0;
                              if (currentValue > 0) {
                                field.onChange(currentValue - 1);
                              }
                            }}
                            className="package-button-fix"
                          >
                            -
                          </Button>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            max="20"
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            className="package-text-fix text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentValue = parseInt(String(field.value || 0)) || 0;
                              if (currentValue < 20) {
                                field.onChange(currentValue + 1);
                              }
                            }}
                            className="package-button-fix"
                          >
                            +
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Return Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={control}
                  name="transferDetails.roundTripDetails.returnDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Return Date</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="package-text-fix"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="transferDetails.roundTripDetails.returnTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Return Time</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="time"
                          className="package-text-fix"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Wait Time at Destination - COMMENTED OUT */}
              {/* <div>
                <FormLabel>Wait Time at Destination (Optional)</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    placeholder="Hours"
                    className="package-text-fix"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Minutes"
                    className="package-text-fix"
                  />
                </div>
              </div> */}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Details Section */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FaCar className="h-3 w-3 text-purple-600" />
            Vehicle Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2 px-3">
          <div className="space-y-2">
            <AnimatePresence>
              {(watchedData.vehicles || []).map((vehicle, index) => (
                <VehicleDetailRow
                  key={vehicle.id}
                  vehicle={vehicle}
                  index={index}
                  onUpdate={(updatedVehicle) => {
                    const currentVehicles = watchedData.vehicles || [];
                    const updatedVehicles = currentVehicles.map((v) =>
                      v.id === updatedVehicle.id ? updatedVehicle : v
                    );
                    setValue('transferDetails.vehicles', updatedVehicles);
                  }}
                  onRemove={(id) => {
                    const currentVehicles = watchedData.vehicles || [];
                    const updatedVehicles = currentVehicles.filter((v) => v.id !== id);
                    setValue('transferDetails.vehicles', updatedVehicles);
                  }}
                  control={control}
                />
              ))}
            </AnimatePresence>

            {/* Add Vehicle Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const currentVehicles = watchedData.vehicles || [];
                const newVehicle = {
                  id: Date.now().toString(),
                  vehicleName: '',
                  vehicleType: undefined,
                  maxCapacity: 1,
                  vehicleImage: null,
                  order: currentVehicles.length + 1,
                };
                setValue('transferDetails.vehicles', [...currentVehicles, newVehicle]);
              }}
              className="package-button-fix w-full"
            >
              <FaPlus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>

            {/* Show message if no vehicles */}
            {(!watchedData.vehicles || watchedData.vehicles.length === 0) && (
              <div className="text-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <FaCar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  No vehicles added yet. Click &quot;Add Vehicle&quot; to get started.
                </p>
            </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Section */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FaDollarSign className="h-3 w-3 text-green-600" />
            Pricing Options
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2 px-3">
          <TransferPricingOptionsManager
            hourlyOptions={watch('pricingPolicies.hourlyPricingOptions') || []}
            pointToPointOptions={watch('pricingPolicies.pointToPointPricingOptions') || []}
            onUpdateHourly={(options: HourlyPricingOption[]) => {
              setValue('pricingPolicies.hourlyPricingOptions', options);
            }}
            onUpdatePointToPoint={(options: PointToPointPricingOption[]) => {
              setValue('pricingPolicies.pointToPointPricingOptions', options);
            }}
            userVehicles={watchedData.vehicles
              ?.filter(v => v.vehicleName && v.vehicleName.trim() !== '') // Only include vehicles with names
              .map(v => ({
                vehicleName: v.vehicleName,
                vehicleType: v.vehicleType,
                maxCapacity: v.maxCapacity
              })) || []}
          />
        </CardContent>
      </Card>
    </div>
  );
};

