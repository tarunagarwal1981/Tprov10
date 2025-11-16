"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiPlus, FiMinus } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Travelers } from '@/lib/services/queryService';

interface TravelersSelectorProps {
  value: Travelers;
  onChange: (travelers: Travelers) => void;
  required?: boolean;
}

export const TravelersSelector: React.FC<TravelersSelectorProps> = ({
  value,
  onChange,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDisplay = () => {
    const parts = [];
    if (value.rooms > 0) parts.push(`${value.rooms} room${value.rooms > 1 ? 's' : ''}`);
    if (value.adults > 0) parts.push(`${value.adults} adult${value.adults > 1 ? 's' : ''}`);
    return parts.join(', ') || '1 room, 2 adults';
  };

  const handleIncrement = (field: keyof Travelers) => {
    const maxValues: Record<keyof Travelers, number> = {
      rooms: 6,
      adults: 20,
      children: 10,
      infants: 5,
    };
    
    if (value[field] < maxValues[field]) {
      onChange({
        ...value,
        [field]: value[field] + 1,
      });
    }
  };

  const handleDecrement = (field: keyof Travelers) => {
    const minValues: Record<keyof Travelers, number> = {
      rooms: 1,
      adults: 1,
      children: 0,
      infants: 0,
    };
    
    if (value[field] > minValues[field]) {
      onChange({
        ...value,
        [field]: value[field] - 1,
      });
    }
  };

  const handleDone = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Label htmlFor="travelers">
        Number of Travelers {required && <span className="text-red-500">*</span>}
      </Label>
      <button
        type="button"
        id="travelers"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>{formatDisplay()}</span>
        <FiChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 mt-2 w-full rounded-md border bg-white p-4 shadow-lg"
            >
              <div className="space-y-4">
                {/* Rooms */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Rooms</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecrement('rooms')}
                      disabled={value.rooms <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <FiMinus className="h-4 w-4" />
                    </Button>
                    <div className="flex h-8 w-12 items-center justify-center border rounded-md bg-white text-sm font-medium">
                      {value.rooms}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleIncrement('rooms')}
                      disabled={value.rooms >= 6}
                      className="h-8 w-8 p-0"
                    >
                      <FiPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Adults */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Adults(12+)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecrement('adults')}
                      disabled={value.adults <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <FiMinus className="h-4 w-4" />
                    </Button>
                    <div className="flex h-8 w-12 items-center justify-center border rounded-md bg-white text-sm font-medium">
                      {value.adults}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleIncrement('adults')}
                      disabled={value.adults >= 20}
                      className="h-8 w-8 p-0"
                    >
                      <FiPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Children</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecrement('children')}
                      disabled={value.children <= 0}
                      className="h-8 w-8 p-0"
                    >
                      <FiMinus className="h-4 w-4" />
                    </Button>
                    <div className="flex h-8 w-12 items-center justify-center border rounded-md bg-white text-sm font-medium">
                      {value.children}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleIncrement('children')}
                      disabled={value.children >= 10}
                      className="h-8 w-8 p-0"
                    >
                      <FiPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Done Button */}
                <div className="flex justify-end pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDone}
                    className="px-4"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

