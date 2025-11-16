'use client';

import React, { useState } from 'react';
import { FiX, FiStar, FiHome, FiDollarSign } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface HotelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityName: string;
  starRating?: number;
  onSelect: (hotel: any) => void;
}

export function HotelSelectorModal({
  isOpen,
  onClose,
  cityName,
  starRating,
  onSelect,
}: HotelSelectorModalProps) {
  const [hotelData, setHotelData] = useState({
    hotel_name: '',
    star_rating: starRating || 3,
    room_type: '',
    meal_plan: 'ROOM_ONLY',
    price_per_night: '',
    currency: 'USD',
  });

  const mealPlans = [
    { value: 'ROOM_ONLY', label: 'Room Only' },
    { value: 'BED_BREAKFAST', label: 'Bed & Breakfast' },
    { value: 'HALF_BOARD', label: 'Half Board' },
    { value: 'FULL_BOARD', label: 'Full Board' },
  ];

  const handleSave = () => {
    if (!hotelData.hotel_name) {
      return;
    }
    onSelect({
      ...hotelData,
      star_rating: Number(hotelData.star_rating),
      price_per_night: Number(hotelData.price_per_night) || 0,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Select Hotel for {cityName}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <FiX className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="hotel_name">Hotel Name *</Label>
            <Input
              id="hotel_name"
              value={hotelData.hotel_name}
              onChange={(e) => setHotelData(prev => ({ ...prev, hotel_name: e.target.value }))}
              placeholder="Enter hotel name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="star_rating">Star Rating</Label>
              <Select
                value={hotelData.star_rating.toString()}
                onValueChange={(value) => setHotelData(prev => ({ ...prev, star_rating: Number(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(rating => (
                    <SelectItem key={rating} value={rating.toString()}>
                      {rating} Star{rating > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="room_type">Room Type</Label>
              <Input
                id="room_type"
                value={hotelData.room_type}
                onChange={(e) => setHotelData(prev => ({ ...prev, room_type: e.target.value }))}
                placeholder="e.g., Deluxe Double, Twin"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="meal_plan">Meal Plan</Label>
            <Select
              value={hotelData.meal_plan}
              onValueChange={(value) => setHotelData(prev => ({ ...prev, meal_plan: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mealPlans.map(plan => (
                  <SelectItem key={plan.value} value={plan.value}>
                    {plan.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price_per_night">Price per Night</Label>
              <Input
                id="price_per_night"
                type="number"
                value={hotelData.price_per_night}
                onChange={(e) => setHotelData(prev => ({ ...prev, price_per_night: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={hotelData.currency}
                onValueChange={(value) => setHotelData(prev => ({ ...prev, currency: value }))}
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
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1" disabled={!hotelData.hotel_name}>
              Save Hotel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


