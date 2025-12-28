'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiCalendar, FiPackage, FiMapPin, FiDollarSign, FiUsers, FiClock, FiCheck } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import { QueryModal } from '@/components/agent/QueryModal';
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
  customer_id?: string | null;
}

export default function CreateProposalPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const leadId = params.leadId as string;

  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [proposalAction, setProposalAction] = useState<'create' | 'insert' | null>(null);
  const [itinerariesCount, setItinerariesCount] = useState(0);

  useEffect(() => {
    if (leadId && user?.id) {
      fetchLeadData();
      fetchItinerariesCount();
    }
  }, [leadId, user?.id]);

  const fetchLeadData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}?agentId=${user.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Lead not found');
          router.push('/agent/leads/manage');
          return;
        }
        throw new Error('Failed to fetch lead details');
      }

      const { lead: leadData } = await response.json();
      if (!leadData) {
        toast.error('Lead not found');
        router.push('/agent/leads/manage');
        return;
      }

      setLead({
        id: leadData.id,
        destination: leadData.destination,
        customerName: leadData.customerName,
        customerEmail: leadData.customerEmail,
        customerPhone: leadData.customerPhone,
        budgetMin: leadData.budgetMin,
        budgetMax: leadData.budgetMax,
        durationDays: leadData.durationDays,
        travelersCount: leadData.travelersCount,
        customer_id: leadData.customer_id,
      });
    } catch (error) {
      console.error('Error fetching lead:', error);
      toast.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  const fetchItinerariesCount = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/itineraries/leads/${leadId}`);
      if (response.ok) {
        const { itineraries } = await response.json();
        setItinerariesCount(itineraries?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching itineraries count:', error);
    }
  };

  const handleQuerySave = async (data: {
    destinations: Array<{ city: string; nights: number }>;
    leaving_from: string;
    nationality: string;
    leaving_on: string;
    travelers: { rooms: number; adults: number; children: number; infants: number };
    star_rating?: number;
    add_transfers: boolean;
  }) => {
    if (!user?.id || !proposalAction) return;

    try {
      // Create query
      const queryResponse = await fetch(`/api/queries/${leadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinations: data.destinations,
          leaving_from: data.leaving_from,
          nationality: data.nationality,
          leaving_on: data.leaving_on,
          travelers: data.travelers,
          star_rating: data.star_rating,
          add_transfers: data.add_transfers,
        }),
      });

      if (!queryResponse.ok) {
        const error = await queryResponse.json();
        throw new Error(error.error || 'Failed to create query');
      }

      const { query: savedQuery } = await queryResponse.json();

      // Create itinerary
      const itineraryPayload = {
        leadId,
        agentId: user.id,
        name: proposalAction === 'insert' ? 'Insert Itinerary' : 'Create Itinerary',
        adultsCount: data.travelers.adults,
        childrenCount: data.travelers.children,
        infantsCount: data.travelers.infants,
        queryId: savedQuery.id,
      };

      const itineraryResponse = await fetch('/api/itineraries/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itineraryPayload),
      });

      if (!itineraryResponse.ok) {
        const error = await itineraryResponse.json();
        throw new Error(error.error || 'Failed to create itinerary');
      }

      const { itinerary: createdItinerary } = await itineraryResponse.json();

      // Navigate based on action
      if (proposalAction === 'create') {
        router.push(`/agent/leads/${leadId}/itineraries/new?queryId=${savedQuery.id}&itineraryId=${createdItinerary.id}`);
      } else {
        router.push(`/agent/leads/${leadId}/insert?itineraryId=${createdItinerary.id}&queryId=${savedQuery.id}`);
      }
    } catch (error) {
      console.error('Error creating query/itinerary:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create proposal');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Lead not found</p>
          <Button onClick={() => router.push('/agent/leads/manage')}>
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads Management
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/agent/leads/manage')}
            className="mb-4"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads Management
          </Button>
          
          {/* Lead Summary Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {lead.customerName || 'Lead'} - {lead.destination}
                  </CardTitle>
                  {lead.customer_id && (
                    <Badge variant="outline" className="text-xs font-mono">
                      {lead.customer_id}
                    </Badge>
                  )}
                </div>
                {itinerariesCount > 0 && (
                  <Badge className="bg-blue-100 text-blue-700">
                    {itinerariesCount} {itinerariesCount === 1 ? 'Itinerary' : 'Itineraries'} Created
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiMapPin className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{lead.destination}</span>
                </div>
                {(lead.budgetMin || lead.budgetMax) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiDollarSign className="w-4 h-4 text-gray-400" />
                    <span>
                      {lead.budgetMin ? formatCurrency(lead.budgetMin) : ''}
                      {lead.budgetMin && lead.budgetMax ? ' - ' : ''}
                      {lead.budgetMax ? formatCurrency(lead.budgetMax) : ''}
                    </span>
                  </div>
                )}
                {lead.durationDays && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiClock className="w-4 h-4 text-gray-400" />
                    <span>{lead.durationDays} {lead.durationDays === 1 ? 'Day' : 'Days'}</span>
                  </div>
                )}
                {lead.travelersCount && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiUsers className="w-4 h-4 text-gray-400" />
                    <span>{lead.travelersCount} {lead.travelersCount === 1 ? 'Traveler' : 'Travelers'}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Proposal Selection */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Proposal Creation Method</h2>
            <p className="text-gray-600">Select how you&apos;d like to create a proposal for this lead</p>
          </div>

          {/* Proposal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Create Itinerary Card */}
            <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-300 cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FiCalendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Create Itinerary</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Build a custom day-by-day itinerary from scratch with full control over activities, transfers, and scheduling.
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FiCheck className="w-4 h-4 text-green-600" />
                    <span>Full control over activities</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FiCheck className="w-4 h-4 text-green-600" />
                    <span>Custom scheduling and timing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FiCheck className="w-4 h-4 text-green-600" />
                    <span>Flexible day-by-day planning</span>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setProposalAction('create');
                    setQueryModalOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  Start Creating
                </Button>
              </CardContent>
            </Card>

            {/* Insert Itinerary Card */}
            <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-300 cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <FiPackage className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">Insert Itinerary</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Quickly insert pre-built multi-city packages for faster proposal creation with ready-made itineraries.
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FiCheck className="w-4 h-4 text-green-600" />
                    <span>Faster setup and configuration</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FiCheck className="w-4 h-4 text-green-600" />
                    <span>Ready-made multi-city packages</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FiCheck className="w-4 h-4 text-green-600" />
                    <span>Less configuration required</span>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setProposalAction('insert');
                    setQueryModalOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                >
                  Start Inserting
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Tip Section */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-xl">💡</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Pro Tip</p>
                  <p className="text-sm text-gray-700">
                    Use <strong>&quot;Create Itinerary&quot;</strong> for custom trips with specific requirements. 
                    Use <strong>&quot;Insert Itinerary&quot;</strong> for quick multi-city package proposals.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Query Modal */}
        {proposalAction && (
          <QueryModal
            isOpen={queryModalOpen}
            onClose={() => {
              setQueryModalOpen(false);
              setProposalAction(null);
            }}
            onSave={handleQuerySave}
            leadId={leadId}
            loading={false}
          />
        )}
      </div>
    </div>
  );
}
