'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiCalendar, FiPackage, FiMapPin, FiDollarSign, FiUsers, FiClock, FiCheck, FiEye, FiCopy, FiTrash2, FiEdit2, FiFileText, FiLock } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import { QueryModal } from '@/components/agent/QueryModal';
import type { ItineraryQuery } from '@/lib/services/queryService';
import type { Itinerary } from '@/lib/services/itineraryService';

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
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loadingItineraries, setLoadingItineraries] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  useEffect(() => {
    if (leadId && user?.id) {
      fetchLeadData();
      fetchItineraries();
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

  const fetchItineraries = async () => {
    if (!user?.id) return;
    
    setLoadingItineraries(true);
    try {
      const response = await fetch(`/api/itineraries/leads/${leadId}`);
      if (response.ok) {
        const { itineraries: data } = await response.json();
        setItineraries(data || []);
      }
    } catch (error) {
      console.error('Error fetching itineraries:', error);
      toast.error('Failed to load itineraries');
    } finally {
      setLoadingItineraries(false);
    }
  };

  const handleDuplicate = async (itineraryId: string) => {
    const newName = prompt('Enter name for duplicate itinerary:', 'Copy of Itinerary');
    if (!newName) return;

    setDuplicatingId(itineraryId);
    try {
      const response = await fetch('/api/itineraries/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itineraryId, newName }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to duplicate itinerary');
      }
      
      const { itinerary: newItinerary } = await response.json();
      toast.success('Itinerary duplicated successfully');
      setItineraries(prev => [newItinerary, ...prev]);
    } catch (err) {
      console.error('Error duplicating itinerary:', err);
      toast.error('Failed to duplicate itinerary');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async (itineraryId: string) => {
    if (!confirm('Are you sure you want to delete this itinerary?')) return;

    try {
      const response = await fetch(`/api/itineraries/${itineraryId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete itinerary');
      }

      toast.success('Itinerary deleted successfully');
      setItineraries(prev => prev.filter(i => i.id !== itineraryId));
    } catch (err) {
      console.error('Error deleting itinerary:', err);
      toast.error('Failed to delete itinerary');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      completed: 'bg-blue-100 text-blue-700',
      sent: 'bg-green-100 text-green-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      locked: 'bg-purple-100 text-purple-700',
      confirmed: 'bg-emerald-100 text-emerald-700',
    };
    return colors[status] || colors.draft;
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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
                {itineraries.length > 0 && (
                  <Badge className="bg-blue-100 text-blue-700">
                    {itineraries.length} {itineraries.length === 1 ? 'Itinerary' : 'Itineraries'} Created
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

          {/* Existing Itineraries Section */}
          {itineraries.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Existing Proposals</h2>
                  <p className="text-gray-600">View and manage your created itineraries</p>
                </div>
              </div>
              
              {loadingItineraries ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {itineraries.map((itinerary) => (
                    <Card key={itinerary.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-lg font-semibold line-clamp-1">
                            {itinerary.name}
                          </CardTitle>
                          <Badge className={getStatusColor(itinerary.status)}>
                            {itinerary.status}
                          </Badge>
                        </div>
                        {itinerary.customer_id && (
                          <div className="text-xs text-gray-500 font-mono mt-1">
                            {itinerary.customer_id}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Travelers */}
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>{itinerary.adults_count} Adults</span>
                          {itinerary.children_count > 0 && (
                            <span>{itinerary.children_count} Children</span>
                          )}
                          {itinerary.infants_count > 0 && (
                            <span>{itinerary.infants_count} Infants</span>
                          )}
                        </div>

                        {/* Total Price */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm text-gray-600">Total Price</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(itinerary.total_price)}
                          </span>
                        </div>

                        {/* Dates */}
                        {(itinerary.start_date || itinerary.end_date) && (
                          <div className="text-xs text-gray-500">
                            {itinerary.start_date && (
                              <div>Start: {new Date(itinerary.start_date).toLocaleDateString()}</div>
                            )}
                            {itinerary.end_date && (
                              <div>End: {new Date(itinerary.end_date).toLocaleDateString()}</div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-1.5 pt-2 border-t flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/agent/itineraries/${itinerary.id}/builder`)}
                            className="flex-1 text-xs min-w-[80px]"
                          >
                            <FiEye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          {itinerary.query_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Navigate to appropriate edit page based on itinerary type
                                // Check if it's an insert itinerary by checking if it has multi-city items
                                // For now, navigate to create/new page - user can switch if needed
                                router.push(`/agent/leads/${leadId}/itineraries/new?itineraryId=${itinerary.id}&queryId=${itinerary.query_id}`);
                              }}
                              className="flex-1 text-xs min-w-[80px]"
                            >
                              <FiEdit2 className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicate(itinerary.id)}
                            disabled={duplicatingId === itinerary.id}
                            className="flex-1 text-xs min-w-[80px]"
                          >
                            <FiCopy className="w-3 h-3 mr-1" />
                            {duplicatingId === itinerary.id ? '...' : 'Copy'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(itinerary.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        {itinerary.is_locked && (
                          <div className="flex items-center gap-1 text-xs text-purple-600 mt-1">
                            <FiLock className="w-3 h-3" />
                            <span>Locked</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Proposal Selection */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {itineraries.length > 0 ? 'Create New Proposal' : 'Choose Your Proposal Creation Method'}
            </h2>
            <p className="text-gray-600">
              {itineraries.length > 0 
                ? 'Create another proposal using one of the methods below'
                : 'Select how you&apos;d like to create a proposal for this lead'}
            </p>
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
