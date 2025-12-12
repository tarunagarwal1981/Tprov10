'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import { QueryModal } from '@/components/agent/QueryModal';
import { ExactMatchNotFoundDialog } from '@/components/agent/ExactMatchNotFoundDialog';
import { PackagesTable, type PackageTableRow } from '@/components/agent/PackagesTable';
import { LeadQuerySidebar } from '@/components/agent/LeadQuerySidebar';
import { findExactMatches, findSimilarPackages } from '@/lib/utils/packageMatching';
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

export default function CreateItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const leadId = params.leadId as string;
  
  // State
  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [query, setQuery] = useState<ItineraryQuery | null>(null);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PackageTableRow[]>([]);
  const [operators, setOperators] = useState<Record<string, OperatorInfo>>({});
  const [showSimilarDialog, setShowSimilarDialog] = useState(false);
  const [showingSimilar, setShowingSimilar] = useState(false);

  // Fetch lead and query data on mount
  useEffect(() => {
    if (leadId && user?.id) {
      fetchInitialData();
    }
  }, [leadId, user?.id]);

  const fetchInitialData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch lead details
      const leadResponse = await fetch(`/api/leads/${leadId}?agentId=${user.id}`);
      if (leadResponse.ok) {
        const { lead: leadData } = await leadResponse.json();
        if (leadData) {
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
          });
        }
      }

      // Fetch query
      const queryResponse = await fetch(`/api/queries/${leadId}`);
      if (queryResponse.ok) {
        const { query: queryData } = await queryResponse.json();
        setQuery(queryData);
        
        // If query exists, fetch packages
        if (queryData && queryData.destinations && queryData.destinations.length > 0) {
          await fetchAndMatchPackages(queryData);
        } else {
          // No query exists, show query modal
          setQueryModalOpen(true);
        }
      } else {
        // No query exists, show query modal
        setQueryModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const fetchAndMatchPackages = async (queryData: ItineraryQuery) => {
    if (!queryData.destinations || queryData.destinations.length === 0) {
      return;
    }

    setLoading(true);
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

      // Extract cities for API call
      const cities = queryData.destinations.map(d => d.city);
      const citiesParam = cities.join(',');

      // Fetch all packages (both types)
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

      // Find exact matches
      const exactMatches = findExactMatches(queryData.destinations, allPackages);

      if (exactMatches.length > 0) {
        // Convert to table format
        const tableRows: PackageTableRow[] = exactMatches.map((pkg) => ({
          id: pkg.id,
          title: pkg.title,
          cities: pkg.cities || [],
          totalNights: pkg.total_nights || 0,
          price: pkg.base_price || pkg.adult_price || null,
          currency: pkg.currency || 'USD',
          operatorName: operators[pkg.operator_id]?.name,
          featuredImageUrl: pkg.featured_image_url,
          type: (pkg as any).type || 'multi_city',
        }));
        setPackages(tableRows);
        setShowingSimilar(false);
      } else {
        // No exact matches, show dialog
        setShowSimilarDialog(true);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleShowSimilar = async () => {
    if (!query) return;

    setShowSimilarDialog(false);
    setLoading(true);

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

      // Fetch all packages again
      const cities = query.destinations.map(d => d.city);
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

      // Find similar packages
      const similarPackages = findSimilarPackages(query.destinations, allPackages);

      // Convert to table format
      const tableRows: PackageTableRow[] = similarPackages.map((pkg) => ({
        id: pkg.id,
        title: pkg.title,
        cities: pkg.cities || [],
        totalNights: pkg.total_nights || 0,
        price: pkg.base_price || pkg.adult_price || null,
        currency: pkg.currency || 'USD',
        operatorName: operators[pkg.operator_id]?.name,
        featuredImageUrl: pkg.featured_image_url,
        type: (pkg as any).type || 'multi_city',
      }));

      setPackages(tableRows);
      setShowingSimilar(true);
    } catch (err) {
      console.error('Error fetching similar packages:', err);
      toast.error('Failed to load similar packages');
    } finally {
      setLoading(false);
    }
  };

  const handleDontShowSimilar = () => {
    setShowSimilarDialog(false);
    router.push(`/agent/leads/${leadId}`);
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

      // Fetch and match packages after query is saved
      await fetchAndMatchPackages(savedQuery);
    } catch (err) {
      console.error('Error saving query:', err);
      toast.error('Failed to save query. Please try again.');
      throw err;
    } finally {
      setQueryLoading(false);
    }
  };

  const handlePackageSelect = async (packageId: string, packageType: 'multi_city' | 'multi_city_hotel') => {
    if (!user?.id || !query) {
      toast.error('Query information is missing. Please save the query first.');
      return;
    }

    // Validate query has destinations
    if (!query.destinations || !Array.isArray(query.destinations) || query.destinations.length === 0) {
      toast.error('Query destinations are missing. Please update the query with destinations.');
      console.error('Query destinations missing:', { query });
      return;
    }

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

      // Calculate end date based on destinations and nights
      const totalNights = query.destinations.reduce((sum: number, dest: any) => sum + (dest.nights || 0), 0);
      const startDate = query.leaving_on ? new Date(query.leaving_on) : new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + totalNights);

      // Create itinerary first
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
          startDate: query.leaving_on ? formatDate(startDate) : formatDate(startDate),
          endDate: formatDate(endDate),
          notes: null,
          leadBudgetMin: lead?.budgetMin || null,
          leadBudgetMax: lead?.budgetMax || null,
          status: 'draft',
        }),
      });

      if (!createItineraryResponse.ok) {
        const error = await createItineraryResponse.json();
        throw new Error(error.error || 'Failed to create itinerary');
      }

      const { itinerary: newItinerary } = await createItineraryResponse.json();
      const itineraryId = newItinerary.id;

      // Generate days based on query destinations
      const daysToInsert: any[] = [];
      const currentDate = new Date(startDate);
      let dayNumber = 1;

      console.log('Generating days from query:', { 
        destinations: query.destinations, 
        destinationsLength: query.destinations?.length,
        startDate: startDate.toISOString()
      });

      for (const destination of query.destinations) {
        if (!destination || !destination.city) {
          console.warn('Skipping invalid destination:', destination);
          continue;
        }

        const cityName = destination.city;
        const nights = destination.nights || 1;

        for (let night = 0; night < nights; night++) {
          const dayDate = new Date(currentDate);
          dayDate.setDate(currentDate.getDate() + night);

          daysToInsert.push({
            dayNumber: dayNumber,
            date: formatDate(dayDate),
            cityName: cityName,
            displayOrder: dayNumber,
            timeSlots: {
              morning: { time: '', activities: [], transfers: [] },
              afternoon: { time: '', activities: [], transfers: [] },
              evening: { time: '', activities: [], transfers: [] }
            },
            notes: null,
          });

          dayNumber++;
        }

        currentDate.setDate(currentDate.getDate() + nights);
      }

      console.log('Generated days to insert:', { count: daysToInsert.length, days: daysToInsert });

      // Insert all days
      if (daysToInsert.length === 0) {
        console.error('No days to insert! Query destinations:', query.destinations);
        toast.error('Failed to generate itinerary days. Please check your query destinations.');
        throw new Error('No days generated from query destinations');
      }

      const daysResponse = await fetch(`/api/itineraries/${itineraryId}/days/bulk-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: daysToInsert }),
      });

      if (!daysResponse.ok) {
        const error = await daysResponse.json();
        console.error('Failed to create itinerary days:', error);
        throw new Error(error.error || 'Failed to create itinerary days');
      }

      // Fetch package details
      const packageResponse = await fetch(`/api/packages/${packageId}?type=${packageType}`);
      
      if (!packageResponse.ok) {
        const error = await packageResponse.json();
        toast.error(error.error || 'Failed to load package details');
        return;
      }

      const { package: pkgData } = await packageResponse.json();

      // Create itinerary_item
      const createItemResponse = await fetch(`/api/itineraries/${itineraryId}/items/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId: null,
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
          unitPrice: pkgData.base_price || 0,
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

      const { item: newItem } = await createItemResponse.json();

      toast.success('Itinerary created successfully!');
      // Navigate to configure page
      router.push(`/agent/itineraries/${itineraryId}/configure/${newItem.id}`);
    } catch (err) {
      console.error('Error creating itinerary:', err);
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
        <h1 className="text-2xl font-bold text-gray-900">Create Itinerary</h1>
        <p className="text-gray-600 mt-2">
          {showingSimilar 
            ? 'Similar packages (exact matches not available)' 
            : packages.length > 0 
              ? `Found ${packages.length} matching package${packages.length > 1 ? 's' : ''}`
              : query 
                ? 'Select a package matching your query'
                : 'Create a query to find matching packages'}
        </p>
      </div>

      {/* Main Content with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Lead & Query Details */}
        <div className="lg:col-span-1">
          {lead && (
            <LeadQuerySidebar
              lead={lead}
              query={query}
              onEditQuery={() => setQueryModalOpen(true)}
            />
          )}
        </div>

        {/* Right Side - Packages Table */}
        <div className="lg:col-span-3">
          <PackagesTable
            packages={packages}
            onSelectPackage={handlePackageSelect}
            loading={loading}
            rowsPerPage={20}
          />
        </div>
      </div>

      {/* Query Modal */}
      <QueryModal
        isOpen={queryModalOpen}
        onClose={() => {
          // If no query exists, redirect back
          if (!query) {
            router.push(`/agent/leads/${leadId}`);
          } else {
            setQueryModalOpen(false);
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
