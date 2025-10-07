"use client";

import React, { useState, useCallback } from "react";
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
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  TransferPackageFormData,
  TransferType,
  DistanceUnit,
  TransferStop,
} from "@/lib/types/transfer-package";

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
  {
    value: 'MULTI_STOP',
    label: 'Multi-Stop Transfer',
    icon: <FaRoute className="h-6 w-6" />,
    description: 'Multiple stops along the route with flexible itinerary'
  },
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

// Stop card component
const StopCard: React.FC<{
  stop: TransferStop;
  onUpdate: (stop: TransferStop) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
}> = ({ stop, onUpdate, onRemove, isEditing, onEdit, onCancelEdit }) => {
  const [editData, setEditData] = useState(stop);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    onCancelEdit();
  }, [editData, onUpdate, onCancelEdit]);

  const handleCancel = useCallback(() => {
    setEditData(stop);
    onCancelEdit();
  }, [stop, onCancelEdit]);

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Stop Location</label>
            <Input
              value={editData.location.name}
              onChange={(e) => setEditData({
                ...editData,
                location: { ...editData.location, name: e.target.value }
              })}
              placeholder="Enter stop location"
              className="package-text-fix"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Duration (Hours)</label>
              <Input
                type="number"
                min="0"
                max="24"
                value={editData.duration.hours}
                onChange={(e) => setEditData({
                  ...editData,
                  duration: { ...editData.duration, hours: parseInt(e.target.value) || 0 }
                })}
                className="package-text-fix"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Duration (Minutes)</label>
              <Input
                type="number"
                min="0"
                max="59"
                value={editData.duration.minutes}
                onChange={(e) => setEditData({
                  ...editData,
                  duration: { ...editData.duration, minutes: parseInt(e.target.value) || 0 }
                })}
                className="package-text-fix"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Description (Optional)</label>
            <Input
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="e.g., Shopping stop, Restaurant visit"
              className="package-text-fix"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" className="package-button-fix">
              Save
            </Button>
            <Button onClick={handleCancel} size="sm" variant="outline" className="package-button-fix">
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <FaGripVertical className="h-4 w-4 text-gray-400 cursor-move mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FaMapMarkerAlt className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium">{stop.location.name}</h4>
              <Badge variant="outline" className="text-xs">
                Stop {stop.order}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {stop.location.address}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <FaClock className="h-3 w-3" />
                <span>{stop.duration.hours}h {stop.duration.minutes}m</span>
              </div>
              {stop.description && (
                <span className="text-gray-600">{stop.description}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(stop.id)}
            className="package-button-fix"
          >
            <FaEdit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(stop.id)}
            className="package-button-fix text-red-600 hover:text-red-700"
          >
            <FaTrash className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Route visualization component
const RouteVisualization: React.FC<{
  routeInfo: any;
  transferType: TransferType;
}> = ({ routeInfo, transferType }) => {
  return (
    <Card className="package-selector-glass package-shadow-fix">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FaMap className="h-5 w-5 text-blue-600" />
          Route Visualization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Route Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FaRuler className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Distance</p>
                <p className="font-medium">
                  {routeInfo.totalDistance} {routeInfo.distanceUnit}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <FaClock className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                <p className="font-medium">
                  {routeInfo.estimatedDuration.hours}h {routeInfo.estimatedDuration.minutes}m
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <FaRoute className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                <p className="font-medium capitalize">
                  {transferType.replace('_', ' ').toLowerCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Mock Map */}
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FaMap className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">
                Interactive map will be displayed here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Showing route with {routeInfo.routePoints?.length || 0} waypoints
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const TransferDetailsTab: React.FC = () => {
  const { control, watch, setValue } = useFormContext<TransferPackageFormData>();
  const [editingStop, setEditingStop] = useState<string | null>(null);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('KM');

  const watchedData = watch('transferDetails');

  const handleAddStop = useCallback(() => {
    const newStop: TransferStop = {
      id: Date.now().toString(),
      location: {
        name: '',
        address: '',
        coordinates: { latitude: 0, longitude: 0 },
        city: '',
        country: '',
      },
      duration: { hours: 1, minutes: 0 },
      order: (watchedData.multiStopDetails?.stops?.length || 0) + 1,
      description: '',
    };

    const currentStops = watchedData.multiStopDetails?.stops || [];
    setValue('transferDetails.multiStopDetails.stops', [...currentStops, newStop]);
  }, [watchedData.multiStopDetails?.stops, setValue]);

  const handleUpdateStop = useCallback((updatedStop: TransferStop) => {
    const currentStops = watchedData.multiStopDetails?.stops || [];
    const updatedStops = currentStops.map(stop =>
      stop.id === updatedStop.id ? updatedStop : stop
    );
    setValue('transferDetails.multiStopDetails.stops', updatedStops);
  }, [watchedData.multiStopDetails?.stops, setValue]);

  const handleRemoveStop = useCallback((id: string) => {
    const currentStops = watchedData.multiStopDetails?.stops || [];
    const updatedStops = currentStops.filter(stop => stop.id !== id);
    setValue('transferDetails.multiStopDetails.stops', updatedStops);
  }, [watchedData.multiStopDetails?.stops, setValue]);

  return (
    <div className="space-y-6 package-scroll-fix">
      {/* Transfer Type Selection */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaRoute className="h-5 w-5 text-blue-600" />
            Transfer Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="transferDetails.transferType"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    {TRANSFER_TYPES.map((type) => (
                      <div key={type.value} className="relative">
                        <RadioGroupItem
                          value={type.value}
                          id={type.value}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={type.value}
                          className={cn(
                            "flex flex-col items-center justify-center p-6 border-2 rounded-lg cursor-pointer transition-all duration-200",
                            "package-border-radius-fix package-animation-fix",
                            "hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                            field.value === type.value
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-700"
                          )}
                        >
                          <div className="mb-3 text-blue-600">
                            {type.icon}
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{type.label}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            {type.description}
                          </p>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Transfer Details Based on Type */}
      {watchedData.transferType === 'ONE_WAY' && (
        <Card className="package-selector-glass package-shadow-fix">
          <CardHeader>
            <CardTitle>One-Way Transfer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="transferDetails.oneWayDetails.pickupLocation"
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
                  name="transferDetails.oneWayDetails.dropoffLocation"
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={control}
                  name="transferDetails.oneWayDetails.distance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          step="0.1"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="package-text-fix"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="transferDetails.oneWayDetails.distanceUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <select
                          value={field.value}
                          onChange={field.onChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                        >
                          <option value="KM">Kilometers</option>
                          <option value="MILES">Miles</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Estimated Duration</FormLabel>
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
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {watchedData.transferType === 'ROUND_TRIP' && (
        <Card className="package-selector-glass package-shadow-fix">
          <CardHeader>
            <CardTitle>Round Trip Transfer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Same as One-Way */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* Return Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FormLabel>Return Date</FormLabel>
                  <Input
                    type="date"
                    className="package-text-fix"
                  />
                </div>
                <div>
                  <FormLabel>Return Time</FormLabel>
                  <Input
                    type="time"
                    className="package-text-fix"
                  />
                </div>
              </div>

              <div>
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {watchedData.transferType === 'MULTI_STOP' && (
        <Card className="package-selector-glass package-shadow-fix">
          <CardHeader>
            <CardTitle>Multi-Stop Transfer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Pickup and Dropoff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="transferDetails.multiStopDetails.pickupLocation"
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
                  name="transferDetails.multiStopDetails.dropoffLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <LocationAutocomplete
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Enter final dropoff location"
                          label="Final Dropoff Location"
                          icon={<FaMapMarkerAlt className="h-4 w-4 text-red-600" />}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Stops Management */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Intermediate Stops</h4>
                  <Button
                    onClick={handleAddStop}
                    size="sm"
                    className="package-button-fix"
                  >
                    <FaPlus className="h-4 w-4 mr-2" />
                    Add Stop
                  </Button>
                </div>

                <div className="space-y-3">
                  <AnimatePresence>
                    {(watchedData.multiStopDetails?.stops || []).map((stop) => (
                      <StopCard
                        key={stop.id}
                        stop={stop}
                        onUpdate={handleUpdateStop}
                        onRemove={handleRemoveStop}
                        isEditing={editingStop === stop.id}
                        onEdit={setEditingStop}
                        onCancelEdit={() => setEditingStop(null)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Visualization */}
      <RouteVisualization
        routeInfo={watchedData.routeInfo}
        transferType={watchedData.transferType}
      />
    </div>
  );
};
