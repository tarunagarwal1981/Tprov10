"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCar,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCopy,
  FaEye,
  FaEyeSlash,
  FaUsers,
  FaSuitcase,
  FaDollarSign,
  FaImage,
  FaCheck,
  FaTable,
  FaList,
  FaGripVertical,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  TransferPackageFormData,
  VehicleConfiguration,
  VehicleType,
  VehicleFeature,
  VEHICLE_TYPES,
  VEHICLE_FEATURES,
} from "@/lib/types/transfer-package";

// Vehicle card component
const VehicleCard: React.FC<{
  vehicle: VehicleConfiguration;
  onUpdate: (vehicle: VehicleConfiguration) => void;
  onRemove: (id: string) => void;
  onDuplicate: (vehicle: VehicleConfiguration) => void;
  onToggleActive: (id: string) => void;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
}> = ({ 
  vehicle, 
  onUpdate, 
  onRemove, 
  onDuplicate, 
  onToggleActive, 
  isEditing, 
  onEdit, 
  onCancelEdit 
}) => {
  const [editData, setEditData] = useState(vehicle);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    onCancelEdit();
  }, [editData, onUpdate, onCancelEdit]);

  const handleCancel = useCallback(() => {
    setEditData(vehicle);
    onCancelEdit();
  }, [vehicle, onCancelEdit]);

  const vehicleTypeInfo = VEHICLE_TYPES.find(t => t.value === vehicle.vehicleType);

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Vehicle Type</label>
              <Select
                value={editData.vehicleType}
                onValueChange={(value: VehicleType) => setEditData({ ...editData, vehicleType: value })}
              >
                <SelectTrigger className="package-text-fix">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Vehicle Name</label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="e.g., Toyota Camry - Comfortable Sedan"
                className="package-text-fix"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Describe the vehicle and its features"
              rows={3}
              className="package-text-fix"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Passenger Capacity</label>
              <Input
                type="number"
                min="1"
                max="50"
                value={editData.passengerCapacity}
                onChange={(e) => setEditData({ ...editData, passengerCapacity: parseInt(e.target.value) || 1 })}
                className="package-text-fix"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Luggage Capacity</label>
              <Input
                type="number"
                min="0"
                max="20"
                value={editData.luggageCapacity}
                onChange={(e) => setEditData({ ...editData, luggageCapacity: parseInt(e.target.value) || 0 })}
                className="package-text-fix"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Base Price</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editData.basePrice}
                onChange={(e) => setEditData({ ...editData, basePrice: parseFloat(e.target.value) || 0 })}
                className="package-text-fix"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Features</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {VEHICLE_FEATURES.map((feature) => (
                <div key={feature.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${vehicle.id}-${feature.value}`}
                    checked={editData.features.includes(feature.value)}
                    onCheckedChange={(checked) => {
                      const newFeatures = checked
                        ? [...editData.features, feature.value]
                        : editData.features.filter(f => f !== feature.value);
                      setEditData({ ...editData, features: newFeatures });
                    }}
                  />
                  <label
                    htmlFor={`${vehicle.id}-${feature.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <span>{feature.icon}</span>
                    {feature.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="package-button-fix">
              Save Changes
            </Button>
            <Button onClick={handleCancel} variant="outline" className="package-button-fix">
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
      className={cn(
        "p-6 border rounded-lg transition-all duration-200",
        "package-border-radius-fix package-animation-fix",
        vehicle.isActive
          ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <FaGripVertical className="h-4 w-4 text-gray-400 cursor-move mt-1" />
          <div className="flex items-center gap-3">
            <div className="text-2xl">{vehicleTypeInfo?.icon}</div>
            <div>
              <h3 className="font-semibold text-lg">{vehicle.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {vehicleTypeInfo?.label} • {vehicle.description}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            checked={vehicle.isActive}
            onCheckedChange={() => onToggleActive(vehicle.id)}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(vehicle.id)}
            className="package-button-fix"
          >
            <FaEdit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDuplicate(vehicle)}
            className="package-button-fix"
          >
            <FaCopy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(vehicle.id)}
            className="package-button-fix text-red-600 hover:text-red-700"
          >
            <FaTrash className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <FaUsers className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-sm text-gray-500">Passengers</p>
            <p className="font-medium">{vehicle.passengerCapacity}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <FaSuitcase className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-sm text-gray-500">Luggage</p>
            <p className="font-medium">{vehicle.luggageCapacity}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <FaDollarSign className="h-4 w-4 text-purple-600" />
          <div>
            <p className="text-sm text-gray-500">Base Price</p>
            <p className="font-medium">${vehicle.basePrice.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {vehicle.features.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Features</h4>
          <div className="flex flex-wrap gap-2">
            {vehicle.features.map((feature) => {
              const featureInfo = VEHICLE_FEATURES.find(f => f.value === feature);
              return (
                <Badge key={feature} variant="outline" className="text-xs">
                  <span className="mr-1">{featureInfo?.icon}</span>
                  {featureInfo?.label}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {vehicle.images.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Images</h4>
          <div className="flex gap-2">
            {vehicle.images.slice(0, 3).map((image, index) => (
              <div key={index} className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 relative">
                <Image src={image.url} alt={image.fileName} fill sizes="48px" style={{ objectFit: "cover" }} />
              </div>
            ))}
            {vehicle.images.length > 3 && (
              <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                +{vehicle.images.length - 3}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Vehicle comparison table component
const VehicleComparisonTable: React.FC<{
  vehicles: VehicleConfiguration[];
}> = ({ vehicles }) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  if (vehicles.length === 0) return null;

  return (
    <Card className="package-selector-glass package-shadow-fix">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaTable className="h-5 w-5 text-blue-600" />
            Vehicle Comparison
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              onClick={() => setViewMode('cards')}
              className="package-button-fix"
            >
              <FaList className="h-4 w-4 mr-1" />
              Cards
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'outline'}
              onClick={() => setViewMode('table')}
              className="package-button-fix"
            >
              <FaTable className="h-4 w-4 mr-1" />
              Table
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium">Vehicle</th>
                  <th className="text-center py-3 px-4 font-medium">Type</th>
                  <th className="text-center py-3 px-4 font-medium">Passengers</th>
                  <th className="text-center py-3 px-4 font-medium">Luggage</th>
                  <th className="text-center py-3 px-4 font-medium">Price</th>
                  <th className="text-center py-3 px-4 font-medium">Features</th>
                  <th className="text-center py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => {
                  const vehicleTypeInfo = VEHICLE_TYPES.find(t => t.value === vehicle.vehicleType);
                  return (
                    <tr key={vehicle.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{vehicleTypeInfo?.icon}</span>
                          <div>
                            <p className="font-medium">{vehicle.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {vehicle.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="outline">{vehicleTypeInfo?.label}</Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <FaUsers className="h-3 w-3 text-blue-600" />
                          <span>{vehicle.passengerCapacity}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <FaSuitcase className="h-3 w-3 text-green-600" />
                          <span>{vehicle.luggageCapacity}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <FaDollarSign className="h-3 w-3 text-purple-600" />
                          <span>${vehicle.basePrice.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {vehicle.features.slice(0, 3).map((feature) => {
                            const featureInfo = VEHICLE_FEATURES.find(f => f.value === feature);
                            return (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {featureInfo?.icon}
                              </Badge>
                            );
                          })}
                          {vehicle.features.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{vehicle.features.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant={vehicle.isActive ? "default" : "secondary"}>
                          {vehicle.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">
                    {VEHICLE_TYPES.find(t => t.value === vehicle.vehicleType)?.icon}
                  </span>
                  <div>
                    <h4 className="font-medium">{vehicle.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {VEHICLE_TYPES.find(t => t.value === vehicle.vehicleType)?.label}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <FaUsers className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Passengers</p>
                    <p className="font-medium">{vehicle.passengerCapacity}</p>
                  </div>
                  <div className="text-center">
                    <FaSuitcase className="h-4 w-4 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Luggage</p>
                    <p className="font-medium">{vehicle.luggageCapacity}</p>
                  </div>
                  <div className="text-center">
                    <FaDollarSign className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-medium">${vehicle.basePrice.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {vehicle.features.slice(0, 4).map((feature) => {
                    const featureInfo = VEHICLE_FEATURES.find(f => f.value === feature);
                    return (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {featureInfo?.icon}
                      </Badge>
                    );
                  })}
                  {vehicle.features.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{vehicle.features.length - 4}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const VehicleOptionsTab: React.FC = () => {
  const { control, watch, setValue } = useFormContext<TransferPackageFormData>();
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const watchedData = watch('vehicleOptions');

  const handleAddVehicle = useCallback((vehicleData: Partial<VehicleConfiguration>) => {
    const newVehicle: VehicleConfiguration = {
      id: Date.now().toString(),
      vehicleType: vehicleData.vehicleType || 'SEDAN',
      name: vehicleData.name || 'New Vehicle',
      description: vehicleData.description || '',
      passengerCapacity: vehicleData.passengerCapacity || 4,
      luggageCapacity: vehicleData.luggageCapacity || 2,
      features: vehicleData.features || [],
      images: vehicleData.images || [],
      basePrice: vehicleData.basePrice || 0,
      isActive: true,
      order: (watchedData.vehicles?.length || 0) + 1,
    };

    const currentVehicles = watchedData.vehicles || [];
    setValue('vehicleOptions.vehicles', [...currentVehicles, newVehicle]);
    setShowAddModal(false);
  }, [watchedData.vehicles, setValue]);

  const handleUpdateVehicle = useCallback((updatedVehicle: VehicleConfiguration) => {
    const currentVehicles = watchedData.vehicles || [];
    const updatedVehicles = currentVehicles.map(vehicle =>
      vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle
    );
    setValue('vehicleOptions.vehicles', updatedVehicles);
  }, [watchedData.vehicles, setValue]);

  const handleRemoveVehicle = useCallback((id: string) => {
    const currentVehicles = watchedData.vehicles || [];
    const updatedVehicles = currentVehicles.filter(vehicle => vehicle.id !== id);
    setValue('vehicleOptions.vehicles', updatedVehicles);
  }, [watchedData.vehicles, setValue]);

  const handleDuplicateVehicle = useCallback((vehicle: VehicleConfiguration) => {
    const duplicatedVehicle: VehicleConfiguration = {
      ...vehicle,
      id: Date.now().toString(),
      name: `${vehicle.name} (Copy)`,
      order: (watchedData.vehicles?.length || 0) + 1,
    };

    const currentVehicles = watchedData.vehicles || [];
    setValue('vehicleOptions.vehicles', [...currentVehicles, duplicatedVehicle]);
  }, [watchedData.vehicles, setValue]);

  const handleToggleActive = useCallback((id: string) => {
    const currentVehicles = watchedData.vehicles || [];
    const updatedVehicles = currentVehicles.map(vehicle =>
      vehicle.id === id ? { ...vehicle, isActive: !vehicle.isActive } : vehicle
    );
    setValue('vehicleOptions.vehicles', updatedVehicles);
  }, [watchedData.vehicles, setValue]);

  return (
    <div className="space-y-6 package-scroll-fix">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Vehicle Options</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure different vehicle types and their features for your transfer service
          </p>
        </div>
        
        <Button
          onClick={() => setShowAddModal(true)}
          className="package-button-fix package-animation-fix"
        >
          <FaPlus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Vehicle Comparison */}
      {watchedData.vehicles && watchedData.vehicles.length > 0 && (
        <VehicleComparisonTable vehicles={watchedData.vehicles} />
      )}

      {/* Vehicles List */}
      <div className="space-y-4">
        <AnimatePresence>
          {(watchedData.vehicles || []).map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onUpdate={handleUpdateVehicle}
              onRemove={handleRemoveVehicle}
              onDuplicate={handleDuplicateVehicle}
              onToggleActive={handleToggleActive}
              isEditing={editingVehicle === vehicle.id}
              onEdit={setEditingVehicle}
              onCancelEdit={() => setEditingVehicle(null)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {(!watchedData.vehicles || watchedData.vehicles.length === 0) && (
        <Card className="package-selector-glass package-shadow-fix">
          <CardContent className="text-center py-12">
            <FaCar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No vehicles configured yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add vehicle configurations to offer different options to your customers
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="package-button-fix package-animation-fix"
            >
              <FaPlus className="h-4 w-4 mr-2" />
              Add Your First Vehicle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Vehicle Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Add New Vehicle</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Vehicle Type</label>
                  <Select defaultValue="SEDAN">
                    <SelectTrigger className="package-text-fix">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Vehicle Name</label>
                  <Input
                    placeholder="e.g., Toyota Camry - Comfortable Sedan"
                    className="package-text-fix"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe the vehicle and its features"
                    rows={3}
                    className="package-text-fix"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Passenger Capacity</label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      defaultValue="4"
                      className="package-text-fix"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Luggage Capacity</label>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      defaultValue="2"
                      className="package-text-fix"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Base Price</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="package-text-fix"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                  className="package-button-fix"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleAddVehicle({});
                    setShowAddModal(false);
                  }}
                  className="package-button-fix"
                >
                  Add Vehicle
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
