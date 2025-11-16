'use client';

import React, { useState } from 'react';
import { FiX, FiClock } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ArrivalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: any;
  onSave: (arrivalData: any) => void;
}

export function ArrivalDetailsModal({
  isOpen,
  onClose,
  day,
  onSave,
}: ArrivalDetailsModalProps) {
  const [arrivalData, setArrivalData] = useState({
    arrival_time: day.arrival_time || '',
    arrival_description: day.arrival_description || 'Upon arrival at the airport, meet our local tour coordinator who will meet and greet you at the specified area and transfer you to the hotel. Check-in at the hotel and relax.',
  });

  const handleSave = () => {
    onSave(arrivalData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Arrival Details for {day.city_name}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <FiX className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="arrival_time">Arrival Time</Label>
            <Input
              id="arrival_time"
              type="time"
              value={arrivalData.arrival_time}
              onChange={(e) => setArrivalData(prev => ({ ...prev, arrival_time: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be used to filter available activities for the day
            </p>
          </div>

          <div>
            <Label htmlFor="arrival_description">Arrival Description</Label>
            <Textarea
              id="arrival_description"
              value={arrivalData.arrival_description}
              onChange={(e) => setArrivalData(prev => ({ ...prev, arrival_description: e.target.value }))}
              rows={4}
              placeholder="Describe the arrival process..."
            />
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Arrival Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


