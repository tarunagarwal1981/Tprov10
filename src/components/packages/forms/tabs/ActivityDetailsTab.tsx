"use client";

import React, { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaClock,
  FaMapMarkerAlt,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCopy,
  FaCalendarAlt,
  FaUsers,
  FaList,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  ActivityPackageFormData,
  DayOfWeek,
  TimeSlot,
} from "@/lib/types/activity-package";

// Day options
const DAY_OPTIONS: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 'MON', label: 'Monday', short: 'Mon' },
  { value: 'TUE', label: 'Tuesday', short: 'Tue' },
  { value: 'WED', label: 'Wednesday', short: 'Wed' },
  { value: 'THU', label: 'Thursday', short: 'Thu' },
  { value: 'FRI', label: 'Friday', short: 'Fri' },
  { value: 'SAT', label: 'Saturday', short: 'Sat' },
  { value: 'SUN', label: 'Sunday', short: 'Sun' },
];

// List builder component
const ListBuilder: React.FC<{
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, item: string) => void;
  placeholder: string;
  title: string;
  icon: React.ReactNode;
}> = ({ items, onAdd, onRemove, onUpdate, placeholder, title, icon }) => {
  const [newItem, setNewItem] = useState('');

  const handleAdd = useCallback(() => {
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  }, [newItem, onAdd]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }, [handleAdd]);

  return (
    <Card className="package-selector-glass package-shadow-fix">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add new item */}
          <div className="flex gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="package-text-fix"
            />
            <Button
              onClick={handleAdd}
              disabled={!newItem.trim()}
              className="package-button-fix"
            >
              <FaPlus className="h-4 w-4" />
            </Button>
          </div>

          {/* Items list */}
          <div className="space-y-2">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                >
                  <FaCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="flex-1 text-sm">{item}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemove(index)}
                    className="package-button-fix"
                  >
                    <FaTrash className="h-3 w-3" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {items.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No items added yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Time slot component
const TimeSlotCard: React.FC<{
  timeSlot: TimeSlot;
  onUpdate: (timeSlot: TimeSlot) => void;
  onRemove: (id: string) => void;
  onClone: (timeSlot: TimeSlot) => void;
}> = ({ timeSlot, onUpdate, onRemove, onClone }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(timeSlot);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    setIsEditing(false);
  }, [editData, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditData(timeSlot);
    setIsEditing(false);
  }, [timeSlot]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
    >
      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Time</label>
              <Input
                type="time"
                value={editData.startTime}
                onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                className="package-text-fix"
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Time</label>
              <Input
                type="time"
                value={editData.endTime}
                onChange={(e) => setEditData({ ...editData, endTime: e.target.value })}
                className="package-text-fix"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Capacity</label>
            <Input
              type="number"
              min="1"
              value={editData.capacity}
              onChange={(e) => setEditData({ ...editData, capacity: parseInt(e.target.value) || 1 })}
              className="package-text-fix"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Operating Days</label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const allDays = DAY_OPTIONS.map(d => d.value);
                  const isAllSelected = allDays.every(day => editData.days.includes(day));
                  
                  if (isAllSelected) {
                    // Deselect all
                    setEditData({ ...editData, days: [] });
                  } else {
                    // Select all
                    setEditData({ ...editData, days: allDays });
                  }
                }}
                className="package-button-fix text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                {(() => {
                  const allDays = DAY_OPTIONS.map(d => d.value);
                  const isAllSelected = allDays.every(day => editData.days.includes(day));
                  return isAllSelected ? 'Deselect All' : 'Select All';
                })()}
              </Button>
              {DAY_OPTIONS.map((day) => (
                <Badge
                  key={day.value}
                  variant={editData.days.includes(day.value) ? "default" : "outline"}
                  className="cursor-pointer package-button-fix"
                  onClick={() => {
                    const newDays = editData.days.includes(day.value)
                      ? editData.days.filter(d => d !== day.value)
                      : [...editData.days, day.value];
                    setEditData({ ...editData, days: newDays });
                  }}
                >
                  {day.short}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" className="package-button-fix">
              <FaCheck className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button onClick={handleCancel} size="sm" variant="outline" className="package-button-fix">
              <FaTimes className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaClock className="h-4 w-4 text-blue-600" />
              <span className="font-medium">
                {timeSlot.startTime} - {timeSlot.endTime}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="package-button-fix"
              >
                <FaEdit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onClone(timeSlot)}
                className="package-button-fix"
              >
                <FaCopy className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(timeSlot.id)}
                className="package-button-fix text-red-600 hover:text-red-700"
              >
                <FaTrash className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <FaUsers className="h-3 w-3" />
              <span>Capacity: {timeSlot.capacity}</span>
            </div>
            <div className="flex items-center gap-1">
              <FaCalendarAlt className="h-3 w-3" />
              <span>{timeSlot.days.length} days</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {timeSlot.days.map((day) => {
              const dayInfo = DAY_OPTIONS.find(d => d.value === day);
              return (
                <Badge key={day} variant="secondary" className="text-xs">
                  {dayInfo?.short}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const ActivityDetailsTab: React.FC = () => {
  const { control, watch, setValue } = useFormContext<ActivityPackageFormData>();
  const [newTimeSlot, setNewTimeSlot] = useState<Partial<TimeSlot>>({
    startTime: '09:00',
    endTime: '17:00',
    capacity: 10,
    isActive: true,
    days: [],
  });

  const watchedData = watch('activityDetails');

  const handleAddTimeSlot = useCallback(() => {
    if (newTimeSlot.startTime && newTimeSlot.endTime && newTimeSlot.days?.length) {
      const timeSlot: TimeSlot = {
        id: Date.now().toString(),
        startTime: newTimeSlot.startTime!,
        endTime: newTimeSlot.endTime!,
        capacity: newTimeSlot.capacity || 10,
        isActive: true,
        days: newTimeSlot.days!,
      };

      const currentSlots = watchedData.operationalHours.timeSlots || [];
      setValue('activityDetails.operationalHours.timeSlots', [...currentSlots, timeSlot]);
      
      // Reset form
      setNewTimeSlot({
        startTime: '09:00',
        endTime: '17:00',
        capacity: 10,
        isActive: true,
        days: [],
      });
    }
  }, [newTimeSlot, watchedData.operationalHours.timeSlots, setValue]);

  const handleUpdateTimeSlot = useCallback((updatedSlot: TimeSlot) => {
    const currentSlots = watchedData.operationalHours.timeSlots || [];
    const updatedSlots = currentSlots.map(slot => 
      slot.id === updatedSlot.id ? updatedSlot : slot
    );
    setValue('activityDetails.operationalHours.timeSlots', updatedSlots);
  }, [watchedData.operationalHours.timeSlots, setValue]);

  const handleRemoveTimeSlot = useCallback((id: string) => {
    const currentSlots = watchedData.operationalHours.timeSlots || [];
    const updatedSlots = currentSlots.filter(slot => slot.id !== id);
    setValue('activityDetails.operationalHours.timeSlots', updatedSlots);
  }, [watchedData.operationalHours.timeSlots, setValue]);

  const handleCloneTimeSlot = useCallback((timeSlot: TimeSlot) => {
    const clonedSlot: TimeSlot = {
      ...timeSlot,
      id: Date.now().toString(),
    };
    const currentSlots = watchedData.operationalHours.timeSlots || [];
    setValue('activityDetails.operationalHours.timeSlots', [...currentSlots, clonedSlot]);
  }, [watchedData.operationalHours.timeSlots, setValue]);

  const handleAddToList = useCallback((listName: 'whatToBring' | 'whatsIncluded' | 'whatsNotIncluded', item: string) => {
    const currentList = watchedData[listName] || [];
    setValue(`activityDetails.${listName}`, [...currentList, item]);
  }, [watchedData, setValue]);

  const handleRemoveFromList = useCallback((listName: 'whatToBring' | 'whatsIncluded' | 'whatsNotIncluded', index: number) => {
    const currentList = watchedData[listName] || [];
    const updatedList = currentList.filter((_, i) => i !== index);
    setValue(`activityDetails.${listName}`, updatedList);
  }, [watchedData, setValue]);

  return (
    <div className="space-y-6 package-scroll-fix">
      {/* Operating Hours */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaClock className="h-5 w-5 text-blue-600" />
            Operating Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Add Time Slot */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              <h4 className="font-medium mb-4">Add Time Slot</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <Input
                    type="time"
                    value={newTimeSlot.startTime}
                    onChange={(e) => setNewTimeSlot({ ...newTimeSlot, startTime: e.target.value })}
                    className="package-text-fix"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <Input
                    type="time"
                    value={newTimeSlot.endTime}
                    onChange={(e) => setNewTimeSlot({ ...newTimeSlot, endTime: e.target.value })}
                    className="package-text-fix"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Capacity</label>
                  <Input
                    type="number"
                    min="1"
                    value={newTimeSlot.capacity}
                    onChange={(e) => setNewTimeSlot({ ...newTimeSlot, capacity: parseInt(e.target.value) || 1 })}
                    className="package-text-fix"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Select Days</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allDays = DAY_OPTIONS.map(d => d.value);
                      const currentDays = newTimeSlot.days || [];
                      const isAllSelected = allDays.every(day => currentDays.includes(day));
                      
                      if (isAllSelected) {
                        // Deselect all
                        setNewTimeSlot({ ...newTimeSlot, days: [] });
                      } else {
                        // Select all
                        setNewTimeSlot({ ...newTimeSlot, days: allDays });
                      }
                    }}
                    className="package-button-fix text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    {(() => {
                      const allDays = DAY_OPTIONS.map(d => d.value);
                      const currentDays = newTimeSlot.days || [];
                      const isAllSelected = allDays.every(day => currentDays.includes(day));
                      return isAllSelected ? 'Deselect All' : 'Select All';
                    })()}
                  </Button>
                  {DAY_OPTIONS.map((day) => (
                    <Badge
                      key={day.value}
                      variant={newTimeSlot.days?.includes(day.value) ? "default" : "outline"}
                      className="cursor-pointer package-button-fix"
                      onClick={() => {
                        const currentDays = newTimeSlot.days || [];
                        const newDays = currentDays.includes(day.value)
                          ? currentDays.filter(d => d !== day.value)
                          : [...currentDays, day.value];
                        setNewTimeSlot({ ...newTimeSlot, days: newDays });
                      }}
                    >
                      {day.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleAddTimeSlot}
                disabled={!newTimeSlot.startTime || !newTimeSlot.endTime || !newTimeSlot.days?.length}
                className="package-button-fix"
              >
                <FaPlus className="h-4 w-4 mr-2" />
                Add Time Slot
              </Button>
            </div>

            {/* Time Slots List */}
            <div>
              <h4 className="font-medium mb-4">Time Slots</h4>
              <div className="space-y-3">
                <AnimatePresence>
                  {(watchedData.operationalHours.timeSlots || []).map((timeSlot) => (
                    <TimeSlotCard
                      key={timeSlot.id}
                      timeSlot={timeSlot}
                      onUpdate={handleUpdateTimeSlot}
                      onRemove={handleRemoveTimeSlot}
                      onClone={handleCloneTimeSlot}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meeting Point */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaMapMarkerAlt className="h-5 w-5 text-green-600" />
            Meeting Point
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FormField
              control={control}
              name="activityDetails.meetingPoint.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Point Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Central Park Main Entrance"
                      className="package-text-fix"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="activityDetails.meetingPoint.address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Full address of the meeting point"
                      className="package-text-fix"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="activityDetails.meetingPoint.instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Special instructions for finding the meeting point"
                      rows={3}
                      className="package-text-fix"
                    />
                  </FormControl>
                  <FormDescription>
                    Help customers easily find the meeting point
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* What's Included */}
      <ListBuilder
        items={watchedData.whatsIncluded || []}
        onAdd={(item) => handleAddToList('whatsIncluded', item)}
        onRemove={(index) => handleRemoveFromList('whatsIncluded', index)}
        onUpdate={() => {}} // Not implemented for simplicity
        placeholder="Add what's included (e.g., Professional guide, Equipment)"
        title="What's Included"
        icon={<FaCheck className="h-5 w-5 text-green-600" />}
      />

      {/* What's Not Included */}
      <ListBuilder
        items={watchedData.whatsNotIncluded || []}
        onAdd={(item) => handleAddToList('whatsNotIncluded', item)}
        onRemove={(index) => handleRemoveFromList('whatsNotIncluded', index)}
        onUpdate={() => {}} // Not implemented for simplicity
        placeholder="Add what's not included (e.g., Meals, Transportation)"
        title="What's Not Included"
        icon={<FaTimes className="h-5 w-5 text-red-600" />}
      />

      {/* What to Bring */}
      <ListBuilder
        items={watchedData.whatToBring || []}
        onAdd={(item) => handleAddToList('whatToBring', item)}
        onRemove={(index) => handleRemoveFromList('whatToBring', index)}
        onUpdate={() => {}} // Not implemented for simplicity
        placeholder="Add what to bring (e.g., Comfortable shoes, Water bottle)"
        title="What to Bring"
        icon={<FaList className="h-5 w-5 text-blue-600" />}
      />

      {/* Important Information */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle>Important Information</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="activityDetails.importantInformation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Important Information</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Any important information customers should know (max 1000 characters)"
                    maxLength={1000}
                    rows={6}
                    className="package-text-fix"
                  />
                </FormControl>
                <FormDescription>
                  Safety information, restrictions, or special requirements
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};
