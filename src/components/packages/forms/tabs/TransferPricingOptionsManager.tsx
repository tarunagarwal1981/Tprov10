"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaClock,
  FaMapMarkerAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCar,
  FaUsers,
  FaDollarSign,
  FaCheckCircle,
  FaTimes,
  FaSave,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  HourlyPricingOption,
  PointToPointPricingOption,
  VehicleType,
  VehicleFeature,
  VEHICLE_TYPES,
  VEHICLE_FEATURES,
} from "@/lib/types/transfer-package";

// ============================================================================
// HOURLY PRICING OPTION CARD
// ============================================================================

interface HourlyPricingCardProps {
  option: HourlyPricingOption;
  onUpdate: (option: HourlyPricingOption) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
}

const HourlyPricingCard: React.FC<HourlyPricingCardProps> = ({
  option,
  onUpdate,
  onRemove,
  isEditing,
  onEdit,
  onCancelEdit,
}) => {
  const [editData, setEditData] = useState(option);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    onCancelEdit();
  }, [editData, onUpdate, onCancelEdit]);

  const handleCancel = useCallback(() => {
    setEditData(option);
    onCancelEdit();
  }, [option, onCancelEdit]);

  const vehicleTypeInfo = VEHICLE_TYPES.find(v => v.value === option.vehicleType);

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-6 border-2 border-blue-500 rounded-lg bg-white dark:bg-gray-900 shadow-lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Edit Hourly Pricing Option</h4>
            <Badge variant={editData.isActive ? "default" : "secondary"}>
              {editData.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="1"
                value={editData.hours}
                onChange={(e) => setEditData({ ...editData, hours: parseInt(e.target.value) || 1 })}
                className="package-text-fix"
              />
            </div>

            <div>
              <Label htmlFor="rateUSD">Hourly Rate (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="rateUSD"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editData.rateUSD}
                  onChange={(e) => setEditData({ ...editData, rateUSD: parseFloat(e.target.value) || 0 })}
                  className="package-text-fix pl-7"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Select
                value={editData.vehicleType}
                onValueChange={(value: VehicleType) => setEditData({ ...editData, vehicleType: value })}
              >
                <SelectTrigger className="package-text-fix">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 z-50">
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
              <Label htmlFor="vehicleName">Vehicle Name</Label>
              <Input
                id="vehicleName"
                value={editData.vehicleName}
                onChange={(e) => setEditData({ ...editData, vehicleName: e.target.value })}
                placeholder="e.g., Mercedes-Benz S-Class"
                className="package-text-fix"
              />
            </div>

            <div>
              <Label htmlFor="maxPassengers">Max Passengers</Label>
              <Input
                id="maxPassengers"
                type="number"
                min="1"
                value={editData.maxPassengers}
                onChange={(e) => setEditData({ ...editData, maxPassengers: parseInt(e.target.value) || 1 })}
                className="package-text-fix"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Additional details about this option..."
              rows={3}
              className="package-text-fix"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={editData.isActive}
              onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })}
            />
            <Label>Active</Label>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSave} size="sm" className="package-button-fix">
              <FaSave className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button onClick={handleCancel} size="sm" variant="outline" className="package-button-fix">
              <FaTimes className="h-4 w-4 mr-2" />
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
      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{vehicleTypeInfo?.icon}</span>
            <div>
              <h4 className="font-semibold text-lg">{option.vehicleName}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{vehicleTypeInfo?.label}</p>
            </div>
            <Badge variant={option.isActive ? "default" : "secondary"} className="ml-2">
              {option.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-3 mb-2">
            <div className="flex items-center gap-2">
              <FaClock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="font-medium">{option.hours} {option.hours === 1 ? 'Hour' : 'Hours'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FaUsers className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Max Passengers</p>
                <p className="font-medium">{option.maxPassengers}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FaDollarSign className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-xs text-gray-500">Rate</p>
                <p className="font-semibold text-green-600">${option.rateUSD}/hr</p>
              </div>
            </div>
          </div>

          {option.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
              {option.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(option.id)}
            className="package-button-fix"
          >
            <FaEdit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(option.id)}
            className="package-button-fix text-red-600 hover:text-red-700"
          >
            <FaTrash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// POINT-TO-POINT PRICING OPTION CARD
// ============================================================================

interface PointToPointPricingCardProps {
  option: PointToPointPricingOption;
  onUpdate: (option: PointToPointPricingOption) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
}

const PointToPointPricingCard: React.FC<PointToPointPricingCardProps> = ({
  option,
  onUpdate,
  onRemove,
  isEditing,
  onEdit,
  onCancelEdit,
}) => {
  const [editData, setEditData] = useState(option);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    onCancelEdit();
  }, [editData, onUpdate, onCancelEdit]);

  const handleCancel = useCallback(() => {
    setEditData(option);
    onCancelEdit();
  }, [option, onCancelEdit]);

  const vehicleTypeInfo = VEHICLE_TYPES.find(v => v.value === option.vehicleType);

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-6 border-2 border-purple-500 rounded-lg bg-white dark:bg-gray-900 shadow-lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Edit Point-to-Point Pricing Option</h4>
            <Badge variant={editData.isActive ? "default" : "secondary"}>
              {editData.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fromLocation">From Location</Label>
              <Input
                id="fromLocation"
                value={editData.fromLocation}
                onChange={(e) => setEditData({ ...editData, fromLocation: e.target.value })}
                placeholder="e.g., JFK Airport"
                className="package-text-fix"
              />
            </div>

            <div>
              <Label htmlFor="toLocation">To Location</Label>
              <Input
                id="toLocation"
                value={editData.toLocation}
                onChange={(e) => setEditData({ ...editData, toLocation: e.target.value })}
                placeholder="e.g., Manhattan Hotel"
                className="package-text-fix"
              />
            </div>

            <div>
              <Label htmlFor="fromAddress">From Address (Optional)</Label>
              <Input
                id="fromAddress"
                value={editData.fromAddress || ''}
                onChange={(e) => setEditData({ ...editData, fromAddress: e.target.value })}
                placeholder="Full address..."
                className="package-text-fix"
              />
            </div>

            <div>
              <Label htmlFor="toAddress">To Address (Optional)</Label>
              <Input
                id="toAddress"
                value={editData.toAddress || ''}
                onChange={(e) => setEditData({ ...editData, toAddress: e.target.value })}
                placeholder="Full address..."
                className="package-text-fix"
              />
            </div>

            <div>
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Select
                value={editData.vehicleType}
                onValueChange={(value: VehicleType) => setEditData({ ...editData, vehicleType: value })}
              >
                <SelectTrigger className="package-text-fix">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 z-50">
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
              <Label htmlFor="vehicleName">Vehicle Name</Label>
              <Input
                id="vehicleName"
                value={editData.vehicleName}
                onChange={(e) => setEditData({ ...editData, vehicleName: e.target.value })}
                placeholder="e.g., Toyota Camry"
                className="package-text-fix"
              />
            </div>

            <div>
              <Label htmlFor="maxPassengers">Max Passengers</Label>
              <Input
                id="maxPassengers"
                type="number"
                min="1"
                value={editData.maxPassengers}
                onChange={(e) => setEditData({ ...editData, maxPassengers: parseInt(e.target.value) || 1 })}
                className="package-text-fix"
              />
            </div>

            <div>
              <Label htmlFor="costUSD">Total Cost (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="costUSD"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editData.costUSD}
                  onChange={(e) => setEditData({ ...editData, costUSD: parseFloat(e.target.value) || 0 })}
                  className="package-text-fix pl-7"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="distance">Distance (Optional)</Label>
              <Input
                id="distance"
                type="number"
                min="0"
                step="0.1"
                value={editData.distance || ''}
                onChange={(e) => setEditData({ ...editData, distance: parseFloat(e.target.value) || undefined })}
                placeholder="Distance..."
                className="package-text-fix"
              />
            </div>

            <div>
              <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
              <Input
                id="estimatedDuration"
                type="number"
                min="0"
                value={editData.estimatedDurationMinutes || ''}
                onChange={(e) => setEditData({ ...editData, estimatedDurationMinutes: parseInt(e.target.value) || undefined })}
                placeholder="Duration in minutes..."
                className="package-text-fix"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Additional details about this route..."
              rows={3}
              className="package-text-fix"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={editData.isActive}
              onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })}
            />
            <Label>Active</Label>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSave} size="sm" className="package-button-fix">
              <FaSave className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button onClick={handleCancel} size="sm" variant="outline" className="package-button-fix">
              <FaTimes className="h-4 w-4 mr-2" />
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
      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{vehicleTypeInfo?.icon}</span>
            <div>
              <h4 className="font-semibold text-lg">{option.vehicleName}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{vehicleTypeInfo?.label}</p>
            </div>
            <Badge variant={option.isActive ? "default" : "secondary"} className="ml-2">
              {option.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mb-2 text-sm">
            <FaMapMarkerAlt className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{option.fromLocation}</span>
            <span className="text-gray-400">→</span>
            <FaMapMarkerAlt className="h-4 w-4 text-purple-600" />
            <span className="font-medium">{option.toLocation}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="flex items-center gap-2">
              <FaUsers className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Max Passengers</p>
                <p className="font-medium">{option.maxPassengers}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FaDollarSign className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-xs text-gray-500">Total Cost</p>
                <p className="font-semibold text-green-600">${option.costUSD}</p>
              </div>
            </div>
          </div>

          {option.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
              {option.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(option.id)}
            className="package-button-fix"
          >
            <FaEdit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(option.id)}
            className="package-button-fix text-red-600 hover:text-red-700"
          >
            <FaTrash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface TransferPricingOptionsManagerProps {
  hourlyOptions: HourlyPricingOption[];
  pointToPointOptions: PointToPointPricingOption[];
  onUpdateHourly: (options: HourlyPricingOption[]) => void;
  onUpdatePointToPoint: (options: PointToPointPricingOption[]) => void;
}

export const TransferPricingOptionsManager: React.FC<TransferPricingOptionsManagerProps> = ({
  hourlyOptions,
  pointToPointOptions,
  onUpdateHourly,
  onUpdatePointToPoint,
}) => {
  const [editingHourlyId, setEditingHourlyId] = useState<string | null>(null);
  const [editingP2PId, setEditingP2PId] = useState<string | null>(null);
  const [showHourlyForm, setShowHourlyForm] = useState(false);
  const [showP2PForm, setShowP2PForm] = useState(false);

  // New hourly option
  const [newHourlyOption, setNewHourlyOption] = useState<Partial<HourlyPricingOption>>({
    hours: 1,
    vehicleType: 'SEDAN',
    vehicleName: '',
    maxPassengers: 4,
    rateUSD: 0,
    description: '',
    features: [],
    isActive: true,
    displayOrder: 0,
  });

  // New P2P option
  const [newP2POption, setNewP2POption] = useState<Partial<PointToPointPricingOption>>({
    fromLocation: '',
    toLocation: '',
    vehicleType: 'SEDAN',
    vehicleName: '',
    maxPassengers: 4,
    costUSD: 0,
    distanceUnit: 'KM',
    description: '',
    features: [],
    isActive: true,
    displayOrder: 0,
  });

  // Hourly option handlers
  const handleAddHourly = useCallback(() => {
    if (newHourlyOption.vehicleName?.trim() && newHourlyOption.hours && newHourlyOption.rateUSD) {
      const option: HourlyPricingOption = {
        id: Date.now().toString(),
        hours: newHourlyOption.hours!,
        vehicleType: newHourlyOption.vehicleType!,
        vehicleName: newHourlyOption.vehicleName!,
        maxPassengers: newHourlyOption.maxPassengers!,
        rateUSD: newHourlyOption.rateUSD!,
        description: newHourlyOption.description,
        features: newHourlyOption.features!,
        isActive: newHourlyOption.isActive!,
        displayOrder: hourlyOptions.length,
      };

      onUpdateHourly([...hourlyOptions, option]);
      setNewHourlyOption({
        hours: 1,
        vehicleType: 'SEDAN',
        vehicleName: '',
        maxPassengers: 4,
        rateUSD: 0,
        description: '',
        features: [],
        isActive: true,
        displayOrder: 0,
      });
      setShowHourlyForm(false);
    }
  }, [newHourlyOption, hourlyOptions, onUpdateHourly]);

  const handleUpdateHourly = useCallback((updatedOption: HourlyPricingOption) => {
    const updated = hourlyOptions.map(opt =>
      opt.id === updatedOption.id ? updatedOption : opt
    );
    onUpdateHourly(updated);
  }, [hourlyOptions, onUpdateHourly]);

  const handleRemoveHourly = useCallback((id: string) => {
    onUpdateHourly(hourlyOptions.filter(opt => opt.id !== id));
  }, [hourlyOptions, onUpdateHourly]);

  // P2P option handlers
  const handleAddP2P = useCallback(() => {
    if (newP2POption.fromLocation?.trim() && newP2POption.toLocation?.trim() && 
        newP2POption.vehicleName?.trim() && newP2POption.costUSD) {
      const option: PointToPointPricingOption = {
        id: Date.now().toString(),
        fromLocation: newP2POption.fromLocation!,
        fromAddress: newP2POption.fromAddress,
        fromCoordinates: newP2POption.fromCoordinates,
        toLocation: newP2POption.toLocation!,
        toAddress: newP2POption.toAddress,
        toCoordinates: newP2POption.toCoordinates,
        distance: newP2POption.distance,
        distanceUnit: newP2POption.distanceUnit!,
        estimatedDurationMinutes: newP2POption.estimatedDurationMinutes,
        vehicleType: newP2POption.vehicleType!,
        vehicleName: newP2POption.vehicleName!,
        maxPassengers: newP2POption.maxPassengers!,
        costUSD: newP2POption.costUSD!,
        description: newP2POption.description,
        features: newP2POption.features!,
        isActive: newP2POption.isActive!,
        displayOrder: pointToPointOptions.length,
      };

      onUpdatePointToPoint([...pointToPointOptions, option]);
      setNewP2POption({
        fromLocation: '',
        toLocation: '',
        vehicleType: 'SEDAN',
        vehicleName: '',
        maxPassengers: 4,
        costUSD: 0,
        distanceUnit: 'KM',
        description: '',
        features: [],
        isActive: true,
        displayOrder: 0,
      });
      setShowP2PForm(false);
    }
  }, [newP2POption, pointToPointOptions, onUpdatePointToPoint]);

  const handleUpdateP2P = useCallback((updatedOption: PointToPointPricingOption) => {
    const updated = pointToPointOptions.map(opt =>
      opt.id === updatedOption.id ? updatedOption : opt
    );
    onUpdatePointToPoint(updated);
  }, [pointToPointOptions, onUpdatePointToPoint]);

  const handleRemoveP2P = useCallback((id: string) => {
    onUpdatePointToPoint(pointToPointOptions.filter(opt => opt.id !== id));
  }, [pointToPointOptions, onUpdatePointToPoint]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="hourly" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hourly" className="flex items-center gap-2">
            <FaClock className="h-4 w-4" />
            Hourly Pricing ({hourlyOptions.length})
          </TabsTrigger>
          <TabsTrigger value="point-to-point" className="flex items-center gap-2">
            <FaMapMarkerAlt className="h-4 w-4" />
            Point-to-Point ({pointToPointOptions.length})
          </TabsTrigger>
        </TabsList>

        {/* HOURLY PRICING TAB */}
        <TabsContent value="hourly" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FaClock className="h-5 w-5 text-blue-600" />
                    Hourly Pricing Options
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Set pricing based on hourly rates. Ideal for chauffeur services and time-based transfers.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowHourlyForm(!showHourlyForm)}
                  className="package-button-fix"
                >
                  <FaPlus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {showHourlyForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-6 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 dark:bg-blue-950"
                  >
                    <h4 className="text-lg font-semibold mb-4">New Hourly Pricing Option</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Hours</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newHourlyOption.hours}
                          onChange={(e) => setNewHourlyOption({ ...newHourlyOption, hours: parseInt(e.target.value) || 1 })}
                          className="package-text-fix"
                        />
                      </div>
                      <div>
                        <Label>Hourly Rate (USD)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newHourlyOption.rateUSD}
                            onChange={(e) => setNewHourlyOption({ ...newHourlyOption, rateUSD: parseFloat(e.target.value) || 0 })}
                            className="package-text-fix pl-7"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Vehicle Type</Label>
                        <Select
                          value={newHourlyOption.vehicleType}
                          onValueChange={(value: VehicleType) => setNewHourlyOption({ ...newHourlyOption, vehicleType: value })}
                        >
                          <SelectTrigger className="package-text-fix">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 z-50">
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
                        <Label>Vehicle Name</Label>
                        <Input
                          value={newHourlyOption.vehicleName}
                          onChange={(e) => setNewHourlyOption({ ...newHourlyOption, vehicleName: e.target.value })}
                          placeholder="e.g., Mercedes-Benz S-Class"
                          className="package-text-fix"
                        />
                      </div>
                      <div>
                        <Label>Max Passengers</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newHourlyOption.maxPassengers}
                          onChange={(e) => setNewHourlyOption({ ...newHourlyOption, maxPassengers: parseInt(e.target.value) || 1 })}
                          className="package-text-fix"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleAddHourly} className="package-button-fix">
                        <FaCheckCircle className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                      <Button onClick={() => setShowHourlyForm(false)} variant="outline" className="package-button-fix">
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3">
                {hourlyOptions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FaClock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No hourly pricing options yet</p>
                    <p className="text-sm">Click &quot;Add Option&quot; to create your first hourly pricing option</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {hourlyOptions.map((option) => (
                      <HourlyPricingCard
                        key={option.id}
                        option={option}
                        onUpdate={handleUpdateHourly}
                        onRemove={handleRemoveHourly}
                        isEditing={editingHourlyId === option.id}
                        onEdit={setEditingHourlyId}
                        onCancelEdit={() => setEditingHourlyId(null)}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POINT-TO-POINT PRICING TAB */}
        <TabsContent value="point-to-point" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FaMapMarkerAlt className="h-5 w-5 text-purple-600" />
                    Point-to-Point Pricing Options
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Set fixed pricing for specific routes. Perfect for airport transfers and city-to-city trips.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowP2PForm(!showP2PForm)}
                  className="package-button-fix"
                >
                  <FaPlus className="h-4 w-4 mr-2" />
                  Add Route
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {showP2PForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-6 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50 dark:bg-purple-950"
                  >
                    <h4 className="text-lg font-semibold mb-4">New Point-to-Point Route</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>From Location *</Label>
                        <Input
                          value={newP2POption.fromLocation}
                          onChange={(e) => setNewP2POption({ ...newP2POption, fromLocation: e.target.value })}
                          placeholder="e.g., JFK Airport"
                          className="package-text-fix"
                        />
                      </div>
                      <div>
                        <Label>To Location *</Label>
                        <Input
                          value={newP2POption.toLocation}
                          onChange={(e) => setNewP2POption({ ...newP2POption, toLocation: e.target.value })}
                          placeholder="e.g., Manhattan Hotel"
                          className="package-text-fix"
                        />
                      </div>
                      <div>
                        <Label>Vehicle Type</Label>
                        <Select
                          value={newP2POption.vehicleType}
                          onValueChange={(value: VehicleType) => setNewP2POption({ ...newP2POption, vehicleType: value })}
                        >
                          <SelectTrigger className="package-text-fix">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 z-50">
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
                        <Label>Vehicle Name *</Label>
                        <Input
                          value={newP2POption.vehicleName}
                          onChange={(e) => setNewP2POption({ ...newP2POption, vehicleName: e.target.value })}
                          placeholder="e.g., Toyota Camry"
                          className="package-text-fix"
                        />
                      </div>
                      <div>
                        <Label>Max Passengers</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newP2POption.maxPassengers}
                          onChange={(e) => setNewP2POption({ ...newP2POption, maxPassengers: parseInt(e.target.value) || 1 })}
                          className="package-text-fix"
                        />
                      </div>
                      <div>
                        <Label>Total Cost (USD) *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newP2POption.costUSD}
                            onChange={(e) => setNewP2POption({ ...newP2POption, costUSD: parseFloat(e.target.value) || 0 })}
                            className="package-text-fix pl-7"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleAddP2P} className="package-button-fix">
                        <FaCheckCircle className="h-4 w-4 mr-2" />
                        Add Route
                      </Button>
                      <Button onClick={() => setShowP2PForm(false)} variant="outline" className="package-button-fix">
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3">
                {pointToPointOptions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FaMapMarkerAlt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No point-to-point routes yet</p>
                    <p className="text-sm">Click &quot;Add Route&quot; to create your first route pricing option</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {pointToPointOptions.map((option) => (
                      <PointToPointPricingCard
                        key={option.id}
                        option={option}
                        onUpdate={handleUpdateP2P}
                        onRemove={handleRemoveP2P}
                        isEditing={editingP2PId === option.id}
                        onEdit={setEditingP2PId}
                        onCancelEdit={() => setEditingP2PId(null)}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

