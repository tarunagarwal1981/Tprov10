'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiPackage, FiLoader, FiMapPin, FiDollarSign, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import { QueryModal } from '@/components/agent/QueryModal';
import { ExactMatchNotFoundDialog } from '@/components/agent/ExactMatchNotFoundDialog';
import type { ItineraryQuery } from '@/lib/services/queryService';
import type { PackageTableRow } from '@/components/agent/PackagesTable';
import { findSimilarPackages } from '@/lib/utils/packageMatching';
// Removed Supabase import - now using AWS API routes
// queryService and itineraryService now accessed via API routes

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

interface MultiCityPackage {
  id: string;
  title: string;
  destination_region: string | null;
  operator_id: string;
  base_price: number | null;
  adult_price: number | null;
  currency: string;
  total_nights: number;
  total_cities: number;
  featured_image_url?: string;
  cities?: Array<{ name: string; nights: number; country?: string | null }>;
}

interface PackageWithCities {
  id: string;
  title: string;
  destination_region: string | null;
  operator_id: string;
  base_price: number | null;
  adult_price: number | null;
  currency: string;
  total_nights: number;
  total_cities: number;
  featured_image_url?: string;
  cities?: Array<{ name: string; nights: number; country?: string | null }>;
}

interface OperatorInfo {
  id: string;
  name: string;
  email?: string;
}

export default function InsertItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const leadId = params.leadId as string;
  
  // State
  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [query, setQuery] = useState<any>(null);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PackageTableRow[]>([]);
  const [operators, setOperators] = useState<Record<string, OperatorInfo>>({});
  const [showSimilarPackages, setShowSimilarPackages] = useState(false);
  const [showSimilarDialog, setShowSimilarDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'multi_city' | 'multi_city_hotel'>('multi_city');
  const [multiCityPackages, setMultiCityPackages] = useState<MultiCityPackage[]>([]);
  const [multiCityHotelPackages, setMultiCityHotelPackages] = useState<MultiCityPackage[]>([]);
  const [queryDestinations, setQueryDestinations] = useState<string[]>([]);
  const [similarPackagesMultiCity, setSimilarPackagesMultiCity] = useState<{
    sameCities: MultiCityPackage[];
    sameCountries: MultiCityPackage[];
  }>({ sameCities: [], sameCountries: [] });
  const [similarPackagesMultiCityHotel, setSimilarPackagesMultiCityHotel] = useState<{
    sameCities: MultiCityPackage[];
    sameCountries: MultiCityPackage[];
  }>({ sameCities: [], sameCountries: [] });

  // Fetch lead and query data on mount
  useEffect(() => {
    if (leadId && user?.id) {
      fetchData();
    }
  }, [leadId, user?.id]);

  // Debug: Track dialog state changes
  useEffect(() => {
    console.log('[InsertItineraryPage] showSimilarDialog state changed:', showSimilarDialog);
  }, [showSimilarDialog]);

  // Get current similar packages based on active tab
  const currentSimilarPackages = activeTab === 'multi_city' 
    ? similarPackagesMultiCity 
    : similarPackagesMultiCityHotel;

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch lead details first
      const leadResponse = await fetch(`/api/leads/${leadId}?agentId=${user.id}`);
      
      if (!leadResponse.ok) {
        if (leadResponse.status === 404) {
          setLead(null);
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch lead details');
      }

      const { lead: leadDataRaw } = await leadResponse.json();

      if (!leadDataRaw) {
        setLead(null);
        setLoading(false);
        return;
      }

      // Map to LeadDetails format
      const leadData: LeadDetails = {
        id: leadDataRaw.id,
        destination: leadDataRaw.destination,
        customerName: leadDataRaw.customerName,
        customerEmail: leadDataRaw.customerEmail,
        customerPhone: leadDataRaw.customerPhone,
        budgetMin: leadDataRaw.budgetMin ?? undefined,
        budgetMax: leadDataRaw.budgetMax ?? undefined,
        durationDays: leadDataRaw.durationDays ?? undefined,
        travelersCount: leadDataRaw.travelersCount ?? undefined,
      };

      setLead(leadData);

      // Fetch query data
      const queryResponse = await fetch(`/api/queries/${leadId}`);
      if (!queryResponse.ok) {
        // No query exists, show query form
        setQueryModalOpen(true);
        setLoading(false);
        return;
      }
      
      const { query: queryData } = await queryResponse.json();
      if (queryData && queryData.destinations && queryData.destinations.length > 0) {
        setQuery(queryData);
        const cities = queryData.destinations.map((d: any) => d.city);
        setQueryDestinations(cities);
        // fetchPackages will handle loading state itself
        await fetchPackages(queryData.destinations); // Pass full destinations with nights
      } else {
        // No query exists, show query form
        setQueryModalOpen(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load data');
      setLead(null);
      setLoading(false);
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
      toast.success('Query saved successfully!');
      setQueryModalOpen(false);
      
      // Fetch packages with the new query
      const cities = savedQuery.destinations.map((d: any) => d.city);
      setQueryDestinations(cities);
      fetchPackages(savedQuery.destinations);
    } catch (err) {
      console.error('Error saving query:', err);
      toast.error('Failed to save query. Please try again.');
      throw err;
    } finally {
      setQueryLoading(false);
    }
  };

  const fetchPackages = async (destinations: Array<{ city: string; nights: number }>) => {
    const cities = destinations.map(d => d.city);
    setLoading(true);
    setShowSimilarPackages(false);
    setShowSimilarDialog(false); // Reset dialog state
    setSimilarPackagesMultiCity({ sameCities: [], sameCountries: [] }); // Reset similar packages
    setSimilarPackagesMultiCityHotel({ sameCities: [], sameCountries: [] }); // Reset similar packages
    try {
      // Fetch operators only if not already loaded
      if (Object.keys(operators).length === 0) {
      const operatorsResponse = await fetch('/api/operators');
      if (operatorsResponse.ok) {
        const { operators: operatorsData } = await operatorsResponse.json();
        const operatorsMap: Record<string, OperatorInfo> = {};
        operatorsData.forEach((op: any) => {
          operatorsMap[op.id] = {
            id: op.id,
            name: op.name || 'Unknown Operator',
            email: op.email,
          };
        });
        setOperators(operatorsMap);
      }
      }

      // Fetch Multi-City Packages with exact matching
      console.log('[InsertItineraryPage] Fetching packages for destinations:', destinations);
      const multiCityResponse = await fetch('/api/packages/multi-city/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinations }),
      });
      
      let multiCityExactMatches: MultiCityPackage[] = [];
      let multiCitySimilarMatches = { sameCities: [] as MultiCityPackage[], sameCountries: [] as MultiCityPackage[] };
      
      if (multiCityResponse.ok) {
        const responseData = await multiCityResponse.json();
        console.log('[InsertItineraryPage] Multi-City API Response:', {
          exactMatchesCount: responseData.exactMatches?.length || 0,
          similarMatchesSameCities: responseData.similarMatches?.sameCities?.length || 0,
          similarMatchesSameCountries: responseData.similarMatches?.sameCountries?.length || 0,
          hasSimilarMatches: responseData.similarMatches ? 
            (responseData.similarMatches.sameCities?.length > 0 || responseData.similarMatches.sameCountries?.length > 0) : false,
          similarMatchesStructure: responseData.similarMatches,
        });
        const { exactMatches, similarMatches } = responseData;
        multiCityExactMatches = exactMatches as MultiCityPackage[] || [];
        multiCitySimilarMatches = similarMatches || { sameCities: [], sameCountries: [] };
        console.log('[InsertItineraryPage] Parsed Multi-City:', {
          exactCount: multiCityExactMatches.length,
          similarCitiesCount: multiCitySimilarMatches.sameCities?.length || 0,
          similarCountriesCount: multiCitySimilarMatches.sameCountries?.length || 0,
        });
        setMultiCityPackages(multiCityExactMatches);
        setSimilarPackagesMultiCity(multiCitySimilarMatches);
      } else {
        const errorText = await multiCityResponse.text();
        console.error('[InsertItineraryPage] Failed to fetch multi-city packages:', errorText);
        setMultiCityPackages([]);
      }

      // Fetch Multi-City Hotel Packages with exact matching
      const multiCityHotelResponse = await fetch('/api/packages/multi-city-hotel/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinations }),
      });
      
      let multiCityHotelExactMatches: MultiCityPackage[] = [];
      let multiCityHotelSimilarMatches = { sameCities: [] as MultiCityPackage[], sameCountries: [] as MultiCityPackage[] };
      
      if (multiCityHotelResponse.ok) {
        const responseData = await multiCityHotelResponse.json();
        console.log('[InsertItineraryPage] Multi-City Hotel API Response:', {
          exactMatchesCount: responseData.exactMatches?.length || 0,
          similarMatchesSameCities: responseData.similarMatches?.sameCities?.length || 0,
          similarMatchesSameCountries: responseData.similarMatches?.sameCountries?.length || 0,
          hasSimilarMatches: responseData.similarMatches ? 
            (responseData.similarMatches.sameCities?.length > 0 || responseData.similarMatches.sameCountries?.length > 0) : false,
          similarMatchesStructure: responseData.similarMatches,
        });
        const { exactMatches, similarMatches } = responseData;
        multiCityHotelExactMatches = exactMatches as MultiCityPackage[] || [];
        multiCityHotelSimilarMatches = similarMatches || { sameCities: [], sameCountries: [] };
        console.log('[InsertItineraryPage] Parsed Multi-City Hotel:', {
          exactCount: multiCityHotelExactMatches.length,
          similarCitiesCount: multiCityHotelSimilarMatches.sameCities?.length || 0,
          similarCountriesCount: multiCityHotelSimilarMatches.sameCountries?.length || 0,
        });
        setMultiCityHotelPackages(multiCityHotelExactMatches);
        setSimilarPackagesMultiCityHotel(multiCityHotelSimilarMatches);
      } else {
        const errorText = await multiCityHotelResponse.text();
        console.error('[InsertItineraryPage] Failed to fetch multi-city hotel packages:', errorText);
        setMultiCityHotelPackages([]);
      }

      // Set loading to false first
      setLoading(false);

      // Check if we should show the dialog: no exact matches (show dialog to ask if user wants to see all packages)
      const hasExactMatches = multiCityExactMatches.length > 0 || multiCityHotelExactMatches.length > 0;
      const multiCityHasSimilar = multiCitySimilarMatches.sameCities.length > 0 || multiCitySimilarMatches.sameCountries.length > 0;
      const multiCityHotelHasSimilar = multiCityHotelSimilarMatches.sameCities.length > 0 || multiCityHotelSimilarMatches.sameCountries.length > 0;
      const hasSimilarMatches = multiCityHasSimilar || multiCityHotelHasSimilar;

      console.log('[InsertItineraryPage] ========== PACKAGE MATCHING RESULTS ==========');
      console.log('[InsertItineraryPage] Exact Matches - Multi-City:', multiCityExactMatches.length);
      console.log('[InsertItineraryPage] Exact Matches - Multi-City Hotel:', multiCityHotelExactMatches.length);
      console.log('[InsertItineraryPage] hasExactMatches:', hasExactMatches);
      console.log('[InsertItineraryPage] Similar Matches - Multi-City Cities:', multiCitySimilarMatches.sameCities.length);
      console.log('[InsertItineraryPage] Similar Matches - Multi-City Countries:', multiCitySimilarMatches.sameCountries.length);
      console.log('[InsertItineraryPage] Similar Matches - Multi-City Hotel Cities:', multiCityHotelSimilarMatches.sameCities.length);
      console.log('[InsertItineraryPage] Similar Matches - Multi-City Hotel Countries:', multiCityHotelSimilarMatches.sameCountries.length);
      console.log('[InsertItineraryPage] multiCityHasSimilar:', multiCityHasSimilar);
      console.log('[InsertItineraryPage] multiCityHotelHasSimilar:', multiCityHotelHasSimilar);
      console.log('[InsertItineraryPage] hasSimilarMatches:', hasSimilarMatches);
      console.log('[InsertItineraryPage] Should show dialog (!hasExactMatches):', !hasExactMatches);
      console.log('[InsertItineraryPage] ===============================================');

      // Show dialog if no exact matches (regardless of similar matches - user can choose to see all packages)
      if (!hasExactMatches) {
        console.log('[InsertItineraryPage] ✅✅✅ NO EXACT MATCHES - Setting showSimilarDialog to TRUE ✅✅✅');
        setShowSimilarDialog(true);
      } else {
        console.log('[InsertItineraryPage] ✅ Has exact matches, no dialog needed');
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
      toast.error('Failed to load packages');
      setLoading(false);
    }
  };

  const handleShowSimilar = async () => {
    if (!query) return;
    
    setShowSimilarDialog(false);
    setLoading(true);
    
    try {
      // First, check if we already have similar matches from the initial API call
      const hasSimilarFromAPI = 
        (similarPackagesMultiCity.sameCities.length > 0 || similarPackagesMultiCity.sameCountries.length > 0) ||
        (similarPackagesMultiCityHotel.sameCities.length > 0 || similarPackagesMultiCityHotel.sameCountries.length > 0);

      if (hasSimilarFromAPI) {
        // We already have similar packages from the API, just show them
        console.log('[InsertItineraryPage] Using similar packages from API');
        setShowSimilarPackages(true);
        setLoading(false);
        return;
      }

      // Fetch operators if not already loaded
      if (Object.keys(operators).length === 0) {
        const operatorsResponse = await fetch('/api/operators');
        if (operatorsResponse.ok) {
          const { operators: operatorsData } = await operatorsResponse.json();
          const operatorsMap: Record<string, OperatorInfo> = {};
          operatorsData.forEach((op: any) => {
            operatorsMap[op.id] = {
              id: op.id,
              name: op.name || 'Unknown Operator',
              email: op.email,
            };
          });
          setOperators(operatorsMap);
        }
      }

      // Fetch ALL packages to check for similar ones
      const cities = query.destinations.map((d: any) => d.city);
      const citiesParam = cities.join(',');

      const [multiCityResponse, multiCityHotelResponse] = await Promise.all([
        fetch(`/api/packages/multi-city?cities=${encodeURIComponent(citiesParam)}`),
        fetch(`/api/packages/multi-city-hotel?cities=${encodeURIComponent(citiesParam)}`),
      ]);

      const allPackages: PackageWithCities[] = [];

      if (multiCityResponse.ok) {
        const { packages: multiCityPackages } = await multiCityResponse.json();
        allPackages.push(...multiCityPackages.map((pkg: any) => ({
          ...pkg,
          type: 'multi_city' as const,
        })));
      }

      if (multiCityHotelResponse.ok) {
        const { packages: multiCityHotelPackages } = await multiCityHotelResponse.json();
        allPackages.push(...multiCityHotelPackages.map((pkg: any) => ({
          ...pkg,
          type: 'multi_city_hotel' as const,
        })));
      }

      // Use findSimilarPackages utility to find similar packages from all available
      const similarPackages = findSimilarPackages(query.destinations, allPackages);

      console.log('[InsertItineraryPage] Found similar packages:', similarPackages.length);

      // Check if we found any similar packages
      if (similarPackages.length === 0) {
        // No similar packages available
        toast.error('No similar packages available. Please try different destinations or dates.');
        setLoading(false);
        return;
      }

      // Convert to table format and set as similar packages
      const multiCitySimilar: MultiCityPackage[] = [];
      const multiCityHotelSimilar: MultiCityPackage[] = [];
      
      similarPackages.forEach((pkg) => {
        const packageData: MultiCityPackage = {
          id: pkg.id,
          title: pkg.title,
          destination_region: pkg.destination_region || null,
          operator_id: pkg.operator_id,
          base_price: pkg.base_price || pkg.adult_price || null,
          adult_price: pkg.adult_price || null,
          currency: pkg.currency || 'USD',
          total_nights: pkg.total_nights || 0,
          total_cities: pkg.total_cities || 0,
          featured_image_url: pkg.featured_image_url,
          cities: pkg.cities || [],
        };
        
        if (pkg.type === 'multi_city_hotel') {
          multiCityHotelSimilar.push(packageData);
        } else {
          multiCitySimilar.push(packageData);
        }
      });

      // Update state with similar packages
      setSimilarPackagesMultiCity({
        sameCities: multiCitySimilar,
        sameCountries: [],
      });
      setSimilarPackagesMultiCityHotel({
        sameCities: multiCityHotelSimilar,
        sameCountries: [],
      });
      
      setShowSimilarPackages(true);
      toast.success(`Found ${similarPackages.length} similar package${similarPackages.length > 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Error fetching all packages:', err);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleDontShowSimilar = () => {
    setShowSimilarDialog(false);
    router.push(`/agent/leads/${leadId}`);
  };


  const handlePackageSelect = async (packageId: string, packageType: 'multi_city' | 'multi_city_hotel') => {
    if (!user?.id) return;

    try {
      // Ensure the lead exists
      const ensureResponse = await fetch('/api/leads/ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, agentId: user.id }),
      });

      if (!ensureResponse.ok) {
        const error = await ensureResponse.json();
        toast.error(error.error || 'Failed to ensure lead exists');
        return;
      }

      const { leadId: actualLeadId } = await ensureResponse.json();

      // Check if itinerary exists
      const itinerariesResponse = await fetch(`/api/itineraries/leads/${actualLeadId}`);
      const existingItineraries = itinerariesResponse.ok 
        ? (await itinerariesResponse.json()).itineraries 
        : [];
      
      let itineraryId: string;
      
      if (existingItineraries.length === 0) {
        // Create new itinerary
        if (!query) {
          toast.error('Query not found. Please create a query first.');
          return;
        }

        const createItineraryResponse = await fetch('/api/itineraries/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: actualLeadId,
            agentId: user.id,
            name: 'Itinerary #1',
            adultsCount: query.travelers?.adults || 2,
            childrenCount: query.travelers?.children || 0,
            infantsCount: query.travelers?.infants || 0,
            startDate: query.leaving_on || null,
            endDate: null,
          }),
        });

        if (!createItineraryResponse.ok) {
          const error = await createItineraryResponse.json();
          throw new Error(error.error || 'Failed to create itinerary');
        }

        const { itinerary: newItinerary } = await createItineraryResponse.json();
        itineraryId = newItinerary.id;
      } else {
        itineraryId = existingItineraries[0]!.id;
      }

      // For multi-city packages, create itinerary_item immediately and navigate to configure page
      if (packageType === 'multi_city' || packageType === 'multi_city_hotel') {
        // Fetch package details from AWS API
        const packageResponse = await fetch(`/api/packages/${packageId}?type=${packageType}`);
        
        if (!packageResponse.ok) {
          const error = await packageResponse.json();
          console.error('Error fetching package:', error);
          toast.error(error.error || 'Failed to load package details');
          return;
        }

        const { package: pkgData } = await packageResponse.json();
        console.log('Package data received:', { packageId, packageType, pkgData });

        // Get itinerary info for default pricing
        const itineraryResponse = await fetch(`/api/itineraries/${itineraryId}?agentId=${user.id}`);
        let itineraryInfo = null;
        if (itineraryResponse.ok) {
          const { itinerary } = await itineraryResponse.json();
          itineraryInfo = itinerary;
        }

        // Calculate default price (use base_price, adult_price, or 0)
        // Ensure it's a number, not null or undefined
        const defaultPrice = Number(pkgData.base_price || pkgData.adult_price || 0);
        
        // Validate required fields
        if (!pkgData.operator_id) {
          console.error('Package missing operator_id:', pkgData);
          toast.error('Package is missing operator information');
          return;
        }
        
        if (!pkgData.title) {
          console.error('Package missing title:', pkgData);
          toast.error('Package is missing title');
          return;
        }

        console.log('Creating item with:', { 
          itineraryId, 
          packageId, 
          packageType, 
          operatorId: pkgData.operator_id, 
          packageTitle: pkgData.title,
          defaultPrice,
          defaultPriceType: typeof defaultPrice
        });

        // Create itinerary_item with default configuration via API
        const createItemResponse = await fetch(`/api/itineraries/${itineraryId}/items/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dayId: null, // Unassigned initially
            packageType: packageType,
            packageId: packageId,
            operatorId: pkgData.operator_id,
            packageTitle: pkgData.title,
            packageImageUrl: pkgData.image_url || null,
            configuration: {
              pricingType: 'SIC',
              selectedPricingRowId: null,
              selectedVehicle: null,
              quantity: 1,
              selectedHotels: [],
              activities: [],
              transfers: [],
            },
            unitPrice: defaultPrice,
            quantity: 1,
            displayOrder: 0,
            notes: null,
          }),
        });

        if (!createItemResponse.ok) {
          const error = await createItemResponse.json();
          console.error('Error creating itinerary item:', error);
          toast.error(error.error || 'Failed to create itinerary item');
          return;
        }

        const responseData = await createItemResponse.json();
        const newItem = responseData.item;

        if (!newItem || !newItem.id) {
          console.error('Error creating itinerary item:', { error: 'ID not returned', response: responseData });
          toast.error('Failed to create itinerary item: ID not returned');
          return;
        }

        // Navigate directly to configure page
        router.push(`/agent/itineraries/${itineraryId}/configure/${newItem.id}`);
      } else {
        // For other packages, navigate to builder (keep existing flow)
        router.push(`/agent/itineraries/${itineraryId}/builder?packageId=${packageId}&packageType=${packageType}`);
      }
    } catch (err) {
      console.error('Error creating/selecting itinerary:', err);
      toast.error('Failed to create itinerary');
    }
  };

  if (loading && !query) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead data...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/agent/leads/${leadId}`)}
          className="mb-4"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back to Lead Details
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Insert Itinerary</h1>
        <p className="text-gray-600 mt-2">
          {showSimilarPackages 
            ? 'Similar packages (exact matches not available)' 
            : multiCityPackages.length > 0 || multiCityHotelPackages.length > 0
              ? `Found ${multiCityPackages.length + multiCityHotelPackages.length} matching package${(multiCityPackages.length + multiCityHotelPackages.length) > 1 ? 's' : ''}`
              : query 
                ? 'Select a package matching your query'
                : 'Create a query to find matching packages'}
        </p>
      </div>

      {/* Tabs for Multi-City and Multi-City Hotel */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          setActiveTab(value as 'multi_city' | 'multi_city_hotel');
          // Reset similar packages when switching tabs
          setShowSimilarPackages(false);
        }} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="multi_city">Multi-City Packages</TabsTrigger>
          <TabsTrigger value="multi_city_hotel">Multi-City Hotel Packages</TabsTrigger>
        </TabsList>

        {/* Multi-City Packages Tab */}
        <TabsContent value="multi_city" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading packages...</span>
            </div>
          ) : multiCityPackages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Exact Match Found</h3>
                <p className="text-gray-600 mb-4">
                  No multi-city packages exactly match your query destinations: {queryDestinations.join(', ')}
                </p>
                {(currentSimilarPackages.sameCities.length > 0 || currentSimilarPackages.sameCountries.length > 0) && (
                  <div className="mt-4">
                    <Button
                      onClick={() => setShowSimilarPackages(!showSimilarPackages)}
                      variant="outline"
                    >
                      {showSimilarPackages ? 'Hide' : 'Show'} Similar Packages
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-4 py-3">Package Name</TableHead>
                          <TableHead className="px-4 py-3">Cities (Sequence)</TableHead>
                          <TableHead className="px-4 py-3">Nights</TableHead>
                          <TableHead className="px-4 py-3">Operator</TableHead>
                          <TableHead className="px-4 py-3 text-right">Price</TableHead>
                          <TableHead className="px-4 py-3 text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
              {multiCityPackages.map((pkg) => (
                          <TableRow key={pkg.id}>
                            <TableCell className="px-4 py-3">
                              <div className="font-medium text-gray-900">{pkg.title}</div>
                              {pkg.destination_region && (
                                <div className="text-xs text-gray-500 mt-1">{pkg.destination_region}</div>
                    )}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="text-sm text-gray-700">
                                {pkg.cities && pkg.cities.length > 0
                                  ? pkg.cities.map((c, idx) => (
                                      <span key={idx}>
                                        {c.name} ({c.nights}N)
                                        {idx < pkg.cities!.length - 1 && ' → '}
                                      </span>
                                    ))
                                  : 'N/A'}
                        </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                          <FiCalendar className="w-4 h-4" />
                          <span>{pkg.total_nights} nights</span>
                        </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="text-sm text-gray-600">
                                {operators[pkg.operator_id]?.name || 'Unknown Operator'}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right">
                              <div className="text-lg font-bold text-green-600">
                                {pkg.base_price || pkg.adult_price
                                  ? `${pkg.currency || 'USD'} ${(pkg.base_price || pkg.adult_price || 0).toLocaleString()}`
                                  : 'Contact'}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center">
                              <Button
                                size="sm"
                                onClick={() => handlePackageSelect(pkg.id, 'multi_city')}
                              >
                                <FiPackage className="w-4 h-4 mr-2" />
                                Insert
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Similar Packages Section */}
              {showSimilarPackages && (currentSimilarPackages.sameCities.length > 0 || currentSimilarPackages.sameCountries.length > 0) && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Similar Packages</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentSimilarPackages.sameCities.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Same Cities, Different Nights</h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="px-3 py-2">Package</TableHead>
                                <TableHead className="px-3 py-2">Cities</TableHead>
                                <TableHead className="px-3 py-2">Nights</TableHead>
                                <TableHead className="px-3 py-2 text-right">Price</TableHead>
                                <TableHead className="px-3 py-2 text-center">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentSimilarPackages.sameCities.map((pkg) => (
                                <TableRow key={pkg.id}>
                                  <TableCell className="px-3 py-2">{pkg.title}</TableCell>
                                  <TableCell className="px-3 py-2">
                                    {pkg.cities?.map((c, idx) => (
                                      <span key={idx}>
                                        {c.name} ({c.nights}N)
                                        {idx < pkg.cities!.length - 1 && ' → '}
                                      </span>
                                    ))}
                                  </TableCell>
                                  <TableCell className="px-3 py-2">{pkg.total_nights}</TableCell>
                                  <TableCell className="px-3 py-2 text-right font-semibold text-green-600">
                                    {pkg.base_price || pkg.adult_price
                                      ? `${pkg.currency || 'USD'} ${(pkg.base_price || pkg.adult_price || 0).toLocaleString()}`
                                      : 'Contact'}
                                  </TableCell>
                                  <TableCell className="px-3 py-2 text-center">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePackageSelect(pkg.id, activeTab)}
                                    >
                                      Insert
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                    {currentSimilarPackages.sameCountries.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Same Countries</h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Package</TableHead>
                                <TableHead>Cities</TableHead>
                                <TableHead>Nights</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-center">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentSimilarPackages.sameCountries.map((pkg) => (
                                <TableRow key={pkg.id}>
                                  <TableCell>{pkg.title}</TableCell>
                                  <TableCell>
                                    {pkg.cities?.map((c, idx) => (
                                      <span key={idx}>
                                        {c.name} ({c.nights}N)
                                        {idx < pkg.cities!.length - 1 && ' → '}
                                      </span>
                                    ))}
                                  </TableCell>
                                  <TableCell>{pkg.total_nights}</TableCell>
                                  <TableCell className="text-right font-semibold text-green-600">
                                    {pkg.base_price || pkg.adult_price
                                      ? `${pkg.currency || 'USD'} ${(pkg.base_price || pkg.adult_price || 0).toLocaleString()}`
                                      : 'Contact'}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePackageSelect(pkg.id, activeTab)}
                                    >
                                      Insert
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Multi-City Hotel Packages Tab */}
        <TabsContent value="multi_city_hotel" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading packages...</span>
            </div>
          ) : multiCityHotelPackages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Exact Match Found</h3>
                <p className="text-gray-600 mb-4">
                  No multi-city hotel packages exactly match your query destinations: {queryDestinations.join(', ')}
                </p>
                {(currentSimilarPackages.sameCities.length > 0 || currentSimilarPackages.sameCountries.length > 0) && (
                  <div className="mt-4">
                    <Button
                      onClick={() => setShowSimilarPackages(!showSimilarPackages)}
                      variant="outline"
                    >
                      {showSimilarPackages ? 'Hide' : 'Show'} Similar Packages
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-4 py-3">Package Name</TableHead>
                          <TableHead className="px-4 py-3">Cities (Sequence)</TableHead>
                          <TableHead className="px-4 py-3">Nights</TableHead>
                          <TableHead className="px-4 py-3">Operator</TableHead>
                          <TableHead className="px-4 py-3 text-right">Price</TableHead>
                          <TableHead className="px-4 py-3 text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
              {multiCityHotelPackages.map((pkg) => (
                          <TableRow key={pkg.id}>
                            <TableCell className="px-4 py-3">
                              <div className="font-medium text-gray-900">{pkg.title}</div>
                              {pkg.destination_region && (
                                <div className="text-xs text-gray-500 mt-1">{pkg.destination_region}</div>
                    )}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="text-sm text-gray-700">
                                {pkg.cities && pkg.cities.length > 0
                                  ? pkg.cities.map((c, idx) => (
                                      <span key={idx}>
                                        {c.name} ({c.nights}N)
                                        {idx < pkg.cities!.length - 1 && ' → '}
                                      </span>
                                    ))
                                  : 'N/A'}
                        </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                          <FiCalendar className="w-4 h-4" />
                          <span>{pkg.total_nights} nights</span>
                        </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="text-sm text-gray-600">
                                {operators[pkg.operator_id]?.name || 'Unknown Operator'}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right">
                              <div className="text-lg font-bold text-green-600">
                                {pkg.base_price || pkg.adult_price
                                  ? `${pkg.currency || 'USD'} ${(pkg.base_price || pkg.adult_price || 0).toLocaleString()}`
                                  : 'Contact'}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-center">
                              <Button
                                size="sm"
                                onClick={() => handlePackageSelect(pkg.id, 'multi_city_hotel')}
                              >
                                <FiPackage className="w-4 h-4 mr-2" />
                                Insert
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Similar Packages Section */}
              {showSimilarPackages && (currentSimilarPackages.sameCities.length > 0 || currentSimilarPackages.sameCountries.length > 0) && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Similar Packages</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentSimilarPackages.sameCities.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Same Cities, Different Nights</h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Package</TableHead>
                                <TableHead>Cities</TableHead>
                                <TableHead>Nights</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-center">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentSimilarPackages.sameCities.map((pkg) => (
                                <TableRow key={pkg.id}>
                                  <TableCell>{pkg.title}</TableCell>
                                  <TableCell>
                                    {pkg.cities?.map((c, idx) => (
                                      <span key={idx}>
                                        {c.name} ({c.nights}N)
                                        {idx < pkg.cities!.length - 1 && ' → '}
                                      </span>
                                    ))}
                                  </TableCell>
                                  <TableCell>{pkg.total_nights}</TableCell>
                                  <TableCell className="text-right font-semibold text-green-600">
                                    {pkg.base_price || pkg.adult_price
                                      ? `${pkg.currency || 'USD'} ${(pkg.base_price || pkg.adult_price || 0).toLocaleString()}`
                                      : 'Contact'}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePackageSelect(pkg.id, activeTab)}
                                    >
                                      Insert
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                    {currentSimilarPackages.sameCountries.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Same Countries</h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="px-3 py-2">Package</TableHead>
                                <TableHead className="px-3 py-2">Cities</TableHead>
                                <TableHead className="px-3 py-2">Nights</TableHead>
                                <TableHead className="px-3 py-2 text-right">Price</TableHead>
                                <TableHead className="px-3 py-2 text-center">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentSimilarPackages.sameCountries.map((pkg) => (
                                <TableRow key={pkg.id}>
                                  <TableCell className="px-3 py-2">{pkg.title}</TableCell>
                                  <TableCell className="px-3 py-2">
                                    {pkg.cities?.map((c, idx) => (
                                      <span key={idx}>
                                        {c.name} ({c.nights}N)
                                        {idx < pkg.cities!.length - 1 && ' → '}
                                      </span>
                                    ))}
                                  </TableCell>
                                  <TableCell className="px-3 py-2">{pkg.total_nights}</TableCell>
                                  <TableCell className="px-3 py-2 text-right font-semibold text-green-600">
                                    {pkg.base_price || pkg.adult_price
                                      ? `${pkg.currency || 'USD'} ${(pkg.base_price || pkg.adult_price || 0).toLocaleString()}`
                                      : 'Contact'}
                                  </TableCell>
                                  <TableCell className="px-3 py-2 text-center">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePackageSelect(pkg.id, activeTab)}
                                    >
                                      Insert
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Query Modal */}
      <QueryModal
        isOpen={queryModalOpen}
        onClose={() => {
          setQueryModalOpen(false);
          if (!query) {
            router.push(`/agent/leads/${leadId}`);
          }
        }}
        onSave={handleQuerySave}
        initialData={query}
        leadId={leadId}
        loading={queryLoading}
      />

      {/* Exact Match Not Found Dialog */}
      <ExactMatchNotFoundDialog
        isOpen={showSimilarDialog}
        onYes={handleShowSimilar}
        onNo={handleDontShowSimilar}
      />
      </div>
    </div>
  );
}
