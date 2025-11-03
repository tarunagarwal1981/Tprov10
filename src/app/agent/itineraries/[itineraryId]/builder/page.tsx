'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSearch, FiPackage, FiPlus, FiCalendar } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/hooks/useToast';
import { createClient } from '@/lib/supabase/client';
import { PackageSearchPanel } from '@/components/itinerary/PackageSearchPanel';
import { ItineraryBuilderPanel } from '@/components/itinerary/ItineraryBuilderPanel';
import { ItinerarySummaryPanel } from '@/components/itinerary/ItinerarySummaryPanel';

interface Itinerary {
  id: string;
  lead_id: string;
  name: string;
  status?: string;
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

interface ItineraryDay {
  id: string;
  day_number: number;
  date: string | null;
  city_name: string | null;
  notes: string | null;
}

interface ItineraryItem {
  id: string;
  itinerary_id?: string;
  day_id: string | null;
  package_type: 'activity' | 'transfer' | 'multi_city' | 'multi_city_hotel' | 'fixed_departure';
  package_id: string;
  operator_id: string;
  package_title: string;
  package_image_url: string | null;
  configuration: any;
  unit_price: number;
  quantity: number;
  total_price: number;
  display_order: number;
  notes?: string | null;
}

export default function ItineraryBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const supabase = createClient();

  const itineraryId = params.itineraryId as string;

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');

  // Fetch itinerary data
  useEffect(() => {
    const fetchItinerary = async () => {
      if (!itineraryId || !user?.id) return;

      try {
        // Fetch itinerary
        const { data: itineraryData, error: itineraryError } = await supabase
          .from('itineraries' as any)
          .select('*')
          .eq('id', itineraryId)
          .eq('agent_id', user.id)
          .single();

        if (itineraryError) throw itineraryError;

        if (itineraryData) {
          setItinerary(itineraryData as unknown as Itinerary);

          // Fetch lead destination
          const { data: leadData } = await supabase
            .from('leads' as any)
            .select('destination')
            .eq('id', (itineraryData as unknown as Itinerary).lead_id)
            .single();

          const lead = leadData as unknown as { destination?: string };
          if (lead?.destination) {
            setSelectedDestination(lead.destination);
          }

          // Fetch days
          const { data: daysData, error: daysError } = await supabase
            .from('itinerary_days' as any)
            .select('*')
            .eq('itinerary_id', itineraryId)
            .order('day_number', { ascending: true });

          if (daysError) throw daysError;
          setDays((daysData || []) as unknown as ItineraryDay[]);

          // Fetch items
          const { data: itemsData, error: itemsError } = await supabase
            .from('itinerary_items' as any)
            .select('*')
            .eq('itinerary_id', itineraryId)
            .order('display_order', { ascending: true });

          if (itemsError) throw itemsError;
          setItems((itemsData || []) as unknown as ItineraryItem[]);
        }
      } catch (err) {
        console.error('Error fetching itinerary:', err);
        toast.error('Failed to load itinerary');
        router.push('/agent/leads');
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [itineraryId, user?.id, router, toast, supabase]);

  const handleAddDay = async () => {
    if (!itinerary) return;

    const newDayNumber = days.length > 0 ? Math.max(...days.map(d => d.day_number)) + 1 : 1;

    try {
      const { data, error } = await supabase
        .from('itinerary_days' as any)
        .insert({
          itinerary_id: itinerary.id,
          day_number: newDayNumber,
          display_order: newDayNumber,
        })
        .select()
        .single();

      if (error) throw error;

      setDays(prev => [...prev, data as unknown as ItineraryDay]);
      toast.success('Day added successfully');
    } catch (err) {
      console.error('Error adding day:', err);
      toast.error('Failed to add day');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading itinerary...</p>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Itinerary not found</p>
          <Button onClick={() => router.push('/agent/leads')}>
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-[75vh] flex flex-col overflow-hidden px-4 lg:px-6">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/agent/leads')}
              >
                <FiArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{itinerary.name}</h1>
                <p className="text-sm text-gray-600">
                  {itinerary.adults_count} Adults, {itinerary.children_count} Children, {itinerary.infants_count} Infants
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={itinerary.status === 'draft' ? 'secondary' : 'default'}>
                {itinerary.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content - Responsive 3-Column Layout */}
        <div className="flex-1 flex overflow-hidden gap-4 lg:gap-6">
          {/* Desktop: 3 columns */}
          <div className="hidden xl:flex flex-1 divide-x divide-gray-200 rounded-lg">
            {/* Package Search Panel (30%) */}
            <div className="w-[30%] flex flex-col overflow-hidden bg-gray-50 border border-gray-200 rounded-lg">
              <PackageSearchPanel
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedDestination={selectedDestination}
                onDestinationChange={setSelectedDestination}
                itineraryId={itinerary.id}
                onPackageAdded={(item) => {
                  setItems(prev => [...prev, item]);
                  toast.success('Package added to itinerary');
                }}
              />
            </div>

            {/* Itinerary Builder Panel (50%) */}
            <div className="w-[50%] flex flex-col overflow-hidden bg-white border border-gray-200 rounded-lg">
              <ItineraryBuilderPanel
                itinerary={itinerary}
                days={days}
                items={items}
                onDaysChange={setDays}
                onItemsChange={setItems}
                onAddDay={handleAddDay}
              />
            </div>

            {/* Summary Panel (20%) */}
            <div className="w-[20%] flex flex-col overflow-hidden bg-gray-50 border border-gray-200 rounded-lg">
              <ItinerarySummaryPanel
                itinerary={itinerary}
                items={items}
                onSave={async () => {
                  // Save itinerary status
                  try {
                    const { error } = await supabase
                      .from('itineraries' as any)
                      .update({ status: 'completed', updated_at: new Date().toISOString() })
                      .eq('id', itinerary.id);

                    if (error) throw error;

                    setItinerary(prev => prev ? { ...prev, status: 'completed' } : null);
                    toast.success('Itinerary saved successfully');
                  } catch (err) {
                    console.error('Error saving itinerary:', err);
                    toast.error('Failed to save itinerary');
                  }
                }}
              />
            </div>
          </div>

          {/* Tablet: 2 columns with bottom bar */}
          <div className="hidden lg:flex xl:hidden flex-1 flex-col gap-4">
            <div className="flex-1 flex divide-x divide-gray-200 overflow-hidden">
              {/* Package Search Panel (40%) */}
              <div className="w-[40%] flex flex-col overflow-hidden bg-gray-50 border border-gray-200 rounded-lg">
                <PackageSearchPanel
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedDestination={selectedDestination}
                  onDestinationChange={setSelectedDestination}
                  itineraryId={itinerary.id}
                  onPackageAdded={(item) => {
                    setItems(prev => [...prev, item]);
                    toast.success('Package added to itinerary');
                  }}
                />
              </div>

              {/* Itinerary Builder Panel (60%) */}
              <div className="w-[60%] flex flex-col overflow-hidden bg-white border border-gray-200 rounded-lg">
                <ItineraryBuilderPanel
                  itinerary={itinerary}
                  days={days}
                  items={items}
                  onDaysChange={setDays}
                  onItemsChange={setItems}
                  onAddDay={handleAddDay}
                />
              </div>
            </div>

            {/* Summary Bar */}
            <div className="flex-shrink-0 bg-white border border-gray-200 rounded-lg p-4">
              <ItinerarySummaryPanel
                itinerary={itinerary}
                items={items}
                compact
                onSave={async () => {
                  try {
                    const { error } = await supabase
                      .from('itineraries' as any)
                      .update({ status: 'completed', updated_at: new Date().toISOString() })
                      .eq('id', itinerary.id);

                    if (error) throw error;

                    setItinerary(prev => prev ? { ...prev, status: 'completed' } : null);
                    toast.success('Itinerary saved successfully');
                  } catch (err) {
                    console.error('Error saving itinerary:', err);
                    toast.error('Failed to save itinerary');
                  }
                }}
              />
            </div>
          </div>

          {/* Mobile: Stacked with tabs */}
          <div className="flex lg:hidden flex-1 flex-col overflow-hidden gap-3">
            <div className="flex-shrink-0 border-b border-gray-200">
              <div className="flex">
                <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border-b-2 border-blue-500">
                  Itinerary
                </button>
                <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-500">
                  Packages
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ItineraryBuilderPanel
                itinerary={itinerary}
                days={days}
                items={items}
                onDaysChange={setDays}
                onItemsChange={setItems}
                onAddDay={handleAddDay}
              />
            </div>
          </div>
        </div>
      </div>
  );
}

