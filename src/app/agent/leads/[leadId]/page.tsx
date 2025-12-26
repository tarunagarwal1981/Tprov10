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
  FiDownload,
  FiFileText,
  FiLock,
} from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import { getAccessToken } from '@/lib/auth/getAccessToken';
import { queryService, type ItineraryQuery } from '@/lib/services/queryService';
import { itineraryService, type Itinerary } from '@/lib/services/itineraryService';
import { MarketplaceService } from '@/lib/services/marketplaceService';
import { QueryModal } from '@/components/agent/QueryModal';
import { LeadCommunicationHistory } from '@/components/agent/LeadCommunicationHistory';
import { AssignLeadToSubAgent } from '@/components/agent/AssignLeadToSubAgent';
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
  const [assignLeadModalOpen, setAssignLeadModalOpen] = useState(false);
  const sidebarInitialized = React.useRef(false);
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

  // Refresh itinerary data when page becomes visible (e.g., returning from day-by-day page)
  useEffect(() => {
    if (!user?.id) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh itinerary data to get updated prices
        console.log('[LeadDetailPage] Page visible, refreshing itinerary data');
        fetchLeadDataRef.current?.();
      }
    };
    
    // Also refresh on focus (when user switches back to tab)
    const handleFocus = () => {
      console.log('[LeadDetailPage] Window focused, refreshing itinerary data');
      fetchLeadDataRef.current?.();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id]);

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
            // Log each itinerary's price details explicitly
            itinerariesData.forEach((it: Itinerary, index: number) => {
              console.log(`[LeadDetailPage] Itinerary ${index + 1}:`, {
                id: it.id,
                name: it.name,
                total_price: it.total_price,
                total_price_type: typeof it.total_price,
                total_price_is_null: it.total_price === null,
                total_price_is_undefined: it.total_price === undefined,
                total_price_value: it.total_price ?? 'NULL/UNDEFINED',
              });
            });
            
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
      const queryPayload = {
        agent_id: user.id,
        destinations: data.destinations,
        leaving_from: data.leaving_from,
        nationality: data.nationality,
        leaving_on: data.leaving_on,
        travelers: data.travelers,
        star_rating: data.star_rating,
        add_transfers: data.add_transfers,
      };
      
      console.log('[LeadDetailPage] Creating query with payload:', {
        leadId,
        agentId: user.id,
        destinations: data.destinations,
        leaving_from: data.leaving_from,
        nationality: data.nationality,
        leaving_on: data.leaving_on,
        travelers: data.travelers,
        star_rating: data.star_rating,
        add_transfers: data.add_transfers,
      });
      
      const response = await fetch(`/api/queries/${leadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryPayload),
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
      
      console.log('[LeadDetailPage] Query saved successfully:', {
        queryId: savedQuery.id,
        leadId: savedQuery.lead_id,
        agentId: savedQuery.agent_id,
        destinations: savedQuery.destinations,
        leaving_from: savedQuery.leaving_from,
        nationality: savedQuery.nationality,
        leaving_on: savedQuery.leaving_on,
        travelers: savedQuery.travelers,
      });
      
      // If editing an existing itinerary's query, update the itinerary's query_id
      if (editingQueryForItinerary) {
        console.log('[LeadDetailPage] Updating existing itinerary query:', {
          itineraryId: editingQueryForItinerary,
          queryId: savedQuery.id,
        });
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
        const itineraryPayload = {
          leadId,
          agentId: user.id,
          name: queryAction === 'insert' ? 'Insert Itinerary' : 'Create Itinerary',
          adultsCount: data.travelers.adults,
          childrenCount: data.travelers.children,
          infantsCount: data.travelers.infants,
          queryId: savedQuery.id,
        };
        
        console.log('[LeadDetailPage] Creating itinerary with payload:', itineraryPayload);
        
        const itineraryResponse = await fetch('/api/itineraries/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itineraryPayload),
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
        console.log('[LeadDetailPage] Itinerary created successfully:', {
          itineraryId: createdItinerary.id,
          leadId: createdItinerary.lead_id,
          agentId: createdItinerary.agent_id,
          queryId: createdItinerary.query_id,
          name: createdItinerary.name,
        });
        
        // Fetch full itinerary details (API only returns ID)
        console.log('[LeadDetailPage] Fetching full itinerary details:', {
          itineraryId: createdItinerary.id,
          agentId: user.id,
        });
        const fullItineraryResponse = await fetch(`/api/itineraries/${createdItinerary.id}?agentId=${user.id}`);
        let fullItinerary = createdItinerary;
        if (fullItineraryResponse.ok) {
          const { itinerary: fetchedItinerary } = await fullItineraryResponse.json();
          fullItinerary = fetchedItinerary;
          console.log('[LeadDetailPage] Full itinerary fetched:', {
            itineraryId: fullItinerary.id,
            leadId: fullItinerary.lead_id,
            agentId: fullItinerary.agent_id,
            queryId: fullItinerary.query_id,
            name: fullItinerary.name,
            expectedQueryId: savedQuery.id,
            queryIdMatches: fullItinerary.query_id === savedQuery.id,
          });
        } else {
          const errorData = await fullItineraryResponse.json().catch(() => ({}));
          console.error('[LeadDetailPage] Failed to fetch full itinerary:', {
            status: fullItineraryResponse.status,
            error: errorData,
          });
        }
        
        // Ensure query_id is set (should be set during creation, but double-check)
        if (!fullItinerary.query_id && savedQuery.id) {
          console.warn('[LeadDetailPage] Query ID missing from itinerary, updating...', {
            itineraryId: fullItinerary.id,
            queryId: savedQuery.id,
          });
          await fetch(`/api/itineraries/${fullItinerary.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ queryId: savedQuery.id }),
          });
          fullItinerary.query_id = savedQuery.id;
          console.log('[LeadDetailPage] Query ID updated in itinerary');
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
        
        // For "Create Itinerary", navigate to day-by-day itinerary page
        if (queryAction === 'create') {
          const navUrl = `/agent/leads/${leadId}/itineraries/new?queryId=${savedQuery.id}&itineraryId=${fullItinerary.id}`;
          console.log('[LeadDetailPage] Navigating to day-by-day itinerary page:', {
            itineraryId: fullItinerary.id,
            queryId: savedQuery.id,
            leadId,
            url: navUrl
          });
          
          // Use window.location.href for reliable navigation (can't be cancelled by re-renders)
          // Close modal and reset state before navigation
          setQueryModalOpen(false);
          setQueryAction(null);
          
          // Perform hard navigation (full page load) - guaranteed to work
          console.log('[LeadDetailPage] Performing hard navigation via window.location.href');
          window.location.href = navUrl;
          
          // Return early (though navigation will happen anyway)
          return;
        } else if (queryAction === 'insert') {
          // For "Insert Itinerary", navigate to insert page
          const navUrl = `/agent/leads/${leadId}/insert?queryId=${savedQuery.id}&itineraryId=${fullItinerary.id}`;
          console.log('[LeadDetailPage] Navigating to insert itinerary page:', {
            itineraryId: fullItinerary.id,
            queryId: savedQuery.id,
            leadId,
            url: navUrl
          });
          
          // Use window.location.href for reliable navigation (can't be cancelled by re-renders)
          // Close modal and reset state before navigation
          setQueryModalOpen(false);
          setQueryAction(null);
          
          // Perform hard navigation (full page load) - guaranteed to work
          console.log('[LeadDetailPage] Performing hard navigation via window.location.href for insert');
          window.location.href = navUrl;
          
          // Return early (though navigation will happen anyway)
          return;
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

  // Handle itinerary deletion
  const handleDeleteItinerary = async (itineraryId: string, itineraryName: string) => {
    // Confirmation dialog
    if (!confirm(`Are you sure you want to delete "${itineraryName}"?\n\nThis action cannot be undone and will delete all days and items in this itinerary.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/itineraries/${itineraryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete itinerary');
      }

      toast.success('Itinerary deleted successfully');
      
      // Refresh the lead data to update the list
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
    } catch (err) {
      console.error('Error deleting itinerary:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete itinerary');
    }
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
              <div className="pt-3 border-t border-gray-200 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignLeadModalOpen(true)}
                  className="w-full"
                >
                  <FiUser className="w-4 h-4 mr-2" />
                  Assign to Sub-Agent
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Communication History */}
          <LeadCommunicationHistory leadId={leadId} />
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
              
              // Log price information for debugging
              const displayPrice = (itinerary.total_price ?? 0);
              console.log(`[LeadDetailPage] Rendering card for "${itinerary.name}":`, {
                id: itinerary.id,
                total_price_raw: itinerary.total_price,
                total_price_type: typeof itinerary.total_price,
                total_price_is_null: itinerary.total_price === null,
                total_price_is_undefined: itinerary.total_price === undefined,
                displayPrice,
                displayPrice_formatted: `$${displayPrice.toFixed(2)}`,
              });
              // Also log as a simple string for easy reading
              console.log(`[LeadDetailPage] Price for "${itinerary.name}": total_price=${itinerary.total_price}, displayPrice=${displayPrice}, formatted=$${displayPrice.toFixed(2)}`);
              
              return (
                <div key={itinerary.id} className="space-y-4">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold line-clamp-1">
                            {itinerary.name}
                          </CardTitle>
                          {/* Option 1: Copyable ID badge in header */}
                          {itinerary.customer_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 mt-2 text-xs font-mono text-gray-500 hover:text-gray-700 border border-gray-300 hover:border-gray-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (itinerary.customer_id) {
                                  navigator.clipboard.writeText(itinerary.customer_id);
                                  toast.success('Itinerary ID copied to clipboard');
                                }
                              }}
                            >
                              <FiCopy className="w-3 h-3 mr-1" />
                              {itinerary.customer_id}
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {itinerary.is_locked && (
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              <FiLock className="w-3 h-3 mr-1" />
                              Locked
                            </Badge>
                          )}
                          <Badge variant="secondary">{itinerary.status}</Badge>
                        </div>
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
                          ${displayPrice.toFixed(2)}
                        </span>
                      </div>
                      {/* Option 2: ID in footer with copy icon */}
                      {itinerary.customer_id && (
                        <div className="flex items-center justify-between pt-2 border-t text-xs">
                          <span className="text-gray-500">Reference ID:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
                              {itinerary.customer_id}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (itinerary.customer_id) {
                                  navigator.clipboard.writeText(itinerary.customer_id);
                                  toast.success('Itinerary ID copied');
                                }
                              }}
                              title="Copy ID"
                            >
                              <FiCopy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
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
                            onClick={() => {
                              if (itinerary.query_id) {
                                router.push(`/agent/leads/${leadId}/itineraries/new?queryId=${itinerary.query_id}&itineraryId=${itinerary.id}`);
                              } else {
                                toast.error('Query is not linked to this itinerary yet. Please wait...');
                              }
                            }}
                            className="flex-1"
                            disabled={!itinerary.query_id}
                          >
                            <FiEye className="w-4 h-4 mr-1" />
                            View Days
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!itinerary.id) {
                              toast.error('Itinerary not available');
                              return;
                            }
                            try {
                              const accessToken = getAccessToken();
                              const response = await fetch(`/api/itineraries/${itinerary.id}/pdf`, {
                                headers: {
                                  'Authorization': `Bearer ${accessToken || ''}`,
                                },
                              });
                              if (response.ok) {
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `itinerary-${itinerary.customer_id || itinerary.id}.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                                toast.success('Itinerary PDF downloaded');
                              } else {
                                const error = await response.json();
                                toast.error(error.error || 'Failed to generate PDF');
                              }
                            } catch (error) {
                              console.error('Error downloading PDF:', error);
                              toast.error('Failed to download PDF');
                            }
                          }}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 flex-shrink-0"
                          title="Download PDF"
                        >
                          <FiDownload className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            handleDeleteItinerary(itinerary.id, itinerary.name);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          title="Delete itinerary"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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

      {/* Assign Lead Modal */}
      <AssignLeadToSubAgent
        leadId={leadId}
        open={assignLeadModalOpen}
        onClose={() => setAssignLeadModalOpen(false)}
        onSuccess={() => {
          // Refresh lead data if needed
          fetchLeadDataRef.current?.();
        }}
      />
    </div>
  );
}

