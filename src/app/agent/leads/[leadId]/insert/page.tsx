'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiPackage, FiLoader, FiMapPin, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/CognitoAuthContext';
import { useToast } from '@/hooks/useToast';
// Removed Supabase import - now using AWS API routes
// queryService and itineraryService now accessed via API routes

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
  cities?: Array<{ name: string; nights: number }>;
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
  // Removed Supabase client - now using AWS API routes

  const leadId = params.leadId as string;
  const [activeTab, setActiveTab] = useState<'multi_city' | 'multi_city_hotel'>('multi_city');
  const [multiCityPackages, setMultiCityPackages] = useState<MultiCityPackage[]>([]);
  const [multiCityHotelPackages, setMultiCityHotelPackages] = useState<MultiCityPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryDestinations, setQueryDestinations] = useState<string[]>([]);
  const [operators, setOperators] = useState<Record<string, OperatorInfo>>({});

  // Fetch query destinations
  useEffect(() => {
    if (leadId) {
      fetchQueryData();
    }
  }, [leadId]);

  const fetchQueryData = async () => {
    try {
      const response = await fetch(`/api/queries/${leadId}`);
      if (!response.ok) {
        toast.error('Failed to load query data');
        router.push(`/agent/leads/${leadId}`);
        return;
      }
      
      const { query } = await response.json();
      if (query && query.destinations.length > 0) {
        const cities = query.destinations.map((d: any) => d.city);
        setQueryDestinations(cities);
        fetchPackages(cities);
      } else {
        toast.error('Please create a query first with destinations');
        router.push(`/agent/leads/${leadId}`);
      }
    } catch (err) {
      console.error('Error fetching query:', err);
      toast.error('Failed to load query data');
      router.push(`/agent/leads/${leadId}`);
    }
  };

  const fetchPackages = async (cities: string[]) => {
    setLoading(true);
    try {
      // Fetch operators info
      const { data: operatorsData } = await supabase
        .from('users' as any)
        .select('id, name, email')
        .in('role', ['TOUR_OPERATOR', 'ADMIN', 'SUPER_ADMIN']);

      if (operatorsData) {
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

      // Fetch Multi-City Packages matching destinations
      const multiCityQuery = supabase
        .from('multi_city_packages' as any)
        .select(`
          id,
          title,
          destination_region,
          operator_id,
          base_price,
          adult_price,
          currency,
          total_nights,
          total_cities,
          status,
          multi_city_package_images!inner(public_url, is_cover)
        `)
        .eq('status', 'published');

      // Filter by cities - check if any city in package matches query cities
      // We'll need to join with multi_city_package_cities
      const { data: multiCityData } = await supabase
        .from('multi_city_packages' as any)
        .select(`
          id,
          title,
          destination_region,
          operator_id,
          base_price,
          per_person_price,
          fixed_price,
          pricing_mode,
          currency,
          total_nights,
          total_cities,
          status
        `)
        .eq('status', 'published')
        .limit(50);

      // Fetch cities for each package and filter
      if (multiCityData) {
        const packageIds = multiCityData.map((p: any) => p.id);
        const { data: citiesData } = await supabase
          .from('multi_city_package_cities' as any)
          .select('package_id, name, nights')
          .in('package_id', packageIds);

        // Filter packages that have at least one matching city
        const matchingPackages = multiCityData.filter((pkg: any) => {
          const pkgCities = citiesData?.filter((c: any) => c.package_id === pkg.id).map((c: any) => c.name.toLowerCase()) || [];
          return cities.some(queryCity => 
            pkgCities.some((pkgCity: string) => 
              pkgCity.includes(queryCity.toLowerCase()) || queryCity.toLowerCase().includes(pkgCity)
            )
          );
        });

        // Fetch images for matching packages
        const matchingPackageIds = matchingPackages.map((p: any) => p.id);
        const { data: imagesData } = await supabase
          .from('multi_city_package_images' as any)
          .select('package_id, public_url, is_cover')
          .in('package_id', matchingPackageIds)
          .eq('is_cover', true);

        const packagesWithImages = matchingPackages.map((pkg: any) => {
          const image = imagesData?.find((img: any) => img.package_id === pkg.id) as { public_url?: string } | undefined;
          return {
            ...pkg,
            featured_image_url: image?.public_url || undefined,
            cities: citiesData?.filter((c: any) => c.package_id === pkg.id).map((c: any) => ({
              name: c.name,
              nights: c.nights || 1,
            })),
          };
        });

        setMultiCityPackages(packagesWithImages as MultiCityPackage[]);
      }

      // Fetch Multi-City Hotel Packages
      const { data: multiCityHotelData } = await supabase
        .from('multi_city_hotel_packages' as any)
        .select(`
          id,
          title,
          destination_region,
          operator_id,
          base_price,
          adult_price,
          currency,
          total_nights,
          total_cities,
          status
        `)
        .eq('status', 'published')
        .limit(50);

      if (multiCityHotelData) {
        const hotelPackageIds = multiCityHotelData.map((p: any) => p.id);
        const { data: hotelCitiesData } = await supabase
          .from('multi_city_hotel_package_cities' as any)
          .select('package_id, name, nights')
          .in('package_id', hotelPackageIds);

        // Filter packages that have at least one matching city
        const matchingHotelPackages = multiCityHotelData.filter((pkg: any) => {
          const pkgCities = hotelCitiesData?.filter((c: any) => c.package_id === pkg.id).map((c: any) => c.name.toLowerCase()) || [];
          return cities.some(queryCity => 
            pkgCities.some((pkgCity: string) => 
              pkgCity.includes(queryCity.toLowerCase()) || queryCity.toLowerCase().includes(pkgCity)
            )
          );
        });

        // Fetch images
        const matchingHotelPackageIds = matchingHotelPackages.map((p: any) => p.id);
        const { data: hotelImagesData } = await supabase
          .from('multi_city_hotel_package_images' as any)
          .select('package_id, public_url, is_cover')
          .in('package_id', matchingHotelPackageIds)
          .eq('is_cover', true);

        const hotelPackagesWithImages = matchingHotelPackages.map((pkg: any) => {
          const image = hotelImagesData?.find((img: any) => img.package_id === pkg.id) as { public_url?: string } | undefined;
          return {
            ...pkg,
            featured_image_url: image?.public_url || undefined,
            cities: hotelCitiesData?.filter((c: any) => c.package_id === pkg.id).map((c: any) => ({
              name: c.name,
              nights: c.nights || 1,
            })),
          };
        });

        setMultiCityHotelPackages(hotelPackagesWithImages as MultiCityPackage[]);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = async (packageId: string, packageType: 'multi_city' | 'multi_city_hotel') => {
    if (!user?.id) return;

    try {
      // Ensure the lead exists in the leads table (create if needed from marketplace)
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

      // Check if itinerary exists for this lead
      const itinerariesResponse = await fetch(`/api/itineraries/leads/${actualLeadId}`);
      const existingItineraries = itinerariesResponse.ok 
        ? (await itinerariesResponse.json()).itineraries 
        : [];
      
      let itineraryId: string;
      
      if (existingItineraries.length === 0) {
        // Create new itinerary
        const queryResponse = await fetch(`/api/queries/${leadId}`);
        if (!queryResponse.ok) {
          toast.error('Query not found. Please create a query first.');
          return;
        }
        const { query } = await queryResponse.json();
        if (!query) {
          toast.error('Query not found. Please create a query first.');
          return;
        }

        // Create itinerary with query data via API route
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
        // Use first existing itinerary
        itineraryId = existingItineraries[0]!.id;
      }

      // For multi-city packages, create itinerary_item immediately and navigate to configure page
      if (packageType === 'multi_city' || packageType === 'multi_city_hotel') {
        // Fetch package details to get operator_id and base price
        const packageTable = packageType === 'multi_city' 
          ? 'multi_city_packages' 
          : 'multi_city_hotel_packages';
        
        const { data: pkgData, error: pkgError } = await supabase
          .from(packageTable as any)
          .select('id, title, operator_id, base_price, currency')
          .eq('id', packageId)
          .single();

        if (pkgError) {
          console.error('Error fetching package:', pkgError);
          toast.error('Failed to load package details');
          return;
        }

        // Fetch package image
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

        // Get itinerary info for default pricing
        const { data: itineraryInfo } = await supabase
          .from('itineraries' as any)
          .select('adults_count, children_count, infants_count')
          .eq('id', itineraryId)
          .single();

        // Calculate default price (use base_price or 0)
        const defaultPrice = (pkgData as any).base_price || 0;

        // Create itinerary_item with default configuration
        const { data: newItem, error: itemError } = await supabase
          .from('itinerary_items' as any)
          .insert({
            itinerary_id: itineraryId,
            day_id: null, // Unassigned initially
            package_type: packageType,
            package_id: packageId,
            operator_id: (pkgData as any).operator_id,
            package_title: (pkgData as any).title,
            package_image_url: (imageData as any)?.public_url || null,
            configuration: {
              pricingType: 'SIC',
              selectedPricingRowId: null,
              selectedVehicle: null,
              quantity: 1,
              selectedHotels: [],
              activities: [],
              transfers: [],
            },
            unit_price: defaultPrice,
            quantity: 1,
            total_price: defaultPrice,
            display_order: 0,
          })
          .select('id')
          .single();

        if (itemError) {
          console.error('Error creating itinerary item:', itemError);
          toast.error('Failed to create itinerary item');
          return;
        }

        // Navigate directly to configure page
        router.push(`/agent/itineraries/${itineraryId}/configure/${(newItem as any).id}`);
      } else {
        // For other packages, navigate to builder (keep existing flow)
        router.push(`/agent/itineraries/${itineraryId}/builder?packageId=${packageId}&packageType=${packageType}`);
      }
    } catch (err) {
      console.error('Error creating/selecting itinerary:', err);
      toast.error('Failed to create itinerary');
    }
  };

  const formatCities = (cities?: Array<{ name: string; nights: number }>) => {
    if (!cities || cities.length === 0) return 'N/A';
    return cities.map(c => c.name).join(' → ');
  };

  return (
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
          Select a multi-city package matching your query destinations: {queryDestinations.join(', ')}
        </p>
      </div>

      {/* Tabs for Multi-City and Multi-City Hotel */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'multi_city' | 'multi_city_hotel')} className="w-full">
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Multi-City Packages Found</h3>
                <p className="text-gray-600">
                  No multi-city packages match your query destinations: {queryDestinations.join(', ')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {multiCityPackages.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handlePackageSelect(pkg.id, 'multi_city')}
                  >
                    {pkg.featured_image_url && (
                      <div className="h-48 overflow-hidden rounded-t-lg">
                        <img
                          src={pkg.featured_image_url}
                          alt={pkg.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{pkg.title}</CardTitle>
                      {pkg.destination_region && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <FiMapPin className="w-4 h-4" />
                          <span>{pkg.destination_region}</span>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FiCalendar className="w-4 h-4" />
                          <span>{pkg.total_nights} nights</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiMapPin className="w-4 h-4" />
                          <span>{pkg.total_cities} cities</span>
                        </div>
                      </div>
                      
                      {pkg.cities && pkg.cities.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Cities: </span>
                          <span className="text-gray-600">{formatCities(pkg.cities)}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-gray-600">Price</span>
                        <span className="text-xl font-bold text-green-600">
                          {pkg.base_price || pkg.adult_price
                            ? `${pkg.currency || 'USD'} ${(pkg.base_price || pkg.adult_price || 0).toLocaleString()}`
                            : 'Contact for price'}
                        </span>
                      </div>

                      {operators[pkg.operator_id] && (
                        <div className="text-xs text-gray-500">
                          Operator: {operators[pkg.operator_id]!.name}
                        </div>
                      )}

                      <Button
                        className="w-full mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePackageSelect(pkg.id, 'multi_city');
                        }}
                      >
                        <FiPackage className="w-4 h-4 mr-2" />
                        Insert Package
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Multi-City Hotel Packages Found</h3>
                <p className="text-gray-600">
                  No multi-city hotel packages match your query destinations: {queryDestinations.join(', ')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {multiCityHotelPackages.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handlePackageSelect(pkg.id, 'multi_city_hotel')}
                  >
                    {pkg.featured_image_url && (
                      <div className="h-48 overflow-hidden rounded-t-lg">
                        <img
                          src={pkg.featured_image_url}
                          alt={pkg.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{pkg.title}</CardTitle>
                      {pkg.destination_region && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <FiMapPin className="w-4 h-4" />
                          <span>{pkg.destination_region}</span>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FiCalendar className="w-4 h-4" />
                          <span>{pkg.total_nights} nights</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiMapPin className="w-4 h-4" />
                          <span>{pkg.total_cities} cities</span>
                        </div>
                      </div>
                      
                      {pkg.cities && pkg.cities.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Cities: </span>
                          <span className="text-gray-600">{formatCities(pkg.cities)}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-gray-600">Price</span>
                        <span className="text-xl font-bold text-green-600">
                          {pkg.base_price || pkg.adult_price
                            ? `${pkg.currency || 'USD'} ${(pkg.base_price || pkg.adult_price || 0).toLocaleString()}`
                            : 'Contact for price'}
                        </span>
                      </div>

                      {operators[pkg.operator_id] && (
                        <div className="text-xs text-gray-500">
                          Operator: {operators[pkg.operator_id]!.name}
                        </div>
                      )}

                      <Button
                        className="w-full mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePackageSelect(pkg.id, 'multi_city_hotel');
                        }}
                      >
                        <FiPackage className="w-4 h-4 mr-2" />
                        Insert Package
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

