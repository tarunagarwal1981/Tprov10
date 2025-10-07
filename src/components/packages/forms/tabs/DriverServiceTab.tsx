"use client";

import React, { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserTie,
  FaPlus,
  FaTrash,
  FaEdit,
  FaHandshake,
  FaIdCard,
  FaTshirt,
  FaPlane,
  FaLanguage,
  FaSuitcase,
  FaHome,
  FaPhone,
  FaMapMarkerAlt,
  FaDollarSign,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  TransferPackageFormData,
  Language,
  AdditionalService,
} from "@/lib/types/transfer-package";

// Language options with flags
const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
  { value: 'EN', label: 'English', flag: '🇺🇸' },
  { value: 'ES', label: 'Spanish', flag: '🇪🇸' },
  { value: 'FR', label: 'French', flag: '🇫🇷' },
  { value: 'DE', label: 'German', flag: '🇩🇪' },
  { value: 'IT', label: 'Italian', flag: '🇮🇹' },
  { value: 'PT', label: 'Portuguese', flag: '🇵🇹' },
  { value: 'RU', label: 'Russian', flag: '🇷🇺' },
  { value: 'ZH', label: 'Chinese', flag: '🇨🇳' },
  { value: 'JA', label: 'Japanese', flag: '🇯🇵' },
  { value: 'KO', label: 'Korean', flag: '🇰🇷' },
];

// Additional service card component
const AdditionalServiceCard: React.FC<{
  service: AdditionalService;
  onUpdate: (service: AdditionalService) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
}> = ({ service, onUpdate, onRemove, isEditing, onEdit, onCancelEdit }) => {
  const [editData, setEditData] = useState(service);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    onCancelEdit();
  }, [editData, onUpdate, onCancelEdit]);

  const handleCancel = useCallback(() => {
    setEditData(service);
    onCancelEdit();
  }, [service, onCancelEdit]);

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
            <label className="text-sm font-medium">Service Name</label>
            <Input
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              placeholder="e.g., Premium Concierge Service"
              className="package-text-fix"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Describe the additional service"
              rows={3}
              className="package-text-fix"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Price</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={editData.price}
              onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) || 0 })}
              className="package-text-fix"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`included-${editData.id}`}
              checked={editData.isIncluded}
              onCheckedChange={(checked) => setEditData({ ...editData, isIncluded: !!checked })}
            />
            <label htmlFor={`included-${editData.id}`} className="text-sm font-medium">
              Included in base price
            </label>
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
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium">{service.name}</h4>
            <Badge variant={service.isIncluded ? "default" : "secondary"}>
              {service.isIncluded ? "Included" : "Extra"}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {service.description}
          </p>
          <div className="flex items-center gap-2">
            <FaDollarSign className="h-3 w-3 text-green-600" />
            <span className="text-sm font-medium">
              {service.isIncluded ? "Included" : `$${service.price.toFixed(2)}`}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(service.id)}
            className="package-button-fix"
          >
            <FaEdit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(service.id)}
            className="package-button-fix text-red-600 hover:text-red-700"
          >
            <FaTrash className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export const DriverServiceTab: React.FC = () => {
  const { control, watch, setValue } = useFormContext<TransferPackageFormData>();
  const [editingService, setEditingService] = useState<string | null>(null);
  const [newService, setNewService] = useState<Partial<AdditionalService>>({
    name: '',
    description: '',
    price: 0,
    isIncluded: false,
  });

  const watchedData = watch('driverService');

  const handleAddService = useCallback(() => {
    if (newService.name?.trim()) {
      const service: AdditionalService = {
        id: Date.now().toString(),
        name: newService.name!,
        description: newService.description || '',
        price: newService.price || 0,
        isIncluded: newService.isIncluded || false,
      };

      const currentServices = watchedData.additionalServices || [];
      setValue('driverService.additionalServices', [...currentServices, service]);
      
      setNewService({
        name: '',
        description: '',
        price: 0,
        isIncluded: false,
      });
    }
  }, [newService, watchedData.additionalServices, setValue]);

  const handleUpdateService = useCallback((updatedService: AdditionalService) => {
    const currentServices = watchedData.additionalServices || [];
    const updatedServices = currentServices.map(service =>
      service.id === updatedService.id ? updatedService : service
    );
    setValue('driverService.additionalServices', updatedServices);
  }, [watchedData.additionalServices, setValue]);

  const handleRemoveService = useCallback((id: string) => {
    const currentServices = watchedData.additionalServices || [];
    const updatedServices = currentServices.filter(service => service.id !== id);
    setValue('driverService.additionalServices', updatedServices);
  }, [watchedData.additionalServices, setValue]);

  return (
    <div className="space-y-6 package-scroll-fix">
      {/* Basic Services */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaUserTie className="h-5 w-5 text-blue-600" />
            Driver & Service Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Meet & Greet */}
            <FormField
              control={control}
              name="driverService.meetAndGreet"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <FaHandshake className="h-4 w-4 text-green-600" />
                      Meet & Greet Service
                    </FormLabel>
                    <FormDescription>
                      Driver meets passengers at the designated location with a name board
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Name Board */}
            <FormField
              control={control}
              name="driverService.nameBoard"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <FaIdCard className="h-4 w-4 text-blue-600" />
                      Name Board with Passenger Name
                    </FormLabel>
                    <FormDescription>
                      Driver displays passenger name on a professional name board
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Driver Uniform */}
            <FormField
              control={control}
              name="driverService.driverUniform"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <FaTshirt className="h-4 w-4 text-purple-600" />
                      Driver Uniform
                    </FormLabel>
                    <FormDescription>
                      Professional driver in company uniform
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Flight Tracking */}
            <FormField
              control={control}
              name="driverService.flightTracking"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <FaPlane className="h-4 w-4 text-orange-600" />
                      Flight Tracking
                    </FormLabel>
                    <FormDescription>
                      Real-time flight tracking for airport transfers (for airport transfers only)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Luggage Assistance */}
            <FormField
              control={control}
              name="driverService.luggageAssistance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <FaSuitcase className="h-4 w-4 text-green-600" />
                      Luggage Assistance
                    </FormLabel>
                    <FormDescription>
                      Driver assists with loading and unloading luggage
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Door-to-Door Service */}
            <FormField
              control={control}
              name="driverService.doorToDoorService"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <FaHome className="h-4 w-4 text-red-600" />
                      Door-to-Door Service
                    </FormLabel>
                    <FormDescription>
                      Pickup and dropoff at exact addresses, not just main entrances
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Contact Driver in Advance */}
            <FormField
              control={control}
              name="driverService.contactDriverInAdvance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <FaPhone className="h-4 w-4 text-blue-600" />
                      Contact Driver in Advance
                    </FormLabel>
                    <FormDescription>
                      Driver contacts passenger before pickup
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Contact Lead Time */}
            {watchedData.contactDriverInAdvance && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-4"
              >
                <FormField
                  control={control}
                  name="driverService.contactLeadTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Lead Time (Hours)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0.5"
                          max="24"
                          step="0.5"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 2)}
                          className="package-text-fix"
                        />
                      </FormControl>
                      <FormDescription>
                        How many hours before pickup should the driver contact the passenger
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            )}

            {/* Real-time Tracking */}
            <FormField
              control={control}
              name="driverService.realTimeTracking"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <FaMapMarkerAlt className="h-4 w-4 text-indigo-600" />
                      Real-time Tracking
                    </FormLabel>
                    <FormDescription>
                      Passengers can track their driver's location in real-time (if available)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Driver Languages */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaLanguage className="h-5 w-5 text-green-600" />
            Driver Languages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="driverService.driverLanguages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Languages</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {LANGUAGE_OPTIONS.map((language) => (
                    <div key={language.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={language.value}
                        checked={field.value?.includes(language.value)}
                        onCheckedChange={(checked) => {
                          const current = field.value || [];
                          if (checked) {
                            field.onChange([...current, language.value]);
                          } else {
                            field.onChange(current.filter((l: Language) => l !== language.value));
                          }
                        }}
                      />
                      <label
                        htmlFor={language.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <span>{language.flag}</span>
                        {language.label}
                      </label>
                    </div>
                  ))}
                </div>
                <FormDescription>
                  Select languages that your drivers can communicate in
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Additional Services */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle>Additional Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add New Service */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              <h4 className="font-medium mb-4">Add Additional Service</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Service Name</label>
                  <Input
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    placeholder="e.g., Premium Concierge Service"
                    className="package-text-fix"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Describe the additional service"
                    rows={3}
                    className="package-text-fix"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Price</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                    className="package-text-fix"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="new-included"
                    checked={newService.isIncluded}
                    onCheckedChange={(checked) => setNewService({ ...newService, isIncluded: !!checked })}
                  />
                  <label htmlFor="new-included" className="text-sm font-medium">
                    Included in base price
                  </label>
                </div>
                
                <Button
                  onClick={handleAddService}
                  disabled={!newService.name?.trim()}
                  className="package-button-fix"
                >
                  <FaPlus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </div>

            {/* Services List */}
            <div>
              <h4 className="font-medium mb-4">Additional Services</h4>
              <div className="space-y-3">
                <AnimatePresence>
                  {(watchedData.additionalServices || []).map((service) => (
                    <AdditionalServiceCard
                      key={service.id}
                      service={service}
                      onUpdate={handleUpdateService}
                      onRemove={handleRemoveService}
                      isEditing={editingService === service.id}
                      onEdit={setEditingService}
                      onCancelEdit={() => setEditingService(null)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
