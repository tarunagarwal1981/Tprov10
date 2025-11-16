'use client';

import React, { useState } from 'react';
import { FiX, FiCalendar, FiClock } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FlightEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromCity: string;
  toCity: string;
  onSave: (flight: any) => void;
}

export function FlightEntryModal({
  isOpen,
  onClose,
  fromCity,
  toCity,
  onSave,
}: FlightEntryModalProps) {
  const [flightData, setFlightData] = useState({
    from_city: fromCity,
    to_city: toCity,
    departure_date: '',
    departure_time: '',
    arrival_date: '',
    arrival_time: '',
    airline: '',
    flight_number: '',
    price_per_person: '',
    currency: 'USD',
    booking_class: 'ECONOMY',
  });

  const handleSave = () => {
    if (!flightData.departure_date || !flightData.departure_time || !flightData.arrival_date || !flightData.arrival_time) {
      return;
    }
    onSave({
      ...flightData,
      price_per_person: Number(flightData.price_per_person) || 0,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Add Flight: {fromCity} → {toCity}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <FiX className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from_city">From City</Label>
              <Input
                id="from_city"
                value={flightData.from_city}
                onChange={(e) => setFlightData(prev => ({ ...prev, from_city: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="to_city">To City</Label>
              <Input
                id="to_city"
                value={flightData.to_city}
                onChange={(e) => setFlightData(prev => ({ ...prev, to_city: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departure_date">Departure Date *</Label>
              <Input
                id="departure_date"
                type="date"
                value={flightData.departure_date}
                onChange={(e) => setFlightData(prev => ({ ...prev, departure_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="departure_time">Departure Time *</Label>
              <Input
                id="departure_time"
                type="time"
                value={flightData.departure_time}
                onChange={(e) => setFlightData(prev => ({ ...prev, departure_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="arrival_date">Arrival Date *</Label>
              <Input
                id="arrival_date"
                type="date"
                value={flightData.arrival_date}
                onChange={(e) => setFlightData(prev => ({ ...prev, arrival_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="arrival_time">Arrival Time *</Label>
              <Input
                id="arrival_time"
                type="time"
                value={flightData.arrival_time}
                onChange={(e) => setFlightData(prev => ({ ...prev, arrival_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="airline">Airline</Label>
              <Input
                id="airline"
                value={flightData.airline}
                onChange={(e) => setFlightData(prev => ({ ...prev, airline: e.target.value }))}
                placeholder="e.g., Emirates, Qatar Airways"
              />
            </div>
            <div>
              <Label htmlFor="flight_number">Flight Number</Label>
              <Input
                id="flight_number"
                value={flightData.flight_number}
                onChange={(e) => setFlightData(prev => ({ ...prev, flight_number: e.target.value }))}
                placeholder="e.g., EK501"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price_per_person">Price per Person</Label>
              <Input
                id="price_per_person"
                type="number"
                value={flightData.price_per_person}
                onChange={(e) => setFlightData(prev => ({ ...prev, price_per_person: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={flightData.currency}
                onValueChange={(value) => setFlightData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="booking_class">Class</Label>
              <Select
                value={flightData.booking_class}
                onValueChange={(value) => setFlightData(prev => ({ ...prev, booking_class: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ECONOMY">Economy</SelectItem>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                  <SelectItem value="FIRST">First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={!flightData.departure_date || !flightData.departure_time || !flightData.arrival_date || !flightData.arrival_time}
            >
              Save Flight
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


