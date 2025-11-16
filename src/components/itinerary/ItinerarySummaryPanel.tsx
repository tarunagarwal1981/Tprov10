'use client';

import React, { useMemo } from 'react';
import { FiSave, FiDollarSign, FiCheckCircle, FiAlertCircle, FiCalendar } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { OperatorContactView } from './OperatorContactView';
import { useState } from 'react';

interface Itinerary {
  id: string;
  name: string;
  adults_count: number;
  children_count: number;
  infants_count: number;
  start_date: string | null;
  end_date: string | null;
  total_price: number;
  currency: string;
  lead_budget_min: number | null;
  lead_budget_max: number | null;
}

interface ItineraryItem {
  id: string;
  total_price: number;
}

interface ItinerarySummaryPanelProps {
  itinerary: Itinerary;
  items: ItineraryItem[];
  compact?: boolean;
  onSave: () => void;
}

export function ItinerarySummaryPanel({
  itinerary,
  items,
  compact = false,
  onSave,
}: ItinerarySummaryPanelProps) {
  const [showOperators, setShowOperators] = useState(false);
  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  }, [items]);

  const budgetStatus = useMemo(() => {
    if (!itinerary.lead_budget_min || !itinerary.lead_budget_max) {
      return null;
    }

    if (totalPrice < itinerary.lead_budget_min) {
      return { status: 'under', message: 'Under budget', color: 'text-green-600' };
    } else if (totalPrice > itinerary.lead_budget_max) {
      return { status: 'over', message: 'Over budget', color: 'text-red-600' };
    } else {
      return { status: 'within', message: 'Within budget', color: 'text-blue-600' };
    }
  }, [totalPrice, itinerary.lead_budget_min, itinerary.lead_budget_max]);

  const budgetProgress = useMemo(() => {
    if (!itinerary.lead_budget_min || !itinerary.lead_budget_max) return 0;
    
    const range = itinerary.lead_budget_max - itinerary.lead_budget_min;
    const position = totalPrice - itinerary.lead_budget_min;
    return Math.min(100, Math.max(0, (position / range) * 100));
  }, [totalPrice, itinerary.lead_budget_min, itinerary.lead_budget_max]);

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-600">Total Price</p>
            <p className="text-lg font-bold text-gray-900">${totalPrice.toFixed(2)}</p>
          </div>
          {budgetStatus && (
            <div>
              <p className="text-xs text-gray-600">Budget Status</p>
              <p className={`text-sm font-semibold ${budgetStatus.color}`}>
                {budgetStatus.message}
              </p>
            </div>
          )}
        </div>
        <Button onClick={onSave} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          <FiSave className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Travelers Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Travelers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Adults</span>
              <span className="font-medium">{itinerary.adults_count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Children</span>
              <span className="font-medium">{itinerary.children_count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Infants</span>
              <span className="font-medium">{itinerary.infants_count}</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Price */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FiDollarSign className="w-4 h-4" />
              Total Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              ${totalPrice.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">Based on {items.length} package{items.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        {/* Budget Comparison */}
        {itinerary.lead_budget_min && itinerary.lead_budget_max && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Budget Comparison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget Range</span>
                  <span className="font-medium">
                    ${itinerary.lead_budget_min.toLocaleString()} - ${itinerary.lead_budget_max.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Total</span>
                  <span className={`font-semibold ${budgetStatus?.color || 'text-gray-900'}`}>
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {budgetStatus && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {budgetStatus.status === 'within' ? (
                      <FiCheckCircle className={`w-4 h-4 ${budgetStatus.color}`} />
                    ) : (
                      <FiAlertCircle className={`w-4 h-4 ${budgetStatus.color}`} />
                    )}
                    <span className={`text-sm font-semibold ${budgetStatus.color}`}>
                      {budgetStatus.message}
                    </span>
                  </div>
                  <Progress value={budgetProgress} className="h-2" />
                  <p className="text-xs text-gray-500">
                    {budgetProgress.toFixed(0)}% through budget range
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Travel Dates */}
        {(itinerary.start_date || itinerary.end_date) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FiCalendar className="w-4 h-4" />
                Travel Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {itinerary.start_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Start Date</span>
                  <span className="font-medium">
                    {new Date(itinerary.start_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {itinerary.end_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">End Date</span>
                  <span className="font-medium">
                    {new Date(itinerary.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Package Count */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Packages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {items.length}
            </div>
            <p className="text-xs text-gray-600">Package{items.length !== 1 ? 's' : ''} added</p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 space-y-2">
        <Button
          onClick={onSave}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
        >
          <FiSave className="w-4 h-4 mr-2" />
          Save Itinerary
        </Button>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setShowOperators(true)}
        >
          View Operators
        </Button>
        <Button variant="outline" className="w-full">
          Download PDF
        </Button>
        <Button variant="outline" className="w-full">
          Email to Customer
        </Button>
        
        {/* Operator Contact View */}
        {showOperators && (
          <OperatorContactView
            itineraryId={itinerary.id}
            open={showOperators}
            onClose={() => setShowOperators(false)}
          />
        )}
      </div>
    </div>
  );
}

