'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiUsers, FiDollarSign, FiCalendar, FiMapPin, FiPlus } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/useToast';

interface Package {
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
}

interface PackageConfigModalProps {
  package: Package;
  itineraryId: string;
  onClose: () => void;
  onPackageAdded: (item: any) => void;
  onNavigateToConfigure?: (itemId: string) => void;
}

export function PackageConfigModal({
  package: pkg,
  itineraryId,
  onClose,
  onPackageAdded,
  onNavigateToConfigure,
}: PackageConfigModalProps) {
  const supabase = createClient();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [packageData, setPackageData] = useState<any>(null);
  const [config, setConfig] = useState<any>({});
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [itineraryInfo, setItineraryInfo] = useState<any>(null);
  const [showDayAssignment, setShowDayAssignment] = useState(false);
  const [addedItem, setAddedItem] = useState<any>(null);
  const [days, setDays] = useState<any[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  // Fetch itinerary info (adults, children, infants)
  useEffect(() => {
    let isMounted = true;
    
    const fetchItinerary = async () => {
      const { data } = await supabase
        .from('itineraries' as any)
        .select('adults_count, children_count, infants_count, currency')
        .eq('id', itineraryId)
        .single();

      if (data && isMounted) {
        setItineraryInfo(data);
      }
    };

    fetchItinerary();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryId]);

  // Fetch days when showing day assignment
  useEffect(() => {
    if (showDayAssignment) {
      const fetchDays = async () => {
        const { data, error } = await supabase
          .from('itinerary_days' as any)
          .select('*')
          .eq('itinerary_id', itineraryId)
          .order('day_number', { ascending: true });

        if (error) {
          console.error('Error fetching days:', error);
        } else if (data) {
          setDays(data || []);
        }
      };

      fetchDays();
    }
  }, [showDayAssignment, itineraryId]);

  // Fetch package details
  useEffect(() => {
    let isMounted = true;
    
    const fetchPackage = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      try {
        let query: any;
        
        if (pkg.package_type === 'activity') {
          // Fetch activity package and its pricing packages
          const { data: packageData, error: packageError } = await supabase
            .from('activity_packages')
            .select('*')
            .eq('id', pkg.id)
            .single();

          if (packageError) throw packageError;

          // Fetch pricing packages
          const pricingTable = 'activity_pricing_packages' as any;
          const { data: pricingData, error: pricingError } = await supabase
            .from(pricingTable)
            .select('*')
            .eq('package_id', pkg.id)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

          if (pricingError && pricingError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.warn('Error fetching pricing packages:', pricingError);
          }

          setPackageData({
            ...packageData,
            pricing_packages: (pricingData || []) as any[],
          });

          // Initialize default config
          const pricingArray = (pricingData || []) as any[];
          setConfig({
            packageType: 'TICKET_ONLY',
            selectedPricingPackageId: pricingArray[0]?.id || null,
            selectedVehicle: null,
            quantity: 1,
          });
          if (isMounted) {
            setLoading(false);
          }
          return;
        } else if (pkg.package_type === 'transfer') {
          query = supabase.from('transfer_packages').select('*').eq('id', pkg.id).single();
        } else if (pkg.package_type === 'multi_city') {
          const { data: packageData, error: packageError } = await supabase
            .from('multi_city_packages')
            .select('id, title, destination_region, operator_id, base_price, currency, total_nights, total_days, total_cities')
            .eq('id', pkg.id)
            .single();

          if (packageError) throw packageError;

          // Fetch pricing packages
          const { data: pricingPackages, error: pricingError } = await supabase
            .from('multi_city_pricing_packages' as any)
            .select('*')
            .eq('package_id', pkg.id)
            .order('created_at', { ascending: true });

          if (pricingError && pricingError.code !== 'PGRST116') {
            console.warn('Error fetching pricing packages:', pricingError);
          }

          const pricingPkg = (pricingPackages?.[0] as any) || null;
          let sicRows: any[] = [];
          let privateRows: any[] = [];

          if (pricingPkg) {
            if (pricingPkg.pricing_type === 'SIC') {
              // Fetch SIC pricing rows
              const { data: rows } = await supabase
                .from('multi_city_pricing_rows' as any)
                .select('*')
                .eq('pricing_package_id', pricingPkg.id)
                .order('display_order', { ascending: true });
              sicRows = (rows as any[]) || [];
            } else if (pricingPkg.pricing_type === 'PRIVATE_PACKAGE') {
              // Fetch PRIVATE_PACKAGE pricing rows
              const { data: rows } = await supabase
                .from('multi_city_private_package_rows' as any)
                .select('*')
                .eq('pricing_package_id', pricingPkg.id)
                .order('display_order', { ascending: true });
              privateRows = (rows as any[]) || [];
            }
          }

          setPackageData({
            ...(packageData as any),
            pricing_package: pricingPkg,
            sic_pricing_rows: sicRows,
            private_package_rows: privateRows,
          });

          // Initialize default config
          setConfig({
            pricingType: (pricingPkg?.pricing_type as 'SIC' | 'PRIVATE_PACKAGE') || 'SIC',
            selectedPricingRowId: sicRows[0]?.id || privateRows[0]?.id || null,
            selectedVehicle: null,
            selectedHotels: [],
            quantity: 1,
          });

          if (isMounted) {
            setLoading(false);
          }
          return;
        } else if (pkg.package_type === 'multi_city_hotel') {
          const { data: packageData, error: packageError } = await supabase
            .from('multi_city_hotel_packages' as any)
            .select('id, title, destination_region, operator_id, base_price, currency, total_nights, total_cities')
            .eq('id', pkg.id)
            .single();

          if (packageError) throw packageError;

          // Fetch pricing packages
          const { data: pricingPackages, error: pricingError } = await supabase
            .from('multi_city_hotel_pricing_packages' as any)
            .select('*')
            .eq('package_id', pkg.id)
            .order('created_at', { ascending: true });

          if (pricingError && pricingError.code !== 'PGRST116') {
            console.warn('Error fetching pricing packages:', pricingError);
          }

          const pricingPkg = (pricingPackages?.[0] as any) || null;
          let sicRows: any[] = [];
          let privateRows: any[] = [];

          if (pricingPkg) {
            if (pricingPkg.pricing_type === 'SIC') {
              const { data: rows } = await supabase
                .from('multi_city_hotel_pricing_rows' as any)
                .select('*')
                .eq('pricing_package_id', pricingPkg.id)
                .order('display_order', { ascending: true });
              sicRows = (rows as any[]) || [];
            } else if (pricingPkg.pricing_type === 'PRIVATE_PACKAGE') {
              const { data: rows } = await supabase
                .from('multi_city_hotel_private_package_rows' as any)
                .select('*')
                .eq('pricing_package_id', pricingPkg.id)
                .order('display_order', { ascending: true });
              privateRows = (rows as any[]) || [];
            }
          }

          // Fetch cities and hotels
          const { data: cities } = await supabase
            .from('multi_city_hotel_package_cities' as any)
            .select('id, name, nights, city_order')
            .eq('package_id', pkg.id)
            .order('city_order', { ascending: true });

          const cityIds = (cities as any[])?.map((c: any) => c.id) || [];
          let hotelsByCity: Record<string, any[]> = {};

          if (cityIds.length > 0) {
            const { data: hotels } = await supabase
              .from('multi_city_hotel_package_city_hotels' as any)
              .select('*')
              .in('city_id', cityIds)
              .order('display_order', { ascending: true });

            // Group hotels by city
            if (hotels && Array.isArray(hotels)) {
              (hotels as any[]).forEach((hotel: any) => {
                if (hotel.city_id) {
                  if (!hotelsByCity[hotel.city_id]) {
                    hotelsByCity[hotel.city_id] = [];
                  }
                  hotelsByCity[hotel.city_id]!.push(hotel);
                }
              });
            }
          }

          setPackageData({
            ...(packageData as any),
            pricing_package: pricingPkg,
            sic_pricing_rows: sicRows,
            private_package_rows: privateRows,
            cities: (cities as any[]) || [],
            hotels_by_city: hotelsByCity,
          });

          // Initialize default config with hotel selections
          const defaultHotels = ((cities as any[]) || []).map((city: any) => ({
            city_id: city.id,
            city_name: city.name,
            hotel_id: hotelsByCity[city.id]?.[0]?.id || null,
            nights: city.nights || 1,
          }));

          setConfig({
            pricingType: (pricingPkg?.pricing_type as 'SIC' | 'PRIVATE_PACKAGE') || 'SIC',
            selectedPricingRowId: sicRows[0]?.id || privateRows[0]?.id || null,
            selectedVehicle: null,
            selectedHotels: defaultHotels,
            quantity: 1,
          });

          if (isMounted) {
            setLoading(false);
          }
          return;
        } else if (pkg.package_type === 'fixed_departure') {
          const { data: fixedData, error: fixedError } = await supabase
            .from('fixed_departure_flight_packages' as any)
            .select('*')
            .eq('id', pkg.id)
            .single();

          if (fixedError) throw fixedError;
          if (fixedData && isMounted) {
            setPackageData(fixedData);
            setConfig({
              pricingType: 'SIC',
              selectedVehicle: null,
              selectedHotels: [],
              quantity: 1,
            });
          }
          if (isMounted) {
            setLoading(false);
          }
          return;
        } else if (pkg.package_type === 'transfer') {
          const { data: transferData, error: transferError } = await supabase
            .from('transfer_packages')
            .select('*')
            .eq('id', pkg.id)
            .single();

          if (transferError) throw transferError;
          if (transferData && isMounted) {
            setPackageData(transferData);
            setConfig({
              pricingType: 'point-to-point',
              selectedOption: null,
              hours: 1,
              quantity: 1,
            });
          }
          if (isMounted) {
            setLoading(false);
          }
          return;
        } else {
          throw new Error('Unknown package type');
        }
      } catch (err) {
        console.error('Error fetching package:', err);
        if (isMounted) {
          toast.error('Failed to load package details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPackage();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkg.id, pkg.package_type]);

  // Calculate price in real-time
  useEffect(() => {
    if (!packageData || !itineraryInfo) return;

    let price = 0;

    if (pkg.package_type === 'activity') {
      // Use pricing from activity_pricing_packages table
      const pricingPackages = packageData.pricing_packages || [];
      const selectedPricingPackage = pricingPackages.find((p: any) => p.id === config.selectedPricingPackageId);
      
      if (selectedPricingPackage) {
        const adultsPrice = (selectedPricingPackage.adult_price || 0) * (itineraryInfo.adults_count || 0);
        const childrenPrice = (selectedPricingPackage.child_price || 0) * (itineraryInfo.children_count || 0);
        const infantsPrice = (selectedPricingPackage.infant_price || 0) * (itineraryInfo.infants_count || 0);
        price = adultsPrice + childrenPrice + infantsPrice;
        
        // Add transfer price if included
        if (selectedPricingPackage.transfer_included) {
          const transferAdultPrice = (selectedPricingPackage.transfer_price_adult || 0) * (itineraryInfo.adults_count || 0);
          const transferChildPrice = (selectedPricingPackage.transfer_price_child || 0) * (itineraryInfo.children_count || 0);
          const transferInfantPrice = (selectedPricingPackage.transfer_price_infant || 0) * (itineraryInfo.infants_count || 0);
          price += transferAdultPrice + transferChildPrice + transferInfantPrice;
        }
      } else if (packageData.base_price) {
        // Fallback to base_price if no pricing packages
        price = (packageData.base_price || 0) * ((itineraryInfo.adults_count || 0) + (itineraryInfo.children_count || 0));
      }
    } else if (pkg.package_type === 'transfer') {
      // Transfer packages use base_price directly
      if (packageData.base_price) {
        price = (packageData.base_price || 0) * (config.quantity || 1);
      }
    } else if (pkg.package_type === 'multi_city' || pkg.package_type === 'multi_city_hotel') {
      // Multi-city packages use pricing rows based on travelers
      const adults = itineraryInfo.adults_count || 0;
      const children = itineraryInfo.children_count || 0;
      const pkgData = packageData as any;
      const pricingType = config.pricingType || pkgData.pricing_package?.pricing_type || 'SIC';
      
      if (pricingType === 'SIC') {
        // Use selected pricing row, or find matching one
        const sicRows = pkgData.sic_pricing_rows || [];
        let selectedRow = null;
        
        if (config.selectedPricingRowId) {
          selectedRow = sicRows.find((row: any) => row.id === config.selectedPricingRowId);
        }
        
        // If no selected row or selected row doesn't match, find best match
        if (!selectedRow) {
          selectedRow = sicRows.find((row: any) => 
            row.number_of_adults === adults && row.number_of_children === children
          ) || sicRows.find((row: any) => 
            row.number_of_adults >= adults && row.number_of_children >= children
          ) || sicRows[sicRows.length - 1]; // Fallback to last row
        }
        
        if (selectedRow) {
          price = selectedRow.total_price || 0;
        }
      } else if (pricingType === 'PRIVATE_PACKAGE') {
        // Use selected pricing row, or find matching one
        const privateRows = pkgData.private_package_rows || [];
        let selectedRow = null;
        
        if (config.selectedPricingRowId) {
          selectedRow = privateRows.find((row: any) => row.id === config.selectedPricingRowId);
        }
        
        // If no selected row or selected row doesn't match, find best match
        if (!selectedRow) {
          selectedRow = privateRows.find((row: any) => 
            row.number_of_adults === adults && row.number_of_children === children
          ) || privateRows.find((row: any) => 
            row.number_of_adults >= adults && row.number_of_children >= children
          ) || privateRows[privateRows.length - 1]; // Fallback to last row
        }
        
        if (selectedRow) {
          price = selectedRow.total_price || 0;
        }
      }

      // Add hotel prices for multi-city-hotel packages
      if (pkg.package_type === 'multi_city_hotel' && config.selectedHotels && Array.isArray(config.selectedHotels)) {
        const hotelsByCity = pkgData.hotels_by_city || {};
        let hotelPrice = 0;
        
        config.selectedHotels.forEach((hotelSelection: any) => {
          if (hotelSelection.hotel_id && hotelsByCity[hotelSelection.city_id]) {
            const hotel = hotelsByCity[hotelSelection.city_id].find((h: any) => h.id === hotelSelection.hotel_id);
            if (hotel) {
              const nights = hotelSelection.nights || 1;
              const adultPrice = (hotel.adult_price || 0) * adults * nights;
              const childPrice = (hotel.child_price || 0) * children * nights;
              hotelPrice += adultPrice + childPrice;
            }
          }
        });
        
        price += hotelPrice;
      }
    } else if (pkg.package_type === 'fixed_departure') {
      // Fixed departure uses base_price for now (can be enhanced later)
      price = (packageData as any).base_price || 0;
    }

    setCalculatedPrice(price * (config.quantity || 1));
  }, [config, packageData, itineraryInfo, pkg.package_type]);

  const handleAddToItinerary = async () => {
    if (!packageData) return;

    setLoading(true);
    try {
      // Create itinerary item
      const { data: item, error } = await supabase
        .from('itinerary_items' as any)
        .insert({
          itinerary_id: itineraryId,
          day_id: null, // Unassigned initially
          package_type: pkg.package_type,
          package_id: pkg.id,
          operator_id: pkg.operator_id,
          package_title: pkg.title,
          package_image_url: pkg.featured_image_url,
          configuration: config,
          unit_price: calculatedPrice / (config.quantity || 1),
          quantity: config.quantity || 1,
          total_price: calculatedPrice,
          display_order: 0,
        })
        .select()
        .single();

      if (error) throw error;
      if (!item) throw new Error('Failed to create itinerary item');

      const itemTyped = item as unknown as { id: string };

      // For multi-city and multi-city hotel packages, navigate directly to configuration page
      if (pkg.package_type === 'multi_city' || pkg.package_type === 'multi_city_hotel') {
        onPackageAdded(itemTyped);
        onClose();
        
        // Navigate immediately to configuration page (don't show builder page)
        if (onNavigateToConfigure) {
          // Use setTimeout to ensure modal closes first, then navigate
          setTimeout(() => {
            onNavigateToConfigure(itemTyped.id);
          }, 100);
        } else {
          // Fallback: use window.location for immediate navigation
          setTimeout(() => {
            window.location.href = `/agent/itineraries/${itineraryId}/configure/${itemTyped.id}`;
          }, 100);
        }
      } else {
        // For other package types, show day assignment
        setAddedItem(item);
        setShowDayAssignment(true);
        toast.success('Package added! Now assign it to a day');
      }
    } catch (err) {
      console.error('Error adding package:', err);
      toast.error('Failed to add package to itinerary');
      setLoading(false);
    }
  };

  const handleAssignToDay = async () => {
    if (!addedItem || !selectedDayId) return;

    setLoading(true);
    try {
      // Update item with selected day
      const { error } = await supabase
        .from('itinerary_items' as any)
        .update({ day_id: selectedDayId })
        .eq('id', addedItem.id);

      if (error) throw error;

      onPackageAdded({ ...addedItem, day_id: selectedDayId });
      toast.success('Package assigned to day successfully');
      onClose();
    } catch (err) {
      console.error('Error assigning to day:', err);
      toast.error('Failed to assign package to day');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipDayAssignment = () => {
    onPackageAdded(addedItem);
    toast.success('Package added to itinerary (unassigned)');
    onClose();
  };

  const handleCreateDay = async () => {
    setLoading(true);
    try {
      const newDayNumber = days.length > 0 ? Math.max(...days.map(d => d.day_number)) + 1 : 1;
      
      const { data: newDay, error } = await supabase
        .from('itinerary_days' as any)
        .insert({
          itinerary_id: itineraryId,
          day_number: newDayNumber,
          display_order: newDayNumber,
          time_slots: {
            morning: { time: '', activities: [], transfers: [] },
            afternoon: { time: '', activities: [], transfers: [] },
            evening: { time: '', activities: [], transfers: [] },
          },
        })
        .select()
        .single();

      if (error) throw error;
      if (!newDay) throw new Error('Failed to create day');

      const newDayTyped = newDay as unknown as { id: string; day_number: number; date: string | null; city_name: string | null };
      setDays([...days, newDayTyped]);
      setSelectedDayId(newDayTyped.id);
      toast.success('Day created successfully');
    } catch (err) {
      console.error('Error creating day:', err);
      toast.error('Failed to create day');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading && !packageData) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading package details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {showDayAssignment ? 'Assign Package to Day' : pkg.title}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            {showDayAssignment ? (
              `Select which day to assign "${pkg.title}"`
            ) : (
              <>
                {pkg.destination_city && `${pkg.destination_city}, `}
                {pkg.destination_country} • {pkg.operator_name}
              </>
            )}
          </p>
        </DialogHeader>

        {showDayAssignment ? (
          <div className="space-y-6 mt-4">
            {/* Day Assignment UI */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Select Day</Label>
              
              {days.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-300 p-8 text-center">
                  <FiCalendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No days created yet</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create your first day to assign this package
                  </p>
                  <Button onClick={handleCreateDay} disabled={loading}>
                    <FiPlus className="w-4 h-4 mr-2" />
                    Create First Day
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {days.map((day) => (
                    <div
                      key={day.id}
                      onClick={() => setSelectedDayId(day.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedDayId === day.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            selectedDayId === day.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {day.day_number}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Day {day.day_number}: {formatDate(day.date)}
                            </h3>
                            {day.city_name && (
                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <FiMapPin className="w-4 h-4" />
                                {day.city_name}
                              </p>
                            )}
                          </div>
                        </div>
                        {selectedDayId === day.id && (
                          <FiCheck className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={handleCreateDay}
                    disabled={loading}
                    className="w-full mt-2"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Create New Day
                  </Button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleSkipDayAssignment}
                className="flex-1"
              >
                Skip (Assign Later)
              </Button>
              <Button
                onClick={handleAssignToDay}
                disabled={loading || !selectedDayId}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                {loading ? 'Assigning...' : 'Assign to Day'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
          {/* Activity Package Configuration */}
          {pkg.package_type === 'activity' && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">Select Package Option</Label>
                {(() => {
                  // Use pricing packages from activity_pricing_packages table
                  const pricingPackages = packageData?.pricing_packages || [];
                  
                  // Fallback: create a default option from base_price if no pricing packages
                  if (pricingPackages.length === 0 && packageData?.base_price) {
                    const defaultOption = {
                      id: 'default',
                      package_name: pkg.title,
                      adult_price: packageData.base_price,
                      child_price: packageData.base_price * 0.7, // Estimate
                      child_min_age: 3,
                      child_max_age: 12,
                      transfer_included: false,
                    };
                    pricingPackages.push(defaultOption);
                  }

                  if (pricingPackages.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No pricing options available for this package</p>
                        <p className="text-xs text-gray-400 mt-2">Using base price: ${packageData?.base_price?.toFixed(2) || '0.00'}</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <RadioGroup
                        value={config.selectedPricingPackageId || pricingPackages[0]?.id || ''}
                        onValueChange={(value) => {
                          const selectedPkg = pricingPackages.find((p: any) => p.id === value);
                          setConfig({
                            ...config,
                            selectedPricingPackageId: value,
                            packageType: selectedPkg?.transfer_included ? 'PRIVATE_TRANSFER' : 'TICKET_ONLY',
                            selectedVehicle: null,
                          });
                        }}
                      >
                        {pricingPackages.map((pkgOption: any) => (
                          <div key={pkgOption.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                            <RadioGroupItem value={pkgOption.id} id={pkgOption.id} className="mt-1" />
                            <Label htmlFor={pkgOption.id} className="flex-1 cursor-pointer">
                              <div className="font-medium">{pkgOption.package_name || 'Option'}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {pkgOption.transfer_included ? (pkgOption.transfer_type === 'SHARED' ? 'Shared Transfer' : 'Private Transfer') : 'Ticket Only'}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="text-gray-600">
                                  Adult: ${(pkgOption.adult_price || 0).toFixed(2)}
                                </span>
                                <span className="text-gray-600">
                                  Child: ${(pkgOption.child_price || 0).toFixed(2)}
                                </span>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>

                      {/* Vehicle Selection for Private Transfer */}
                      {(() => {
                        const selectedPkg = pricingPackages.find((p: any) => p.id === config.selectedPricingPackageId);
                        if (config.packageType === 'PRIVATE_TRANSFER' && selectedPkg?.transfer_included && selectedPkg?.transfer_type === 'PRIVATE') {
                          // Note: Vehicles for private transfers need to be fetched from a separate table
                          // For now, transfer pricing is included in the pricing package
                          return null;
                        }
                        return null;
                      })()}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Transfer Package Configuration */}
          {pkg.package_type === 'transfer' && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">Transfer Details</Label>
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Base Price</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {packageData?.base_price ? `$${packageData.base_price.toFixed(2)}` : 'Not set'}
                    </span>
                  </div>
                  {packageData?.destination_name && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Destination</span>
                      <span className="text-sm font-medium">{packageData.destination_name}</span>
                    </div>
                  )}
                  {packageData?.transfer_type && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Transfer Type</span>
                      <Badge>{packageData.transfer_type}</Badge>
                    </div>
                  )}
                  {packageData?.estimated_duration_hours && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="text-sm font-medium">
                        {packageData.estimated_duration_hours}h {packageData.estimated_duration_minutes || 0}m
                      </span>
                    </div>
                  )}
                </div>

                {/* Quantity Input */}
                <div className="mt-4">
                  <Label htmlFor="transfer-quantity">Quantity</Label>
                  <Input
                    id="transfer-quantity"
                    type="number"
                    min="1"
                    value={config.quantity || 1}
                    onChange={(e) => setConfig({ ...config, quantity: parseInt(e.target.value) || 1 })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Multi-City Package Configuration */}
          {(pkg.package_type === 'multi_city' || pkg.package_type === 'multi_city_hotel' || pkg.package_type === 'fixed_departure') && packageData && (
            <div className="space-y-4">
              {/* Package Details */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Package Details</Label>
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                  {packageData?.destination_region && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Destination Region</span>
                      <span className="text-sm font-medium">{packageData.destination_region}</span>
                    </div>
                  )}
                  {packageData?.total_days && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="text-sm font-medium">{packageData.total_days} days / {packageData.total_nights || 0} nights</span>
                    </div>
                  )}
                  {packageData?.total_cities && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cities</span>
                      <span className="text-sm font-medium">{packageData.total_cities} cities</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Type Selection (SIC vs PRIVATE_PACKAGE) */}
              {packageData.pricing_package && (
                <div>
                  <Label className="text-base font-semibold mb-3 block">Pricing Type</Label>
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <div className="font-medium">
                      {(packageData.pricing_package as any).pricing_type === 'SIC' ? 'SIC (Seat-In-Coach)' : 'Private Package'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {(packageData.pricing_package as any).pricing_type === 'SIC' 
                        ? 'Shared transportation' 
                        : 'Private vehicle transportation'}
                    </div>
                  </div>
                </div>
              )}

              {/* SIC Pricing Rows */}
              {(packageData.pricing_package as any)?.pricing_type === 'SIC' && (packageData as any).sic_pricing_rows && (packageData as any).sic_pricing_rows.length > 0 && (
                <div>
                  <Label className="text-base font-semibold mb-3 block">Select Pricing (Based on {itineraryInfo?.adults_count || 0} Adults, {itineraryInfo?.children_count || 0} Children)</Label>
                  <div className="space-y-2">
                    {((packageData as any).sic_pricing_rows || []).map((row: any) => {
                      const isSelected = config.selectedPricingRowId === row.id;
                      const isMatching = row.number_of_adults === (itineraryInfo?.adults_count || 0) && 
                                        row.number_of_children === (itineraryInfo?.children_count || 0);
                      return (
                        <div
                          key={row.id}
                          onClick={() => setConfig({ ...config, selectedPricingRowId: row.id })}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                          } ${isMatching ? 'ring-2 ring-green-500' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {row.number_of_adults} Adult{row.number_of_adults !== 1 ? 's' : ''}
                                {row.number_of_children > 0 && `, ${row.number_of_children} Child${row.number_of_children !== 1 ? 'ren' : ''}`}
                              </div>
                              {isMatching && (
                                <Badge className="mt-1 bg-green-100 text-green-700">Matches your group</Badge>
                              )}
                            </div>
                            <div className="text-lg font-semibold text-green-600">
                              ${row.total_price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PRIVATE_PACKAGE Pricing Rows */}
              {(packageData.pricing_package as any)?.pricing_type === 'PRIVATE_PACKAGE' && (packageData as any).private_package_rows && (packageData as any).private_package_rows.length > 0 && (
                <div>
                  <Label className="text-base font-semibold mb-3 block">Select Vehicle & Pricing (Based on {itineraryInfo?.adults_count || 0} Adults, {itineraryInfo?.children_count || 0} Children)</Label>
                  <div className="space-y-2">
                    {((packageData as any).private_package_rows || []).map((row: any) => {
                      const isSelected = config.selectedPricingRowId === row.id;
                      const isMatching = row.number_of_adults === (itineraryInfo?.adults_count || 0) && 
                                        row.number_of_children === (itineraryInfo?.children_count || 0);
                      return (
                        <div
                          key={row.id}
                          onClick={() => setConfig({ 
                            ...config, 
                            selectedPricingRowId: row.id,
                            selectedVehicle: row.id,
                          })}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                          } ${isMatching ? 'ring-2 ring-green-500' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{row.car_type}</div>
                              <div className="text-sm text-gray-600">
                                Capacity: {row.vehicle_capacity} • {row.number_of_adults} Adult{row.number_of_adults !== 1 ? 's' : ''}
                                {row.number_of_children > 0 && `, ${row.number_of_children} Child${row.number_of_children !== 1 ? 'ren' : ''}`}
                              </div>
                              {isMatching && (
                                <Badge className="mt-1 bg-green-100 text-green-700">Matches your group</Badge>
                              )}
                            </div>
                            <div className="text-lg font-semibold text-green-600">
                              ${row.total_price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hotel Selection for Multi-City Hotel Packages */}
              {pkg.package_type === 'multi_city_hotel' && (packageData as any).cities && (packageData as any).cities.length > 0 && (
                <div>
                  <Label className="text-base font-semibold mb-3 block">Select Hotels</Label>
                  <div className="space-y-4">
                    {((packageData as any).cities || []).map((city: any) => {
                      const hotels = ((packageData as any).hotels_by_city || {})[city.id] || [];
                      const selectedHotel = config.selectedHotels?.find((h: any) => h.city_id === city.id);
                      return (
                        <div key={city.id} className="p-4 border rounded-lg">
                          <div className="mb-3">
                            <div className="font-medium">{city.name}</div>
                            <div className="text-sm text-gray-600">{city.nights} night{city.nights !== 1 ? 's' : ''}</div>
                          </div>
                          {hotels.length > 0 ? (
                            <Select
                              value={selectedHotel?.hotel_id || ''}
                              onValueChange={(hotelId) => {
                                const updatedHotels = (config.selectedHotels || []).map((h: any) =>
                                  h.city_id === city.id ? { ...h, hotel_id: hotelId } : h
                                );
                                setConfig({ ...config, selectedHotels: updatedHotels });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select hotel" />
                              </SelectTrigger>
                              <SelectContent>
                                {hotels.map((hotel: any) => (
                                  <SelectItem key={hotel.id} value={hotel.id}>
                                    {hotel.hotel_name} ({hotel.hotel_type}) - ${hotel.adult_price?.toFixed(2) || '0.00'}/night
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="text-sm text-gray-500">No hotels available for this city</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Input */}
              <div>
                <Label htmlFor="multicity-quantity">Quantity</Label>
                <Input
                  id="multicity-quantity"
                  type="number"
                  min="1"
                  value={config.quantity || 1}
                  onChange={(e) => setConfig({ ...config, quantity: parseInt(e.target.value) || 1 })}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Price Summary */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Total Price</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${calculatedPrice.toFixed(2)}
                  </p>
                  {config.quantity > 1 && (
                    <p className="text-xs text-gray-600 mt-1">
                      ${(calculatedPrice / config.quantity).toFixed(2)} × {config.quantity || 1}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>Based on:</p>
                  <p>{itineraryInfo?.adults_count || 0} Adults</p>
                  <p>{itineraryInfo?.children_count || 0} Children</p>
                  <p>{itineraryInfo?.infants_count || 0} Infants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToItinerary}
              disabled={loading || calculatedPrice === 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {loading ? 'Adding...' : 'Add to Itinerary'}
            </Button>
          </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

