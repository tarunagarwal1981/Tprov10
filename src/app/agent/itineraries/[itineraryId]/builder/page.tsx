'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSearch, FiPackage, FiPlus, FiCalendar } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
import { createClient } from '@/lib/supabase/client';
import { PackageSearchPanel } from '@/components/itinerary/PackageSearchPanel';
import { ItineraryBuilderPanel } from '@/components/itinerary/ItineraryBuilderPanel';
import { EnhancedItineraryBuilder } from '@/components/itinerary/EnhancedItineraryBuilder';
import { ItinerarySummaryPanel } from '@/components/itinerary/ItinerarySummaryPanel';
import { PackageConfigModal } from '@/components/itinerary/PackageConfigModal';

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
  arrival_flight_id?: string | null;
  arrival_time?: string | null;
  departure_flight_id?: string | null;
  departure_time?: string | null;
  hotel_id?: string | null;
  hotel_name?: string | null;
  hotel_star_rating?: number | null;
  room_type?: string | null;
  meal_plan?: string | null;
  time_slots?: {
    morning: { time: string; activities: string[]; transfers: string[] };
    afternoon: { time: string; activities: string[]; transfers: string[] };
    evening: { time: string; activities: string[]; transfers: string[] };
  };
  lunch_included?: boolean;
  lunch_details?: string | null;
  dinner_included?: boolean;
  dinner_details?: string | null;
  arrival_description?: string | null;
  notes?: string | null;
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
  const searchParams = useSearchParams();
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
  const [selectedPackage, setSelectedPackage] = useState<{
    id: string;
    title: string;
    destination_country: string;
    destination_city: string;
    package_type: 'activity' | 'transfer' | 'multi_city' | 'multi_city_hotel' | 'fixed_departure';
    operator_id: string;
    operator_name?: string;
    featured_image_url?: string;
    base_price?: number;
    currency?: string;
  } | null>(null);

  // Fetch itinerary data
  useEffect(() => {
    let isMounted = true;
    
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

        if (itineraryData && isMounted) {
          setItinerary(itineraryData as unknown as Itinerary);

          // Fetch lead destination
          const { data: leadData } = await supabase
            .from('leads' as any)
            .select('destination')
            .eq('id', (itineraryData as unknown as Itinerary).lead_id)
            .single();

          if (isMounted) {
            const lead = leadData as unknown as { destination?: string };
            if (lead?.destination) {
              setSelectedDestination((prev) => prev || lead.destination || '');
            }
          }

          // Fetch days with all new fields
          const { data: daysData, error: daysError } = await supabase
            .from('itinerary_days' as any)
            .select('*')
            .eq('itinerary_id', itineraryId)
            .order('day_number', { ascending: true });

          if (daysError) throw daysError;
          if (isMounted) {
            // Ensure time_slots exists for each day
            const daysWithTimeSlots = (daysData || []).map((day: any) => ({
              ...day,
              time_slots: day.time_slots || {
                morning: { time: '', activities: [], transfers: [] },
                afternoon: { time: '', activities: [], transfers: [] },
                evening: { time: '', activities: [], transfers: [] },
              },
            }));
            setDays(daysWithTimeSlots as unknown as ItineraryDay[]);
          }

          // Fetch items
          const { data: itemsData, error: itemsError } = await supabase
            .from('itinerary_items' as any)
            .select('*')
            .eq('itinerary_id', itineraryId)
            .order('display_order', { ascending: true });

          if (itemsError) throw itemsError;
          if (isMounted) {
            setItems((itemsData || []) as unknown as ItineraryItem[]);
            
            // Check if any multi-city packages need configuration
            const multiCityItems = (itemsData || []).filter(
              (item: any) => 
                (item.package_type === 'multi_city' || item.package_type === 'multi_city_hotel') &&
                (!item.configuration?.selectedHotels && !item.configuration?.activities && !item.configuration?.transfers)
            );
            
            // If there are unconfigured multi-city packages, show a notification
            if (multiCityItems.length > 0) {
              toast.info(`${multiCityItems.length} package(s) need configuration. Click to configure.`);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching itinerary:', err);
        if (isMounted) {
          toast.error('Failed to load itinerary');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchItinerary();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryId, user?.id]);

  // Handle package selection from URL params (when coming from insert page)
  useEffect(() => {
    const packageId = searchParams.get('packageId');
    const packageType = searchParams.get('packageType') as 'multi_city' | 'multi_city_hotel' | null;

    if (packageId && packageType && !selectedPackage) {
      const fetchPackageForModal = async () => {
        try {
          let query: any;
          
          if (packageType === 'multi_city') {
            query = supabase
              .from('multi_city_packages' as any)
              .select('id, title, destination_region, operator_id, base_price, currency')
              .eq('id', packageId)
              .single();
          } else if (packageType === 'multi_city_hotel') {
            query = supabase
              .from('multi_city_hotel_packages' as any)
              .select('id, title, destination_region, operator_id, base_price, currency')
              .eq('id', packageId)
              .single();
          } else {
            return;
          }

          const { data, error } = await query;
          
          if (error) throw error;
          
          if (data) {
            // Fetch operator name
            const { data: operatorData } = await supabase
              .from('users' as any)
              .select('name')
              .eq('id', data.operator_id)
              .single();

            // Fetch cover image
            const imageTable = packageType === 'multi_city' 
              ? 'multi_city_package_images' 
              : 'multi_city_hotel_package_images';
            const { data: imageData } = await supabase
              .from(imageTable as any)
              .select('public_url')
              .eq('package_id', packageId)
              .eq('is_cover', true)
              .limit(1)
              .maybeSingle();

            const operatorTyped = operatorData as unknown as { name?: string } | null;
            const imageTyped = imageData as unknown as { public_url?: string } | null;

            setSelectedPackage({
              id: data.id,
              title: data.title,
              destination_country: data.destination_region || '',
              destination_city: '',
              package_type: packageType,
              operator_id: data.operator_id,
              operator_name: operatorTyped?.name || 'Unknown Operator',
              featured_image_url: imageTyped?.public_url || undefined,
              base_price: data.base_price || undefined,
              currency: data.currency || 'USD',
            });

            // Clear URL params
            router.replace(`/agent/itineraries/${itineraryId}/builder`, { scroll: false });
          }
        } catch (err) {
          console.error('Error fetching package for modal:', err);
          toast.error('Failed to load package details');
          // Clear URL params even on error
          router.replace(`/agent/itineraries/${itineraryId}/builder`, { scroll: false });
        }
      };

      fetchPackageForModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, itineraryId]);

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

        {/* Summary Bar (compact) */}
        <div className="flex-shrink-0 mb-4">
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

        {/* Main Content - Responsive 2-Column Layout */}
        <div className="flex-1 flex overflow-hidden gap-4 lg:gap-6">
          {/* Desktop: 2 columns */}
          <div className="hidden xl:flex flex-1 gap-4 rounded-lg">
            {/* Package Search Panel (35%) */}
            <div className="w-[35%] flex flex-col overflow-hidden bg-gray-50 border border-gray-200 rounded-lg">
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

            {/* Enhanced Itinerary Builder (65%) */}
            <div className="w-[65%] flex flex-col overflow-hidden bg-white border border-gray-200 rounded-lg p-6 overflow-y-auto">
              <EnhancedItineraryBuilder
                itineraryId={itinerary.id}
                days={days}
                items={items}
                onDaysChange={setDays}
                onItemsChange={(items) => setItems(items)}
                onEditPackage={(itemId) => {
                  router.push(`/agent/itineraries/${itinerary.id}/configure/${itemId}`);
                }}
              />
            </div>

            {/* No right summary on desktop; compact bar used above */}
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

              {/* Enhanced Itinerary Builder (60%) */}
              <div className="w-[60%] flex flex-col overflow-hidden bg-white border border-gray-200 rounded-lg p-6 overflow-y-auto">
                <EnhancedItineraryBuilder
                  itineraryId={itinerary.id}
                  days={days}
                  items={items}
                  onDaysChange={setDays}
                  onItemsChange={(items) => setItems(items)}
                  onEditPackage={(itemId) => {
                    router.push(`/agent/itineraries/${itinerary.id}/configure/${itemId}`);
                  }}
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
            <div className="flex-1 overflow-y-auto p-4">
              <EnhancedItineraryBuilder
                itineraryId={itinerary.id}
                days={days}
                items={items}
                onDaysChange={setDays}
                onItemsChange={(items) => setItems(items)}
                onEditPackage={(itemId) => {
                  router.push(`/agent/itineraries/${itinerary.id}/configure/${itemId}`);
                }}
              />
            </div>
          </div>
        </div>

        {/* Package Configuration Modal (for packages selected from insert page) */}
        {selectedPackage && itinerary && (
          <PackageConfigModal
            package={selectedPackage}
            itineraryId={itinerary.id}
            onClose={() => {
              setSelectedPackage(null);
              // If it's a multi-city package, we'll navigate away, so don't clear
            }}
            onPackageAdded={(item) => {
              setItems(prev => [...prev, item]);
              // Don't clear selectedPackage here for multi-city - navigation will happen
              if (selectedPackage.package_type !== 'multi_city' && selectedPackage.package_type !== 'multi_city_hotel') {
                setSelectedPackage(null);
                toast.success('Package added to itinerary');
              }
            }}
            onNavigateToConfigure={(itemId) => {
              // Navigate immediately to configure page
              router.push(`/agent/itineraries/${itinerary.id}/configure/${itemId}`);
            }}
          />
        )}
      </div>
  );
}

