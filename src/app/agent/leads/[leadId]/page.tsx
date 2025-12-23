'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { DayByDayItineraryView } from '@/components/agent/DayByDayItineraryView';
// Removed Supabase import - now using AWS API routes

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
  // Removed Supabase client - now using AWS API routes

  const leadId = params.leadId as string;

  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [queries, setQueries] = useState<Record<string, ItineraryQuery>>({}); // Map of itinerary_id -> query
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryAction, setQueryAction] = useState<'create' | 'insert' | null>(null); // Track which card was clicked
  const [editingQueryForItinerary, setEditingQueryForItinerary] = useState<string | null>(null); // Track which itinerary's query is being edited
  const [expandedItineraryId, setExpandedItineraryId] = useState<string | null>(null); // Track which itinerary is expanded to show days
  const sidebarInitialized = React.useRef(false);
  const priceUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);
  const fetchLeadDataRef = useRef<(() => Promise<void>) | null>(null);
  const lastFetchKeyRef = useRef<string | null>(null);

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

  const fetchLeadData = useCallback(async () => {
    if (!user?.id) return;
    // Don't check or set isFetchingRef here - let the caller manage it
    
    setLoading(true);
    try {
      console.log('[LeadDetailPage] Fetching lead data for leadId:', leadId);
      
      // Fetch lead details from AWS API route with timeout
      const leadController = new AbortController();
      const leadTimeout = setTimeout(() => leadController.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(`/api/leads/${leadId}?agentId=${user.id}`, {
          signal: leadController.signal,
        });
        clearTimeout(leadTimeout);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.error('[LeadDetailPage] Lead not found - 404 response');
            setLead(null);
            setLoading(false);
            return; // Don't navigate away, just show error state
          }
          const errorText = await response.text();
          console.error('[LeadDetailPage] Failed to fetch lead:', response.status, errorText);
          throw new Error(`Failed to fetch lead details: ${response.status}`);
        }

        const { lead: leadData } = await response.json();

        if (!leadData) {
          console.error('[LeadDetailPage] Lead data is null');
          setLead(null);
          setLoading(false);
          return; // Don't navigate away, just show error state
        }

        console.log('[LeadDetailPage] Lead data fetched successfully');
        
        // Fetch itineraries with timeout
        const itinerariesController = new AbortController();
        const itinerariesTimeout = setTimeout(() => itinerariesController.abort(), 10000);
        
        try {
          const itinerariesResponse = await fetch(`/api/itineraries/leads/${leadId}`, {
            signal: itinerariesController.signal,
          });
          clearTimeout(itinerariesTimeout);
          
          if (itinerariesResponse.ok) {
            const { itineraries: itinerariesData } = await itinerariesResponse.json();
            console.log('[LeadDetailPage] Fetched itineraries:', itinerariesData.length);
            
            // Fetch queries for each itinerary (with timeout per query)
            const queriesMap: Record<string, ItineraryQuery> = {};
            const queryPromises = itinerariesData.map(async (itinerary: Itinerary) => {
              if (itinerary.query_id) {
                try {
                  const queryController = new AbortController();
                  const queryTimeout = setTimeout(() => queryController.abort(), 5000);
                  const queryResponse = await fetch(`/api/queries/by-id/${itinerary.query_id}`, {
                    signal: queryController.signal,
                  });
                  clearTimeout(queryTimeout);
                  
                  if (queryResponse.ok) {
                    const { query: queryData } = await queryResponse.json();
                    queriesMap[itinerary.id] = queryData;
                  }
                } catch (err) {
                  console.error(`Error fetching query for itinerary ${itinerary.id}:`, err);
                }
              }
            });
            
            await Promise.all(queryPromises);
            console.log('[LeadDetailPage] Fetched queries:', Object.keys(queriesMap).length);
            
            // Batch all state updates together to minimize re-renders
            // Use React's automatic batching (React 18+) by doing all updates in the same synchronous block
            setLead(leadData);
            setItineraries(itinerariesData || []);
            setQueries(queriesMap);
          } else {
            console.warn('[LeadDetailPage] Failed to fetch itineraries:', itinerariesResponse.status);
            setLead(leadData);
            setItineraries([]);
            setQueries({});
          }
        } catch (err) {
          clearTimeout(itinerariesTimeout);
          if (err instanceof Error && err.name === 'AbortError') {
            console.error('[LeadDetailPage] Timeout fetching itineraries');
            toast.error('Timeout loading itineraries. Please refresh the page.');
          } else {
            console.error('[LeadDetailPage] Error fetching itineraries:', err);
          }
          setLead(leadData);
          setItineraries([]);
          setQueries({});
        }
      } catch (err) {
        clearTimeout(leadTimeout);
        if (err instanceof Error && err.name === 'AbortError') {
          console.error('[LeadDetailPage] Timeout fetching lead data');
          toast.error('Timeout loading lead details. Please refresh the page.');
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('[LeadDetailPage] Error fetching lead data:', err);
      toast.error('Failed to load lead data. Please try refreshing the page.');
    } finally {
      setLoading(false);
      // Don't reset isFetchingRef here - let the caller manage it
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, user?.id]); // Removed toast from dependencies - toast functions are stable

  // Store the latest fetchLeadData in a ref for callbacks that shouldn't trigger re-renders
  useEffect(() => {
    fetchLeadDataRef.current = fetchLeadData;
  }, [fetchLeadData]);

  // Memoized callbacks for DayByDayItineraryView to prevent infinite loops
  const handleDaysGenerated = useCallback(async () => {
    const currentKey = `${leadId}-${user?.id}`;
    if (!isFetchingRef.current && currentKey) {
      lastFetchKeyRef.current = null; // Reset to allow fresh fetch
      isFetchingRef.current = true;
      try {
        await fetchLeadData();
        if (lastFetchKeyRef.current === null || lastFetchKeyRef.current === currentKey) {
          lastFetchKeyRef.current = currentKey;
        }
      } finally {
        if (lastFetchKeyRef.current === null || lastFetchKeyRef.current === currentKey) {
          isFetchingRef.current = false;
        }
      }
    }
  }, [fetchLeadData, leadId, user?.id]);

  const createHandlePriceUpdated = useCallback((itineraryId: string) => {
    return async (totalPrice: number) => {
      // Debounce price updates to prevent infinite loops
      if (priceUpdateTimeoutRef.current) {
        clearTimeout(priceUpdateTimeoutRef.current);
      }
      
      priceUpdateTimeoutRef.current = setTimeout(async () => {
        // Update itinerary total price in database
        try {
          await fetch(`/api/itineraries/${itineraryId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ totalPrice }),
          });
        } catch (err) {
          console.error('Error updating itinerary price:', err);
        }
        
        // Only refresh if not already fetching
        const currentKey = `${leadId}-${user?.id}`;
        if (!isFetchingRef.current && currentKey) {
          lastFetchKeyRef.current = null; // Reset to allow fresh fetch
          isFetchingRef.current = true;
          try {
            await fetchLeadData();
            if (lastFetchKeyRef.current === null || lastFetchKeyRef.current === currentKey) {
              lastFetchKeyRef.current = currentKey;
            }
          } finally {
            if (lastFetchKeyRef.current === null || lastFetchKeyRef.current === currentKey) {
              isFetchingRef.current = false;
            }
          }
        }
      }, 1000); // Debounce by 1 second
    };
  }, [fetchLeadData, leadId, user?.id]);

  // Fetch lead and query data - only on mount or when leadId/user?.id actually changes
  useEffect(() => {
    // Only fetch if we have both leadId and user.id
    if (leadId && user?.id) {
      // Use a ref to track the last fetched leadId/userId to prevent duplicate fetches
      const currentKey = `${leadId}-${user.id}`;
      
      // Only fetch if this is a new combination (leadId or userId changed) AND we're not already fetching
      if (lastFetchKeyRef.current !== currentKey && !isFetchingRef.current) {
        console.log('[LeadDetailPage] useEffect triggered, fetching lead data', { currentKey, lastKey: lastFetchKeyRef.current });
        
        // Set both flags atomically to prevent race conditions
        lastFetchKeyRef.current = currentKey;
        isFetchingRef.current = true;
        
        // Call fetchLeadData directly (it's already memoized with useCallback)
        // Note: fetchLeadData no longer checks isFetchingRef internally
        fetchLeadData().finally(() => {
          // Only reset isFetchingRef if we're still on the same key (prevent race conditions)
          if (lastFetchKeyRef.current === currentKey) {
            isFetchingRef.current = false;
          }
        }).catch(err => {
          console.error('[LeadDetailPage] Error in fetchLeadData:', err);
          // Only reset isFetchingRef if we're still on the same key
          if (lastFetchKeyRef.current === currentKey) {
            isFetchingRef.current = false;
          }
        });
      }
      // Silently skip if same key or already fetching - this is expected behavior
    } else if (!user) {
      console.log('[LeadDetailPage] User not loaded yet, waiting...');
    } else if (!user?.id) {
      console.log('[LeadDetailPage] User not authenticated');
      setLoading(false);
    } else {
      console.log('[LeadDetailPage] Waiting for leadId:', { leadId, userId: user?.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, user?.id]); // Only depend on leadId and user?.id - fetchLeadData is stable due to useCallback

  // Handle query save - creates a new query and optionally creates/links an itinerary
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
      // Create a new query for this itinerary
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

      const responseData = await response.json();
      console.log('[LeadDetailPage] Query API response:', responseData);
      
      const savedQuery = responseData.query;
      
      if (!responseData) {
        console.error('[LeadDetailPage] Empty response from query API');
        throw new Error('Invalid response from query API');
      }
      
      if (!savedQuery) {
        console.error('[LeadDetailPage] No query in response:', responseData);
        throw new Error('Query not returned in API response');
      }
      
      if (!savedQuery.id) {
        console.error('[LeadDetailPage] Query created but missing ID:', {
          query: savedQuery,
          queryKeys: Object.keys(savedQuery),
          fullResponse: responseData,
        });
        throw new Error('Query created but no ID returned');
      }
      
      console.log('[LeadDetailPage] Query saved successfully with ID:', savedQuery.id);
      
      // If editing an existing itinerary's query, update the itinerary's query_id
      if (editingQueryForItinerary) {
        await fetch(`/api/itineraries/${editingQueryForItinerary}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query_id: savedQuery.id }),
        });
        setQueries(prev => ({ ...prev, [editingQueryForItinerary]: savedQuery }));
        setEditingQueryForItinerary(null);
      toast.success('Query updated successfully!');
      } else {
        // Creating a new itinerary - create itinerary and link query
        const itineraryResponse = await fetch('/api/itineraries/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            agentId: user.id,
            name: queryAction === 'insert' ? 'Insert Itinerary' : 'Create Itinerary',
            adultsCount: data.travelers.adults,
            childrenCount: data.travelers.children,
            infantsCount: data.travelers.infants,
            queryId: savedQuery.id,
          }),
        });

        if (!itineraryResponse.ok) {
          const errorData = await itineraryResponse.json().catch(() => ({}));
          console.error('[LeadDetailPage] Failed to create itinerary:', {
            status: itineraryResponse.status,
            statusText: itineraryResponse.statusText,
            error: errorData,
          });
          throw new Error(errorData.details || errorData.error || 'Failed to create itinerary');
        }

        const { itinerary: createdItinerary } = await itineraryResponse.json();
        console.log('[LeadDetailPage] Itinerary created successfully:', createdItinerary);
        
        // Fetch full itinerary details (API only returns ID)
        const fullItineraryResponse = await fetch(`/api/itineraries/${createdItinerary.id}?agentId=${user.id}`);
        let fullItinerary = createdItinerary;
        if (fullItineraryResponse.ok) {
          const { itinerary: fetchedItinerary } = await fullItineraryResponse.json();
          fullItinerary = fetchedItinerary;
          console.log('[LeadDetailPage] Full itinerary fetched, query_id:', fullItinerary.query_id);
        }
        
        // Ensure query_id is set (should be set during creation, but double-check)
        if (!fullItinerary.query_id && savedQuery.id) {
          console.log('[LeadDetailPage] Query ID missing from itinerary, updating...');
          await fetch(`/api/itineraries/${fullItinerary.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ queryId: savedQuery.id }),
          });
          fullItinerary.query_id = savedQuery.id;
        }

        // Refresh itineraries to get the latest data
        const itinerariesResponse = await fetch(`/api/itineraries/leads/${leadId}`);
        if (itinerariesResponse.ok) {
          const { itineraries: itinerariesData } = await itinerariesResponse.json();
          setItineraries(itinerariesData);
          // Immediately add query to queries map so it's available for rendering
          setQueries(prev => ({ ...prev, [fullItinerary.id]: savedQuery }));
          console.log('[LeadDetailPage] Itineraries and queries updated');
        }

        toast.success('Query and itinerary created successfully!');
        
        // For "Create Itinerary", expand it to show day-by-day view inline (NO NAVIGATION)
        if (queryAction === 'create') {
          console.log('[LeadDetailPage] Setting expanded itinerary ID:', fullItinerary.id);
          // Set expanded state immediately so the view renders
          setExpandedItineraryId(fullItinerary.id);
          // Refresh the page data in background to ensure everything is up to date
          // Reset the lastFetchKeyRef to force a fresh fetch
          const currentKey = `${leadId}-${user.id}`;
          if (!isFetchingRef.current) {
            lastFetchKeyRef.current = null; // Reset to allow fresh fetch
            isFetchingRef.current = true;
            fetchLeadData().finally(() => {
              if (lastFetchKeyRef.current === null || lastFetchKeyRef.current === currentKey) {
                lastFetchKeyRef.current = currentKey;
                isFetchingRef.current = false;
              }
            }).catch(err => {
              console.error('Error refreshing lead data:', err);
              if (lastFetchKeyRef.current === null || lastFetchKeyRef.current === currentKey) {
                lastFetchKeyRef.current = currentKey;
                isFetchingRef.current = false;
              }
            });
          }
        } else if (queryAction === 'insert') {
          // For "Insert Itinerary", navigate to insert page
          setTimeout(() => {
            router.push(`/agent/leads/${leadId}/insert?queryId=${savedQuery.id}&itineraryId=${fullItinerary.id}`);
          }, 100);
        } else {
          // For editing existing itinerary, just refresh
          const currentKey = `${leadId}-${user.id}`;
          if (!isFetchingRef.current) {
            lastFetchKeyRef.current = null; // Reset to allow fresh fetch
            isFetchingRef.current = true;
            try {
              await fetchLeadData();
              if (lastFetchKeyRef.current === null || lastFetchKeyRef.current === currentKey) {
                lastFetchKeyRef.current = currentKey;
              }
            } finally {
              if (lastFetchKeyRef.current === null || lastFetchKeyRef.current === currentKey) {
                isFetchingRef.current = false;
              }
            }
          }
        }
      }
      
      setQueryModalOpen(false);
      setQueryAction(null);
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
          <p className="text-sm text-gray-400 mt-2">If this takes too long, please refresh the page</p>
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

        </div>

        {/* Right Column - Proposals Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Proposals</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Existing Itineraries - Each with its own query */}
            {itineraries.map((itinerary) => {
              const itineraryQuery = queries[itinerary.id];
              const isInsertItinerary = itinerary.name.toLowerCase().includes('insert');
              const isCreateItinerary = itinerary.name.toLowerCase().includes('create');
              const isExpanded = expandedItineraryId === itinerary.id;
              
              return (
                <div key={itinerary.id} className="space-y-4">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-semibold line-clamp-1">
                          {itinerary.name}
                        </CardTitle>
                        <Badge variant="secondary">{itinerary.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Query Details for this itinerary */}
                      {itineraryQuery ? (
                        <div className="bg-gray-50 p-3 rounded-md space-y-2 text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-700">Query Details</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingQueryForItinerary(itinerary.id);
                                setQueryModalOpen(true);
                              }}
                            >
                              <FiEdit2 className="w-3 h-3 mr-1" />
                              Edit Query
                            </Button>
                          </div>
                          {itineraryQuery.destinations.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-600">Destinations: </span>
                              <span className="text-gray-500">{formatDestinations(itineraryQuery.destinations)}</span>
                            </div>
                          )}
                          {itineraryQuery.travelers && (
                            <div>
                              <span className="font-medium text-gray-600">Travelers: </span>
                              <span className="text-gray-500">{formatTravelers(itineraryQuery.travelers)}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-700">
                          No query data. Click &quot;Edit Query&quot; to add query details.
                        </div>
                      )}
                      
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
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/agent/itineraries/${itinerary.id}/builder`)}
                          className="flex-1"
                        >
                          <FiEye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {isInsertItinerary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/agent/leads/${leadId}/insert?itineraryId=${itinerary.id}&queryId=${itineraryQuery?.id || ''}`)}
                            className="flex-1"
                          >
                            <FiPackage className="w-4 h-4 mr-1" />
                            Insert Packages
                          </Button>
                        )}
                        {isCreateItinerary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedItineraryId(isExpanded ? null : itinerary.id)}
                            className="flex-1"
                          >
                            <FiEye className="w-4 h-4 mr-1" />
                            {isExpanded ? 'Collapse' : 'View Days'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Day-by-Day Itinerary View (inline, only for Create Itinerary) */}
                  {isCreateItinerary && isExpanded && itinerary.query_id && (
                    <Card className="border-2 border-blue-200">
                      <CardContent className="p-6">
                        <DayByDayItineraryView
                          key={`itinerary-${itinerary.id}`}
                          itineraryId={itinerary.id}
                          queryId={itinerary.query_id}
                          adultsCount={itinerary.adults_count}
                          childrenCount={itinerary.children_count}
                          infantsCount={itinerary.infants_count}
                          onDaysGenerated={handleDaysGenerated}
                          onPriceUpdated={createHandlePriceUpdated(itinerary.id)}
                        />
                      </CardContent>
                    </Card>
                  )}
                  {/* Show message if Create Itinerary is expanded but query_id is missing */}
                  {isCreateItinerary && isExpanded && !itinerary.query_id && (
                    <Card className="border-2 border-yellow-200">
                      <CardContent className="p-6 text-center">
                        <p className="text-gray-600">Query is being linked to itinerary. Please wait...</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}

            {/* Insert Itinerary Card - Always shows, creates new query + itinerary */}
            <Card className="border-dashed border-2 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer flex items-center justify-center min-h-[200px]"
              onClick={() => {
                setQueryAction('insert');
                setEditingQueryForItinerary(null);
                setQueryModalOpen(true);
              }}
            >
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FiPlus className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-gray-600 font-medium">Insert Itinerary</p>
                <p className="text-xs text-gray-400 mt-1">Create new itinerary with packages</p>
              </CardContent>
            </Card>

            {/* Create Itinerary Card - Always shows, creates new query + itinerary */}
            <Card className="border-dashed border-2 border-gray-300 hover:border-green-500 transition-colors cursor-pointer flex items-center justify-center min-h-[200px]"
              onClick={() => {
                setQueryAction('create');
                setEditingQueryForItinerary(null);
                setQueryModalOpen(true);
              }}
            >
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FiPlus className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-gray-600 font-medium">Create Itinerary</p>
                <p className="text-xs text-gray-400 mt-1">Build custom itinerary from scratch</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Query Modal */}
      <QueryModal
        isOpen={queryModalOpen}
        onClose={() => {
          setQueryModalOpen(false);
          setEditingQueryForItinerary(null);
        }}
        onSave={handleQuerySave}
        initialData={editingQueryForItinerary ? queries[editingQueryForItinerary] || null : null}
        leadId={leadId}
        loading={queryLoading}
      />
    </div>
  );
}

