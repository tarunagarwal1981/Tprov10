"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiChevronUp, FiChevronDown, FiPlus, FiCalendar } from 'react-icons/fi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { TravelersSelector } from '@/components/agent/TravelersSelector';
import type { Destination, Travelers, ItineraryQuery } from '@/lib/services/queryService';

export interface QueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    destinations: Destination[];
    leaving_from: string;
    nationality: string;
    leaving_on: string;
    travelers: Travelers;
    star_rating?: number;
    add_transfers: boolean;
  }) => Promise<void>;
  initialData?: ItineraryQuery | null;
  leadId: string;
  loading?: boolean;
}

export const QueryModal: React.FC<QueryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  leadId,
  loading = false,
}) => {
  // Form state
  const [destinations, setDestinations] = useState<Destination[]>([
    { city: '', nights: 1 },
  ]);
  const [leavingFrom, setLeavingFrom] = useState('');
  const [nationality, setNationality] = useState('');
  const [leavingOn, setLeavingOn] = useState('');
  const [travelers, setTravelers] = useState<Travelers>({
    rooms: 1,
    adults: 2,
    children: 0,
    infants: 0,
  });
  const [starRating, setStarRating] = useState<number | undefined>(undefined);
  const [addTransfers, setAddTransfers] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load initial data
  useEffect(() => {
    if (initialData) {
      setDestinations(initialData.destinations.length > 0 ? initialData.destinations : [{ city: '', nights: 1 }]);
      setLeavingFrom(initialData.leaving_from || '');
      setNationality(initialData.nationality || '');
      setLeavingOn(initialData.leaving_on || '');
      setTravelers(initialData.travelers || { rooms: 1, adults: 2, children: 0, infants: 0 });
      setStarRating(initialData.star_rating || undefined);
      setAddTransfers(initialData.add_transfers || false);
    } else {
      // Reset to defaults
      setDestinations([{ city: '', nights: 1 }]);
      setLeavingFrom('');
      setNationality('');
      setLeavingOn('');
      setTravelers({ rooms: 1, adults: 2, children: 0, infants: 0 });
      setStarRating(undefined);
      setAddTransfers(false);
    }
  }, [initialData, isOpen]);

  // Handle destination changes
  const handleDestinationChange = (index: number, field: 'city' | 'nights', value: string | number) => {
    const newDestinations = [...destinations];
    const current = newDestinations[index];
    if (current) {
      newDestinations[index] = {
        ...current,
        [field]: field === 'nights' ? Number(value) : value,
      };
      setDestinations(newDestinations);
    }
  };

  const handleAddDestination = () => {
    setDestinations([...destinations, { city: '', nights: 1 }]);
  };

  const handleRemoveDestination = (index: number) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter((_, i) => i !== index));
    }
  };

  // Handle reorder (simple up/down for now)
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newDestinations = [...destinations];
      const current = newDestinations[index];
      const previous = newDestinations[index - 1];
      if (current && previous) {
        newDestinations[index - 1] = current;
        newDestinations[index] = previous;
        setDestinations(newDestinations);
      }
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < destinations.length - 1) {
      const newDestinations = [...destinations];
      const current = newDestinations[index];
      const next = newDestinations[index + 1];
      if (current && next) {
        newDestinations[index] = next;
        newDestinations[index + 1] = current;
        setDestinations(newDestinations);
      }
    }
  };

  // Handle travelers change
  const handleTravelersChange = (field: keyof Travelers, value: number) => {
    setTravelers({
      ...travelers,
      [field]: value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!nationality.trim()) {
      alert('Nationality is required');
      return;
    }
    if (!leavingOn.trim()) {
      alert('Leaving on date is required');
      return;
    }
    if (destinations.some(d => !d.city.trim())) {
      alert('All destination cities must be filled');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        destinations: destinations.filter(d => d.city.trim()),
        leaving_from: leavingFrom.trim(),
        nationality: nationality.trim(),
        leaving_on: leavingOn.trim(),
        travelers,
        star_rating: starRating,
        add_transfers: addTransfers,
      });
      // Modal will close from parent
    } catch (error) {
      console.error('Error saving query:', error);
      // Error handling is done in parent
    } finally {
      setSaving(false);
    }
  };

  // Format travelers display
  const getTravelersDisplay = () => {
    const parts = [];
    if (travelers.rooms > 0) parts.push(`${travelers.rooms} room${travelers.rooms > 1 ? 's' : ''}`);
    if (travelers.adults > 0) parts.push(`${travelers.adults} adult${travelers.adults > 1 ? 's' : ''}`);
    if (travelers.children > 0) parts.push(`${travelers.children} child${travelers.children > 1 ? 'ren' : ''}`);
    if (travelers.infants > 0) parts.push(`${travelers.infants} infant${travelers.infants > 1 ? 's' : ''}`);
    return parts.join(', ') || '1 room, 2 adults';
  };

  // Determine if modal can be closed (only if query exists or initialData is provided)
  const canClose = initialData !== null && initialData !== undefined;

  return (
    <Dialog open={isOpen} onOpenChange={canClose ? onClose : undefined}>
      <DialogContent 
        size="xl" 
        overlayVariant="subtle"
        className="max-h-[90vh] overflow-y-auto bg-white"
        preventClose={!canClose}
        closeOnOverlayClick={canClose}
        showCloseButton={canClose}
      >
        <DialogHeader>
          <DialogTitle>Create Query</DialogTitle>
          <DialogDescription>
            Enter the destinations and trip details for this lead
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* DESTINATIONS Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold uppercase">Destinations</h3>
            </div>
            <p className="text-sm text-gray-600">
              Enter the cities below in the order in which they will be visited for the itinerary:
            </p>

            <div className="space-y-3">
              {destinations.map((destination, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === destinations.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* City input */}
                  <Input
                    value={destination.city}
                    onChange={(e) => handleDestinationChange(index, 'city', e.target.value)}
                    placeholder="City Name"
                    className="flex-1"
                    required
                  />

                  {/* Nights dropdown */}
                  <Select
                    value={destination.nights.toString()}
                    onValueChange={(value) => handleDestinationChange(index, 'nights', parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((nights) => (
                        <SelectItem key={nights} value={nights.toString()}>
                          {nights} {nights === 1 ? 'night' : 'nights'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Remove button */}
                  {destinations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDestination(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddDestination}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <FiPlus className="w-4 h-4" />
              Add Another City
            </button>
          </div>

          <Separator />

          {/* TRIP DETAILS Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold uppercase">Trip Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Leaving From */}
              <div>
                <Label htmlFor="leavingFrom">Leaving From</Label>
                <Input
                  id="leavingFrom"
                  value={leavingFrom}
                  onChange={(e) => setLeavingFrom(e.target.value)}
                  placeholder="e.g., Delhi"
                />
              </div>

              {/* Nationality */}
              <div>
                <Label htmlFor="nationality">
                  Nationality <span className="text-red-500">*</span>
                </Label>
                <Select value={nationality} onValueChange={setNationality} required>
                  <SelectTrigger id="nationality">
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="UK">UK</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Leaving on */}
              <div>
                <Label htmlFor="leavingOn" className="flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" />
                  Leaving on <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="leavingOn"
                  type="date"
                  value={leavingOn}
                  onChange={(e) => setLeavingOn(e.target.value)}
                  required
                />
              </div>

              {/* Number of Travelers */}
              <div>
                <TravelersSelector
                  value={travelers}
                  onChange={setTravelers}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  For more than 6 rooms, please contact support
                </p>
              </div>

              {/* Star rating and Add Transfers in same row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="starRating">Star rating</Label>
                  <Select
                    value={starRating?.toString() || ''}
                    onValueChange={(value) => setStarRating(value ? parseInt(value) : undefined)}
                  >
                    <SelectTrigger id="starRating">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Star</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Add Transfers */}
                <div className="flex items-end">
                  <div className="flex items-center space-x-2 h-9">
                    <Checkbox
                      id="addTransfers"
                      checked={addTransfers}
                      onCheckedChange={(checked) => setAddTransfers(checked === true)}
                      className="border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label htmlFor="addTransfers" className="cursor-pointer font-medium text-gray-700">
                      Add Transfers
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving || loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || loading}>
              {saving || loading ? 'Saving...' : 'Save Query'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

