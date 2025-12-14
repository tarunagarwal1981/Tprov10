'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit2, FiCalendar, FiMapPin } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// Removed Supabase - using AWS-based API routes instead

interface ItineraryDay {
  id: string;
  day_number: number;
  date: string | null;
  city_name: string | null;
  notes: string | null;
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

interface Itinerary {
  id: string;
  name: string;
  adults_count: number;
  children_count: number;
  infants_count: number;
  start_date: string | null;
  end_date: string | null;
}

interface ItineraryBuilderPanelProps {
  itinerary: Itinerary;
  days: ItineraryDay[];
  items: ItineraryItem[];
  onDaysChange: (days: ItineraryDay[]) => void;
  onItemsChange: (items: ItineraryItem[]) => void;
  onAddDay: () => void;
}

export function ItineraryBuilderPanel({
  itinerary,
  days,
  items,
  onDaysChange,
  onItemsChange,
  onAddDay,
}: ItineraryBuilderPanelProps) {
  // Using AWS-based API routes instead of Supabase
  const [editingDay, setEditingDay] = useState<string | null>(null);

  const handleDeleteDay = async (dayId: string) => {
    if (!confirm('Delete this day? All items in this day will also be removed.')) return;

    try {
      // Delete day via API
      const dayResponse = await fetch(`/api/itineraries/${itinerary.id}/days/${dayId}`, {
        method: 'DELETE',
      });

      if (!dayResponse.ok) {
        const error = await dayResponse.json();
        throw new Error(error.error || 'Failed to delete day');
      }

      // Items will be deleted via CASCADE, but we can also delete them explicitly
      const dayItems = items.filter(i => i.day_id === dayId);
      for (const item of dayItems) {
        try {
          await fetch(`/api/itineraries/${itinerary.id}/items/${item.id}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.warn('Error deleting item:', err);
        }
      }

      onDaysChange(days.filter(d => d.id !== dayId));
      onItemsChange(items.filter(i => i.day_id !== dayId));
    } catch (err) {
      console.error('Error deleting day:', err);
      alert('Failed to delete day');
    }
  };

  const handleUpdateDay = async (dayId: string, updates: Partial<ItineraryDay>) => {
    try {
      const response = await fetch(`/api/itineraries/${itinerary.id}/days/${dayId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityName: updates.city_name,
          date: updates.date,
          notes: updates.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update day');
      }

      const { day } = await response.json();
      const updatedDay = day as unknown as ItineraryDay;
      onDaysChange(days.map(d => d.id === dayId ? updatedDay : d));
      setEditingDay(null);
    } catch (err) {
      console.error('Error updating day:', err);
      alert('Failed to update day');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/itineraries/${itinerary.id}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete item');
      }

      onItemsChange(items.filter(i => i.id !== itemId));
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item');
    }
  };

  const handleMoveItem = async (itemId: string, dayId: string | null) => {
    try {
      const response = await fetch(`/api/itineraries/${itinerary.id}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move item');
      }

      onItemsChange(items.map(i => i.id === itemId ? { ...i, day_id: dayId } : i));
    } catch (err) {
      console.error('Error moving item:', err);
      alert('Failed to move item');
    }
  };

  const getItemsForDay = (dayId: string | null) => {
    return items.filter(item => item.day_id === dayId);
  };

  const getUnassignedItems = () => {
    return items.filter(item => !item.day_id);
  };

  const getPackageTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      activity: 'bg-blue-100 text-blue-700',
      transfer: 'bg-green-100 text-green-700',
      multi_city: 'bg-purple-100 text-purple-700',
      multi_city_hotel: 'bg-pink-100 text-pink-700',
      fixed_departure: 'bg-orange-100 text-orange-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Itinerary Builder</h2>
          <Button onClick={onAddDay} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <FiPlus className="w-4 h-4 mr-2" />
            Add Day
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Days */}
        {days.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FiCalendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm font-medium mb-1">No days added yet</p>
            <p className="text-xs text-gray-400 mb-4">Click &quot;Add Day&quot; to start building your itinerary</p>
            <Button onClick={onAddDay} variant="outline" size="sm">
              <FiPlus className="w-4 h-4 mr-2" />
              Add First Day
            </Button>
          </div>
        ) : (
          days.map((day) => (
            <motion.div
              key={day.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 rounded-lg bg-white"
            >
              {/* Day Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                      {day.day_number}
                    </div>
                    {editingDay === day.id ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                          placeholder="City name..."
                          value={day.city_name || ''}
                          onChange={(e) => handleUpdateDay(day.id, { city_name: e.target.value })}
                          className="flex-1"
                          onBlur={() => setEditingDay(null)}
                          autoFocus
                        />
                        <Input
                          type="date"
                          value={day.date || ''}
                          onChange={(e) => handleUpdateDay(day.id, { date: e.target.value || null })}
                          className="w-40"
                          onBlur={() => setEditingDay(null)}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          Day {day.day_number}
                          {day.city_name && (
                            <>
                              {' - '}
                              <span className="text-blue-600">{day.city_name}</span>
                            </>
                          )}
                        </h3>
                        {day.date && (
                          <Badge variant="outline" className="text-xs">
                            <FiCalendar className="w-3 h-3 mr-1" />
                            {new Date(day.date).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingDay(day.id)}
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDay(day.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Day Items */}
              <div className="p-4 space-y-3">
                {getItemsForDay(day.id).length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    No packages added yet
                  </div>
                ) : (
                  getItemsForDay(day.id).map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      {item.package_image_url && (
                        <img
                          src={item.package_image_url}
                          alt={item.package_title}
                          className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-gray-900">{item.package_title}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-700 flex-shrink-0"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-xs ${getPackageTypeColor(item.package_type)}`}>
                            {item.package_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600">Quantity: {item.quantity}</p>
                          <p className="text-sm font-semibold text-green-600">
                            ${item.total_price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          ))
        )}

        {/* Unassigned Items */}
        {getUnassignedItems().length > 0 && (
          <div className="border border-gray-200 rounded-lg bg-yellow-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Unassigned Packages</h3>
              <p className="text-xs text-gray-600 mt-1">Drag to a day or assign manually</p>
            </div>
            <div className="p-4 space-y-3">
              {getUnassignedItems().map((item) => (
                <motion.div
                  key={item.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-white"
                >
                  {item.package_image_url && (
                    <img
                      src={item.package_image_url}
                      alt={item.package_title}
                      className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">{item.package_title}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`text-xs ${getPackageTypeColor(item.package_type)}`}>
                        {item.package_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <select
                        value=""
                        onChange={(e) => {
                          const dayId = e.target.value || null;
                          handleMoveItem(item.id, dayId);
                        }}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Assign to day...</option>
                        {days.map(day => (
                          <option key={day.id} value={day.id}>
                            Day {day.day_number} {day.city_name ? `- ${day.city_name}` : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm font-semibold text-green-600">
                        ${item.total_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

