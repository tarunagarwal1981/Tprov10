'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiEdit2,
  FiPackage,
  FiPlus,
  FiCopy,
  FiEye,
  FiTrash2,
} from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import { queryService, type ItineraryQuery } from '@/lib/services/queryService';
import { itineraryService, type Itinerary } from '@/lib/services/itineraryService';
import { MarketplaceService } from '@/lib/services/marketplaceService';
import { QueryModal } from '@/components/agent/QueryModal';
import { createClient } from '@/lib/supabase/client';

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

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const supabase = createClient();

  const leadId = params.leadId as string;

  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [query, setQuery] = useState<ItineraryQuery | null>(null);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const sidebarInitialized = React.useRef(false);

  // Collapse sidebar by default on this page (only once on initial mount)
  useEffect(() => {
    if (typeof window !== 'undefined' && !sidebarInitialized.current) {
      // Set to collapsed on first visit to this page
      localStorage.setItem('agent-sidebar-collapsed', 'true');
      
      // Dispatch event to update sidebar and layout
      window.dispatchEvent(new CustomEvent('agent-sidebar-toggled', { detail: { collapsed: true } }));
      
      sidebarInitialized.current = true;
    }
  }, []);

  // Fetch lead and query data
  useEffect(() => {
    if (leadId && user?.id) {
      fetchLeadData();
    }
  }, [leadId, user?.id]);

  const fetchLeadData = async () => {
    setLoading(true);
    try {
      // Fetch lead details
      const { data: purchaseData } = await supabase
        .from('lead_purchases' as any)
        .select('lead_id')
        .eq('lead_id', leadId)
        .eq('agent_id', user?.id)
        .maybeSingle();

      let leadData: LeadDetails | null = null;

      if (purchaseData) {
        // Fetch from marketplace
        const { data: marketplaceLead } = await supabase
          .from('lead_marketplace' as any)
          .select('id, destination, customer_name, customer_email, customer_phone, budget_min, budget_max, duration_days, travelers_count')
          .eq('id', leadId)
          .single();

        if (marketplaceLead) {
          const lead = marketplaceLead as unknown as {
            id: string;
            destination: string;
            customer_name?: string | null;
            customer_email?: string | null;
            customer_phone?: string | null;
            budget_min?: number | null;
            budget_max?: number | null;
            duration_days?: number | null;
            travelers_count?: number | null;
          };
          leadData = {
            id: lead.id,
            destination: lead.destination,
            customerName: lead.customer_name || undefined,
            customerEmail: lead.customer_email || undefined,
            customerPhone: lead.customer_phone || undefined,
            budgetMin: lead.budget_min || undefined,
            budgetMax: lead.budget_max || undefined,
            durationDays: lead.duration_days || undefined,
            travelersCount: lead.travelers_count || undefined,
          };
        }
      } else {
        // Fetch from leads table
        const { data: regularLead } = await supabase
          .from('leads' as any)
          .select('id, destination, customer_name, customer_email, customer_phone, budget_min, budget_max, duration_days, travelers_count')
          .eq('id', leadId)
          .eq('agent_id', user?.id)
          .maybeSingle();

        if (regularLead) {
          const lead = regularLead as unknown as {
            id: string;
            destination: string;
            customer_name?: string | null;
            customer_email?: string | null;
            customer_phone?: string | null;
            budget_min?: number | null;
            budget_max?: number | null;
            duration_days?: number | null;
            travelers_count?: number | null;
          };
          leadData = {
            id: lead.id,
            destination: lead.destination,
            customerName: lead.customer_name || undefined,
            customerEmail: lead.customer_email || undefined,
            customerPhone: lead.customer_phone || undefined,
            budgetMin: lead.budget_min || undefined,
            budgetMax: lead.budget_max || undefined,
            durationDays: lead.duration_days || undefined,
            travelersCount: lead.travelers_count || undefined,
          };
        }
      }

      if (!leadData) {
        toast.error('Lead not found');
        router.push('/agent/leads');
        return;
      }

      setLead(leadData);

      // Fetch query
      // Fetch query
      const queryResponse = await fetch(`/api/queries/${leadId}`);
      if (queryResponse.ok) {
        const { query: queryData } = await queryResponse.json();
        setQuery(queryData);
      }

      // Fetch itineraries
      const itinerariesResponse = await fetch(`/api/itineraries/leads/${leadId}`);
      if (itinerariesResponse.ok) {
        const { itineraries: itinerariesData } = await itinerariesResponse.json();
        setItineraries(itinerariesData);
      }
    } catch (err) {
      console.error('Error fetching lead data:', err);
      toast.error('Failed to load lead data');
    } finally {
      setLoading(false);
    }
  };

  // Handle query save
  const handleQuerySave = async (data: {
    destinations: Array<{ city: string; nights: number }>;
    leaving_from: string;
    nationality: string;
    leaving_on: string;
    travelers: { rooms: number; adults: number; children: number; infants: number };
    star_rating?: number;
    add_transfers: boolean;
  }) => {
    if (!user?.id || !leadId) return;

    setQueryLoading(true);
    try {
      const response = await fetch(`/api/queries/${leadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: user.id,
          destinations: data.destinations,
          leaving_from: data.leaving_from,
          nationality: data.nationality,
          leaving_on: data.leaving_on,
          travelers: data.travelers,
          star_rating: data.star_rating,
          add_transfers: data.add_transfers,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to save query');
      }

      const { query: savedQuery } = await response.json();
      setQuery(savedQuery);
      toast.success('Query updated successfully!');
      setQueryModalOpen(false);
    } catch (err) {
      console.error('Error saving query:', err);
      toast.error('Failed to save query. Please try again.');
      throw err;
    } finally {
      setQueryLoading(false);
    }
  };

  // Format destinations display
  const formatDestinations = (destinations: Array<{ city: string; nights: number }>) => {
    return destinations.map(d => `${d.city} (${d.nights} ${d.nights === 1 ? 'night' : 'nights'})`).join(' → ');
  };

  // Format travelers display
  const formatTravelers = (travelers: { rooms: number; adults: number; children: number; infants: number }) => {
    const parts = [];
    if (travelers.rooms > 0) parts.push(`${travelers.rooms} room${travelers.rooms > 1 ? 's' : ''}`);
    if (travelers.adults > 0) parts.push(`${travelers.adults} adult${travelers.adults > 1 ? 's' : ''}`);
    if (travelers.children > 0) parts.push(`${travelers.children} child${travelers.children > 1 ? 'ren' : ''}`);
    if (travelers.infants > 0) parts.push(`${travelers.infants} infant${travelers.infants > 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Lead not found</p>
          <Button onClick={() => router.push('/agent/leads')}>
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/agent/leads')}
          className="mb-4"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Query #{leadId.slice(-8)}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Lead Details Panel */}
        <div className="lg:col-span-1 space-y-4">
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
                  onClick={() => setQueryModalOpen(true)}
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

        {/* Right Column - Proposals Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Proposals</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Existing Itineraries */}
            {itineraries.map((itinerary) => (
              <Card key={itinerary.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/agent/itineraries/${itinerary.id}/builder`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold line-clamp-1">
                      {itinerary.name}
                    </CardTitle>
                    <Badge variant="secondary">{itinerary.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{itinerary.adults_count} Adults</span>
                    {itinerary.children_count > 0 && (
                      <span>{itinerary.children_count} Children</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-gray-600">Total Price</span>
                    <span className="text-xl font-bold text-green-600">
                      ${itinerary.total_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/agent/itineraries/${itinerary.id}/builder`)}
                      className="flex-1"
                    >
                      <FiEye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Insert Itinerary Card */}
            <Card className="border-dashed border-2 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer flex items-center justify-center min-h-[200px]"
              onClick={() => {
                router.push(`/agent/leads/${leadId}/insert`);
              }}
            >
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FiPlus className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-gray-600 font-medium">Insert Itinerary</p>
              </CardContent>
            </Card>

            {/* Create Itinerary Card */}
            <Card className="border-dashed border-2 border-gray-300 hover:border-green-500 transition-colors cursor-pointer flex items-center justify-center min-h-[200px]"
              onClick={() => {
                router.push(`/agent/leads/${leadId}/itineraries/new`);
              }}
            >
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FiPlus className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-gray-600 font-medium">Create Itinerary</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Query Modal */}
      <QueryModal
        isOpen={queryModalOpen}
        onClose={() => setQueryModalOpen(false)}
        onSave={handleQuerySave}
        initialData={query}
        leadId={leadId}
        loading={queryLoading}
      />
    </div>
  );
}

