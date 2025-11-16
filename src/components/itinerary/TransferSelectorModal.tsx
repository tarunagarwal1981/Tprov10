'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiLoader } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { SmartItineraryFilter, TransferPackage } from '@/lib/services/smartItineraryFilter';

interface TransferSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromCity: string;
  toCity: string;
  operatorId?: string; // Filter by tour operator
  onSelect: (transfer: TransferPackage) => void;
}

export function TransferSelectorModal({
  isOpen,
  onClose,
  fromCity,
  toCity,
  operatorId,
  onSelect,
}: TransferSelectorModalProps) {
  const filterService = new SmartItineraryFilter();
  const [transfers, setTransfers] = useState<TransferPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && fromCity && toCity) {
      fetchTransfers();
    }
  }, [isOpen, fromCity, toCity]); // Removed operatorId from dependencies

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      // Fetch all published transfers from all operators for this route
      const routeTransfers = await filterService.getTransfersForRoute(fromCity, toCity);
      setTransfers(routeTransfers);
    } catch (err) {
      console.error('Error fetching transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransfers = transfers.filter(transfer =>
    transfer.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Select Transfer: {fromCity} → {toCity}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <FiX className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search transfers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading transfers...</span>
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 font-medium">No transfer packages available for {fromCity} → {toCity}</p>
              <p className="text-sm text-gray-500 mt-2">
                {operatorId 
                  ? "This tour operator doesn't have any transfer packages for this route yet."
                  : "No transfer packages found for this route."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTransfers.map((transfer) => (
                <Card
                  key={transfer.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onSelect(transfer)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{transfer.title}</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        {transfer.from_location} → {transfer.to_location}
                      </p>
                      <p className="text-sm text-gray-600">
                        Type: {transfer.pricing_mode}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-gray-600">Price</span>
                        <span className="text-lg font-bold text-green-600">
                          {transfer.base_price
                            ? `${transfer.currency || 'USD'} ${transfer.base_price.toLocaleString()}`
                            : 'Contact for price'}
                        </span>
                      </div>
                    </div>
                    <Button className="w-full mt-4" onClick={(e) => {
                      e.stopPropagation();
                      onSelect(transfer);
                    }}>
                      Select Transfer
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


