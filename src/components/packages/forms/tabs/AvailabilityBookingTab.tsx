"use client";

import React, { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCalendarAlt,
  FaPlus,
  FaTrash,
  FaEdit,
  FaClock,
  FaCheck,
  FaTimes,
  FaGripVertical,
  FaExclamationTriangle,
  FaInfoCircle,
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
  DayOfWeek,
  TimeSlot,
  BookingRestriction,
} from "@/lib/types/transfer-package";

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

// Time slot card component
const TimeSlotCard: React.FC<{
  timeSlot: TimeSlot;
  onUpdate: (timeSlot: TimeSlot) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
}> = ({ timeSlot, onUpdate, onRemove, isEditing, onEdit, onCancelEdit }) => {
  const [editData, setEditData] = useState(timeSlot);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    onCancelEdit();
  }, [editData, onUpdate, onCancelEdit]);

  const handleCancel = useCallback(() => {
    setEditData(timeSlot);
    onCancelEdit();
  }, [timeSlot, onCancelEdit]);

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
      >
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
            <label className="text-sm font-medium mb-2 block">Operating Days</label>
            <div className="flex flex-wrap gap-2">
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

          <div className="flex items-center space-x-2">
            <Switch
              checked={editData.isActive}
              onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })}
            />
            <label className="text-sm font-medium">Active</label>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaGripVertical className="h-4 w-4 text-gray-400 cursor-move" />
          <div className="flex items-center gap-2">
            <FaClock className="h-4 w-4 text-blue-600" />
            <span className="font-medium">
              {timeSlot.startTime} - {timeSlot.endTime}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={timeSlot.isActive ? "default" : "secondary"}>
            {timeSlot.isActive ? "Active" : "Inactive"}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(timeSlot.id)}
            className="package-button-fix"
          >
            <FaEdit className="h-3 w-3" />
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

      <div className="mt-3">
        <div className="flex flex-wrap gap-1">
          {timeSlot.days.map((day) => {
            const dayInfo = DAY_OPTIONS.find(d => d.value === day);
            return (
              <Badge key={day} variant="outline" className="text-xs">
                {dayInfo?.short}
              </Badge>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// Booking restriction card component
const BookingRestrictionCard: React.FC<{
  restriction: BookingRestriction;
  onUpdate: (restriction: BookingRestriction) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
}> = ({ restriction, onUpdate, onRemove, isEditing, onEdit, onCancelEdit }) => {
  const [editData, setEditData] = useState(restriction);

  const handleSave = useCallback(() => {
    onUpdate(editData);
    onCancelEdit();
  }, [editData, onUpdate, onCancelEdit]);

  const handleCancel = useCallback(() => {
    setEditData(restriction);
    onCancelEdit();
  }, [restriction, onCancelEdit]);

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
            <label className="text-sm font-medium">Restriction Type</label>
            <select
              value={editData.type}
              onChange={(e) => setEditData({ ...editData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="DATE_RANGE">Date Range</option>
              <option value="SPECIFIC_DATES">Specific Dates</option>
              <option value="HOLIDAYS">Holidays</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Describe the booking restriction"
              rows={3}
              className="package-text-fix"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={editData.isActive}
              onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })}
            />
            <label className="text-sm font-medium">Active</label>
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
            <h4 className="font-medium">{restriction.description}</h4>
            <Badge variant={restriction.isActive ? "default" : "secondary"}>
              {restriction.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {restriction.type.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(restriction.id)}
            className="package-button-fix"
          >
            <FaEdit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(restriction.id)}
            className="package-button-fix text-red-600 hover:text-red-700"
          >
            <FaTrash className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export const AvailabilityBookingTab: React.FC = () => {
  const { control, watch, setValue } = useFormContext<TransferPackageFormData>();
  const [editingTimeSlot, setEditingTimeSlot] = useState<string | null>(null);
  const [editingRestriction, setEditingRestriction] = useState<string | null>(null);
  const [newTimeSlot, setNewTimeSlot] = useState<Partial<TimeSlot>>({
    startTime: '09:00',
    endTime: '17:00',
    isActive: true,
    days: [],
  });
  const [newRestriction, setNewRestriction] = useState<Partial<BookingRestriction>>({
    type: 'DATE_RANGE',
    description: '',
    isActive: true,
  });

  const watchedData = watch('availabilityBooking');

  const handleAddTimeSlot = useCallback(() => {
    if (newTimeSlot.startTime && newTimeSlot.endTime && newTimeSlot.days?.length) {
      const timeSlot: TimeSlot = {
        id: Date.now().toString(),
        startTime: newTimeSlot.startTime!,
        endTime: newTimeSlot.endTime!,
        isActive: true,
        days: newTimeSlot.days!,
      };

      const currentSlots = watchedData.availableTimeSlots || [];
      setValue('availabilityBooking.availableTimeSlots', [...currentSlots, timeSlot]);
      
      setNewTimeSlot({
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
        days: [],
      });
    }
  }, [newTimeSlot, watchedData.availableTimeSlots, setValue]);

  const handleUpdateTimeSlot = useCallback((updatedSlot: TimeSlot) => {
    const currentSlots = watchedData.availableTimeSlots || [];
    const updatedSlots = currentSlots.map(slot => 
      slot.id === updatedSlot.id ? updatedSlot : slot
    );
    setValue('availabilityBooking.availableTimeSlots', updatedSlots);
  }, [watchedData.availableTimeSlots, setValue]);

  const handleRemoveTimeSlot = useCallback((id: string) => {
    const currentSlots = watchedData.availableTimeSlots || [];
    const updatedSlots = currentSlots.filter(slot => slot.id !== id);
    setValue('availabilityBooking.availableTimeSlots', updatedSlots);
  }, [watchedData.availableTimeSlots, setValue]);

  const handleAddRestriction = useCallback(() => {
    if (newRestriction.description?.trim()) {
      const restriction: BookingRestriction = {
        id: Date.now().toString(),
        type: newRestriction.type || 'DATE_RANGE',
        description: newRestriction.description!,
        isActive: newRestriction.isActive || true,
      };

      const currentRestrictions = watchedData.bookingRestrictions || [];
      setValue('availabilityBooking.bookingRestrictions', [...currentRestrictions, restriction]);
      
      setNewRestriction({
        type: 'DATE_RANGE',
        description: '',
        isActive: true,
      });
    }
  }, [newRestriction, watchedData.bookingRestrictions, setValue]);

  const handleUpdateRestriction = useCallback((updatedRestriction: BookingRestriction) => {
    const currentRestrictions = watchedData.bookingRestrictions || [];
    const updatedRestrictions = currentRestrictions.map(restriction =>
      restriction.id === updatedRestriction.id ? updatedRestriction : restriction
    );
    setValue('availabilityBooking.bookingRestrictions', updatedRestrictions);
  }, [watchedData.bookingRestrictions, setValue]);

  const handleRemoveRestriction = useCallback((id: string) => {
    const currentRestrictions = watchedData.bookingRestrictions || [];
    const updatedRestrictions = currentRestrictions.filter(restriction => restriction.id !== id);
    setValue('availabilityBooking.bookingRestrictions', updatedRestrictions);
  }, [watchedData.bookingRestrictions, setValue]);

  return (
    <div className="space-y-6 package-scroll-fix">
      {/* Available Days */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaCalendarAlt className="h-5 w-5 text-blue-600" />
            Available Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="availabilityBooking.availableDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Available Days</FormLabel>
                <div className="grid grid-cols-7 gap-2">
                  {DAY_OPTIONS.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.value}
                        checked={field.value?.includes(day.value)}
                        onCheckedChange={(checked) => {
                          const current = field.value || [];
                          if (checked) {
                            field.onChange([...current, day.value]);
                          } else {
                            field.onChange(current.filter((d: DayOfWeek) => d !== day.value));
                          }
                        }}
                      />
                      <label
                        htmlFor={day.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {day.short}
                      </label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Available Time Slots */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaClock className="h-5 w-5 text-green-600" />
            Available Time Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Add Time Slot */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              <h4 className="font-medium mb-4">Add Time Slot</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Select Days</label>
                <div className="flex flex-wrap gap-2">
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
                  {(watchedData.availableTimeSlots || []).map((timeSlot) => (
                    <TimeSlotCard
                      key={timeSlot.id}
                      timeSlot={timeSlot}
                      onUpdate={handleUpdateTimeSlot}
                      onRemove={handleRemoveTimeSlot}
                      isEditing={editingTimeSlot === timeSlot.id}
                      onEdit={setEditingTimeSlot}
                      onCancelEdit={() => setEditingTimeSlot(null)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Requirements */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle>Booking Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="availabilityBooking.advanceBookingRequired"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advance Booking Required (Hours)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      className="package-text-fix"
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum hours in advance for booking
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="availabilityBooking.maximumAdvanceBooking"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Advance Booking (Days)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                      className="package-text-fix"
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum days in advance for booking
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-6">
            <FormField
              control={control}
              name="availabilityBooking.instantConfirmation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Instant Confirmation</FormLabel>
                    <FormDescription>
                      Bookings are confirmed immediately without manual approval
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

      {/* Special Instructions */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle>Special Instructions for Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="availabilityBooking.specialInstructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Instructions</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Any special instructions or requirements for customers"
                    rows={4}
                    className="package-text-fix"
                  />
                </FormControl>
                <FormDescription>
                  Instructions that will be shown to customers during booking
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Booking Restrictions */}
      <Card className="package-selector-glass package-shadow-fix">
        <CardHeader>
          <CardTitle>Booking Restrictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add New Restriction */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              <h4 className="font-medium mb-4">Add Booking Restriction</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Restriction Type</label>
                  <select
                    value={newRestriction.type}
                    onChange={(e) => setNewRestriction({ ...newRestriction, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  >
                    <option value="DATE_RANGE">Date Range</option>
                    <option value="SPECIFIC_DATES">Specific Dates</option>
                    <option value="HOLIDAYS">Holidays</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newRestriction.description}
                    onChange={(e) => setNewRestriction({ ...newRestriction, description: e.target.value })}
                    placeholder="Describe the booking restriction"
                    rows={3}
                    className="package-text-fix"
                  />
                </div>
                
                <Button
                  onClick={handleAddRestriction}
                  disabled={!newRestriction.description?.trim()}
                  className="package-button-fix"
                >
                  <FaPlus className="h-4 w-4 mr-2" />
                  Add Restriction
                </Button>
              </div>
            </div>

            {/* Restrictions List */}
            <div>
              <h4 className="font-medium mb-4">Booking Restrictions</h4>
              <div className="space-y-3">
                <AnimatePresence>
                  {(watchedData.bookingRestrictions || []).map((restriction) => (
                    <BookingRestrictionCard
                      key={restriction.id}
                      restriction={restriction}
                      onUpdate={handleUpdateRestriction}
                      onRemove={handleRemoveRestriction}
                      isEditing={editingRestriction === restriction.id}
                      onEdit={setEditingRestriction}
                      onCancelEdit={() => setEditingRestriction(null)}
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
