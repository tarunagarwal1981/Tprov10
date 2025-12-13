"use client";

import React from 'react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiDollarSign, FiEdit2 } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ItineraryQuery } from '@/lib/services/queryService';

interface LeadDetails {
  id: string;
  destination: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  budgetMin?: number;
  budgetMax?: number;
  durationDays?: number;
  travelersCount?: number;
}

interface LeadQuerySidebarProps {
  lead: LeadDetails;
  query: ItineraryQuery | null;
  onEditQuery: () => void;
}

export const LeadQuerySidebar: React.FC<LeadQuerySidebarProps> = ({
  lead,
  query,
  onEditQuery,
}) => {
  const formatDestinations = (destinations: Array<{ city: string; nights: number }>) => {
    return destinations.map(d => `${d.city} (${d.nights} ${d.nights === 1 ? 'night' : 'nights'})`).join(' → ');
  };

  const formatTravelers = (travelers: { rooms: number; adults: number; children: number; infants: number }) => {
    const parts = [];
    if (travelers.rooms > 0) parts.push(`${travelers.rooms} room${travelers.rooms > 1 ? 's' : ''}`);
    if (travelers.adults > 0) parts.push(`${travelers.adults} adult${travelers.adults > 1 ? 's' : ''}`);
    if (travelers.children > 0) parts.push(`${travelers.children} child${travelers.children > 1 ? 'ren' : ''}`);
    if (travelers.infants > 0) parts.push(`${travelers.infants} infant${travelers.infants > 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  return (
    <div className="space-y-4">
      {/* Lead Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lead Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lead.customerName && (
            <div className="flex items-center gap-2 text-sm">
              <FiUser className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{lead.customerName}</span>
            </div>
          )}
          {lead.customerEmail && (
            <div className="flex items-center gap-2 text-sm">
              <FiMail className="w-4 h-4 text-gray-500" />
              <a href={`mailto:${lead.customerEmail}`} className="text-blue-600 hover:underline">
                {lead.customerEmail}
              </a>
            </div>
          )}
          {lead.customerPhone && (
            <div className="flex items-center gap-2 text-sm">
              <FiPhone className="w-4 h-4 text-gray-500" />
              <a href={`tel:${lead.customerPhone}`} className="text-blue-600 hover:underline">
                {lead.customerPhone}
              </a>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <FiMapPin className="w-4 h-4 text-gray-500" />
            <span>→ {lead.destination}</span>
          </div>
          {lead.budgetMin && lead.budgetMax && (
            <div className="flex items-center gap-2 text-sm">
              <FiDollarSign className="w-4 h-4 text-gray-500" />
              <span>${lead.budgetMin.toLocaleString()} - ${lead.budgetMax.toLocaleString()}</span>
            </div>
          )}
          {lead.durationDays && (
            <div className="flex items-center gap-2 text-sm">
              <FiCalendar className="w-4 h-4 text-gray-500" />
              <span>{lead.durationDays} days</span>
            </div>
          )}
          {lead.travelersCount && (
            <div className="flex items-center gap-2 text-sm">
              <FiUser className="w-4 h-4 text-gray-500" />
              <span>{lead.travelersCount} travelers</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Query Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Query Details</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditQuery}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <FiEdit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {query ? (
            <>
              {query.destinations.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Destinations: </span>
                  <span className="text-gray-600">{formatDestinations(query.destinations)}</span>
                </div>
              )}
              {query.leaving_from && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Leaving From: </span>
                  <span className="text-gray-600">{query.leaving_from}</span>
                </div>
              )}
              {query.nationality && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Nationality: </span>
                  <span className="text-gray-600">{query.nationality}</span>
                </div>
              )}
              {query.leaving_on && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Leaving on: </span>
                  <span className="text-gray-600">{new Date(query.leaving_on).toLocaleDateString()}</span>
                </div>
              )}
              {query.travelers && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Travelers: </span>
                  <span className="text-gray-600">{formatTravelers(query.travelers)}</span>
                </div>
              )}
              {query.star_rating && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Star Rating: </span>
                  <span className="text-gray-600">{query.star_rating} stars</span>
                </div>
              )}
              <div className="text-sm">
                <span className="font-medium text-gray-700">Transfers: </span>
                <span className="text-gray-600">{query.add_transfers ? 'Yes' : 'No'}</span>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">
              No query data yet. Click Edit to create a query.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

